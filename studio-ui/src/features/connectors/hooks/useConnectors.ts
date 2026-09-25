import { useEffect, useRef, useState } from 'react';
import type { ConnectorReport } from '../model/contracts';

async function responseJSON(response: Response) {
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Le service des connecteurs ne répond pas.');
  return value;
}
export function useConnectors(revisionId: string | null) {
  const [loaded, setLoaded] = useState<{ revision: string | null; data: ConnectorReport } | null>(
    null,
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const generation = useRef(0);
  const mutation = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const current = ++generation.current;
    setError('');
    setBusy(false);
    fetch('/api/connectors?' + new URLSearchParams(revisionId ? { revision: revisionId } : {}), {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      cache: 'no-store',
    })
      .then(responseJSON)
      .then((data: ConnectorReport) => {
        if (current !== generation.current || controller.signal.aborted) return;
        if (data.schemaVersion !== 1 || !data.catalog || !Array.isArray(data.connections))
          throw new Error('Catalogue illisible. Aucun état de connexion confirmé.');
        if (revisionId !== null && data.revisionId !== revisionId)
          throw new Error('Le catalogue concerne une autre version.');
        setLoaded({ revision: revisionId, data });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted && current === generation.current)
          setError(cause instanceof Error ? cause.message : 'Chargement impossible.');
      });
    return () => {
      generation.current = current + 1;
      controller.abort();
      mutation.current?.abort();
      mutation.current = null;
    };
  }, [revisionId, refreshKey]);
  async function action(route: string, input: Record<string, unknown>): Promise<unknown | null> {
    if (mutation.current) return null;
    const controller = new AbortController();
    mutation.current = controller;
    const current = generation.current;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/connectors/' + route, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      });
      const result: unknown = await responseJSON(response);
      if (controller.signal.aborted || current !== generation.current) return null;
      return result;
    } catch (cause) {
      if (!controller.signal.aborted && current === generation.current)
        setError(
          cause instanceof Error
            ? cause.message
            : 'Action non confirmée. Actualisez pour vérifier.',
        );
      return null;
    } finally {
      if (current === generation.current) {
        mutation.current = null;
        setBusy(false);
      }
    }
  }
  return {
    report: loaded?.revision === revisionId ? loaded.data : null,
    error,
    busy,
    action,
    refresh: () => setRefreshKey((value) => value + 1),
  };
}
