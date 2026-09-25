export type ChangeCategory =
  'visual' | 'interaction' | 'network' | 'concurrency' | 'permissions' | 'logic';
export interface RiskCitation {
  path: string;
  side: 'before' | 'after';
  line: number;
}
export interface RiskFinding extends RiskCitation {
  category: ChangeCategory;
  reason: string;
}
export interface SemanticFinding extends RiskFinding {
  invariant: string;
  scenario: string;
  uncertainty: string;
}
export interface RiskModelOutput {
  summary: string;
  findings: SemanticFinding[];
  limits: string[];
}
export interface RiskAnalysisRun {
  id: string;
  contextKey: string;
  revisionId: string;
  startedAt: string;
  finishedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'interrupted';
  provider: string;
  output?: RiskModelOutput;
  error?: string;
  usage?: { inputTokens: number; outputTokens: number } | null;
}
export interface HybridRiskReport {
  contextKey: string;
  revisionId: string;
  baseRevisionId: string | null;
  categories: ChangeCategory[];
  findings: RiskFinding[];
  checks: string[];
  limits: string[];
  changedFiles: string[];
  analysis?: RiskAnalysisRun;
  available: boolean;
  availability: string;
}
