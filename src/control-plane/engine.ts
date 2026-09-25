import { createHash } from 'node:crypto';
import type {
  AttentionItem,
  ControlInput,
  ControlPlaneState,
  ControlSnapshot,
  HumanIntervention,
  RiskSignal,
} from './contracts.js';
import { refreshGraph } from './graph.js';
import { assessRisk, decideAutonomy, evidenceSupports, policyFor, riskOrder } from './policy.js';

export function fingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function contextKey(input: ControlInput): string {
  return fingerprint([
    input.projectId,
    input.revisionId,
    input.action,
    input.dependencies,
    input.stopSignature,
    input.signals,
    ...(input.policyId ? [input.policyId] : []),
  ]);
}

function attentionSignals(snapshot: ControlSnapshot): RiskSignal[] {
  const signals = [...snapshot.risk.signals];
  if (snapshot.input.action.reserved)
    signals.push({
      id: 'reserved',
      level: 'high',
      category: 'permissions',
      reason: 'Application d’une version réservée à la personne',
      evidenceIds: [],
      humanResolvable: true,
    });
  if (snapshot.input.stopSignature)
    signals.push({
      id: 'stop',
      level: 'critical',
      category: 'convergence',
      reason: 'Arrêt persistant · réconciliation requise',
      evidenceIds: [],
      humanResolvable: true,
    });
  return signals;
}

function updateAttention(
  snapshot: ControlSnapshot,
  previous: ControlPlaneState | undefined,
  interventions: HumanIntervention[],
): AttentionItem[] {
  const items: AttentionItem[] = attentionSignals(snapshot).map((signal) => {
    const id = fingerprint([snapshot.contextKey, signal.id]);
    const old = previous?.attention.find((item) => item.id === id);
    const resolution = [...interventions].reverse().find((entry) => entry.itemId === id);
    return {
      id,
      contextKey: snapshot.contextKey,
      cause: signal.reason,
      severity: signal.level,
      revisionId: snapshot.input.revisionId,
      actionId: snapshot.input.action.id,
      evidenceIds: signal.evidenceIds,
      riskIds: [signal.id],
      expectedAction: signal.humanResolvable
        ? 'decide'
        : signal.category === 'permissions'
          ? 'inspect'
          : 'renew',
      status: resolution
        ? resolution.resolution === 'accept'
          ? 'resolved'
          : 'rejected'
        : old?.status === 'read'
          ? 'read'
          : 'open',
      at: old?.at ?? snapshot.input.at,
      ...(resolution ? { resolution } : {}),
    };
  });
  const ids = new Set(items.map((item) => item.id));
  for (const old of previous?.attention ?? []) {
    if (!ids.has(old.id))
      items.push({
        ...old,
        status: ['resolved', 'rejected'].includes(old.status) ? old.status : 'superseded',
      });
  }
  return items.sort(
    (a, b) => riskOrder[b.severity] - riskOrder[a.severity] || a.at.localeCompare(b.at),
  );
}

export function evaluateControl(
  input: ControlInput,
  previous?: ControlPlaneState,
): ControlPlaneState {
  const policy = policyFor(input.policyId);
  const key = contextKey(input);
  const interventions = previous?.interventions ?? [];
  const matching = interventions.filter((entry) => entry.contextKey === key);
  const accepted = new Set(
    matching
      .filter((entry) => entry.resolution === 'accept')
      .flatMap(
        (entry) => previous?.attention.find((item) => item.id === entry.itemId)?.riskIds ?? [],
      ),
  );
  const graph = refreshGraph(input);
  const risk = assessRisk(input, graph.nodes, accepted);
  const decision = decideAutonomy(input, risk, {
    stopped:
      (Boolean(input.stopSignature) && !accepted.has('stop')) ||
      matching.some((entry) => entry.resolution === 'reject'),
    reservedApproved: accepted.has('reserved'),
  });
  const required = graph.nodes.filter((node) => node.required);
  const supported = required.filter(evidenceSupports).length;
  const snapshot: ControlSnapshot = {
    key: '',
    contextKey: key,
    input,
    ...graph,
    risk,
    decision,
    evidence: {
      current: supported,
      required: required.length,
      missing: required.length - supported,
    },
    interventionIds: matching.map((entry) => entry.id),
  };
  const base = {
    projectId: input.projectId,
    missionId: input.missionId,
    actionId: input.action.id,
    revisionId: input.revisionId,
    at: input.at,
    status: 'inferred' as const,
    freshness: 'current' as const,
    outcome: 'unknown' as const,
    dependencies: {},
    dependencyScope: 'complete' as const,
    required: false,
    source: policy.id,
    limits: risk.limits,
  };
  snapshot.nodes.push(
    {
      ...base,
      id: 'risk',
      kind: 'risk',
      label: `Risque ${{ low: 'faible', medium: 'moyen', high: 'élevé', critical: 'critique' }[risk.level]}`,
      explanation: risk.justification,
    },
    {
      ...base,
      id: 'autonomy',
      kind: 'autonomy',
      label: decision.effective,
      explanation: decision.justification,
    },
  );
  for (const node of graph.nodes.filter((entry) => entry.required))
    snapshot.edges.push({
      id: `risk:${node.id}`,
      from: 'risk',
      to: node.id,
      relation: 'depends-on',
      explanation: 'Cette preuve contribue à l’évaluation du risque.',
    });
  snapshot.edges.push({
    id: 'risk:autonomy',
    from: 'autonomy',
    to: 'risk',
    relation: 'depends-on',
    explanation: 'La politique calcule l’autonomie depuis le risque et les preuves.',
  });
  for (const intervention of matching) {
    const id = `human:${intervention.id}`;
    snapshot.nodes.push({
      ...base,
      id,
      kind: 'human',
      label: 'Décision humaine',
      status: 'observed',
      at: intervention.at,
      source: 'Intervention utilisateur enregistrée',
      explanation: intervention.reason,
    });
    snapshot.edges.push({
      id: `${id}:autonomy`,
      from: 'autonomy',
      to: id,
      relation: 'depends-on',
      explanation: 'Intervention sur la version et l’action exactes.',
    });
  }
  snapshot.key = fingerprint({
    ...snapshot,
    nodes: snapshot.nodes.map((node) => ({ ...node, at: '' })),
    input: { ...input, at: '', nodes: input.nodes.map((node) => ({ ...node, at: '' })) },
  });
  const changed = snapshot.key !== previous?.snapshot.key;
  return {
    schemaVersion: 1,
    ...(previous?.analyses ? { analyses: previous.analyses } : {}),
    policy,
    snapshot: changed ? snapshot : previous.snapshot,
    attention: updateAttention(snapshot, previous, interventions),
    interventions,
    history: changed ? [...(previous?.history ?? []), snapshot] : previous.history,
    transitions: changed
      ? [
          ...(previous?.transitions ?? []),
          {
            id: fingerprint([snapshot.key, previous?.transitions.length ?? 0]),
            at: input.at,
            type: 'evaluation',
            snapshotKey: snapshot.key,
            explanation: `${decision.effective} · ${risk.justification}`,
          },
        ]
      : previous.transitions,
  };
}

export function markAttentionRead(state: ControlPlaneState, at: string): void {
  const unread = state.attention.filter((item) => item.status === 'open');
  if (!unread.length) return;
  unread.forEach((item) => {
    item.status = 'read';
  });
  state.transitions.push({
    id: fingerprint([at, unread.map((item) => item.id)]),
    at,
    type: 'read',
    snapshotKey: state.snapshot.key,
    explanation: `${unread.length} élément(s) marqué(s) comme lu(s), sans résolution.`,
  });
}

export function resolveAttention(
  state: ControlPlaneState,
  input: { itemId: string; resolution: 'accept' | 'reject'; reason: string },
  at: string,
): void {
  const item = state.attention.find((entry) => entry.id === input.itemId);
  if (!item || item.contextKey !== state.snapshot.contextKey || item.expectedAction !== 'decide')
    throw new Error('Cette décision n’est plus actuelle ou exige une vraie vérification.');
  const existing = [...state.interventions].reverse().find((entry) => entry.itemId === item.id);
  if (existing) {
    if (existing.resolution === input.resolution && existing.reason === input.reason) return;
    throw new Error('Décision déjà enregistrée ; elle ne peut pas être réécrite.');
  }
  if (
    !['accept', 'reject'].includes(input.resolution) ||
    typeof input.reason !== 'string' ||
    !input.reason.trim() ||
    input.reason.length > 2000
  )
    throw new Error('Une résolution et une justification de 1 à 2 000 caractères sont requises.');
  const intervention: HumanIntervention = {
    ...input,
    id: fingerprint([item.id, input.resolution, input.reason]),
    contextKey: item.contextKey,
    at,
    actor: 'user',
  };
  state.interventions.push(intervention);
  state.transitions.push({
    id: intervention.id,
    at,
    type: 'decision',
    snapshotKey: state.snapshot.key,
    interventionId: intervention.id,
    explanation: `${input.resolution === 'accept' ? 'Acceptation' : 'Rejet'} · ${input.reason}`,
  });
}
