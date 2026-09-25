import { useEffect, useRef, useState } from 'react';
import { applyIntent, describeChange } from '../model/domain';
import type { BookingIntent, Snapshot } from '../model/types';
import { createWorkshopStore, DataConflict, type WorkshopStore } from '../services/workshop-store';

const defaultStore = createWorkshopStore();
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : 'Une erreur est survenue. Votre saisie reste conservée.';

/** Owns requests and their lifetime. Domain rules remain independent of React. */
export function useWorkshopData(store: WorkshopStore = defaultStore) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [retryIntent, setRetryIntent] = useState<BookingIntent | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const current = useRef<Snapshot | null>(null);
  const pending = useRef(false);
  const lifetime = useRef<AbortController | null>(null);

  function accept(next: Snapshot) {
    current.current = next;
    setSnapshot(next);
  }

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    pending.current = false;
    setBusy(false);
    setLoading(true);
    store
      .load(controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        accept(next);
        setMessage('');
        setFailed(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setMessage(messageOf(error));
        setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [store, loadAttempt]);

  async function reportFailure(error: unknown, controller: AbortController) {
    if (controller.signal.aborted) return;
    if (error instanceof DataConflict) {
      try {
        const fresh = await store.load(controller.signal);
        if (controller.signal.aborted) return;
        accept(fresh);
      } catch (reloadError) {
        if (controller.signal.aborted) return;
        setMessage(`Conflit détecté, puis ${messageOf(reloadError)} Votre saisie est conservée.`);
        setFailed(true);
        return;
      }
    }
    setMessage(messageOf(error));
    setFailed(true);
  }

  async function perform(intent: BookingIntent): Promise<boolean> {
    const before = current.current;
    const controller = lifetime.current;
    if (!before || pending.current || !controller || controller.signal.aborted) return false;
    pending.current = true;
    setBusy(true);
    setRetryIntent(intent);
    try {
      const next = applyIntent(before.data, intent);
      const saved = await store.save(before.version, next, controller.signal);
      if (controller.signal.aborted) return false;
      accept(saved);
      setMessage(describeChange(before.data, saved.data, intent));
      setFailed(false);
      setRetryIntent(null);
      return true;
    } catch (error) {
      await reportFailure(error, controller);
      return false;
    } finally {
      if (!controller.signal.aborted) {
        pending.current = false;
        setBusy(false);
      }
    }
  }

  return {
    snapshot,
    loading,
    busy,
    message,
    failed,
    retryIntent,
    perform,
    reload: () => setLoadAttempt((value) => value + 1),
  };
}
