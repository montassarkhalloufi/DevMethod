import type { ControlPlaneState } from './contracts.js';
import { policy, hybridPolicy } from './policy.js';
import { validateRiskRuns, validateRiskRunTransition } from './hybrid-validation.js';

function requireValue(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`Control Plane : ${message}`);
}

function record(value: unknown): asserts value is Record<string, unknown> {
  requireValue(value && typeof value === 'object' && !Array.isArray(value), 'objet invalide.');
}

function list(value: unknown, maximum: number): asserts value is unknown[] {
  requireValue(
    Array.isArray(value) && value.length <= maximum,
    'journal absent ou capacité atteinte.',
  );
}

function text(value: unknown): asserts value is string {
  requireValue(typeof value === 'string' && value.length <= 20000, 'texte invalide.');
}

function validateSnapshot(value: unknown) {
  record(value);
  text(value.key);
  text(value.contextKey);
  record(value.input);
  record(value.input.action);
  record(value.input.dependencies);
  requireValue(
    ['guided', 'devauto', 'delegated'].includes(String(value.input.requested)),
    'mode invalide.',
  );
  requireValue(Number.isFinite(Date.parse(String(value.input.at))), 'date invalide.');
  record(value.decision);
  record(value.risk);
  record(value.evidence);
  requireValue(
    ['Auto-Continue', 'Verify', 'Human Decision', 'Bounded Stop'].includes(
      String(value.decision.effective),
    ),
    'décision invalide.',
  );
  requireValue(
    [policy.id, hybridPolicy.id].includes(value.decision.policyId as typeof policy.id) &&
      value.risk.policyId === value.decision.policyId &&
      (value.input.policyId ?? policy.id) === value.decision.policyId,
    'politique inconnue.',
  );
  list(value.nodes, 5000);
  list(value.edges, 20000);
  for (const node of value.nodes) {
    record(node);
    text(node.id);
    text(node.label);
    text(node.explanation);
    text(node.source);
    record(node.dependencies);
    list(node.limits, 100);
    requireValue(
      ['observed', 'declared', 'inferred', 'missing'].includes(String(node.status)),
      'provenance invalide.',
    );
    requireValue(
      ['current', 'stale', 'unavailable'].includes(String(node.freshness)),
      'fraîcheur invalide.',
    );
    requireValue(
      ['passed', 'failed', 'unknown', 'running'].includes(String(node.outcome)),
      'résultat invalide.',
    );
    requireValue(typeof node.required === 'boolean', 'couverture invalide.');
  }
  const ids = new Set(value.nodes.map((node) => (node as Record<string, unknown>).id));
  requireValue(ids.size === value.nodes.length, 'nœuds dupliqués.');
  for (const edge of value.edges) {
    record(edge);
    requireValue(ids.has(edge.from) && ids.has(edge.to), 'relation sans cible.');
    requireValue(
      ['validates', 'contradicts', 'depends-on', 'invalidates'].includes(String(edge.relation)),
      'relation invalide.',
    );
  }
}

export function validateControlPlane(value: unknown): asserts value is ControlPlaneState {
  record(value);
  requireValue(
    value.schemaVersion === 1 &&
      [policy, hybridPolicy].some(
        (entry) => JSON.stringify(value.policy) === JSON.stringify(entry),
      ),
    'format ou politique inconnus ; aucun remplacement automatique.',
  );
  validateSnapshot(value.snapshot);
  if (value.analyses !== undefined) validateRiskRuns(value.analyses);
  list(value.history, 250);
  list(value.transitions, 2000);
  list(value.attention, 2000);
  list(value.interventions, 1000);
  value.history.forEach(validateSnapshot);
  for (const item of value.attention) {
    record(item);
    text(item.id);
    text(item.contextKey);
    text(item.cause);
    list(item.evidenceIds, 5000);
    list(item.riskIds, 100);
    requireValue(
      ['open', 'read', 'resolved', 'rejected', 'superseded'].includes(String(item.status)),
      'état d’attention invalide.',
    );
  }
  for (const entry of value.interventions) {
    record(entry);
    text(entry.id);
    text(entry.reason);
    text(entry.itemId);
    text(entry.contextKey);
    requireValue(
      entry.actor === 'user' && ['accept', 'reject'].includes(String(entry.resolution)),
      'intervention invalide.',
    );
  }
}

export function validateControlTransition(
  previous: ControlPlaneState | undefined,
  next: ControlPlaneState | undefined,
) {
  if (!previous) return;
  requireValue(next, 'le journal ne peut pas être supprimé.');
  validateRiskRunTransition(previous.analyses, next.analyses);
  for (const key of ['history', 'interventions', 'transitions'] as const) {
    requireValue(next[key].length >= previous[key].length, 'le passé ne peut pas être supprimé.');
    previous[key].forEach((entry, index) =>
      requireValue(
        JSON.stringify(entry) === JSON.stringify(next[key][index]),
        'le passé ne peut pas être réécrit.',
      ),
    );
  }
}
