import { useRef, useState } from 'react';
import type { JourneyOptions, JourneyStage } from '../model/contracts';

export function useJourneyActions(options: JourneyOptions) {
  const [pending, setPending] = useState<string | null>(null);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  function prepare(stage: JourneyStage, request: string) {
    setError('');
    try {
      options.onRequest(stage, request);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'La demande n’a pas pu être préparée. Réessayez.',
      );
    }
  }
  async function approve(masterId: string) {
    if (inFlight.current || !options.onApproveMaster) return;
    inFlight.current = true;
    setPending(masterId);
    setError('');
    try {
      await options.onApproveMaster(masterId);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'La validation n’a pas été enregistrée. Réessayez.',
      );
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }
  async function chooseDirection(designId: string) {
    if (inFlight.current || !options.onChooseDirection) return;
    inFlight.current = true;
    setChoosing(designId);
    setError('');
    try {
      await options.onChooseDirection(designId);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Le choix n’a pas été enregistré. Réessayez.',
      );
    } finally {
      inFlight.current = false;
      setChoosing(null);
    }
  }
  return { prepare, approve, chooseDirection, pending, choosing, error };
}
