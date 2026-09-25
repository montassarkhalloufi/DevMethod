import { useEffect, useRef, useState } from 'react';
import { useGuidePreparation } from '../connectors';
import type { GuideInput, GuidePreparation } from '../connectors';
import { guideResponse } from '../connectors/hooks/useConnectorGuides';
import { readInteraction } from './model';
import type { ConnectorInteraction } from './model';

type Edit = { input: GuideInput | null; step: number };

export function useInteractionAnswer(
  record: ConnectorInteraction,
  onSaved: (item: ConnectorInteraction) => void,
) {
  const [local, setLocal] = useState<Edit>({ input: record.input, step: record.step });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const validation = useGuidePreparation();
  const current = useRef({
    record,
    local,
    pending: null as Edit | null,
    failed: false,
    alive: true,
    task: null as Promise<boolean> | null,
  });
  useEffect(() => {
    const state = current.current;
    state.alive = true;
    return () => {
      state.alive = false;
    };
  }, []);
  useEffect(() => {
    const state = current.current;
    if (record.version < state.record.version) return;
    state.record = record;
    if (record.status === 'answered') {
      state.pending = null;
      state.failed = false;
      setError('');
    }
    if (!state.pending && !state.task) {
      state.local = { input: record.input, step: record.step };
      setLocal(state.local);
    }
  }, [record]);

  async function post(route: 'draft' | 'answer', edit: Edit) {
    const result = (await guideResponse(
      await fetch('/api/connectors/interactions/' + route, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          interactionId: record.id,
          expectedVersion: current.current.record.version,
          ...edit,
        }),
        signal: AbortSignal.timeout(15000),
      }),
    )) as { interaction: unknown };
    const value = readInteraction(result.interaction);
    if (value.id !== record.id || value.jobId !== record.jobId)
      throw new Error('Questionnaire différent.');
    current.current.record = value;
    if (current.current.alive) onSaved(value);
    return value;
  }
  async function drain() {
    const state = current.current;
    setSaving(true);
    try {
      while (state.pending && state.record.status === 'pending') {
        const edit = state.pending;
        await post('draft', edit);
        if (state.pending === edit) state.pending = null;
      }
      return !state.pending;
    } catch {
      state.failed = true;
      if (state.alive && state.record.status === 'pending')
        setError(
          'Réponses non enregistrées ou questionnaire modifié. Votre saisie est conservée. Réessayez après avoir relu son état.',
        );
      return false;
    } finally {
      state.task = null;
      if (state.alive) setSaving(false);
    }
  }
  function flush() {
    const state = current.current;
    if (state.task) return state.task;
    if (state.failed) return Promise.resolve(false);
    if (!state.pending) return Promise.resolve(true);
    state.task = drain();
    return state.task;
  }
  function edit(value: Edit) {
    if (record.status !== 'pending') return;
    const state = current.current;
    state.local = value;
    state.pending = value;
    setLocal(value);
    void flush();
  }
  async function answer(value: GuidePreparation) {
    if (!(await flush())) return;
    setSaving(true);
    try {
      await post('answer', { input: value.input, step: 2 });
    } catch {
      setError(
        'Réponse non transmise. Votre saisie est conservée ; relisez le questionnaire avant de réessayer.',
      );
    } finally {
      if (current.current.alive) setSaving(false);
    }
  }
  return {
    local,
    saving,
    error,
    validation,
    change: (input: GuideInput) => {
      validation.reset();
      edit({ ...current.current.local, input });
    },
    setStep: (step: number) => edit({ ...current.current.local, step }),
    answer,
    retry: () => {
      current.current.failed = false;
      setError('');
      void flush();
    },
  };
}
