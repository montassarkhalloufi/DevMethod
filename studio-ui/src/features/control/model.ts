import type {
  ControlReport,
  SourceLink,
  RequestedMode,
  EvidenceNode,
} from '../../../../src/control-plane/contracts';
export type {
  ControlReport,
  SourceLink,
  RequestedMode,
  EvidenceNode,
  AttentionItem,
  RiskLevel,
} from '../../../../src/control-plane/contracts';
export type ControlView = 'overview' | 'graph' | 'risks' | 'attention' | 'autonomy' | 'history';
export interface ControlOptions {
  active?: boolean;
  expanded?: boolean;
  onExpand?: () => void;
  revisionId: string | null;
  mode: RequestedMode;
  onOpen: (link: SourceLink) => void;
  onMode: (mode: RequestedMode) => void;
  onStateChanged: () => void;
  sidebar: HTMLElement;
  modes: HTMLElement;
}
export const views: { id: ControlView; label: string; icon: string }[] = [
  { id: 'overview', label: 'Vue d’ensemble', icon: 'document' },
  { id: 'graph', label: 'Graphe des preuves', icon: 'graph' },
  { id: 'risks', label: 'Analyse des risques', icon: 'risk' },
  { id: 'attention', label: 'Attention humaine', icon: 'person' },
  { id: 'autonomy', label: 'Autonomie adaptative', icon: 'settings' },
  { id: 'history', label: 'Historique du Control Plane', icon: 'history' },
];
export const riskLabels = { low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique' };
export const modeLabels = { guided: 'Guidé', devauto: 'DevAuto', delegated: 'Autonome' };
export const statusLabels = {
  observed: 'Observé',
  declared: 'Déclaré',
  inferred: 'Inféré',
  missing: 'Manquant',
};
export const freshnessLabels = {
  current: 'Actuelle',
  stale: 'À renouveler',
  unavailable: 'Indisponible',
};
export const decisionLabels = {
  'Auto-Continue': 'Continuation autorisée',
  Verify: 'Vérifications renforcées',
  'Human Decision': 'Décision humaine requise',
  'Bounded Stop': 'Arrêt borné',
};
export const openItems = (report: ControlReport) =>
  report.attention.filter((item) => ['open', 'read'].includes(item.status));
export const missingNodes = (nodes: EvidenceNode[]) =>
  nodes.filter(
    (node) =>
      node.required &&
      (node.status !== 'observed' || node.freshness !== 'current' || node.outcome !== 'passed'),
  );
export function locationView(): ControlView {
  const selected = new URLSearchParams(window.location.search).get('control');
  return views.find((view) => view.id === selected)?.id ?? 'overview';
}

export const kindLabels: Record<EvidenceNode['kind'], string> = {
  intention: 'Intentions',
  criterion: 'Critères',
  decision: 'Décisions',
  code: 'Code',
  analysis: 'Analyses',
  check: 'Vérifications',
  visual: 'Preuves visuelles',
  job: 'Missions',
  agent: 'Agents',
  mcp: 'Actions MCP',
  runtime: 'Services locaux',
  risk: 'Risques',
  human: 'Interventions humaines',
  autonomy: 'Autonomie',
};
