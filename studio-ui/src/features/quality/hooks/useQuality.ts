import { presentQualityReport } from '../model/catalog-presentation';
import { localizeMessage } from '../model/ui-messages';
import { useI18n } from '../../../i18n';
import { translate } from '../../../i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { QualityOptions, QualityReport } from '../model/contracts';
import { runnableChecks } from '../model/selectors';

interface BatchProgress {
  revisionId: string;
  total: number;
  completed: number;
  state: 'running' | 'complete' | 'stopped';
  stopping?: boolean;
}

async function readResponse(
  response: Response,
  locale: 'en' | 'fr' = 'en',
): Promise<QualityReport> {
  const value: unknown = await response.json();
  if (!response.ok) {
    const detail =
      typeof value === 'object' && value !== null && 'error' in value
        ? String(value.error)
        : translate(
            'Le service qualité n’a pas répondu.',
            'The quality service did not respond.',
            undefined,
            locale,
          );
    throw new Error(detail);
  }
  if (
    typeof value !== 'object' ||
    value === null ||
    !('checks' in value) ||
    !Array.isArray(value.checks) ||
    !('revisionId' in value)
  )
    throw new Error(
      translate('Rapport qualité invalide.', 'Invalid quality report.', undefined, locale),
    );
  return value as QualityReport;
}

async function requestReport(
  url: string,
  signal: AbortSignal,
  timeoutMs: number,
  init?: RequestInit,
  locale: 'en' | 'fr' = 'en',
): Promise<QualityReport> {
  const deadline = AbortSignal.timeout(timeoutMs);
  const combined = AbortSignal.any([signal, deadline]);
  try {
    const response = await fetch(url, { ...init, signal: combined });
    const report = await readResponse(response, locale);
    combined.throwIfAborted();
    return report;
  } catch (cause) {
    if (deadline.aborted && !signal.aborted)
      throw new Error(
        translate(
          'Délai de réponse dépassé ({seconds} s). Aucun nouveau résultat confirmé. Réessayez pour lire l’état réel des contrôles ; une exécution peut continuer côté serveur.',
          'Response timed out ({seconds} s). No new result confirmed. Retry to read the actual check status; execution may continue on the server.',
          { seconds: timeoutMs / 1000 },
          locale,
        ),
        { cause },
      );
    throw cause;
  }
}

interface CheckSequence {
  queue: string[];
  revisionId: string;
  signal: AbortSignal;
  current(): boolean;
  shouldStop(): boolean;
  onStart(id: string): void;
  onResult(report: QualityReport, completed: number): void;
}
async function executeCheckSequence(sequence: CheckSequence, locale: 'en' | 'fr' = 'en') {
  let completed = 0;
  for (const checkId of sequence.queue) {
    if (!sequence.current() || sequence.shouldStop()) break;
    sequence.onStart(checkId);
    const next = await requestReport(
      '/api/project/checks/run',
      sequence.signal,
      30_000,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ revisionId: sequence.revisionId, checkId }),
      },
      locale,
    );
    if (!sequence.current()) break;
    if (next.revisionId !== sequence.revisionId)
      throw new Error(
        translate(
          'La réponse concerne une autre version ; série interrompue.',
          'The response concerns another version; batch interrupted.',
          undefined,
          locale,
        ),
      );
    sequence.onResult(next, ++completed);
  }
  return completed;
}

export function useQuality({ revisionId, onStateChanged, verification }: QualityOptions) {
  const { locale } = useI18n();
  const verificationKey =
    verification?.revisionId === revisionId
      ? JSON.stringify([
          verification.jobId,
          verification.revisionId,
          verification.status,
          verification.receiptId,
          verification.finishedAt,
        ])
      : '';
  const automaticRunning = verification?.status === 'running';
  const [loaded, setLoaded] = useState<{
    report: QualityReport;
    refreshKey: number;
    verificationKey: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [runningId, setRunningId] = useState<string | null>(null);
  const [batch, setBatch] = useState<BatchProgress | null>(null);
  const stopRequested = useRef(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const report =
    loaded?.report.revisionId === revisionId &&
    loaded.refreshKey === refreshKey &&
    loaded.verificationKey === verificationKey
      ? loaded.report
      : null;
  const request = useRef(0);
  const runController = useRef<AbortController | null>(null);
  const coverageController = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController(),
      sequence = ++request.current;
    runController.current?.abort();
    runController.current = null;
    setLoaded(null);
    setBatch(null);
    setError('');
    setRunningId(null);
    if (revisionId) {
      requestReport(
        `/api/project/checks?revision=${encodeURIComponent(revisionId)}`,
        controller.signal,
        15_000,
        undefined,
        'fr',
      )
        .then((next) => {
          if (!controller.signal.aborted && sequence === request.current) {
            if (next.revisionId !== revisionId)
              throw new Error('La réponse concerne une autre version ; rapport écarté.');
            setLoaded({ report: next, refreshKey, verificationKey });
          }
        })
        .catch((cause: unknown) => {
          if (!controller.signal.aborted && sequence === request.current) {
            setLoaded(null);
            setError(cause instanceof Error ? cause.message : 'Chargement impossible.');
          }
        });
    }
    return () => {
      controller.abort();
      runController.current?.abort();
      coverageController.current?.abort();
    };
  }, [revisionId, refreshKey, verificationKey]);

  const execute = useCallback(
    async (ids: string[], multiple: boolean) => {
      if (
        automaticRunning ||
        !revisionId ||
        runController.current ||
        report?.revisionId !== revisionId
      )
        return;
      const allowed = new Set(runnableChecks(report.checks).map((check) => check.id));
      const queue = [...new Set(ids)].filter((id) => allowed.has(id));
      if (!queue.length) return;
      coverageController.current?.abort();
      const controller = new AbortController(),
        sequence = request.current;
      const current = () => !controller.signal.aborted && sequence === request.current;
      runController.current = controller;
      stopRequested.current = false;
      setError('');
      setBatch(
        multiple ? { revisionId, total: queue.length, completed: 0, state: 'running' } : null,
      );
      let completed = 0;
      try {
        // The server serializes checks per project. Progress advances only on actual responses.
        completed = await executeCheckSequence(
          {
            queue,
            revisionId,
            signal: controller.signal,
            current,
            shouldStop: () => stopRequested.current,
            onStart: setRunningId,
            onResult(next, count) {
              setLoaded((previous) => ({
                refreshKey,
                verificationKey,
                report: {
                  ...next,
                  flowModel:
                    next.flowModel ??
                    (previous?.report.revisionId === revisionId &&
                    previous.refreshKey === refreshKey
                      ? previous.report.flowModel
                      : null),
                },
              }));
              completed = count;
              if (multiple)
                setBatch({ revisionId, total: queue.length, completed, state: 'running' });
            },
          },
          'fr',
        );
        if (current()) onStateChanged?.();
      } catch (cause) {
        if (current()) {
          setLoaded(null);
          setError(cause instanceof Error ? cause.message : 'Contrôle indisponible.');
        }
      } finally {
        if (current()) {
          setRunningId(null);
          runController.current = null;
          setBatch((previous) =>
            previous
              ? {
                  ...previous,
                  completed,
                  state: completed === queue.length ? 'complete' : 'stopped',
                }
              : null,
          );
        }
      }
    },
    [revisionId, report, refreshKey, verificationKey, automaticRunning, onStateChanged],
  );
  const refreshCoverage = useCallback(async () => {
    if (!revisionId) return;
    coverageController.current?.abort();
    const controller = new AbortController(),
      sequence = request.current;
    coverageController.current = controller;
    try {
      const next = await requestReport(
        `/api/project/checks?revision=${encodeURIComponent(revisionId)}`,
        controller.signal,
        15_000,
        undefined,
        'fr',
      );
      if (controller.signal.aborted || sequence !== request.current) return;
      if (next.revisionId !== revisionId) throw new Error('La réponse concerne une autre version.');
      setLoaded({ report: next, refreshKey, verificationKey });
    } catch (cause) {
      if (!controller.signal.aborted && sequence === request.current)
        setError(
          'Actualisation du rapport après appréciation impossible. ' +
            (cause instanceof Error ? cause.message : 'Réessayez.'),
        );
    }
  }, [revisionId, refreshKey, verificationKey]);
  const visibleReport = report?.revisionId === revisionId ? report : null;
  return {
    report: presentQualityReport(visibleReport, locale),
    error: localizeMessage(error, locale),
    runningId: automaticRunning
      ? verification?.revisionId === revisionId
        ? 'business-browser'
        : 'automatic-browser-other-revision'
      : runningId,
    batch: batch?.revisionId === revisionId ? batch : null,
    run: (id: string) => execute([id], false),
    runAll: () =>
      execute(
        runnableChecks(visibleReport?.checks ?? []).map((check) => check.id),
        true,
      ),
    stopAfterCurrent: () => {
      stopRequested.current = true;
      setBatch((previous) => (previous ? { ...previous, stopping: true } : null));
    },
    refreshCoverage,
    refresh: () => setRefreshKey((key) => key + 1),
  };
}
