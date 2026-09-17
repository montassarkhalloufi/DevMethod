import fs from 'node:fs';
import { mcpShape, mcpRequire } from './mcp-contract.mjs';

export function readWorkerJSON(file, command) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (
      ['mcp-tools', 'mcp-call', 'mcp-actions', 'guide-request', 'guide-responses'].includes(command)
    )
      throw new Error('Fichier JSON local du pont MCP illisible ; aucun contenu affiché.', {
        cause: error,
      });
    throw error;
  }
}

export function mcpWorkerRequest(command, input, runtime) {
  const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + runtime.token };
  if (['mcp-call', 'guide-request'].includes(command))
    return {
      url:
        runtime.url +
        (command === 'mcp-call' ? '/api/mcp/call' : '/api/connectors/interactions/request'),
      init: { method: 'POST', headers, body: JSON.stringify(input) },
    };
  const keys =
    command === 'mcp-actions'
      ? ['jobId', 'requestId']
      : command === 'guide-responses'
        ? ['jobId']
        : ['jobId', 'connectionId', 'toolName'];
  mcpShape(input, keys);
  mcpRequire(
    Object.values(input).every((value) => typeof value === 'string'),
    'Paramètres MCP invalides.',
  );
  const route =
    command === 'mcp-actions'
      ? '/api/mcp/actions'
      : command === 'guide-responses'
        ? '/api/connectors/interactions'
        : '/api/mcp/tools';
  return { url: runtime.url + route + '?' + new URLSearchParams(input), init: { headers } };
}
