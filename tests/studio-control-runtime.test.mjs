import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialStudioState } from '../scripts/studio/store.mjs';
import { projectControl } from '../scripts/studio/control.mjs';

test('queued follow-up does not hide the candidate awaiting verification', () => {
  const state = createInitialStudioState();
  state.project.mode = 'delegated';
  state.jobs = [
    { id: 'built', status: 'ready' },
    { id: 'followup', status: 'queued' },
  ];
  state.revisions = [
    {
      id: 'candidate',
      jobId: 'built',
      files: [{ path: 'index.html', sha256: 'a'.repeat(64), bytes: 1 }],
    },
  ];
  const result = projectControl(state, { automatic: true });
  assert.equal(result.graph.revisionId, 'candidate');
  assert.equal(result.autonomy.action, 'strengthen-verification');
  assert.equal(
    projectControl(state, { automatic: true }, 'followup').graph.revisionId,
    null,
    'a specific failed or unfinished job cannot borrow another job’s result',
  );
});

test('imported active baseline can be inspected without manufacturing a producing job', () => {
  const state = createInitialStudioState();
  state.activeRevision = 'baseline';
  state.revisions = [
    {
      id: 'baseline',
      origin: { kind: 'import' },
      files: [{ path: 'index.html', sha256: 'a'.repeat(64), bytes: 1 }],
    },
  ];
  const result = projectControl(state, { automatic: false });
  assert.equal(result.graph.revisionId, 'baseline');
  assert.equal(result.graph.nodes.filter((node) => node.type === 'job').length, 0);
  assert.equal(result.autonomy.action, 'stop');
});

test('manual or disabled execution is not described as an exhausted budget', () => {
  const state = createInitialStudioState();
  assert.deepEqual(projectControl(state, { automatic: false }).autonomy.reasons, [
    'agent-unavailable',
  ]);
  assert.deepEqual(
    projectControl(state, { automatic: false, attempts: 2, maxJobs: 2 }).autonomy.reasons,
    ['budget-closed'],
  );
  assert.deepEqual(
    projectControl(state, { automatic: false, usageUnknown: true }).autonomy.reasons,
    ['usage-unknown'],
  );
});
