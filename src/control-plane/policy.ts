import type {
  AutonomyDecision,
  ControlInput,
  EvidenceNode,
  PolicyVersion,
  RiskAssessment,
  RiskLevel,
  RiskSignal,
} from './contracts.js';

export const policy: PolicyVersion = Object.freeze({
  id: 'control-plane-v1',
  version: 1,
  title: 'Politique locale explicable · v1',
  calibration: 'disabled',
  rules: [
    'Arrêt persistant, effets inconnus ou échec critique → Bounded Stop.',
    'Permissions, risque élevé, irréversibilité ou choix réservé → Human Decision.',
    'Risque moyen, incertitude, preuve absente, contradictoire ou périmée → Verify.',
    'Faible risque, preuves observées suffisantes et action réversible déléguée → Auto-Continue.',
    'Un accord humain ne remplace jamais une preuve ni une permission MCP.',
  ],
});
export const riskOrder: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export function evidenceSupports(node: EvidenceNode): boolean {
  return node.status === 'observed' && node.freshness === 'current' && node.outcome === 'passed';
}

function evidenceSignals(nodes: EvidenceNode[]): RiskSignal[] {
  const missing = nodes.filter((node) => node.required && !evidenceSupports(node));
  const failures = nodes.filter(
    (node) => node.outcome === 'failed' && node.freshness === 'current',
  );
  const signals: RiskSignal[] = [];
  if (!nodes.some((node) => node.required))
    signals.push({
      id: 'coverage-unknown',
      level: 'medium',
      category: 'uncertainty',
      reason: 'Aucun périmètre de preuves requis n’est établi.',
      evidenceIds: [],
      humanResolvable: false,
    });
  if (missing.length)
    signals.push({
      id: 'evidence-incomplete',
      level: 'medium',
      category: 'evidence',
      reason: `${missing.length} preuve(s) requise(s) absente(s), périmée(s) ou non concluante(s).`,
      evidenceIds: missing.map((node) => node.id),
      humanResolvable: false,
    });
  if (failures.length)
    signals.push({
      id: 'evidence-failed',
      level: 'medium',
      category: 'evidence',
      reason: `${failures.length} contrôle(s) ont détecté un échec.`,
      evidenceIds: failures.map((node) => node.id),
      humanResolvable: false,
    });
  return signals;
}

export function assessRisk(
  input: ControlInput,
  nodes: EvidenceNode[],
  accepted: Set<string> = new Set(),
): RiskAssessment {
  const signals = [...input.signals, ...evidenceSignals(nodes)];
  if (input.action.impact !== 'low')
    signals.push({
      id: 'action-impact',
      level: input.action.impact,
      category: 'impact',
      reason: 'Impact potentiel de l’action évaluée.',
      evidenceIds: [],
      humanResolvable: true,
    });
  if (!input.action.reversible)
    signals.push({
      id: 'irreversible',
      level: 'high',
      category: 'reversibility',
      reason: 'La réversibilité de cette action n’est pas établie.',
      evidenceIds: [],
      humanResolvable: true,
    });
  if (input.sourceIssues.length)
    signals.push({
      id: 'source-unavailable',
      level: 'medium',
      category: 'uncertainty',
      reason: 'Une source est indisponible ; la couverture reste incomplète.',
      evidenceIds: [],
      humanResolvable: false,
    });
  const effective = signals.filter(
    (signal) => !(signal.humanResolvable && accepted.has(signal.id)),
  );
  const level = effective.reduce<RiskLevel>(
    (current, signal) => (riskOrder[signal.level] > riskOrder[current] ? signal.level : current),
    'low',
  );
  return {
    level,
    signals,
    policyId: policy.id,
    evidenceIds: nodes.filter(evidenceSupports).map((node) => node.id),
    justification:
      effective.map((signal) => signal.reason).join(' ') ||
      'Preuves requises actuelles ; aucun signal défavorable détecté dans ce périmètre.',
    limits: [
      ...input.sourceIssues,
      'Évaluation déterministe du périmètre observé ; aucune garantie globale ou probabilité statistique.',
    ],
  };
}

export function decideAutonomy(
  input: ControlInput,
  risk: RiskAssessment,
  options: { stopped: boolean; reservedApproved: boolean },
): AutonomyDecision {
  let effective: AutonomyDecision['effective'] = 'Auto-Continue';
  if (options.stopped || risk.level === 'critical') effective = 'Bounded Stop';
  else if (risk.level === 'high' || (input.action.reserved && !options.reservedApproved))
    effective = 'Human Decision';
  else if (risk.level === 'medium') effective = 'Verify';
  const actions = {
    'Auto-Continue': [
      'Consulter les sources',
      'Vérifier',
      'Préparer une évolution réversible',
      'Appliquer dans les délégations existantes',
    ],
    Verify: [
      'Consulter les sources',
      'Vérifier',
      'Préparer une correction sans adoption automatique',
    ],
    'Human Decision': ['Consulter les sources', 'Vérifier', 'Préparer la décision humaine'],
    'Bounded Stop': ['Consulter les sources', 'Vérifier', 'Réconcilier l’arrêt avec la personne'],
  };
  const execution = {
    'Auto-Continue': 'continue',
    Verify: 'verify',
    'Human Decision': 'request-human',
    'Bounded Stop': 'stop',
  } as const;
  const conditions =
    risk.justification ===
    'Preuves requises actuelles ; aucun signal défavorable détecté dans ce périmètre.'
      ? []
      : [risk.justification];
  if (input.action.reserved && !options.reservedApproved)
    conditions.unshift(
      'Une responsabilité réservée exige une décision humaine sur cette version et cette action.',
    );
  if (options.stopped)
    conditions.unshift('Réconcilier l’arrêt persistant et ses effets avant toute reprise.');
  return {
    requested: input.requested,
    effective,
    execution: execution[effective],
    justification: conditions.join(' ') || risk.justification,
    conditions,
    allowedActions: actions[effective],
    policyId: policy.id,
  };
}
