import fs from 'node:fs';
import { safeFile, atomicJSON, digest } from './files.mjs';
import { mcpId, mcpLimits, mcpRequire, mcpShape } from './mcp-contract.mjs';

export const mcpPermissions = Object.freeze(['allow', 'ask', 'deny']);
const fingerprint = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const identity = (connection) =>
  digest(JSON.stringify([connection.provider, connection.url, connection.auth]));
export const mcpToolFingerprint = (tool) =>
  digest(JSON.stringify([tool.inputSchemaFingerprint, tool.outputSchemaFingerprint ?? null]));

export function stricterMcpPermission(captured = 'ask', current = 'ask') {
  return mcpPermissions[
    Math.max(mcpPermissions.indexOf(captured), mcpPermissions.indexOf(current))
  ];
}

function validateRules(rules, stored = false) {
  mcpRequire(Array.isArray(rules) && rules.length <= mcpLimits.tools, 'Règles MCP invalides.');
  const names = new Set();
  for (const rule of rules) {
    mcpShape(rule, [
      'toolName',
      'inputSchemaFingerprint',
      'permission',
      ...(stored ? ['contractFingerprint'] : []),
    ]);
    mcpRequire(
      typeof rule.toolName === 'string' &&
        /^[A-Za-z0-9_.-]{1,128}$/.test(rule.toolName) &&
        !names.has(rule.toolName) &&
        fingerprint(rule.inputSchemaFingerprint) &&
        (!stored ||
          rule.contractFingerprint === undefined ||
          fingerprint(rule.contractFingerprint)) &&
        mcpPermissions.includes(rule.permission),
      'Permission MCP invalide.',
    );
    names.add(rule.toolName);
  }
}

function readPolicies(file) {
  if (!fs.existsSync(file)) return [];
  const stat = fs.lstatSync(file);
  mcpRequire(stat.isFile() && stat.size <= 4 * 1024 * 1024, 'Politiques MCP illisibles.');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  mcpShape(data, ['format', 'connections']);
  mcpRequire(
    data.format === 1 &&
      Array.isArray(data.connections) &&
      data.connections.length <= mcpLimits.connections,
    'Politiques MCP invalides.',
  );
  const ids = new Set();
  for (const entry of data.connections) {
    mcpShape(entry, ['connectionId', 'identity', 'version', 'rules']);
    mcpRequire(
      mcpId(entry.connectionId) &&
        !ids.has(entry.connectionId) &&
        fingerprint(entry.identity) &&
        Number.isSafeInteger(entry.version) &&
        entry.version >= 1,
      'Politique de connexion MCP invalide.',
    );
    validateRules(entry.rules, true);
    ids.add(entry.connectionId);
  }
  return data.connections;
}

export function createMcpPolicies(directory, getConnection) {
  const file = safeFile(directory, 'policies.json');
  let entries = readPolicies(file);

  function save(entry) {
    const next = [...entries.filter((item) => item.connectionId !== entry.connectionId), entry];
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    atomicJSON(file, { format: 1, connections: next });
    fs.chmodSync(file, 0o600);
    entries = next;
  }

  function reconcile(connectionId) {
    const connection = getConnection(connectionId);
    const previous = entries.find((entry) => entry.connectionId === connectionId);
    if (!previous || connection.status !== 'connected') return;
    const sameIdentity = previous.identity === identity(connection);
    const rules = connection.tools.map((tool) => {
      const contractFingerprint = mcpToolFingerprint(tool);
      const prior = previous.rules.find(
        (rule) => rule.toolName === tool.name && rule.contractFingerprint === contractFingerprint,
      );
      return {
        toolName: tool.name,
        inputSchemaFingerprint: tool.inputSchemaFingerprint,
        contractFingerprint,
        permission: sameIdentity ? (prior?.permission ?? 'ask') : 'ask',
      };
    });
    if (sameIdentity && JSON.stringify(rules) === JSON.stringify(previous.rules)) return;
    save({ ...previous, identity: identity(connection), version: previous.version + 1, rules });
  }

  function permission(connectionId, tool) {
    reconcile(connectionId);
    const connection = getConnection(connectionId);
    const entry = entries.find(
      (item) => item.connectionId === connectionId && item.identity === identity(connection),
    );
    return (
      entry?.rules.find(
        (rule) =>
          rule.toolName === tool.name && rule.contractFingerprint === mcpToolFingerprint(tool),
      )?.permission ?? 'ask'
    );
  }

  function read(connectionId) {
    reconcile(connectionId);
    const connection = getConnection(connectionId);
    const tools = connection.tools.map((tool) => ({
      name: tool.name,
      ...(tool.title ? { title: tool.title } : {}),
      ...(tool.description ? { description: tool.description } : {}),
      inputSchemaFingerprint: tool.inputSchemaFingerprint,
      permission: permission(connectionId, tool),
    }));
    const values = new Set(tools.map((tool) => tool.permission));
    return {
      connectionId,
      version: entries.find((entry) => entry.connectionId === connectionId)?.version ?? 0,
      tools,
      bulkPermission: values.size === 1 ? tools[0].permission : values.size ? 'mixed' : 'ask',
    };
  }

  function update(input) {
    mcpShape(input, ['connectionId', 'version', 'updates']);
    const connection = getConnection(input.connectionId),
      current = read(input.connectionId);
    mcpRequire(
      Number.isSafeInteger(input.version) && input.version === current.version,
      'Ces permissions ont changé. Rechargez-les avant de réessayer.',
      409,
      'policy-conflict',
    );
    validateRules(input.updates);
    const rules = current.tools.map((tool) => ({
      toolName: tool.name,
      inputSchemaFingerprint: tool.inputSchemaFingerprint,
      contractFingerprint: mcpToolFingerprint(
        connection.tools.find((entry) => entry.name === tool.name),
      ),
      permission: tool.permission,
    }));
    for (const change of input.updates) {
      const index = rules.findIndex(
        (rule) =>
          rule.toolName === change.toolName &&
          rule.inputSchemaFingerprint === change.inputSchemaFingerprint,
      );
      mcpRequire(index >= 0, 'Cet outil a changé. Rechargez ses permissions.', 409, 'tool-changed');
      rules[index] = { ...rules[index], ...change };
    }
    const entry = {
      connectionId: input.connectionId,
      identity: identity(connection),
      version: current.version + 1,
      rules,
    };
    save(entry);
    return read(input.connectionId);
  }

  return { read, update, permission, reconcile };
}
