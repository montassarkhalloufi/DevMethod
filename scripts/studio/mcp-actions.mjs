import { mcpId, mcpRequire, mcpShape } from './mcp-contract.mjs';
import { mcpToolFingerprint } from './mcp-policy.mjs';
import {
  createMcpActionsStore,
  mcpActionFingerprint,
  mcpActionId,
  mcpActionLimits,
  publicMcpAction,
} from './mcp-actions-store.mjs';

export function createMcpActions({
  root,
  inspect,
  validate,
  execute,
  requestApproval,
  now = Date.now,
}) {
  const storage = createMcpActionsStore(root, now),
    tasks = new Map();
  const stamp = () => new Date(now()).toISOString();

  function refresh(entry) {
    if (entry.status !== 'pending') return entry;
    if (Date.parse(entry.expiresAt) <= now()) {
      storage.save({
        ...entry,
        status: 'expired',
        finishedAt: stamp(),
        error: {
          code: 'approval-expired',
          message: 'Cette demande d’accord a expiré. Préparez une nouvelle action.',
        },
      });
    } else {
      try {
        inspect(entry);
      } catch (error) {
        storage.save({
          ...entry,
          status: error.code === 'policy-denied' ? 'denied' : 'cancelled',
          finishedAt: stamp(),
          error: {
            code: error.mcpSafe ? error.code : 'context-changed',
            message: error.mcpSafe ? error.message : 'Le contexte de cette action a changé.',
          },
        });
      }
    }
    return storage.get(entry.requestId);
  }

  function existing(input) {
    const requestId = mcpActionId(input);
    mcpRequire(mcpId(requestId), 'Identifiant de requête MCP invalide.');
    const found = storage.get(requestId);
    if (!found) return null;
    mcpRequire(
      found.fingerprint === mcpActionFingerprint(input),
      'Cet identifiant désigne une autre action. Utilisez un nouvel identifiant.',
      409,
      'request-conflict',
    );
    return publicMcpAction(refresh(found));
  }

  async function run(entry, approved) {
    try {
      const result = await execute(entry, approved);
      return storage.save({ ...entry, ...result, status: 'completed', finishedAt: stamp() });
    } catch (error) {
      const failed = {
        ...entry,
        status: error.dispatched === false ? 'cancelled' : 'unknown',
        finishedAt: stamp(),
        error: {
          code: error.mcpSafe ? error.code : 'call-failed',
          message: error.mcpSafe
            ? error.message
            : 'Résultat inconnu ; vérifiez le fournisseur avant de recommencer.',
        },
      };
      try {
        return storage.save(failed);
      } catch {
        return storage.rememberUnknown({
          ...failed,
          status: 'unknown',
          error: {
            code: 'result-storage-failed',
            message:
              'Le résultat n’a pas pu être enregistré. Vérifiez le fournisseur avant toute nouvelle action.',
          },
        });
      }
    }
  }

  function start(entry, approved) {
    inspect(entry);
    const executing = {
      ...entry,
      status: 'executing',
      startedAt: stamp(),
      ...(approved ? { decision: 'allow' } : {}),
    };
    storage.save(executing);
    const task = run(executing, approved).finally(() => tasks.delete(entry.requestId));
    tasks.set(entry.requestId, task);
    // Persistence failures still leave an executing receipt on disk. Never retry the effect.
    task.catch(() => {});
    return task;
  }

  async function submit(input) {
    const previous = existing(input);
    if (previous) return previous;
    await validate(input);
    const raced = existing(input);
    if (raced) return raced;
    const needsControlApproval = await requestApproval?.();
    const { access, tool, permission } = inspect(input);
    for (const entry of storage.read().filter((entry) => entry.jobId === input.jobId))
      refresh(entry);
    mcpRequire(
      !storage
        .read()
        .some(
          (entry) => entry.jobId === input.jobId && ['pending', 'executing'].includes(entry.status),
        ),
      'Une action MCP attend déjà pour cette mission.',
      409,
      'busy',
    );
    const entry = {
      requestId: mcpActionId(input),
      fingerprint: mcpActionFingerprint(input),
      jobId: input.jobId,
      baseRevision: access.job.baseRevision,
      connectionId: input.connectionId,
      connectionVersion: access.connection.version,
      connectionName: access.connection.name,
      connectionUrl: access.connection.url,
      toolName: input.toolName,
      inputSchemaFingerprint: tool.inputSchemaFingerprint,
      contractFingerprint: mcpToolFingerprint(tool),
      arguments: structuredClone(input.arguments),
      status: 'pending',
      createdAt: stamp(),
      expiresAt: new Date(now() + mcpActionLimits.ttlMs).toISOString(),
      execution: 'manual-host-only',
    };
    storage.save(entry);
    return permission === 'allow' && !needsControlApproval
      ? start(entry, false)
      : publicMcpAction(entry);
  }

  function list(input = {}) {
    mcpShape(input, ['jobId', 'requestId']);
    if (input.jobId !== undefined)
      mcpRequire(
        typeof input.jobId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(input.jobId),
        'Identifiant de mission invalide.',
      );
    if (input.requestId !== undefined)
      mcpRequire(mcpId(input.requestId), 'Identifiant de requête invalide.');
    return {
      actions: storage
        .read()
        .filter(
          (entry) =>
            (input.jobId === undefined || entry.jobId === input.jobId) &&
            (input.requestId === undefined || entry.requestId === input.requestId),
        )
        .map((entry) => publicMcpAction(refresh(entry))),
    };
  }

  function decide(input) {
    mcpShape(input, ['requestId', 'decision']);
    mcpRequire(
      mcpId(input.requestId) && ['allow', 'deny'].includes(input.decision),
      'Décision MCP invalide.',
    );
    const saved = storage.get(input.requestId);
    mcpRequire(saved, 'Action MCP absente.', 404, 'action-missing');
    const entry = refresh(saved);
    if (entry.status !== 'pending') return publicMcpAction(entry);
    if (input.decision === 'deny')
      return storage.save({
        ...entry,
        status: 'denied',
        decision: 'deny',
        finishedAt: stamp(),
        error: { code: 'user-denied', message: 'Cette action a été refusée.' },
      });
    start(entry, true);
    return publicMcpAction(storage.get(entry.requestId));
  }

  return { submit, list, decide };
}
