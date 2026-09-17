import { useEffect, useRef, useState } from 'react';
import { mcpRequest } from '../model/permissions';
import type { McpPermission, McpPolicy, PolicyTool } from '../model/permissions';

export function useMcpPolicy(connectionId: string) {
  const [policy, setPolicy] = useState<McpPolicy | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mutation = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void mcpRequest<McpPolicy>(
      'policy?connectionId=' + encodeURIComponent(connectionId),
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted) {
          setPolicy((current) =>
            current?.connectionId === value.connectionId && current.version > value.version
              ? current
              : value,
          );
          setError('');
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message);
      });
    return () => {
      controller.abort();
      mutation.current?.abort();
    };
  }, [connectionId, attempt]);
  async function change(tools: PolicyTool[], permission: McpPermission) {
    if (!policy || policy.connectionId !== connectionId || mutation.current) return;
    const controller = new AbortController();
    mutation.current = controller;
    setBusy(true);
    try {
      const next = await mcpRequest<McpPolicy>('policy', controller.signal, {
        connectionId,
        version: policy.version,
        updates: tools.map((tool) => ({
          toolName: tool.name,
          inputSchemaFingerprint: tool.inputSchemaFingerprint,
          permission,
        })),
      });
      if (!controller.signal.aborted) {
        setPolicy((current) =>
          current?.connectionId === next.connectionId && current.version > next.version
            ? current
            : next,
        );
        setError('');
      }
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Réglage non enregistré.');
    } finally {
      if (mutation.current === controller) {
        mutation.current = null;
        setBusy(false);
      }
    }
  }
  return {
    policy: policy?.connectionId === connectionId ? policy : null,
    busy,
    error,
    change,
    refresh: () => setAttempt((value) => value + 1),
  };
}
