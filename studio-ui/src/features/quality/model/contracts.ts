import type { ProjectElement, ProjectFlow, SourceRef } from '../../project/model/contracts';

export type QualityStatus =
  'notrun' | 'running' | 'passed' | 'failed' | 'blocked' | 'notapplicable';
export type Freshness = 'current' | 'obsolete' | 'reevaluate';
export interface QualityEvidence {
  id: string;
  checkId?: string;
  revisionId: string;
  status: QualityStatus;
  fingerprint?: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  tool: string;
  toolVersion?: string;
  source?: { kind: 'host-local' | 'host-api' | 'host-mcp'; toolName?: string };
  provider?: {
    connectionId: string;
    optionId: string;
    connectionVersion: number;
    probeId: string;
    attestation: 'host-bridge';
  };
  metrics?: Record<string, number>;
  environment: string;
  expected: string;
  observed: string;
  findings: { source?: SourceRef; target?: string; message: string }[];
  limits: string[];
  events: { label: string; at: string }[];
}
export interface QualityCheck {
  id: string;
  title: string;
  category: string;
  tool: string;
  objective: string;
  execution: 'studio' | 'external' | 'recorded';
  status: QualityStatus;
  freshness: Freshness;
  reason?: string;
  nextAction?: string;
  canRun: boolean;
  evidence: QualityEvidence | null;
}
export interface QualityReport {
  schemaVersion: 1;
  revisionId: string;
  fingerprint: string;
  generatedAt: string;
  environment: string;
  localChanges: boolean;
  capabilities: Record<string, boolean>;
  categories: { id: string; label: string }[];
  checks: QualityCheck[];
  historical: QualityCheck[];
  limits: string[];
  flowModel: { flows: ProjectFlow[]; elements: ProjectElement[] } | null;
}
export interface QualityOptions {
  revisionId: string | null;
  onOpenSource: (path: string, line?: number, revisionId?: string) => void;
  onStateChanged?: () => void;
  onPrepareRequest?: (request: QualityRequest) => void;
  onOpenConnectors?: (checkId?: string) => void;
}
export interface QualityRequest {
  kind: 'fix' | 'connect';
  revisionId: string;
  checkId: string;
  title: string;
  prompt: string;
}
export interface QualityHandle {
  update(options: QualityOptions): void;
  dispose(): void;
}
