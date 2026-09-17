import fs from 'node:fs';
import { assertRealDirectory, safeFile, atomicJSON } from './files.mjs';
import { mcpRequire, mcpId, mcpURL, mcpLimits, mcpError } from './mcp-contract.mjs';

export function createMcpStore(directory) {
  const root = assertRealDirectory(directory);
  if (fs.existsSync(root)) fs.chmodSync(root, 0o700);
  const file = safeFile(root, 'connections.json');
  let entries = [];
  if (fs.existsSync(file)) {
    const stat = fs.lstatSync(file);
    mcpRequire(stat.isFile() && stat.size <= 16 * 1024 * 1024, 'Stockage MCP invalide.');
    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      throw mcpError('Stockage MCP illisible ; aucun remplacement effectué.');
    }
    mcpRequire(
      data.format === 1 &&
        Array.isArray(data.connections) &&
        data.connections.length <= mcpLimits.connections,
      'Stockage MCP invalide.',
    );
    const ids = new Set();
    for (const entry of data.connections) {
      mcpRequire(
        mcpId(entry.id) &&
          !ids.has(entry.id) &&
          typeof entry.name === 'string' &&
          ['oauth', 'none', 'bearer'].includes(entry.auth) &&
          Array.isArray(entry.tools) &&
          entry.tools.length <= mcpLimits.tools,
        'Connexion MCP sauvegardée invalide.',
      );
      mcpURL(entry.url);
      ids.add(entry.id);
      // A saved observation is not a live connection after restart. Refresh is explicit.
      entries.push({ ...entry, status: 'disconnected', error: undefined });
    }
    fs.chmodSync(file, 0o600);
  }
  return {
    read: () => structuredClone(entries),
    write(next) {
      mcpRequire(
        Buffer.byteLength(JSON.stringify(next)) <= 16 * 1024 * 1024,
        'Stockage MCP trop volumineux.',
        413,
      );
      fs.mkdirSync(root, { recursive: true, mode: 0o700 });
      fs.chmodSync(root, 0o700);
      atomicJSON(file, { format: 1, connections: next });
      fs.chmodSync(file, 0o600);
      entries = structuredClone(next);
    },
    root,
    file,
  };
}
