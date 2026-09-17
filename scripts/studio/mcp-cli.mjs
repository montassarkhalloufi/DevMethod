import fs from 'node:fs';
import { mcpShape, mcpRequire } from './mcp-contract.mjs';

export function readWorkerJSON(file, command) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (['mcp-tools', 'mcp-call'].includes(command))
      throw new Error('Fichier JSON local du pont MCP illisible ; aucun contenu affiché.', {
        cause: error,
      });
    throw error;
  }
}

export function mcpWorkerRequest(command, input, runtime) {
  const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + runtime.token };
  if (command === 'mcp-call')
    return {
      url: runtime.url + '/api/mcp/call',
      init: { method: 'POST', headers, body: JSON.stringify(input) },
    };
  mcpShape(input, ['jobId', 'connectionId', 'toolName']);
  mcpRequire(
    Object.values(input).every((value) => typeof value === 'string'),
    'Paramètres MCP invalides.',
  );
  return { url: runtime.url + '/api/mcp/tools?' + new URLSearchParams(input), init: { headers } };
}
