import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectPlan } from '../dist/planner.js';
const task = (id, dependsOn = []) => ({
  id,
  dependsOn,
  owner: 'worker',
  worktree: `worktrees/${id}`,
  owns: [`src/${id}`],
  status: 'pending',
  attempts: 0,
  maxAttempts: 2,
  checkpoint: 'checkpoint.json',
  evidence: 'missing',
  acceptance: ['Contract check'],
});
const plan = () => ({
  format: 1,
  status: 'active',
  concurrency: 2,
  contractOwner: 'supervisor',
  sharedContracts: ['contracts'],
  tasks: [task('a'), task('b'), task('c', ['a'])],
});
test('planner bounds candidates, respects dependencies and sequential fallback without mutation', () => {
  const p = plan(),
    before = structuredClone(p);
  assert.deepEqual(inspectPlan(p).candidates, ['a', 'b']);
  assert.deepEqual(p, before);
  p.concurrency = 1;
  assert.deepEqual(inspectPlan(p).candidates, ['a']);
  Object.assign(p.tasks[0], { status: 'passed', attempts: 1, evidence: 'current' });
  assert.deepEqual(inspectPlan(p).tasks[2], { id: 'c', state: 'eligible' });
  p.tasks[0].evidence = 'stale';
  assert.equal(inspectPlan(p).tasks[2].state, 'blocked');
});
test('failure, cancellation, exhausted attempts and interrupted work never auto-retry', () => {
  for (const status of ['failed', 'blocked', 'cancelled', 'running']) {
    const p = plan();
    Object.assign(p.tasks[0], { status, attempts: 1 });
    const r = inspectPlan(p);
    assert.ok(!r.candidates.includes('a'));
    assert.equal(r.tasks[2].state, 'blocked');
    if (status === 'running') {
      assert.deepEqual(r.candidates, []);
      assert.equal(r.tasks[0].state, 'needs-reconciliation');
    }
  }
  const p = plan();
  p.tasks[0].attempts = 2;
  assert.equal(inspectPlan(p).tasks[0].state, 'exhausted');
  p.status = 'cancelled';
  assert.deepEqual(inspectPlan(p).candidates, []);
});
test('ownership conflicts, nested worktrees, graph errors and false completion fail closed', () => {
  for (const edit of [
    (p) => (p.tasks[1].owns = ['src/a/child']),
    (p) => (p.tasks[1].worktree = 'worktrees/a/nested'),
    (p) => (p.tasks[0].owns = ['contracts/api']),
    (p) => (p.tasks[0].dependsOn = ['c']),
    (p) => (p.tasks[0].dependsOn = ['unknown']),
    (p) => (p.status = 'complete'),
    (p) => (p.concurrency = 3),
  ]) {
    const p = plan();
    edit(p);
    assert.throws(() => inspectPlan(p));
  }
  const p = plan();
  for (const t of p.tasks) Object.assign(t, { status: 'passed', attempts: 1, evidence: 'current' });
  p.status = 'complete';
  assert.deepEqual(inspectPlan(p).candidates, []);
});

test('pre-execution blocking and cancellation require no fabricated attempt', () => {
  for (const status of ['blocked', 'cancelled']) {
    const p = plan();
    p.tasks[0].status = status;
    assert.equal(inspectPlan(p).tasks[0].state, status);
  }
});

test('dependency evaluation retains declared task and candidate order', () => {
  const value = plan();
  const parent = task('parent');
  Object.assign(parent, { status: 'passed', attempts: 1, evidence: 'current' });
  value.tasks = [task('child', ['parent']), parent, task('other')];
  const result = inspectPlan(value);
  assert.deepEqual(result.tasks, [
    { id: 'child', state: 'eligible' },
    { id: 'parent', state: 'passed' },
    { id: 'other', state: 'eligible' },
  ]);
  assert.deepEqual(result.candidates, ['child', 'other']);
  parent.evidence = 'stale';
  assert.deepEqual(inspectPlan(value).candidates, ['other']);
});
