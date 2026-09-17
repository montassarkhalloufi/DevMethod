import { digest } from './files.mjs';
import { mcpLimits, mcpRequire } from './mcp-contract.mjs';
import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';

export function withoutSecrets(value, secret) {
  const encoded = JSON.stringify(value);
  const values = [
    secret?.bearerToken,
    secret?.tokens?.access_token,
    secret?.tokens?.refresh_token,
    secret?.client?.client_secret,
  ].filter(Boolean);
  mcpRequire(
    !values.some((token) => encoded.includes(JSON.stringify(token).slice(1, -1))) &&
      !/https?:\/\/[^\s/"<>]+:[^\s/"<>]+@/i.test(encoded),
    'Réponse MCP contenant des identifiants refusée.',
    502,
    'sensitive-result',
  );
  return value;
}

function label(value, maximum) {
  return typeof value === 'string' ? value.replace(/[\p{Cc}]/gu, ' ').slice(0, maximum) : undefined;
}

export function sanitizeMcpTool(tool, secret) {
  mcpRequire(
    typeof tool.name === 'string' && /^[A-Za-z0-9_.-]{1,128}$/.test(tool.name),
    'Nom d’outil MCP incompatible.',
    502,
    'tool-contract',
  );
  const encoded = JSON.stringify(tool.inputSchema);
  mcpRequire(
    encoded && encoded.length <= 65536 && tool.inputSchema.type === 'object',
    'Schéma d’outil MCP absent ou trop volumineux.',
    502,
    'tool-contract',
  );
  const output = tool.outputSchema && JSON.stringify(tool.outputSchema);
  mcpRequire(
    !output || (output.length <= 65536 && tool.outputSchema.type === 'object'),
    'Schéma de sortie MCP incompatible.',
    502,
    'tool-contract',
  );
  const annotations = {};
  for (const key of ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint'])
    if (typeof tool.annotations?.[key] === 'boolean') annotations[key] = tool.annotations[key];
  return withoutSecrets(
    {
      name: tool.name,
      ...(tool.title ? { title: label(tool.title, 200) } : {}),
      ...(tool.description ? { description: label(tool.description, 1000) } : {}),
      inputSchema: structuredClone(tool.inputSchema),
      inputSchemaFingerprint: digest(encoded),
      ...(output
        ? {
            outputSchema: structuredClone(tool.outputSchema),
            outputSchemaFingerprint: digest(output),
          }
        : {}),
      ...(tool.execution ? { execution: structuredClone(tool.execution) } : {}),
      ...(Object.keys(annotations).length ? { annotations } : {}),
    },
    secret,
  );
}

export async function discoverMcpTools(client, secret, signal) {
  const tools = [],
    cursors = new Set(),
    names = new Set();
  let cursor;
  do {
    // The SDK listTools helper compiles output schemas synchronously. Keep untrusted
    // schemas as data here; invocation validates structured output in a bounded worker.
    const page = await client.request(
      { method: 'tools/list', params: cursor ? { cursor } : {} },
      ListToolsResultSchema,
      { signal, timeout: 15000 },
    );
    mcpRequire(
      tools.length + page.tools.length <= mcpLimits.tools && cursors.size < 20,
      'Liste MCP trop volumineuse.',
      502,
      'tool-limit',
    );
    for (const item of page.tools) {
      const tool = sanitizeMcpTool(item, secret);
      mcpRequire(!names.has(tool.name), 'Liste MCP avec doublon.', 502, 'tool-contract');
      names.add(tool.name);
      tools.push(tool);
    }
    cursor = page.nextCursor;
    if (cursor) {
      mcpRequire(
        cursor.length <= 2048 && !cursors.has(cursor),
        'Pagination MCP incohérente.',
        502,
        'tool-pagination',
      );
      cursors.add(cursor);
    }
  } while (cursor);
  return tools;
}
