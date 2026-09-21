import { randomBytes } from 'node:crypto';
import { createMcpStore } from './mcp-store.mjs';
import { createMcpPolicies } from './mcp-policy.mjs';
import { createMcpOAuth } from './mcp-oauth.mjs';
import { performMcpSession } from './mcp-client.mjs';
import {
  connectionInput,
  publicConnection,
  mcpError,
  mcpRequire,
  mcpId,
  mcpLimits,
  mcpPresets,
} from './mcp-contract.mjs';

const failure = (error) =>
  error.mcpSafe
    ? { code: error.code, message: error.message }
    : {
        code: 'connection-failed',
        message:
          'La connexion MCP a échoué. Vérifiez le serveur, l’accès et ses exigences OAuth, puis réessayez.',
      };

export function createMcpManager({
  directory,
  getOrigin,
  now = Date.now,
  authorizationTTL = 600000,
  operationTimeout = 30000,
}) {
  const store = createMcpStore(directory);
  const entries = new Map(
    store.read().map((entry) => [entry.id, { ...entry, version: entry.version ?? 1 }]),
  );
  const operations = new Map(),
    pending = new Map(),
    tasks = new Set();
  let closed = false;
  const save = () => store.write([...entries.values()]);
  const entryFor = (id) => {
    mcpRequire(!closed, 'Le gestionnaire MCP est fermé.', 409);
    mcpRequire(mcpId(id), 'Identifiant MCP invalide.');
    const entry = entries.get(id);
    mcpRequire(entry, 'Connexion MCP absente.', 404);
    return entry;
  };
  const policies = createMcpPolicies(store.root, entryFor);

  function admit(entry, prior) {
    entries.set(entry.id, entry);
    try {
      save();
    } catch {
      if (prior) entries.set(entry.id, prior);
      else entries.delete(entry.id);
      throw mcpError(
        'Le stockage privé MCP est indisponible. Réessayez après sa réparation.',
        503,
        'storage-failed',
      );
    }
  }

  function cancel(id) {
    const operation = operations.get(id);
    if (!operation) return;
    clearTimeout(operation.timer);
    pending.delete(operation.state);
    operation.controller.abort();
    operations.delete(id);
  }

  function begin(entry) {
    cancel(entry.id);
    const operation = {
      id: entry.id,
      controller: new AbortController(),
      state: randomBytes(32).toString('base64url'),
      deadline: now() + authorizationTTL,
    };
    operations.set(entry.id, operation);
    operation.timer = setTimeout(() => operation.controller.abort(), operationTimeout);
    operation.timer.unref();
    return operation;
  }

  function assertCurrent(entry, operation) {
    mcpRequire(
      !closed &&
        operations.get(entry.id) === operation &&
        entries.get(entry.id) === entry &&
        !operation.controller.signal.aborted,
      'Opération MCP annulée ou expirée.',
      409,
      'cancelled',
    );
  }

  function providerFor(entry, operation) {
    if (entry.auth !== 'oauth') return undefined;
    return createMcpOAuth({
      entry,
      operation,
      callbackURL: getOrigin() + '/api/mcp/callback',
      now,
      assertCurrent: () => assertCurrent(entry, operation),
      saveSecret(secret) {
        assertCurrent(entry, operation);
        entry.secret = secret;
        save();
      },
    });
  }

  function expire(operation) {
    if (operations.get(operation.id) !== operation) return;
    const entry = entries.get(operation.id);
    cancel(operation.id);
    entry.status = 'error';
    entry.error = {
      code: 'oauth-expired',
      message: 'L’autorisation OAuth a expiré. Reconnectez le service.',
    };
    try {
      save();
    } catch {
      // Expiry must still cancel authorization if disk I/O fails inside the timer.
      // Reloading persisted entries also marks them disconnected, never authenticated.
    }
  }

  function authorizationRequired(entry, operation) {
    entry.status = 'authorization-required';
    pending.set(operation.state, operation);
    clearTimeout(operation.timer);
    operation.timer = setTimeout(() => expire(operation), Math.max(1, operation.deadline - now()));
    operation.timer.unref();
    save();
    return { connection: publicConnection(entry), authorizationUrl: operation.authorizationUrl };
  }

  async function run(entry, operation, options = {}) {
    try {
      const result = await performMcpSession({
        entry,
        operation,
        provider: providerFor(entry, operation),
        now,
        ...options,
      });
      assertCurrent(entry, operation);
      entry.tools = result.tools;
      entry.status = 'connected';
      policies.reconcile(entry.id);
      entry.connectedAt = new Date(now()).toISOString();
      delete entry.error;
      save();
      return {
        connection: publicConnection(entry),
        ...(options.call ? { result: result.result } : {}),
      };
    } catch (error) {
      if (error.mcpAdmission) throw error;
      if (operations.get(entry.id) !== operation || closed)
        throw mcpError('Opération MCP annulée.', 409, 'cancelled');
      if (operation.authorizationUrl && !operation.controller.signal.aborted)
        return authorizationRequired(entry, operation);
      entry.status = 'error';
      entry.tools = [];
      entry.error = failure(error);
      save();
      if (options.call) throw mcpError(entry.error.message, 502, entry.error.code);
      return { connection: publicConnection(entry) };
    } finally {
      if (entry.status !== 'authorization-required' && operations.get(entry.id) === operation)
        cancel(entry.id);
    }
  }

  function track(task) {
    tasks.add(task);
    task.then(
      () => tasks.delete(task),
      () => tasks.delete(task),
    );
    return task;
  }

  function connect(input) {
    mcpRequire(!closed, 'Le gestionnaire MCP est fermé.', 409);
    const { prior, config, secret } = connectionInput(input, [...entries.values()]);
    const entry = {
      ...config,
      secret,
      version: (prior?.version ?? 0) + 1,
      status: 'connecting',
      tools: [],
    };
    admit(entry, prior);
    const operation = begin(entry);
    operation.task = track(run(entry, operation));
    return operation.task;
  }

  function refresh(id) {
    const prior = entryFor(id);
    const current = operations.get(id);
    if (current && prior.status !== 'authorization-required') {
      mcpRequire(!current.call, 'Un appel utilise déjà cette connexion.', 409, 'busy');
      return current.task;
    }
    const entry = { ...prior, status: 'connecting', error: undefined };
    admit(entry, prior);
    const operation = begin(entry);
    operation.task = track(run(entry, operation));
    return operation.task;
  }

  function list() {
    for (const operation of pending.values()) if (operation.deadline <= now()) expire(operation);
    return {
      supported: true,
      nativeRunner: true,
      presets: structuredClone(mcpPresets),
      connections: [...entries.values()].map(publicConnection),
      limits: mcpLimits,
    };
  }

  function completeAuthorization(params) {
    mcpRequire(
      [...params.keys()].every((key) =>
        ['code', 'state', 'error', 'error_description', 'iss'].includes(key),
      ) && ['code', 'state', 'error', 'iss'].every((key) => params.getAll(key).length <= 1),
      'Retour OAuth invalide.',
    );
    const state = params.get('state');
    mcpRequire(
      typeof state === 'string' && /^[A-Za-z0-9_-]{43}$/.test(state),
      'État OAuth invalide.',
    );
    const operation = pending.get(state);
    mcpRequire(operation, 'Autorisation OAuth absente, expirée ou déjà utilisée.');
    if (operation.deadline <= now()) {
      expire(operation);
      throw mcpError('Autorisation OAuth expirée.');
    }
    let entry = entryFor(operation.id);
    if (params.has('error')) {
      cancel(entry.id);
      entry.status = 'error';
      entry.error = {
        code: 'oauth-denied',
        message: 'Autorisation refusée ou annulée auprès du fournisseur.',
      };
      save();
      return Promise.resolve({ connection: publicConnection(entry) });
    }
    const code = params.get('code');
    mcpRequire(
      code && code.length <= 4096 && !/[\p{Cc}]/u.test(code) && operation.verifier,
      'Code OAuth invalide.',
    );
    const issuer = params.get('iss');
    mcpRequire(
      !issuer || issuer === entry.secret.discovery?.authorizationServerMetadata?.issuer,
      'Émetteur OAuth incohérent.',
    );
    const admitted = { ...entry, version: entry.version + 1, status: 'connecting' };
    admit(admitted, entry);
    entry = admitted;
    // Consume only a valid, saved callback before awaiting I/O. Failed admission retains expiry.
    pending.delete(state);
    clearTimeout(operation.timer);
    operation.authorizationUrl = undefined;
    operation.timer = setTimeout(() => operation.controller.abort(), operationTimeout);
    operation.timer.unref();
    operation.task = track(run(entry, operation, { code }));
    return operation.task;
  }

  function disconnect(id) {
    const prior = entryFor(id);
    cancel(id);
    const entry = {
      ...prior,
      version: prior.version + 1,
      status: 'disconnected',
      secret: {},
      tools: [],
      error: undefined,
      connectedAt: undefined,
    };
    entries.set(id, entry);
    save();
    return { connection: publicConnection(entry) };
  }

  function getTools(id) {
    const entry = entryFor(id);
    mcpRequire(
      entry.status === 'connected',
      'Cette connexion MCP doit être reconnectée.',
      409,
      'not-connected',
    );
    return structuredClone(entry.tools);
  }

  function invoke(id, name, args, { signal, beforeCall } = {}) {
    const tool = getTools(id).find((entry) => entry.name === name),
      entry = entryFor(id);
    mcpRequire(
      tool &&
        args &&
        typeof args === 'object' &&
        !Array.isArray(args) &&
        JSON.stringify(args).length <= 65536,
      'Appel MCP invalide.',
    );
    mcpRequire(!operations.has(id), 'Une opération utilise déjà cette connexion.', 409, 'busy');
    const operation = begin(entry);
    operation.call = true;
    const abort = () => operation.controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, { once: true });
    return track(
      run(entry, operation, {
        call: {
          name,
          args,
          fingerprint: tool.inputSchemaFingerprint,
          outputFingerprint: tool.outputSchemaFingerprint,
          beforeCall() {
            try {
              beforeCall?.();
            } catch (error) {
              throw Object.assign(error, { mcpAdmission: true });
            }
          },
        },
      }),
    )
      .then((value) => {
        mcpRequire(
          value.result !== undefined,
          'Réauthentification requise avant l’appel.',
          409,
          'authorization-required',
        );
        return value.result;
      })
      .finally(() => signal?.removeEventListener('abort', abort));
  }

  return {
    list,
    connect,
    refresh,
    disconnect,
    completeAuthorization,
    getTools,
    policy: policies.read,
    setPolicy: policies.update,
    permission: policies.permission,
    invoke,
    async close() {
      closed = true;
      for (const id of operations.keys()) cancel(id);
      await Promise.allSettled([...tasks]);
    },
  };
}
