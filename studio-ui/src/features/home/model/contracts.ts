export type ProjectKind = 'new' | 'imported' | 'existing';

export interface HomeProject {
  id: string;
  name: string;
  kind: ProjectKind;
  workspace: string;
  createdAt: string;
  lastOpenedAt: string | null;
}

export interface ProjectInput {
  kind: ProjectKind;
  name?: string;
  idea?: string;
  source?: string;
  workspace?: string;
}

export interface HomeOptions {
  navigate?(url: string): void;
}

export interface HomeOperation {
  phase: 'idle' | 'creating' | 'opening';
  project: HomeProject | null;
  error: string;
}

export interface ProjectFields {
  name: string;
  idea: string;
  source: string;
  workspace: string;
}

export interface FieldError {
  field: keyof ProjectFields;
  message: string;
}
