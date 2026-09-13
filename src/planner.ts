import { object, text, id, safePath } from './records.js';

interface Task { id: string; owner: string; worktree: string; owns: string[]; dependsOn: string[];
  status: 'pending' | 'running' | 'passed' | 'failed' | 'blocked' | 'cancelled'; attempts: number;
  maxAttempts: number; checkpoint: string; evidence: 'current' | 'stale' | 'missing'; acceptance: string[] }
export interface Plan { format: 1; status: 'active' | 'complete' | 'cancelled'; concurrency: 1 | 2;
  contractOwner: string; sharedContracts: string[]; tasks: Task[] }
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 128 && v.every(text) && new Set(v).size === v.length;
const overlaps = (a: string, b: string) => a.toLowerCase() === b.toLowerCase() || a.toLowerCase().startsWith(b.toLowerCase() + '/') || b.toLowerCase().startsWith(a.toLowerCase() + '/');
export function inspectPlan(input: unknown) {
  if (!object(input) || input.format !== 1 || typeof input.status !== 'string' || !['active', 'complete', 'cancelled'].includes(input.status)
    || ![1, 2].includes(input.concurrency as number) || !text(input.contractOwner) || !strings(input.sharedContracts) || !input.sharedContracts.every(safePath)
    || !Array.isArray(input.tasks) || !input.tasks.length || input.tasks.length > 128) throw new Error('Expected bounded plan format 1, concurrency 1 or 2, contractOwner, sharedContracts and 1–128 tasks.');
  for (const t of input.tasks) if (!object(t) || !id(t.id) || !text(t.owner) || !safePath(t.worktree)
    || !strings(t.owns) || !t.owns.length || !t.owns.every(safePath) || !strings(t.dependsOn) || !t.dependsOn.every(id)
    || !strings(t.acceptance) || !t.acceptance.length || !safePath(t.checkpoint)
    || typeof t.status !== 'string' || !['pending', 'running', 'passed', 'failed', 'blocked', 'cancelled'].includes(t.status)
    || !Number.isInteger(t.attempts) || (t.attempts as number) < 0 || !Number.isInteger(t.maxAttempts) || (t.maxAttempts as number) < 1 || (t.maxAttempts as number) > 10 || (t.attempts as number) > (t.maxAttempts as number)
    || typeof t.evidence !== 'string' || !['current', 'stale', 'missing'].includes(t.evidence)) throw new Error('Invalid task: require ownership, isolated worktree, dependencies, acceptance, bounded attempts, checkpoint and evidence state.');
  const plan = input as unknown as Plan;
  const byId = new Map(plan.tasks.map(t => [t.id, t]));
  if (byId.size !== plan.tasks.length) throw new Error('Duplicate task ID.');
  for (const t of plan.tasks) {
    if (t.dependsOn.some(d => !byId.has(d))) throw new Error('Unknown dependency.');
    if (t.owns.some(p => plan.sharedContracts.some(c => overlaps(p, c))) && t.owner !== plan.contractOwner) throw new Error('Shared contracts require the single contract owner.');
    if (['running', 'passed', 'failed'].includes(t.status) && t.attempts === 0) throw new Error('Running, passed or failed tasks require a recorded attempt.');
  }
  for (let i = 0; i < plan.tasks.length; i++) for (const b of plan.tasks.slice(i + 1)) {
    const a = plan.tasks[i]!;
    if (overlaps(a.worktree, b.worktree)) throw new Error('Worktrees must be distinct and non-nested.');
    if (a.owns.some(p => b.owns.some(q => overlaps(p, q)))) throw new Error('Task ownership must not overlap, even across dependent tasks.');
  }
  const done = new Set<string>();
  while (done.size < plan.tasks.length) {
    let progress = false;
    for (const t of plan.tasks) if (!done.has(t.id) && t.dependsOn.every(d => done.has(d))) { done.add(t.id); progress = true; }
    if (!progress) throw new Error('Task dependency cycle.');
  }
  const results = new Map<string, string>();
  for (const key of done) {
    const t = byId.get(key)!;
    results.set(key, t.status === 'running' ? 'needs-reconciliation' : t.status === 'passed' ?
      t.evidence === 'current' && t.dependsOn.every(d => results.get(d) === 'passed') ? 'passed' : 'blocked' :
      t.status !== 'pending' ? t.status : t.attempts >= t.maxAttempts ? 'exhausted' : t.evidence === 'stale' ? 'blocked' :
      t.dependsOn.every(d => results.get(d) === 'passed') ? 'eligible' : 'blocked');
  }
  const running = plan.tasks.filter(t => t.status === 'running').length;
  if (running > plan.concurrency) throw new Error('Running tasks exceed concurrency.');
  if (plan.status === 'complete' && [...results.values()].some(s => s !== 'passed')) throw new Error('Completed plan requires current passing evidence for every task.');
  const candidates = plan.status === 'active' && running === 0 ? plan.tasks.filter(t => results.get(t.id) === 'eligible').slice(0, plan.concurrency).map(t => t.id) : [];
  return { format: 1, status: plan.status, tasks: plan.tasks.map(t => ({ id: t.id, state: results.get(t.id) })), candidates,
    adapter: 'manual-planning-only', dispatch: 'not-implemented',
    limitations: 'Claims are supplied by the operator; validate checkpoint evidence and actual isolated worktrees before use. Running tasks require reconciliation. No retries, host dispatch or new authorization.' };
}
