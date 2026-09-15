/** Native stage entry points; module selection remains the six-module contract. */
export const stageOwners: Record<string, string> = {
  'devmethod-explore': 'project-foundation',
  'devmethod-frame': 'project-foundation',
  'devmethod-design': 'design-to-code',
  'devmethod-architecture': 'decision-architecture',
  'devmethod-plan': 'scoped-delivery',
  'devmethod-ready': 'scoped-delivery',
  'devmethod-implement': 'scoped-delivery',
  'devmethod-review': 'scoped-delivery',
  'devmethod-verify': 'scoped-delivery',
  'devmethod-integrate': 'scoped-delivery',
  'devmethod-correct-course': 'project-foundation',
  'devmethod-next': 'scoped-delivery',
  'devmethod-status': 'project-foundation',
  'devmethod-handoff': 'scoped-delivery',
};

export function commandSkills(selected: readonly string[]): string[] {
  return Object.entries(stageOwners)
    .filter(([, owner]) => selected.includes('project-foundation') && selected.includes(owner))
    .map(([name]) => name);
}

export type GuardCommand = '/implement' | '/verify' | '/integrate';

export interface CommandConditions {
  halted: boolean;
  ready: boolean;
  initialized: boolean;
  retryNeedsDiagnosis: boolean;
  hasDiagnosis: boolean;
  hasBehavioralReceipt: boolean;
}

/** Gates are shared by the local guard; host slash-command routing remains advisory. */
export function commandGate(command: GuardCommand, conditions: CommandConditions): string | null {
  if (!['/implement', '/verify', '/integrate'].includes(command)) return 'unknown-command';
  if (conditions.halted) return 'human-intervention';
  if (!conditions.ready) return 'mission-not-ready';
  if (command === '/implement') return null;
  if (!conditions.initialized) return 'implementation-gate-required';
  if (command === '/integrate')
    return conditions.hasBehavioralReceipt ? null : 'behavioral-evidence-required';
  if (conditions.retryNeedsDiagnosis && !conditions.hasDiagnosis) return 'diagnosis-required';
  return null;
}
