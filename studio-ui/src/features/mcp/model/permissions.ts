export type McpPermission = 'allow' | 'ask' | 'deny';
export interface PolicyTool {
  name: string;
  title?: string;
  description?: string;
  inputSchemaFingerprint: string;
  permission: McpPermission;
}
export interface McpPolicy {
  connectionId: string;
  version: number;
  bulkPermission: McpPermission | 'mixed';
  tools: PolicyTool[];
}
export const permissionLabels: Record<McpPermission, string> = {
  allow: 'Autoriser',
  ask: 'Demander',
  deny: 'Interdire',
};
export async function mcpRequest<T>(
  route: string,
  signal: AbortSignal,
  input?: object,
): Promise<T> {
  const response = await fetch('/api/mcp/' + route, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
    ...(input
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      : {}),
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(
      typeof value.error === 'string' ? value.error : 'Action indisponible. Réessayez.',
    );
  return value as T;
}
