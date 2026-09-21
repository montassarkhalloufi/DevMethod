import { useI18n } from '../../../i18n';
import { useEffect, useRef, useState } from 'react';
import { readGuideDefinitions } from '../model/guides';
import type { GuideDefinition } from '../model/guides';

export async function guideResponse(response: Response): Promise<unknown> {
  const value = await response.json();
  if (!response.ok)
    throw new Error(
      typeof value?.error === 'string' ? value.error : 'Le guide ne répond pas. Réessayez.',
    );
  return value;
}

export function useConnectorGuides({ enabled = true }: { enabled?: boolean } = {}) {
  const { locale } = useI18n();
  const [guides, setGuides] = useState<GuideDefinition[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const current = ++generation.current;
    setLoading(true);
    setError('');
    fetch('/api/connectors/guides?language=' + locale, {
      cache: 'no-store',
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
    })
      .then(guideResponse)
      .then(readGuideDefinitions)
      .then((value) => {
        if (!controller.signal.aborted && current === generation.current) setGuides(value);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted && current === generation.current)
          setError(cause instanceof Error ? cause.message : 'Guides indisponibles.');
      })
      .finally(() => {
        if (!controller.signal.aborted && current === generation.current) setLoading(false);
      });
    return () => {
      controller.abort();
      generation.current = current + 1;
    };
  }, [enabled, version, locale]);
  return {
    guides,
    loading: enabled && loading,
    error,
    refresh: () => setVersion((value) => value + 1),
  };
}
