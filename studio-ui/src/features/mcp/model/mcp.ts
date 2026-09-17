export type McpAuth = 'oauth' | 'bearer' | 'none';
export type McpProvider = 'notion' | 'linear' | 'sentry' | 'custom';
export interface McpConnection {
  id: string;
  name: string;
  provider: McpProvider;
  url: string;
  auth: McpAuth;
  status: 'disconnected' | 'connecting' | 'authorization-required' | 'connected' | 'error';
  tools: { name: string; title?: string; description?: string }[];
  error?: { code?: string; message: string };
}
export interface McpPreset {
  id: Exclude<McpProvider, 'custom'>;
  name: string;
  url: string;
  auth: 'oauth';
  docs: string;
}
export interface McpIndex {
  presets: McpPreset[];
  connections: McpConnection[];
  supported: boolean;
}
export interface McpConnectInput {
  id?: string;
  provider: McpProvider;
  name?: string;
  url?: string;
  auth?: McpAuth;
  bearerToken?: string;
}

export function reconnectMcpInput(connection: McpConnection): McpConnectInput {
  return {
    id: connection.id,
    provider: connection.provider,
    auth: connection.auth,
    ...(connection.provider === 'custom' ? { name: connection.name, url: connection.url } : {}),
  };
}

export function readMcpConnection(value: unknown): McpConnection {
  const item = value as McpConnection | null;
  if (
    !item ||
    ![item.id, item.name, item.url].every((v) => typeof v === 'string' && v.length) ||
    !['notion', 'linear', 'sentry', 'custom'].includes(item.provider) ||
    !['oauth', 'bearer', 'none'].includes(item.auth) ||
    !['disconnected', 'connecting', 'authorization-required', 'connected', 'error'].includes(
      item.status,
    ) ||
    !Array.isArray(item.tools) ||
    item.tools.some((tool) => !tool || typeof tool.name !== 'string')
  ) {
    throw new Error('La connexion MCP reçue est illisible. Actualisez son état.');
  }
  return {
    id: item.id,
    name: item.name,
    provider: item.provider,
    url: item.url,
    auth: item.auth,
    status: item.status,
    tools: item.tools.map((tool) => ({
      name: tool.name,
      ...(typeof tool.title === 'string' ? { title: tool.title } : {}),
      ...(typeof tool.description === 'string' ? { description: tool.description } : {}),
    })),
    ...(typeof item.error?.message === 'string'
      ? {
          error: {
            message: item.error.message,
            ...(typeof item.error.code === 'string' ? { code: item.error.code } : {}),
          },
        }
      : {}),
  };
}

export function readMcpIndex(value: unknown): McpIndex {
  const item = value as McpIndex | null;
  if (!item || !Array.isArray(item.connections) || !Array.isArray(item.presets))
    throw new Error('La liste des serveurs MCP est indisponible.');
  const presets = item.presets.filter(
    (preset) =>
      preset &&
      ['notion', 'linear', 'sentry'].includes(preset.id) &&
      typeof preset.name === 'string' &&
      typeof preset.url === 'string',
  );
  return {
    presets,
    connections: item.connections.map(readMcpConnection),
    supported: item.supported !== false,
  };
}

export function mcpAuthorizationUrl(value: unknown) {
  if (typeof value !== 'string')
    throw new Error('Le serveur n’a pas renvoyé d’adresse d’autorisation.');
  const url = new URL(value);
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (
    (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
    url.username ||
    url.password ||
    value.includes('\\')
  )
    throw new Error('L’adresse d’autorisation renvoyée est invalide.');
  return url.href;
}

export const mcpStatusLabels: Record<McpConnection['status'], string> = {
  disconnected: 'Déconnecté',
  connecting: 'Connexion en cours',
  'authorization-required': 'Autorisation attendue',
  connected: 'Connecté',
  error: 'Connexion à rétablir',
};

export function mcpConnectionInput(form: HTMLFormElement): McpConnectInput {
  const data = new FormData(form);
  const provider = String(data.get('mcp-provider') || 'custom') as McpProvider;
  if (provider !== 'custom') return { provider };
  const name = String(data.get('mcp-name') || '').trim();
  const url = String(data.get('mcp-url') || '').trim();
  const auth = String(data.get('mcp-auth') || 'oauth') as McpAuth;
  if (!name || !url) throw new Error('Indiquez un nom et l’adresse du serveur MCP.');
  const parsed = new URL(url);
  if (
    (parsed.protocol !== 'https:' &&
      !(parsed.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(parsed.hostname))) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    url.includes('\\')
  )
    throw new Error(
      'Utilisez une adresse HTTPS (ou HTTP locale) sans identifiant, paramètres ni fragment.',
    );
  const bearerToken = String(data.get('mcp-token') || '');
  if (auth === 'bearer' && !bearerToken.trim()) throw new Error('Saisissez le jeton de connexion.');
  return { provider, name, url, auth, ...(auth === 'bearer' ? { bearerToken } : {}) };
}
