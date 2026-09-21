import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import {
  activateRevision,
  cancelJob,
  recordCheck,
  queueRequest,
  updateProject,
} from '../scripts/studio/domain.mjs';

// Real local syntax checks; no provider call or claim of application behavior.
test('invalid JavaScript remains a candidate, manual adoption is refused, correction gets its own check', async (t) => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-admission-'));
  const store = createStudioStore(root);
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  store.commit(store.read().version, (state) =>
    updateProject(state, {
      name: 'Admission fixture',
      idea: 'Local page',
      mode: 'delegated',
      constraints: [],
    }),
  );
  const jobs = createJobs(store);

  async function deliver(code) {
    store.commit(store.read().version, (state) =>
      queueRequest(state, { request: 'Update script' }),
    );
    const claim = jobs.claim('controlled fixture');
    fs.writeFileSync(
      path.join(claim.workDirectory, 'index.html'),
      '<script src="app.js"></script>',
    );
    fs.writeFileSync(path.join(claim.workDirectory, 'app.js'), code);
    return jobs.finish({ jobId: claim.job.id, title: 'Candidate', summary: 'Syntax fixture' });
  }

  const first = await deliver('const value = 1;');
  assert.equal(store.read().activeRevision, first.revision.id);
  const untrusted = store.read();
  untrusted.checks = [];
  recordCheck(untrusted, {
    revisionId: first.revision.id,
    label: 'Claimed check',
    kind: 'command',
    command: 'node --check',
    protocol: 'studio-javascript-syntax-v1',
    status: 'passed',
  });
  assert.throws(
    () => activateRevision(untrusted, { id: first.revision.id, reason: 'Untrusted claim' }),
    /vérification/i,
  );
  assert.throws(() => recordCheck(untrusted, { executor: 'studio' }), /provenance/i);
  const invalid = await deliver('const value = ;');
  assert.equal(store.read().activeRevision, first.revision.id);
  assert.ok(
    store
      .read()
      .checks.some(
        (check) => check.revisionId === invalid.revision.id && check.status === 'failed',
      ),
  );
  assert.throws(
    () =>
      store.commit(store.read().version, (state) =>
        activateRevision(state, { id: invalid.revision.id, reason: 'Try invalid' }),
      ),
    /vérification/i,
  );
  const fixed = await deliver('const value = 2;');
  assert.equal(store.read().activeRevision, fixed.revision.id);
  assert.ok(
    store
      .read()
      .checks.some((check) => check.revisionId === fixed.revision.id && check.status === 'passed'),
  );
  assert.ok(
    store
      .read()
      .checks.some(
        (check) => check.revisionId === invalid.revision.id && check.status === 'failed',
      ),
  );
});

// Controlled local source fixture, checked by the real Node subprocess (no native agent).
test('cancellation during syntax checks rejects the late result and preserves the work', async (t) => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-cancel-check-'));
  const store = createStudioStore(root);
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  store.commit(store.read().version, (state) => {
    updateProject(state, {
      name: 'Cancellation fixture',
      idea: 'Local page',
      mode: 'delegated',
      constraints: [],
    });
    queueRequest(state, { request: 'Check local source' });
  });
  const jobs = createJobs(store);
  const claim = jobs.claim('controlled fixture');
  fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), '<script src="app.js"></script>');
  fs.writeFileSync(path.join(claim.workDirectory, 'app.js'), 'const value = 1;');
  const pending = jobs.finish({ jobId: claim.job.id, title: 'Late candidate' });
  assert.equal(
    store.read().revisions.length,
    0,
    'verification must yield before creating a revision',
  );
  assert.equal(store.read().checks.length, 0, 'no receipt exists before the check completes');
  store.commit(store.read().version, (state) => cancelJob(state, { jobId: claim.job.id }));
  const cancelled = store.read();
  await assert.rejects(pending, { status: 409 });
  assert.deepEqual(store.read(), cancelled, 'late checks must not mutate cancelled state');
  assert.equal(
    fs.readFileSync(path.join(claim.workDirectory, 'app.js'), 'utf8'),
    'const value = 1;',
  );
});
