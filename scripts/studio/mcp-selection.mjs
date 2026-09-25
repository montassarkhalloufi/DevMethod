import fs from 'node:fs';
import { safeFile, atomicJSON } from './files.mjs';
import { mcpRequire, mcpId, mcpShape, mcpLimits } from './mcp-contract.mjs';

export function validateMcpSelection(ids, manager) {
  mcpRequire(
    Array.isArray(ids) &&
      ids.length <= mcpLimits.selected &&
      ids.every(mcpId) &&
      new Set(ids).size === ids.length,
    'Sélection MCP invalide (12 connexions maximum).',
  );
  const connections = manager?.list().connections ?? [];
  return ids.map((id) => {
    const connection = connections.find((entry) => entry.id === id);
    mcpRequire(
      connection?.status === 'connected',
      'Reconnectez les services MCP sélectionnés avant de continuer.',
      409,
      'not-connected',
    );
    return {
      id,
      name: connection.name,
      tools: connection.tools.slice(0, 20).map((tool) => tool.name),
    };
  });
}

export function readMcpSelection(store) {
  const file = safeFile(store.root, '.devmethod/mcp-selection.json');
  if (!fs.existsSync(file)) return { format: 1, connectionIds: [] };
  const stat = fs.lstatSync(file);
  mcpRequire(stat.isFile() && stat.size <= 4096, 'Sélection MCP illisible.');
  const input = JSON.parse(fs.readFileSync(file, 'utf8'));
  mcpShape(input, ['format', 'connectionIds']);
  mcpRequire(
    input.format === 1 &&
      Array.isArray(input.connectionIds) &&
      input.connectionIds.length <= mcpLimits.selected &&
      input.connectionIds.every(mcpId) &&
      new Set(input.connectionIds).size === input.connectionIds.length,
    'Sélection MCP illisible.',
  );
  return input;
}

export function writeMcpSelection(store, connectionIds, manager) {
  validateMcpSelection(connectionIds, manager);
  const value = { format: 1, connectionIds: [...connectionIds] };
  atomicJSON(safeFile(store.root, '.devmethod/mcp-selection.json'), value);
  return value;
}
