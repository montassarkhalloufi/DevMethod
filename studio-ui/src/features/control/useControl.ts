import { useCallback, useEffect, useRef, useState } from 'react';
import type { ControlOptions, ControlReport } from './model';

async function request(url: string, signal: AbortSignal, input?: unknown): Promise<ControlReport> {
  const response = await fetch(url, {
    signal,
    cache: 'no-store',
    ...(input
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      : {}),
  }).catch(() => {
    throw new Error('Connexion au Studio interrompue. Les preuves seront relues à la reprise.');
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Le Control Plane est indisponible.');
  if (
    value.schemaVersion !== 1 ||
    !value.snapshot?.decision ||
    !Array.isArray(value.snapshot.nodes)
  )
    throw new Error('Réponse du Control Plane invalide.');
  return value as ControlReport;
}

export function useControl(options: ControlOptions) {
  const [report, setReport] = useState<ControlReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const generation = useRef(0);
  const active = useRef<AbortController | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { revisionId, mode, active: visible = true } = options;
  useEffect(() => {
    if (!visible) return;
    const sequence = ++generation.current;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    active.current?.abort();
    active.current = null;
    setLoading(true);
    setBusy(null);
    setReport(null);
    setError('');
    const poll = async () => {
      if (active.current) {
        timer = setTimeout(poll, 3000);
        return;
      }
      try {
        const next = await request(
          `/api/control${revisionId ? `?revision=${encodeURIComponent(revisionId)}` : ''}`,
          controller.signal,
        );
        if (sequence === generation.current && !controller.signal.aborted) {
          setReport(next);
          setError('');
        }
      } catch (cause) {
        if (!controller.signal.aborted && sequence === generation.current)
          setError(cause instanceof Error ? cause.message : 'Chargement impossible.');
      } finally {
        if (!controller.signal.aborted && sequence === generation.current) {
          setLoading(false);
          timer = setTimeout(poll, 3000);
        }
      }
    };
    void poll();
    return () => {
      controller.abort();
      active.current?.abort();
      clearTimeout(timer);
    };
  }, [revisionId, mode, refreshKey, visible]);

  const mutate = useCallback(
    async (action: string, input: object) => {
      if (active.current) return;
      const controller = new AbortController(),
        sequence = generation.current;
      active.current = controller;
      setBusy(action);
      setError('');
      try {
        const next = await request(`/api/control/${action}`, controller.signal, input);
        if (sequence === generation.current && !controller.signal.aborted) {
          setReport(next);
          options.onStateChanged();
        }
      } catch (cause) {
        if (sequence === generation.current && !controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : 'Action impossible.');
      } finally {
        if (active.current === controller) {
          active.current = null;
          setBusy(null);
        }
      }
    },
    [options],
  );

  const runChecks = async (ids?: string[]) => {
    if (!report || active.current) return;
    const nodes = report.snapshot.nodes.filter(
      (node) => node.canRun && (!ids || ids.includes(node.checkId!)),
    );
    if (!nodes.length) return;
    const controller = new AbortController(),
      sequence = generation.current;
    active.current = controller;
    setBusy('verify');
    setError('');
    try {
      for (const [index, node] of nodes.entries()) {
        setProgress(`${index} / ${nodes.length} contrôles terminés · ${node.label} en cours`);
        const next = await request('/api/control/verify', controller.signal, {
          revisionId: report.snapshot.input.revisionId,
          checkId: node.checkId,
          requestId: crypto.randomUUID(),
        });
        if (sequence !== generation.current || controller.signal.aborted) return;
        setReport(next);
        setProgress(
          `${index + 1} / ${nodes.length} contrôles terminés · consultez leurs résultats`,
        );
      }
      options.onStateChanged();
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Vérification interrompue.');
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(null);
      }
    }
  };
  return {
    report,
    error,
    loading,
    busy,
    progress,
    mutate,
    runChecks,
    refresh: () => setRefreshKey((key) => key + 1),
  };
}
