import { useEffect, useState } from 'react';
import type { Drafts } from '../model/types';

const DRAFT_KEY = 'les-ateliers:drafts:v1';

function readDrafts(): Drafts {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  } catch {
    return {};
  }
}

export function useBookingDrafts() {
  const [drafts, setDrafts] = useState<Drafts>(readDrafts);
  const [storageWarning, setStorageWarning] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
      setStorageWarning(false);
    } catch {
      setStorageWarning(true);
    }
  }, [drafts]);
  return {
    drafts,
    storageWarning,
    change: (id: string, name: string) => setDrafts((previous) => ({ ...previous, [id]: name })),
    clear: (id: string, submitted: string) =>
      setDrafts((previous) => {
        // A completed request must not erase text typed while it was in flight.
        if (previous[id] !== submitted) return previous;
        const next = { ...previous };
        delete next[id];
        return next;
      }),
  };
}
