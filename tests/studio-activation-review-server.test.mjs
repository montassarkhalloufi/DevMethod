import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startStudio } from '../scripts/studio/server.mjs';
import { updateProject, queueRequest } from '../scripts/studio/domain.mjs';

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-adoption-http-'));
  const studio = await startStudio({ workspace: root, port: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  studio.store.commit(studio.store.read().version, (state) => {
    updateProject(state, {
      name: 'Controlled adoption',
      idea: 'Fixture',
      mode: 'delegated',
      constraints: [],
    });
    queueRequest(state, { request: 'Create fixture' });
  });
  const claim = studio.jobs.claim('controlled-test-worker');
  fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), '<h1>Controlled fixture</h1>');
  const result = await studio.jobs.finish(
    { jobId: claim.job.id, title: 'Candidate for explicit review' },
    { deferActivation: true },
  );
  const runtime = studio.runtime();
  const review = () =>
    fetch(runtime.url + '/api/activation-review?revision=' + result.revision.id).then((r) =>
      r.json(),
    );
  const post = async (input, headers = { Origin: runtime.url }) => {
    const response = await fetch(runtime.url + '/api/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(input),
    });
    return { status: response.status, body: await response.json() };
  };
  return { studio, revision: result.revision, runtime, review, post };
}

test('HTTP adoption requires the exact review and preserves a user decision without enabling the agent', async (t) => {
  const f = await fixture(t);
  const before = f.studio.store.read();
  const review = await f.review();
  assert.equal(review.revision.id, f.revision.id);
  assert.equal(review.control.graph.revisionId, f.revision.id);
  assert.equal(review.version, before.version);
  assert.equal(review.canActivate, true);
  assert.equal(f.studio.store.read().activeRevision, null);
  const input = {
    version: review.version,
    id: f.revision.id,
    reviewKey: review.reviewKey,
    reason: 'Controlled test of adoption; no human acceptance claimed.',
  };
  assert.equal((await f.post({ ...input, reviewKey: undefined })).status, 400);
  assert.equal((await f.post({ ...input, reason: '   ' })).status, 400);
  assert.equal((await f.post(input, { Authorization: 'Bearer ' + f.runtime.token })).status, 403);
  assert.equal((await f.post(input, { Origin: 'https://foreign.invalid' })).status, 403);
  assert.equal(f.studio.store.read().version, before.version);
  const result = await f.post(input);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.state.activeRevision, f.revision.id);
  const decision = result.body.state.decisions.at(-1);
  assert.equal(decision.source, 'user');
  assert.equal(decision.reason, input.reason);
  assert.ok(decision.review);
  assert.equal(f.studio.runtime().agent.automatic, false);
  assert.equal(f.studio.store.read().jobs.length, before.jobs.length);
});

test('HTTP adoption refuses a project changed since review instead of applying an obsolete confirmation', async (t) => {
  const f = await fixture(t);
  const review = await f.review();
  f.studio.store.commit(review.version, (state) => {
    state.draft = 'A concurrent draft remains preserved';
  });
  const result = await f.post({
    version: review.version,
    id: f.revision.id,
    reviewKey: review.reviewKey,
    reason: 'Obsolete review must not activate',
  });
  assert.equal(result.status, 409);
  assert.equal(f.studio.store.read().activeRevision, null);
  assert.equal(f.studio.store.read().draft, 'A concurrent draft remains preserved');
});
