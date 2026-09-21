import fs from 'node:fs';
import path from 'node:path';
import { safeFile, atomicJSON, digest } from './files.mjs';
import { mcpId, mcpRequire, mcpShape } from './mcp-contract.mjs';

export const mcpActionLimits = Object.freeze({
  count: 128,
  ttlMs: 600000,
  bytes: 48 * 1024 * 1024,
});
export const mcpActionStatuses = Object.freeze([
  'pending',
  'executing',
  'completed',
  'denied',
  'expired',
  'cancelled',
  'unknown',
]);

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((key) => JSON.stringify(key) + ':' + canonical(value[key]))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}

export function mcpActionFingerprint(input) {
  return digest(
    canonical({
      jobId: input.jobId,
      connectionId: input.connectionId,
      toolName: input.toolName,
      arguments: input.arguments,
    }),
  );
}

export function mcpActionId(input) {
  const hash = mcpActionFingerprint(input);
  return (
    input.requestId ??
    `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
  );
}

function validateEntry(entry) {
  mcpShape(entry, [
    'requestId',
    'jobId',
    'baseRevision',
    'connectionId',
    'connectionVersion',
    'connectionName',
    'connectionUrl',
    'toolName',
    'inputSchemaFingerprint',
    'contractFingerprint',
    'arguments',
    'fingerprint',
    'status',
    'createdAt',
    'expiresAt',
    'startedAt',
    'finishedAt',
    'decision',
    'error',
    'result',
    'isError',
    'execution',
  ]);
  mcpRequire(
    mcpId(entry.requestId) &&
      mcpId(entry.connectionId) &&
      typeof entry.jobId === 'string' &&
      /^[A-Za-z0-9_-]{1,128}$/.test(entry.jobId) &&
      Number.isSafeInteger(entry.connectionVersion) &&
      entry.connectionVersion >= 1 &&
      typeof entry.toolName === 'string' &&
      /^[A-Za-z0-9_.-]{1,128}$/.test(entry.toolName) &&
      /^[a-f0-9]{64}$/.test(entry.inputSchemaFingerprint) &&
      /^[a-f0-9]{64}$/.test(entry.contractFingerprint) &&
      entry.arguments &&
      typeof entry.arguments === 'object' &&
      !Array.isArray(entry.arguments) &&
      mcpActionStatuses.includes(entry.status) &&
      Number.isFinite(Date.parse(entry.createdAt)) &&
      Number.isFinite(Date.parse(entry.expiresAt)) &&
      entry.fingerprint === mcpActionFingerprint(entry),
    'Action MCP sauvegardée invalide.',
  );
}

export function publicMcpAction(entry) {
  const result = structuredClone(entry);
  delete result.fingerprint;
  return result;
}

// Pure validated snapshot: observing a live broker must never reconcile its executions.
export function readMcpActions(root) {
  const file = safeFile(root, '.devmethod/mcp-actions.json');
  if (!fs.existsSync(file)) return [];
  const stat = fs.lstatSync(file);
  mcpRequire(
    stat.isFile() && stat.size <= mcpActionLimits.bytes,
    'Journal des actions MCP invalide.',
  );
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    mcpRequire(false, 'Journal des actions MCP illisible.');
  }
  mcpShape(data, ['format', 'actions']);
  mcpRequire(
    data.format === 1 &&
      Array.isArray(data.actions) &&
      data.actions.length <= mcpActionLimits.count,
    'Journal des actions MCP invalide.',
  );
  const ids = new Set();
  for (const entry of data.actions) {
    validateEntry(entry);
    mcpRequire(!ids.has(entry.requestId), 'Action MCP dupliquée.');
    ids.add(entry.requestId);
  }
  return structuredClone(data.actions);
}

export function createMcpActionsStore(root, now) {
  const file = safeFile(root, '.devmethod/mcp-actions.json');
  let entries = [];
  const persist = (next) => {
    const value = { format: 1, actions: next };
    mcpRequire(
      Buffer.byteLength(JSON.stringify(value, null, 2) + '\n') <= mcpActionLimits.bytes,
      'Journal des actions MCP plein ; aucune action supplémentaire exécutée.',
      413,
      'action-limit',
    );
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    atomicJSON(file, value);
    entries = structuredClone(next);
  };
  entries = readMcpActions(root);
  if (entries.some((entry) => entry.status === 'executing'))
    persist(
      entries.map((entry) =>
        entry.status === 'executing'
          ? {
              ...entry,
              status: 'unknown',
              finishedAt: new Date(now()).toISOString(),
              error: {
                code: 'interrupted',
                message:
                  'Exécution interrompue. Vérifiez son effet chez le fournisseur avant toute nouvelle demande.',
              },
            }
          : entry,
      ),
    );
  return {
    read: () => structuredClone(entries),
    get: (id) => structuredClone(entries.find((entry) => entry.requestId === id)),
    save(entry) {
      validateEntry(entry);
      const index = entries.findIndex((item) => item.requestId === entry.requestId);
      mcpRequire(
        index >= 0 || entries.length < mcpActionLimits.count,
        'Maximum de 128 actions MCP atteint pour ce projet.',
        429,
        'action-limit',
      );
      const next = [...entries];
      if (index < 0) next.push(entry);
      else next[index] = entry;
      persist(next);
      return publicMcpAction(entry);
    },
    rememberUnknown(entry) {
      mcpRequire(
        entry.status === 'unknown' && entries.some((item) => item.requestId === entry.requestId),
        'Résultat MCP inconnu sans reçu préalable.',
      );
      // The durable executing receipt still prevents a replay after restart.
      entries = entries.map((item) =>
        item.requestId === entry.requestId ? structuredClone(entry) : item,
      );
      return publicMcpAction(entry);
    },
  };
}
