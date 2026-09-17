import { useCallback, useEffect, useRef, useState } from 'react';
import { notifyMcpChange, onMcpChange } from '../model/change-events';

interface Selection {
  supported: boolean;
  connectionIds: string[];
  reason?: string;
}
async function requestSelection(signal: AbortSignal, connectionIds?: string[]): Promise<Selection> {
  const response = await fetch('/api/mcp/selection', {
    credentials: 'same-origin',
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
    ...(connectionIds
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionIds }),
        }
      : {}),
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(
      value.error?.message || value.error || 'La sélection MCP n’a pas été enregistrée.',
    );
  if (
    !Array.isArray(value.connectionIds) ||
    value.connectionIds.some((id: unknown) => typeof id !== 'string')
  )
    throw new Error('La sélection MCP reçue est illisible.');
  return {
    supported: value.supported === true,
    connectionIds: value.connectionIds,
    reason: value.reason,
  };
}

export function useMcpSelection() {
  const [selection, setSelection] = useState<Selection>({ supported: false, connectionIds: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const read = useRef<AbortController | null>(null);
  const write = useRef<AbortController | null>(null);
  const pending = useRef<Promise<unknown> | null>(null);
  const failure = useRef('');
  const failedWrite = useRef(false);
  const changeSource = useRef(Symbol());
  const refreshQueued = useRef(false);
  const refresh = useCallback((preserveWriteFailure = false) => {
    if (write.current) {
      refreshQueued.current = true;
      return;
    }
    refreshQueued.current = false;
    read.current?.abort();
    const controller = new AbortController();
    read.current = controller;
    setLoading(true);
    if (!preserveWriteFailure || !failedWrite.current) {
      setError('');
      failure.current = '';
      failedWrite.current = false;
    }
    pending.current = requestSelection(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setSelection(value);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          failure.current = cause instanceof Error ? cause.message : 'Sélection indisponible.';
          setError(failure.current);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, []);
  useEffect(() => {
    const unsubscribe = onMcpChange('selection', changeSource.current, () => refresh(true));
    refresh();
    return () => {
      unsubscribe();
      read.current?.abort();
      write.current?.abort();
    };
  }, [refresh]);
  async function select(id: string, enabled: boolean) {
    if (
      loading ||
      write.current ||
      !selection.supported ||
      selection.connectionIds.includes(id) === enabled
    )
      return;
    const connectionIds = enabled
      ? [...selection.connectionIds, id]
      : selection.connectionIds.filter((item) => item !== id);
    if (connectionIds.length > 12) {
      setError('Vous pouvez sélectionner au maximum 12 serveurs MCP.');
      return;
    }
    read.current?.abort();
    const controller = new AbortController();
    write.current = controller;
    setSaving(true);
    failure.current = '';
    failedWrite.current = false;
    setError('');
    try {
      const value = await requestSelection(controller.signal, connectionIds);
      if (!controller.signal.aborted) {
        setSelection(value);
        notifyMcpChange('selection', changeSource.current);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        failedWrite.current = true;
        failure.current = cause instanceof Error ? cause.message : 'Sélection non enregistrée.';
        setError(failure.current);
      }
    } finally {
      if (!controller.signal.aborted) {
        write.current = null;
        setSaving(false);
        if (refreshQueued.current) refresh(true);
      }
    }
  }
  return {
    ...selection,
    loading,
    saving,
    error,
    select: (id: string, enabled: boolean) => {
      if (
        loading ||
        write.current ||
        !selection.supported ||
        selection.connectionIds.includes(id) === enabled
      )
        return pending.current;
      const operation = select(id, enabled);
      pending.current = operation;
      return operation;
    },
    refresh: () => refresh(),
    prepareRequest: async () => {
      let operation;
      do {
        operation = pending.current;
        await operation;
      } while (pending.current !== operation);
      return !failure.current;
    },
  };
}
