import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { auth } from '@modelcontextprotocol/sdk/client/auth.js';
import { createMcpFetch } from './mcp-network.mjs';
import { discoverMcpTools, withoutSecrets } from './mcp-tools.mjs';
import { mcpRequire, mcpError } from './mcp-contract.mjs';
import { validateMcpArguments } from './mcp-schema.mjs';

async function connectedClient(entry, provider, signal, fetcher, sse = false) {
  const client = new Client({ name: 'DevMethod Studio', version: '0.5.0' }, { capabilities: {} });
  const options = {
    fetch: fetcher,
    ...(provider ? { authProvider: provider } : {}),
    ...(entry.auth === 'bearer'
      ? { requestInit: { headers: { Authorization: `Bearer ${entry.secret.bearerToken}` } } }
      : {}),
    reconnectionOptions: {
      maxRetries: 0,
      initialReconnectionDelay: 1000,
      maxReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1,
    },
  };
  const url = new URL(entry.url);
  const transport = sse
    ? new SSEClientTransport(url, options)
    : new StreamableHTTPClientTransport(url, options);
  try {
    await client.connect(transport, { signal, timeout: 15000 });
    return client;
  } catch (error) {
    await client.close();
    if (!sse && [404, 405].includes(error.code))
      return connectedClient(entry, provider, signal, fetcher, true);
    throw error;
  }
}

export async function performMcpSession({ entry, provider, operation, now, code, call }) {
  const signal = operation.controller.signal;
  const fetcher = createMcpFetch(entry.url, signal);
  if (
    code !== undefined ||
    (provider && entry.secret.expiresAt && entry.secret.expiresAt <= now())
  ) {
    const result = await auth(provider, {
      serverUrl: entry.url,
      authorizationCode: code,
      fetchFn: fetcher,
    });
    mcpRequire(
      result === 'AUTHORIZED',
      'Autorisation utilisateur nécessaire.',
      401,
      'authorization-required',
    );
  }
  const client = await connectedClient(entry, provider, signal, fetcher);
  try {
    const tools = await discoverMcpTools(client, entry.secret, signal);
    if (!call) return { tools };
    const tool = tools.find((item) => item.name === call.name);
    mcpRequire(
      tool &&
        tool.inputSchemaFingerprint === call.fingerprint &&
        tool.outputSchemaFingerprint === call.outputFingerprint,
      'Le contrat de l’outil a changé. Actualisez la connexion.',
      409,
      'tool-changed',
    );
    mcpRequire(
      tool.execution?.taskSupport !== 'required',
      'Cet outil exige un protocole de tâches non pris en charge.',
      422,
      'unsupported-tool',
    );
    call.beforeCall?.();
    const result = await client.callTool({ name: call.name, arguments: call.args }, undefined, {
      signal,
      timeout: 15000,
    });
    mcpRequire(
      JSON.stringify(result).length <= 2 * 1024 * 1024,
      'Résultat MCP trop volumineux.',
      413,
      'result-limit',
    );
    if (tool.outputSchema && !result.isError) {
      mcpRequire(result.structuredContent, 'Résultat structuré MCP manquant.', 502, 'tool-result');
      try {
        await validateMcpArguments(tool.outputSchema, result.structuredContent, { signal });
      } catch {
        throw mcpError(
          'Résultat MCP incompatible ou non validable. Un effet externe éventuel est inconnu ; ne relancez pas automatiquement l’appel.',
          502,
          'tool-result',
        );
      }
    }
    return { tools, result: withoutSecrets(result, entry.secret) };
  } finally {
    await client.close();
  }
}
