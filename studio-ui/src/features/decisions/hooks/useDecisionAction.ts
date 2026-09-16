import { useRef, useState } from 'react';

interface DraftIdentity {
  draftScope?: string;
  proposalId: string;
  baseRevision: string | null;
}

const reasonLimit = 4000;
const storageUnavailable =
  'Le stockage local est indisponible. Votre raison reste en mémoire ; copiez-la avant de quitter.';

function storageKey(identity: DraftIdentity): string | null {
  if (!identity.draftScope || identity.draftScope.length > 4096) return null;
  return (
    'devmethod:decision-reason:v1:' +
    JSON.stringify([identity.draftScope, identity.proposalId, identity.baseRevision])
  );
}

function parseReason(raw: string): string {
  if (raw.length > 32768) throw new Error('Oversized reason draft');
  const value: unknown = JSON.parse(raw);
  if (
    !value ||
    typeof value !== 'object' ||
    !('format' in value) ||
    value.format !== 1 ||
    !('text' in value) ||
    typeof value.text !== 'string' ||
    value.text.length > reasonLimit
  )
    throw new Error('Invalid reason draft');
  return value.text;
}

function readReason(key: string | null) {
  if (!key) return { reason: '', warning: storageUnavailable };
  try {
    const raw = window.localStorage.getItem(key);
    return { reason: raw === null ? '' : parseReason(raw), warning: '' };
  } catch {
    return { reason: '', warning: storageUnavailable };
  }
}

function persistReason(key: string | null, text: string): string {
  if (!key) return storageUnavailable;
  try {
    window.localStorage.setItem(key, JSON.stringify({ format: 1, text }));
    return '';
  } catch {
    return storageUnavailable;
  }
}

function removeApprovedReason(key: string | null, text: string): string {
  if (!key) return storageUnavailable;
  try {
    const raw = window.localStorage.getItem(key);
    // A different tab may have saved a newer thought under the same identity.
    if (raw !== null && parseReason(raw) === text) window.localStorage.removeItem(key);
    return '';
  } catch {
    return storageUnavailable;
  }
}

function useReasonDraft(identity: DraftIdentity) {
  const key = storageKey(identity);
  const [initial] = useState(() => readReason(key));
  const [reason, setReasonValue] = useState(initial.reason);
  const [storageWarning, setStorageWarning] = useState(initial.warning);
  const current = useRef({ text: initial.reason, edits: 0 });
  function setReason(value: string) {
    const text = value.slice(0, reasonLimit);
    current.current = { text, edits: current.current.edits + 1 };
    setReasonValue(text);
    setStorageWarning(persistReason(key, text));
  }
  function clearApproved(edits: number) {
    if (edits !== current.current.edits) return;
    setStorageWarning(removeApprovedReason(key, current.current.text));
    current.current = { text: '', edits: edits + 1 };
    setReasonValue('');
  }
  return { reason, setReason, storageWarning, current, clearApproved };
}

// Domain state belongs to the caller; the local reason is scoped and is never approval.
export function useDecisionAction(identity: DraftIdentity) {
  const draft = useReasonDraft(identity);
  const inFlight = useRef(false);
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');
  const [error, setError] = useState('');
  async function run(action: () => Promise<void>, approve = false) {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus('saving');
    setError('');
    const submittedAt = draft.current.current.edits;
    try {
      await action();
      if (approve) draft.clearApproved(submittedAt);
    } catch (failure) {
      setError(
        failure &&
          typeof failure === 'object' &&
          'message' in failure &&
          typeof failure.message === 'string'
          ? failure.message
          : 'Enregistrement impossible. Réessayez.',
      );
    } finally {
      inFlight.current = false;
      setStatus('idle');
    }
  }
  return {
    status,
    error,
    run,
    reason: draft.reason,
    setReason: draft.setReason,
    storageWarning: draft.storageWarning,
  };
}
