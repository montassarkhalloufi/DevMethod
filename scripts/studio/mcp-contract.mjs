import { randomUUID } from 'node:crypto';

export const mcpLimits = Object.freeze({ connections: 32, tools: 200, selected: 12 });
export const mcpPresets = Object.freeze([
  {
    id: 'notion',
    name: 'Notion',
    url: 'https://mcp.notion.com/mcp',
    auth: 'oauth',
    docs: 'https://developers.notion.com/guides/mcp/get-started-with-mcp',
  },
  {
    id: 'linear',
    name: 'Linear',
    url: 'https://mcp.linear.app/mcp',
    auth: 'oauth',
    docs: 'https://linear.app/docs/mcp',
  },
  {
    id: 'sentry',
    name: 'Sentry',
    url: 'https://mcp.sentry.dev/mcp',
    auth: 'oauth',
    docs: 'https://mcp.sentry.dev/',
  },
]);
export const mcpId = (value) =>
  typeof value === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value);

export function mcpError(message, status = 400, code = 'invalid-input') {
  return Object.assign(new Error(message), { status, code, mcpSafe: true });
}

export function mcpRequire(value, message, status, code) {
  if (!value) throw mcpError(message, status, code);
}

export function mcpShape(value, keys) {
  mcpRequire(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).every((key) => keys.includes(key)),
    'Champs MCP invalides.',
  );
}

export function mcpText(value, maximum, empty = false) {
  mcpRequire(
    typeof value === 'string' &&
      value.length <= maximum &&
      (empty || value.trim()) &&
      !/[\p{Cc}]/u.test(value),
    'Texte MCP invalide.',
  );
  return value.trim();
}

export function mcpURL(value, { query = false, localOrigin } = {}) {
  mcpText(value, 2048);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw mcpError('Adresse MCP invalide.');
  }
  mcpRequire(
    !url.username && !url.password && !url.hash && !value.includes('\\') && (query || !url.search),
    'Adresse sans identifiants, fragment ni paramètres secrets requise.',
  );
  const local = ['127.0.0.1', 'localhost'].includes(url.hostname);
  mcpRequire(
    url.protocol === 'https:' ||
      (url.protocol === 'http:' && local && (!localOrigin || url.origin === localOrigin)),
    'HTTPS requis, sauf serveur MCP explicitement local.',
  );
  return url;
}

export function connectionInput(input, connections) {
  mcpShape(input, ['id', 'provider', 'name', 'url', 'auth', 'bearerToken']);
  const preset = mcpPresets.find((entry) => entry.id === input.provider);
  mcpRequire(preset || input.provider === 'custom', 'Fournisseur MCP inconnu.');
  if (input.id !== undefined) mcpRequire(mcpId(input.id), 'Identifiant MCP invalide.');
  const prior = input.id
    ? connections.find((entry) => entry.id === input.id)
    : connections.find((entry) => preset && entry.provider === preset.id);
  if (input.id) mcpRequire(prior, 'Connexion MCP absente.', 404);
  mcpRequire(
    !preset || (input.url === undefined && (input.auth === undefined || input.auth === 'oauth')),
    'Ce fournisseur utilise son endpoint OAuth officiel.',
  );
  const auth = input.auth ?? 'oauth';
  mcpRequire(['oauth', 'bearer', 'none'].includes(auth), 'Authentification MCP inconnue.');
  mcpRequire(
    input.bearerToken === undefined || auth === 'bearer',
    'Une clé est réservée au mode Bearer.',
  );
  const config = {
    id: prior?.id ?? randomUUID(),
    provider: input.provider,
    name: mcpText(input.name ?? preset?.name, 100),
    url: mcpURL(preset?.url ?? input.url).href,
    auth,
  };
  const reuse = prior && ['provider', 'url', 'auth'].every((key) => prior[key] === config[key]);
  const bearerToken =
    input.bearerToken === undefined && reuse ? prior.secret?.bearerToken : input.bearerToken;
  if (auth === 'bearer') mcpText(bearerToken, 8192);
  mcpRequire(
    prior || connections.length < mcpLimits.connections,
    'Maximum de 32 connexions atteint.',
    429,
  );
  return {
    prior,
    config,
    secret: { ...(reuse ? prior.secret : {}), ...(auth === 'bearer' ? { bearerToken } : {}) },
  };
}

export function publicConnection(entry) {
  const { id, version, name, provider, url, auth, status, connectedAt, error } = entry;
  return {
    id,
    version,
    name,
    provider,
    url,
    auth,
    status,
    tools: (entry.tools ?? []).map((tool) => {
      const result = { ...tool };
      delete result.inputSchema;
      delete result.outputSchema;
      return result;
    }),
    ...(connectedAt ? { connectedAt } : {}),
    ...(error ? { error } : {}),
  };
}
