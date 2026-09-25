export type ProjectView = 'files' | 'architecture' | 'flows' | 'impact';

export interface ProjectWidgetOptions {
  revisionId: string | null;
  previousRevisionId: string | null;
  activeRevisionId: string | null;
  sourceHost: HTMLElement;
  selectedPath: string | null;
  revisions?: { id: string; title: string; origin?: { kind: 'import' } }[];
  onSelectVersion?(id: string): void;
  checks: { id: string; revisionId: string; status: string; label: string }[];
  decisions: { id: string; topic: string; choice: string; reason: string; status: string }[];
  onOpenSource(path: string, line?: number, options?: { draft: boolean }): void;
  onShowChecks(path?: string): void;
  onFocus(): void;
  onExpand(): void;
  focused: boolean;
  pendingDecision?: string;
  onReviewDecision?(): void;
  view?: ProjectView;
  onViewChange?(view: ProjectView): void;
}
export interface ProjectWidgetHandle {
  update(options: ProjectWidgetOptions): void;
  dispose(): void;
}
