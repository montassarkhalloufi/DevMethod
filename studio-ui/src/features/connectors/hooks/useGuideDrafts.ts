import { useEffect, useState, useSyncExternalStore } from 'react';
import { GuideDraftSession } from '../model/guide-draft-session';

export function useGuideDrafts({ enabled = true }: { enabled?: boolean } = {}) {
  const [session] = useState(() => new GuideDraftSession());
  const state = useSyncExternalStore(session.subscribe, session.snapshot);
  useEffect(() => {
    if (!enabled) return;
    session.resume();
    return () => session.dispose();
  }, [enabled, session]);
  return {
    ...state,
    edit: session.edit.bind(session),
    retry: () => session.load(),
    clear: (optionId: string) => session.edit(optionId, null, 0),
  };
}
