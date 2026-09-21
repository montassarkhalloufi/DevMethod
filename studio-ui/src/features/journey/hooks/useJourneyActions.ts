import { useI18n } from '../../../i18n';
import { useRef, useState } from 'react';
import type { JourneyOptions, JourneyStage } from '../model/contracts';

export function useJourneyActions(options: JourneyOptions) {
  const { t } = useI18n();
  const [pending, setPending] = useState<string | null>(null);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [failure, setFailure] = useState<{
    kind: 'prepare' | 'approve' | 'choose';
    message?: string;
  } | null>(null);
  const error = !failure
    ? ''
    : (failure.message ??
      {
        prepare: t(
          'La demande n’a pas pu être préparée. Réessayez.',
          'The request could not be prepared. Try again.',
        ),
        approve: t(
          'La validation n’a pas été enregistrée. Réessayez.',
          'The approval was not saved. Try again.',
        ),
        choose: t(
          'Le choix n’a pas été enregistré. Réessayez.',
          'The choice was not saved. Try again.',
        ),
      }[failure.kind]);
  const inFlight = useRef(false);
  function prepare(stage: JourneyStage, request: string) {
    setFailure(null);
    try {
      options.onRequest(stage, request);
    } catch (failure) {
      setFailure({
        kind: 'prepare',
        ...(failure instanceof Error ? { message: failure.message } : {}),
      });
    }
  }
  async function approve(masterId: string) {
    if (inFlight.current || !options.onApproveMaster) return;
    inFlight.current = true;
    setPending(masterId);
    setFailure(null);
    try {
      await options.onApproveMaster(masterId);
    } catch (failure) {
      setFailure({
        kind: 'approve',
        ...(failure instanceof Error ? { message: failure.message } : {}),
      });
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }
  async function chooseDirection(designId: string) {
    if (inFlight.current || !options.onChooseDirection) return;
    inFlight.current = true;
    setChoosing(designId);
    setFailure(null);
    try {
      await options.onChooseDirection(designId);
    } catch (failure) {
      setFailure({
        kind: 'choose',
        ...(failure instanceof Error ? { message: failure.message } : {}),
      });
    } finally {
      inFlight.current = false;
      setChoosing(null);
    }
  }
  return { prepare, approve, chooseDirection, pending, choosing, error };
}
