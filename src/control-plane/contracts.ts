export type RequestedMode = 'guided' | 'devauto' | 'delegated';
export type ExecutionDecision = 'Auto-Continue' | 'Verify' | 'Human Decision' | 'Bounded Stop';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type EvidenceStatus = 'observed' | 'declared' | 'inferred' | 'missing';
export type Freshness = 'current' | 'stale' | 'unavailable';
export type EvidenceKind =
  | 'intention'
  | 'criterion'
  | 'decision'
  | 'code'
  | 'analysis'
  | 'check'
  | 'visual'
  | 'job'
  | 'agent'
  | 'mcp'
  | 'runtime'
  | 'risk'
  | 'human'
  | 'autonomy';
export interface SourceLink {
  panel: 'journey' | 'code' | 'choices' | 'checks' | 'product' | 'history' | 'connectors';
  path?: string;
  revisionId?: string;
  checkId?: string;
  requestId?: string;
}
export interface EvidenceNode {
  id: string;
  kind: EvidenceKind;
  label: string;
  projectId: string;
  missionId: string | null;
  actionId: string;
  revisionId: string | null;
  at: string;
  status: EvidenceStatus;
  freshness: Freshness;
  outcome: 'passed' | 'failed' | 'unknown' | 'running';
  source: string;
  explanation: string;
  limits: string[];
  dependencies: Record<string, string>;
  dependencyScope: 'complete' | 'revision';
  required: boolean;
  expiresAt?: string;
  link?: SourceLink;
  checkId?: string;
  canRun?: boolean;
  runId?: string;
}
export interface EvidenceEdge {
  id: string;
  from: string;
  to: string;
  relation: 'validates' | 'contradicts' | 'depends-on' | 'invalidates';
  explanation: string;
}
export interface RiskSignal {
  id: string;
  level: RiskLevel;
  category:
    | 'impact'
    | 'uncertainty'
    | 'permissions'
    | 'scope'
    | 'reversibility'
    | 'critical-area'
    | 'evidence'
    | 'convergence';
  reason: string;
  evidenceIds: string[];
  humanResolvable: boolean;
}
export interface PolicyVersion {
  id: 'control-plane-v1';
  version: 1;
  title: string;
  rules: string[];
  calibration: 'disabled';
}
export interface EvaluatedAction {
  id: string;
  label: string;
  kind: 'delivery' | 'mcp' | 'verification' | 'inspection';
  reversible: boolean;
  impact: RiskLevel;
  reserved: boolean;
}
export interface ControlInput {
  projectId: string;
  missionId: string | null;
  revisionId: string | null;
  requested: RequestedMode;
  at: string;
  action: EvaluatedAction;
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
  dependencies: Record<string, string>;
  signals: RiskSignal[];
  sourceIssues: string[];
  stopSignature: string | null;
}
export interface RiskAssessment {
  level: RiskLevel;
  signals: RiskSignal[];
  justification: string;
  policyId: PolicyVersion['id'];
  evidenceIds: string[];
  limits: string[];
}
export interface AutonomyDecision {
  requested: RequestedMode;
  effective: ExecutionDecision;
  execution: 'continue' | 'verify' | 'request-human' | 'stop';
  justification: string;
  conditions: string[];
  allowedActions: string[];
  policyId: PolicyVersion['id'];
}
export interface HumanIntervention {
  id: string;
  itemId: string;
  contextKey: string;
  resolution: 'accept' | 'reject';
  reason: string;
  at: string;
  actor: 'user';
}
export interface AttentionItem {
  id: string;
  contextKey: string;
  cause: string;
  severity: RiskLevel;
  revisionId: string | null;
  actionId: string;
  evidenceIds: string[];
  riskIds: string[];
  expectedAction: 'decide' | 'renew' | 'inspect';
  status: 'open' | 'read' | 'resolved' | 'rejected' | 'superseded';
  at: string;
  resolution?: HumanIntervention;
}
export interface ControlSnapshot {
  key: string;
  contextKey: string;
  input: ControlInput;
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
  risk: RiskAssessment;
  decision: AutonomyDecision;
  evidence: { current: number; required: number; missing: number };
  interventionIds: string[];
}
export interface ControlTransition {
  id: string;
  at: string;
  type: 'evaluation' | 'read' | 'decision';
  snapshotKey: string;
  explanation: string;
  interventionId?: string;
}
export interface ControlPlaneState {
  schemaVersion: 1;
  policy: PolicyVersion;
  snapshot: ControlSnapshot;
  attention: AttentionItem[];
  interventions: HumanIntervention[];
  history: ControlSnapshot[];
  transitions: ControlTransition[];
}
export interface ControlReport extends ControlPlaneState {
  continuation?: { available: boolean; reason: string };
  version: number;
  revisions: { id: string; title: string }[];
}
