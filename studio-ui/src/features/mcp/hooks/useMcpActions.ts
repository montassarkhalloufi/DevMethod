import { useEffect, useRef, useState } from 'react';
import { mcpRequest } from '../model/permissions';

export interface McpAction {
  requestId: string;
  jobId: string;
  connectionId: string;
  connectionName: string;
  connectionUrl?: string;
  toolName: string;
  arguments: unknown;
  status: 'pending' | 'executing' | 'completed' | 'denied' | 'expired' | 'cancelled' | 'unknown';
  createdAt: string;
  expiresAt: string;
  error?: { code: string; message: string };
  result?: unknown;
  isError?: boolean;
}
function mergeAction(previous: McpAction | undefined, next: McpAction): McpAction {
  if (!previous || previous.status === 'pending') return next;
  if (next.status === 'pending' || (previous.status !== 'executing' && next.status === 'executing'))
    return previous;
  return next;
}
export function useMcpActions(jobId: string, running: boolean) {
  const [actions, setActions] = useState<McpAction[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const mutation = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const value = await mcpRequest<{ actions: McpAction[] }>(
          'actions?jobId=' + encodeURIComponent(jobId),
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setActions((current) =>
            value.actions.map((next) =>
              mergeAction(
                current.find((item) => item.requestId === next.requestId),
                next,
              ),
            ),
          );
          setError('');
        }
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : 'Actions indisponibles.');
      } finally {
        if (!controller.signal.aborted && running) timer = setTimeout(() => void refresh(), 2000);
      }
    }
    void refresh();
    return () => {
      controller.abort();
      clearTimeout(timer);
      mutation.current?.abort();
    };
  }, [jobId, running, attempt]);
  async function decide(requestId: string, decision: 'allow' | 'deny') {
    if (mutation.current) return;
    const controller = new AbortController();
    mutation.current = controller;
    setBusy(requestId);
    try {
      const value = await mcpRequest<McpAction>('actions/decide', controller.signal, {
        requestId,
        decision,
      });
      if (!controller.signal.aborted) {
        setActions((current) =>
          current.map((item) =>
            item.requestId === value.requestId ? mergeAction(item, value) : item,
          ),
        );
        setError('');
      }
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Décision non enregistrée.');
    } finally {
      if (mutation.current === controller) {
        mutation.current = null;
        setBusy(null);
      }
    }
  }
  return {
    actions: actions.filter((action) => action.jobId === jobId),
    error,
    busy,
    decide,
    refresh: () => setAttempt((value) => value + 1),
  };
}
