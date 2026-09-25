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

async function readResponse(response: Response): Promise<QualityReport> {
  const value: unknown = await response.json();
  if (!response.ok) {
    const detail =
      typeof value === 'object' && value !== null && 'error' in value
        ? String(value.error)
        : 'Le service qualité n’a pas répondu.';
    throw new Error(detail);
  }
  if (
    typeof value !== 'object' ||
    value === null ||
    !('checks' in value) ||
    !Array.isArray(value.checks) ||
    !('revisionId' in value)
  )
    throw new Error('Rapport qualité invalide.');
  return value as QualityReport;
}

async function requestReport(
  url: string,
  signal: AbortSignal,
  timeoutMs: number,
  init?: RequestInit,
): Promise<QualityReport> {
  const deadline = AbortSignal.timeout(timeoutMs);
  const combined = AbortSignal.any([signal, deadline]);
  try {
    const response = await fetch(url, { ...init, signal: combined });
    const report = await readResponse(response);
    combined.throwIfAborted();
    return report;
  } catch (cause) {
    if (deadline.aborted && !signal.aborted)
      throw new Error(
        `Délai de réponse dépassé (${timeoutMs / 1000} s). Aucun nouveau résultat confirmé. Réessayez pour lire l’état réel des contrôles ; une exécution peut continuer côté serveur.`,
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
async function executeCheckSequence(sequence: CheckSequence) {
  let completed = 0;
  for (const checkId of sequence.queue) {
    if (!sequence.current() || sequence.shouldStop()) break;
    sequence.onStart(checkId);
    const next = await requestReport('/api/project/checks/run', sequence.signal, 30_000, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ revisionId: sequence.revisionId, checkId }),
    });
    if (!sequence.current()) break;
    if (next.revisionId !== sequence.revisionId)
      throw new Error('La réponse concerne une autre version ; série interrompue.');
    sequence.onResult(next, ++completed);
  }
  return completed;
}

export function useQuality({ revisionId, onStateChanged }: QualityOptions) {
  const [loaded, setLoaded] = useState<{ report: QualityReport; refreshKey: number } | null>(null);
  const [error, setError] = useState('');
  const [runningId, setRunningId] = useState<string | null>(null);
  const [batch, setBatch] = useState<BatchProgress | null>(null);
  const stopRequested = useRef(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const report =
    loaded?.report.revisionId === revisionId && loaded.refreshKey === refreshKey
      ? loaded.report
      : null;
  const request = useRef(0);
  const runController = useRef<AbortController | null>(null);
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
      )
        .then((next) => {
          if (!controller.signal.aborted && sequence === request.current) {
            if (next.revisionId !== revisionId)
              throw new Error('La réponse concerne une autre version ; rapport écarté.');
            setLoaded({ report: next, refreshKey });
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
    };
  }, [revisionId, refreshKey]);

  const execute = useCallback(
    async (ids: string[], multiple: boolean) => {
      if (!revisionId || runController.current || report?.revisionId !== revisionId) return;
      const allowed = new Set(runnableChecks(report.checks).map((check) => check.id));
      const queue = [...new Set(ids)].filter((id) => allowed.has(id));
      if (!queue.length) return;
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
        completed = await executeCheckSequence({
          queue,
          revisionId,
          signal: controller.signal,
          current,
          shouldStop: () => stopRequested.current,
          onStart: setRunningId,
          onResult(next, count) {
            setLoaded((previous) => ({
              refreshKey,
              report: {
                ...next,
                flowModel:
                  next.flowModel ??
                  (previous?.report.revisionId === revisionId && previous.refreshKey === refreshKey
                    ? previous.report.flowModel
                    : null),
              },
            }));
            completed = count;
            if (multiple)
              setBatch({ revisionId, total: queue.length, completed, state: 'running' });
          },
        });
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
    [revisionId, report, refreshKey, onStateChanged],
  );
  const visibleReport = report?.revisionId === revisionId ? report : null;
  return {
    report: visibleReport,
    error,
    runningId,
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
    refresh: () => setRefreshKey((key) => key + 1),
  };
}
