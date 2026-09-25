import type { ReactNode } from 'react';
export type JobStatus = 'queued' | 'running' | 'ready' | 'failed' | 'cancelled' | 'interrupted';
export interface ProgressJob {
  id: string;
  request: string;
  status: JobStatus;
  worker: string | null;
  baseRevision: string | null;
}
export interface ProgressStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'blocked';
}
export interface ProgressAction {
  id: string;
  kind: 'read' | 'write' | 'command' | 'search' | 'check' | 'message';
  label: string;
  status: 'running' | 'completed' | 'failed';
  at: string;
  path?: string;
}
export interface ProgressSnapshot {
  jobId: string;
  baseRevision: string | null;
  status: JobStatus;
  worker: string | null;
  sequence: number;
  updatedAt: string | null;
  plan: { title: string; steps: ProgressStep[] } | null;
  actions: ProgressAction[];
  truncated: boolean;
  source: 'host' | 'runner' | null;
}
export interface ProgressWidgetProps {
  renderInteractions?(job: ProgressJob): ReactNode;
  jobs: ProgressJob[];
  revisions: { id: string; jobId: string; files: { path: string }[] }[];
  loadProgress(jobId: string, signal: AbortSignal): Promise<ProgressSnapshot>;
  onOpenFile(jobId: string, path: string): void;
  pollMs?: number;
}
