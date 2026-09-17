export type ProjectKind = 'new' | 'imported' | 'existing';
export type HomeProjectType = 'website' | 'app' | 'prototype' | 'slides';

export type HomeProjectPreview =
  | { status: 'ready'; revisionId: string; url: string; selection: 'active' | 'candidate' }
  | { status: 'empty'; reason: 'no-revision' }
  | {
      status: 'unavailable';
      reason: 'source-only' | 'artifacts-unavailable' | 'state-unavailable';
      revisionId?: string;
    };

export interface LaunchInput {
  action: 'plan' | 'build';
  projectType: HomeProjectType;
  design?: string;
  connectors: string[];
  mcpConnectionIds: string[];
  links: string[];
  attachments: { name: string; mime: string; base64: string }[];
}

export interface HomeProject {
  id: string;
  name: string;
  kind: ProjectKind;
  workspace: string;
  createdAt: string;
  lastOpenedAt: string | null;
  preview?: HomeProjectPreview;
}

export interface ProjectInput {
  kind: ProjectKind;
  name?: string;
  idea?: string;
  source?: string;
  workspace?: string;
  launch?: LaunchInput;
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
