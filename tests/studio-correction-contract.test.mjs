import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialStudioState } from '../scripts/studio/store.mjs';
import {
  queueRequest,
  claimJob,
  finishJob,
  queueCorrection,
  validateStudioState,
} from '../scripts/studio/domain.mjs';

function failedCandidate() {
  const state = createInitialStudioState();
  state.project.mode = 'delegated';
  const job = queueRequest(state, { request: 'Build the requested app' });
  claimJob(state, { worker: 'controlled fixture' });
  finishJob(
    state,
    {
      jobId: job.id,
      revision: {
        id: 'candidate',
        jobId: job.id,
        title: 'Failed candidate',
        summary: 'Syntax fixture',
        createdAt: new Date().toISOString(),
        files: [
          { path: 'index.html', sha256: 'a'.repeat(64), bytes: 20 },
          { path: 'app.js', sha256: 'b'.repeat(64), bytes: 10 },
        ],
      },
    },
    {
      checks: [
        {
          kind: 'command',
          label: 'Syntax',
          command: 'node --check',
          protocol: 'studio-javascript-syntax-v1',
          status: 'failed',
          output: 'Unexpected token',
        },
      ],
    },
  );
  return state;
}

test('one correction retains failed candidate, diagnostic and authority base', () => {
  const state = failedCandidate();
  state.draft = 'Un besoin encore en cours de rédaction';
  const job = queueCorrection(state, { revisionId: 'candidate' });
  assert.equal(state.draft, 'Un besoin encore en cours de rédaction');
  assert.equal(state.activeRevision, null);
  assert.equal(job.baseRevision, null);
  assert.equal(job.correction.sourceRevision, 'candidate');
  assert.deepEqual(job.correction.checkIds, [state.checks[0].id]);
  assert.match(job.request, /Unexpected token/);
  assert.throws(() => queueCorrection(state, { revisionId: 'candidate' }), /déjà enregistrée/);
  validateStudioState(state);
  assert.equal(claimJob(state, { worker: 'fixture' }).id, job.id);
});

test('changed context, absent delegation and self-reported failure cannot authorize repair', () => {
  const changed = failedCandidate();
  queueCorrection(changed, { revisionId: 'candidate' });
  changed.project.idea = 'A different app';
  assert.throws(() => claimJob(changed, { worker: 'fixture' }), /contexte/);
  assert.equal(changed.jobs.at(-1).status, 'queued');
  const revoked = failedCandidate();
  queueCorrection(revoked, { revisionId: 'candidate' });
  revoked.project.delegation = { structure: 'user', visual: 'agent', adoption: 'user' };
  assert.throws(() => claimJob(revoked, { worker: 'fixture' }), /délégation/);
  assert.equal(revoked.jobs.at(-1).status, 'queued');
  const reserved = failedCandidate();
  reserved.project.delegation = { structure: 'agent', visual: 'agent', adoption: 'user' };
  assert.throws(() => queueCorrection(reserved, { revisionId: 'candidate' }), /non déléguée/);
  const untrusted = failedCandidate();
  delete untrusted.checks[0].executor;
  assert.throws(() => queueCorrection(untrusted, { revisionId: 'candidate' }), /Aucun échec/);
});
