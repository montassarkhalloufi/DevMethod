const lexical = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

function groupObservation(groups, node, current) {
  const kind = typeof node.kind === 'string' && node.kind ? node.kind : 'unknown';
  if (!groups.has(kind))
    groups.set(kind, {
      kind,
      count: 0,
      evidenceIds: [],
      currentIds: [],
      staleIds: [],
      untrustedIds: [],
    });
  const group = groups.get(kind);
  group.count++;
  group.evidenceIds.push(node.id);
  (current ? group.currentIds : group.staleIds).push(node.id);
  if (node.trusted !== true) group.untrustedIds.push(node.id);
}

/** Descriptive counts only. Freshness and trust are independent, overlapping axes.
 * Other revision scopes are historical context, never evidence for this revision.
 */
export function summarizeAttention(control) {
  const revisionId = control?.graph?.revisionId ?? null;
  const seen = new Set();
  const groups = new Map();
  let currentCount = 0;
  let historicalCount = 0;
  let observedCount = 0;
  for (const node of control?.graph?.nodes ?? []) {
    if (node.type !== 'evidence' || typeof node.id !== 'string' || seen.has(node.id)) continue;
    seen.add(node.id);
    if (revisionId === null || node.revisionId !== revisionId) {
      historicalCount++;
      continue;
    }
    const current = node.freshness === 'current';
    if (current) currentCount++;
    if (node.status === 'passed' && current && node.trusted === true) continue;
    observedCount++;
    groupObservation(groups, node, current);
  }
  return {
    revisionId,
    observedCount,
    currentCount,
    historicalCount,
    groups: [...groups.values()]
      .map((group) => ({
        ...group,
        evidenceIds: group.evidenceIds.sort(lexical),
        currentIds: group.currentIds.sort(lexical),
        staleIds: group.staleIds.sort(lexical),
        untrustedIds: group.untrustedIds.sort(lexical),
      }))
      .sort((a, b) => b.count - a.count || lexical(a.kind, b.kind)),
    criticalFactors: (control?.risk?.factors ?? [])
      .filter((factor) => factor.severity === 'critical')
      .map((factor) => ({ ...factor })),
    stopReasons: control?.autonomy?.action === 'stop' ? [...(control.autonomy.reasons ?? [])] : [],
  };
}
