import { useEffect, useState } from 'react';
import type { ProjectIntelligence } from '../model/contracts';

type Result = { key: string; scopeKey: string; model?: ProjectIntelligence; error?: string };
export function useProjectModel(
  revisionId: string | null,
  baseRevisionId: string | null,
  draft: boolean,
) {
  const [result, setResult] = useState<Result>({ key: '', scopeKey: '' });
  const [generation, setGeneration] = useState(0);
  const scopeKey = JSON.stringify([revisionId, baseRevisionId, draft]);
  const key = JSON.stringify([revisionId, baseRevisionId, draft, generation]);
  useEffect(() => {
    if (!revisionId) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ revision: revisionId });
    if (baseRevisionId) query.set('base', baseRevisionId);
    if (draft) query.set('draft', '1');
    const timer = window.setTimeout(() => {
      void fetch('/api/project/model?' + query, {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      })
        .then(async (response) => {
          const body = (await response.json()) as ProjectIntelligence & { error?: string };
          if (!response.ok) throw new Error(body.error || 'Analyse indisponible.');
          if (
            body.analysis.revisionId !== revisionId &&
            !(draft && body.analysis.baseRevisionId === revisionId)
          )
            throw new Error('L’analyse reçue concerne une autre version.');
          if (!controller.signal.aborted) setResult({ key, scopeKey, model: body });
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted)
            setResult((previous) => ({
              key,
              scopeKey,
              model: previous.scopeKey === scopeKey ? previous.model : undefined,
              error: error instanceof Error ? error.message : 'Analyse interrompue.',
            }));
        });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [revisionId, baseRevisionId, draft, scopeKey, key]);
  useEffect(() => {
    const refresh = () => setGeneration((value) => value + 1);
    document.addEventListener('studio:editor-saved', refresh);
    return () => document.removeEventListener('studio:editor-saved', refresh);
  }, []);
  const model = result.scopeKey === scopeKey ? result.model : undefined;
  const error = result.key === key ? result.error : undefined;
  const loading = Boolean(revisionId) && result.key !== key;
  return {
    // Refreshes retain the same scope's snapshot so mounted controls and focus survive.
    // A revision, comparison base or draft change must never reuse that snapshot.
    model,
    error,
    loading,
    stale: Boolean(model) && (loading || Boolean(error)),
    refresh: () => setGeneration((value) => value + 1),
  };
}
