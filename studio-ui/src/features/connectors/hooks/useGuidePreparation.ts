import { useI18n } from '../../../i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { guideResponse } from './useConnectorGuides';
import { guideInputKey, readGuidePreparation } from '../model/guides';
import type { GuideInput, GuidePreparation } from '../model/guides';

export function useGuidePreparation() {
  const { locale } = useI18n();
  const lastInput = useRef<GuideInput | null>(null);
  const [preparation, setPreparation] = useState<GuidePreparation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const pending = useRef<{ key: string; promise: Promise<GuidePreparation | null> } | null>(null);
  useEffect(
    () => () => {
      request.current?.abort();
      request.current = null;
      pending.current = null;
    },
    [],
  );
  function reset() {
    lastInput.current = null;
    request.current?.abort();
    request.current = null;
    pending.current = null;
    setPreparation(null);
    setLoading(false);
    setError('');
  }
  function prepare(input: GuideInput): Promise<GuidePreparation | null> {
    lastInput.current = input;
    const key = guideInputKey(input);
    if (pending.current?.key === key) return pending.current.promise;
    const promise = run(input, key);
    pending.current = { key, promise };
    return promise;
  }
  const run = useCallback(
    async (input: GuideInput, key: string): Promise<GuidePreparation | null> => {
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      setPreparation(null);
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/connectors/guides/prepare?language=' + locale, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        const value = readGuidePreparation(await guideResponse(response));
        if (controller.signal.aborted || request.current !== controller) return null;
        if (guideInputKey(value.input) !== key)
          throw new Error('La préparation concerne d’autres réponses. Réessayez.');
        setPreparation(value);
        return value;
      } catch (cause) {
        if (!controller.signal.aborted && request.current === controller)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Préparation impossible. Vos réponses sont conservées.',
          );
        return null;
      } finally {
        if (request.current === controller) {
          request.current = null;
          pending.current = null;
          setLoading(false);
        }
      }
    },
    [locale],
  );
  useEffect(() => {
    if (lastInput.current) {
      pending.current = null;
      void run(lastInput.current, guideInputKey(lastInput.current));
    }
  }, [run]);
  return { preparation, loading, error, prepare, reset };
}
