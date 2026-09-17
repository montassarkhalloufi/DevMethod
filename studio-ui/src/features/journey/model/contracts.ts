export type JourneyStage =
  'foundation' | 'exploration' | 'frame' | 'design' | 'architecture' | 'delivery';

export interface JourneyReference {
  id: string;
  name: string;
  mime: string;
}
export interface JourneyDesign {
  id: string;
  file: string;
  title: string;
  description: string;
}
export interface JourneyDecision {
  id: string;
  topic: string;
  choice: string;
  reason: string;
  status: 'active' | 'hypothesis' | 'superseded';
}
export interface DesignMaster {
  id: string;
  designId: string;
  referenceId: string;
  source: 'agent' | 'user';
  createdAt: string;
  approvedBy: null | 'user' | 'agent';
  approvedAt: string | null;
  approvalReason: string | null;
}
export interface DesignJourney {
  activeMasterId: string | null;
  masters: DesignMaster[];
  screens: { id: string; title: string; referenceId: string; masterId: string }[];
  prototypes: { id: string; masterId: string; revisionId: string }[];
}
export interface JourneyState {
  import?: {
    format: 1;
    baselineRevision: string;
    source: { name: string; importedAt: string; fingerprint: string };
    inventory: { included: number; bytes: number; excluded: { path: string; reason: string }[] };
    context: {
      facts: {
        kind: string;
        label: string;
        value: string;
        provenance: { kind: string; path: string; sha256: string };
      }[];
      unknowns: string[];
      analysis: { status: string; protocol: string; stack: string[]; issues: unknown[] };
    };
  };
  project: {
    name: string;
    idea: string;
    mode: string;
    constraints: string[];
    delegation?: {
      structure: 'agent' | 'user';
      visual: 'agent' | 'user';
      adoption: 'agent' | 'user';
    };
  };
  brief: {
    outcome: string;
    scope: string[];
    excluded: string[];
    criteria: { id: string; text: string }[];
  };
  decisions: JourneyDecision[];
  designs: JourneyDesign[];
  selectedDesignId: string | null;
  references: JourneyReference[];
  revisions: { id: string; title: string }[];
  activeRevision?: string | null;
  checks: { id: string; revisionId: string; status: string }[];
  designJourney?: DesignJourney;
}
export interface JourneyOptions {
  state: JourneyState;
  onRequest: (stage: JourneyStage, request: string) => void;
  onApproveMaster?: (masterId: string) => Promise<void>;
  onChooseDirection?: (designId: string) => Promise<void>;
  onOpenPrototype?: (revisionId: string) => void;
  onOpenSource?: (path: string, revisionId: string) => void;
}
export interface JourneyHandle {
  update(options: JourneyOptions): void;
  dispose(): void;
}
export interface StageSummary {
  id: JourneyStage;
  title: string;
  purpose: string;
  status: string;
  facts: string[];
  request: string;
}
