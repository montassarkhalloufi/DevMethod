import { readMcpActions } from './mcp-actions-store.mjs';

function scope(entry) {
  return {
    requestId: entry.requestId,
    jobId: entry.jobId,
    baseRevision: entry.baseRevision ?? null,
    connectionId: entry.connectionId,
    toolName: entry.toolName,
    inputSchemaFingerprint: entry.inputSchemaFingerprint,
    permission:
      entry.decision === 'allow'
        ? 'explicit-allow'
        : entry.decision === 'deny'
          ? 'explicit-deny'
          : 'not-recorded',
  };
}

function effectiveStatus(entry, state, now) {
  if (entry.status !== 'pending') return entry.status;
  if (Date.parse(entry.expiresAt) <= now) return 'expired';
  const job = state.jobs.find((item) => item.id === entry.jobId);
  return job?.status === 'running' && job.baseRevision === state.activeRevision
    ? 'pending'
    : 'cancelled';
}

function completedResult(entry, item) {
  const isError = typeof entry.isError === 'boolean' ? entry.isError : null;
  return {
    failure:
      isError === false
        ? null
        : { ...item, reason: isError ? 'provider-error' : 'provider-result-unclassified' },
    evidence: {
      ...item,
      id: `mcp-action:${entry.requestId}`,
      kind: 'mcp-transport',
      status: isError === null ? 'unknown' : isError ? 'failed' : 'passed',
      isError,
      observedAt: entry.finishedAt ?? null,
      provenance: 'studio-mcp-broker',
      limits: ['Provider response only; no application behavior or business criterion verified.'],
    },
  };
}

/** Read-only projection, never an approval or an invocation.
 * A persisted unknown from ANY job blocks further external work conservatively:
 * the ledger has no reconciled-outcome state, so it remains unresolved. It is not
 * attributed to the selected candidate. Live executing actions stay pending and
 * are reconciled only by the owning broker on restart, never by this reader.
 * Permission denotes a recorded decision only, not current policy; the broker
 * must revalidate connection/schema/policy and exact arguments at invocation.
 */
export function readControlTools(store, jobId, liveActions = []) {
  if (!Array.isArray(liveActions)) throw new Error('Instantané MCP vivant invalide.');
  // The owning broker may know an outcome is unknown after result persistence failed.
  // Only downgrade a matching durable action; never promote an in-memory success.
  const unknown = new Set(
    liveActions.filter((action) => action.status === 'unknown').map((action) => action.requestId),
  );
  const entries = readMcpActions(store.root).map((entry) =>
    unknown.has(entry.requestId) ? { ...entry, status: 'unknown' } : entry,
  );
  const state = store.read();
  const pending = [],
    failures = [],
    evidence = [];
  for (const entry of entries.filter((item) => item.jobId === jobId)) {
    const status = effectiveStatus(entry, state, Date.now());
    const item = { ...scope(entry), status };
    if (['pending', 'executing'].includes(status))
      pending.push({
        ...item,
        permission: status === 'pending' ? 'awaiting-approval' : item.permission,
        expiresAt: entry.expiresAt,
      });
    else if (status === 'completed') {
      const completed = completedResult(entry, item);
      if (completed.failure) failures.push(completed.failure);
      evidence.push(completed.evidence);
    } else failures.push({ ...item, reason: status });
  }
  return {
    externalOutcomeUnknown: unknown.size > 0 || entries.some((entry) => entry.status === 'unknown'),
    pending,
    failures,
    evidence,
  };
}
