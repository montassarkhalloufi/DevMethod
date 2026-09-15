/** Pure format-1 contract shared by the CLI and browser. No filesystem or evaluation. */
export type Severity = 'critical' | 'major' | 'moderate' | 'minor';
export type Confidence = 'confirmed' | 'suspected';
export type Resolution = 'open' | 'in-progress' | 'resolved' | 'accepted-risk';
export type CheckStatus = 'passed' | 'failed' | 'not-run' | 'blocked' | 'out-of-scope';
export interface ReviewSource {
  id: string;
  title: string;
  kind: 'documentation' | 'skill' | 'project';
  publisher: string;
  technology: string;
  version: string;
  url: string | null;
  consultedAt: string | null;
  access: 'consulted' | 'unavailable' | 'unverified';
  usage: string;
  compatibility: string;
  provenance: string;
}

export interface ReviewEvidence {
  id: string;
  title: string;
  kind: 'text' | 'log' | 'screenshot' | 'diagram';
  content: string;
  url: string | null;
  image: {
    mime: 'image/png' | 'image/jpeg';
    base64: string;
    alt: string;
    origin: 'captured' | 'explanatory';
    privacyReviewed: true;
  } | null;
}

export interface ReviewCheck {
  id: string;
  title: string;
  domain: string;
  kind: 'automated' | 'manual';
  status: CheckStatus;
  result: string;
  reason: string | null;
  evidenceIds: string[];
  revision: string;
  targets: string[];
}

export interface ReviewFinding {
  id: string;
  title: string;
  domain: string;
  severity: Severity;
  severityReason: string;
  confidence: Confidence;
  resolution: Resolution;
  location: { path: string; line: number | null; component: string | null };
  trigger: string;
  expected: string;
  observed: string;
  impact: string;
  reproduction: string[];
  evidenceIds: string[];
  correction: string;
  tradeoffs: string;
  sourceIds: string[];
  ticketIds: string[];
  verification: string;
  resolutionEvidenceIds: string[];
  targets: string[];
}

export interface Review {
  format: 1;
  id: string;
  title: string;
  project: string;
  mission: string;
  tickets: { id: string; title: string; url: string | null }[];
  date: string;
  scope: string[];
  exclusions: string[];
  revision: { commit: string; dirty: string[] };
  technologies: { name: string; version: string; detectedFrom: string }[];
  sources: ReviewSource[];
  checks: ReviewCheck[];
  findings: ReviewFinding[];
  evidence: ReviewEvidence[];
  limits: string[];
  policy: { blockingSeverities: Severity[]; requireAllChecks: boolean; rationale: string };
  summary: string;
}

export interface ReviewSummary {
  severities: Record<Severity, number>;
  suspected: number;
  checks: Record<CheckStatus, number>;
  conclusion: 'corrections' | 'ready' | 'incomplete' | 'blocked';
}

export interface ReviewFilters {
  query: string;
  domain: string;
  severity: string;
  confidence: string;
  resolution: string;
}
