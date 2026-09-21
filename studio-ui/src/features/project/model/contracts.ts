export type Layer = 'frontend' | 'backend' | 'shared' | 'infrastructure' | 'unclassified';
export type ProvenanceKind = 'detected' | 'declared' | 'observed' | 'inferred';
export interface SourceRef {
  path: string;
  line?: number;
  symbol?: string;
}
export interface Provenance {
  kind: ProvenanceKind;
  method: string;
  sources: SourceRef[];
  limitation?: string;
}
export interface ProjectFile {
  path: string;
  sha256: string;
  bytes: number;
  layer: Layer;
  feature: string;
  language: string;
  role: string;
  test: boolean;
}
export interface ProjectElement {
  id: string;
  label: string;
  type:
    | 'frontend'
    | 'module'
    | 'service'
    | 'endpoint'
    | 'database'
    | 'cache'
    | 'queue'
    | 'storage'
    | 'external'
    | 'contract'
    | 'test';
  layer: Layer;
  sources: SourceRef[];
  provenance: Provenance[];
  description: string;
  runtime: 'not_observed' | 'observed';
  details: Record<string, string>;
}
export interface ProjectRelation {
  id: string;
  source: string;
  target: string;
  kind: 'import' | 'http' | 'read' | 'write' | 'publish' | 'consume' | 'declares' | 'tests';
  label: string;
  provenance: Provenance[];
}
export interface ProjectFlow {
  id: string;
  title: string;
  entryId: string;
  elementIds: string[];
  relationIds: string[];
  errors: { label: string; source: SourceRef }[];
  limits: string[];
  kind: 'code' | 'observed';
  trace?: {
    revisionId: string;
    environment: string;
    durationMs?: number;
    events: { label: string; at?: string; durationMs?: number; error?: string }[];
  };
}
export interface AnalysisIssue {
  extractor: string;
  message: string;
  path?: string;
}
export interface ProjectAnalysis {
  schemaVersion: 1;
  revisionId: string;
  baseRevisionId?: string;
  fingerprint: string;
  analyzedAt: string;
  environment: string;
  status: 'complete' | 'partial' | 'failed';
  scope: string;
  localChanges: boolean;
  files: ProjectFile[];
  elements: ProjectElement[];
  relations: ProjectRelation[];
  flows: ProjectFlow[];
  issues: AnalysisIssue[];
  limits: string[];
  stack: string[];
  backendDetected: boolean;
}
export interface ProjectChange {
  path: string;
  kind: 'added' | 'modified' | 'removed';
  elementIds: string[];
  dependencyIds: string[];
  consumerIds: string[];
  contractIds: string[];
  testIds: string[];
}
export interface ProjectImpact {
  baseRevisionId: string | null;
  revisionId: string;
  changes: ProjectChange[];
  staleCheckIds: string[];
  limits: string[];
}
export interface ProjectIntelligence {
  analysis: ProjectAnalysis;
  previous: ProjectAnalysis | null;
  impact: ProjectImpact;
}
export interface ProjectCallbacks {
  onOpenSource: (path: string, line?: number) => void;
  onShowChecks: (path?: string) => void;
}
export interface ModelViewProps extends ProjectCallbacks {
  model: ProjectIntelligence;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}
