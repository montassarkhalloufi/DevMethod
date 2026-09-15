function recordEvent(e, { ids, totals, active, ended }) {
  const p = e.params ?? {},
    item = p.item;
  if (item?.type === 'subAgentActivity' && ids.has(p.threadId)) ids.add(item.agentThreadId);
  if (e.method === 'thread/started' && ids.has(p.thread?.parentThreadId)) ids.add(p.thread.id);
  if (e.method === 'thread/tokenUsage/updated') totals.set(p.threadId, p.tokenUsage?.total);
  if (e.method === 'turn/started') {
    active.set(p.threadId, p.turn.id);
    ended.delete(p.threadId);
  }
  if (e.method === 'turn/completed') {
    active.delete(p.threadId);
    ended.add(p.threadId);
  }
}

/** Reconcile a complete private app-server stream; cumulative totals are not deltas. */
export function meterCodexTree(events, root) {
  const ids = new Set([root]),
    totals = new Map(),
    active = new Map(),
    ended = new Set();
  for (const event of events) recordEvent(event, { ids, totals, active, ended });
  const missing = [...ids].filter(
    (id) =>
      !id ||
      !ended.has(id) ||
      active.has(id) ||
      !['inputTokens', 'outputTokens'].every(
        (k) => Number.isSafeInteger(totals.get(id)?.[k]) && totals.get(id)[k] >= 0,
      ),
  );
  // Usage for an undiscovered thread means attribution is incomplete.
  for (const id of totals.keys()) if (!ids.has(id)) missing.push(id);
  const usage = missing.length
    ? null
    : {
        inputTokens: [...ids].reduce((n, id) => n + totals.get(id).inputTokens, 0),
        outputTokens: [...ids].reduce((n, id) => n + totals.get(id).outputTokens, 0),
        costUSD: null,
      };
  return { threads: [...ids], missing, usage };
}
