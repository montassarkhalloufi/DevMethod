import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startStudio } from '../scripts/studio/server.mjs';
import { queueRequest, recordControl, updateProject } from '../scripts/studio/domain.mjs';

// Real local admission and HTTP only; no provider or browser is executed.
async function fixture(t, { react = false } = {}) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'candidate-request-'));
  const studio = await startStudio({ workspace: root, port: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const { store, jobs } = studio;
  const commit = (fn) => store.commit(store.read().version, fn);
  commit((state) =>
    updateProject(state, {
      name: 'Candidate request fixture',
      idea: 'Preserve a candidate',
      mode: 'delegated',
      constraints: [],
    }),
  );
  commit((state) => queueRequest(state, { request: 'Create baseline' }));
  const first = jobs.claim('local fixture');
  fs.writeFileSync(
    path.join(first.workDirectory, 'index.html'),
    '<!doctype html><h1>Baseline</h1>',
  );
  const base = (await jobs.finish({ jobId: first.job.id, title: 'Baseline' })).revision;
  assert.equal(store.read().activeRevision, base.id);
  commit((state) => queueRequest(state, { request: 'Create candidate' }));
  const next = jobs.claim('local fixture');
  fs.writeFileSync(
    path.join(next.workDirectory, 'index.html'),
    react
      ? '<!doctype html><div id="root"></div><script type="module" src="/src/main.tsx"></script>'
      : '<!doctype html><h1>Candidate needs prose correction</h1>',
  );
  if (react) {
    fs.mkdirSync(path.join(next.workDirectory, 'src'));
    fs.writeFileSync(
      path.join(next.workDirectory, 'package.json'),
      JSON.stringify({ devmethod: { profile: 'react-ts' } }),
    );
    fs.writeFileSync(
      path.join(next.workDirectory, 'src/main.tsx'),
      'import {createRoot} from "react-dom/client"; const value:string="Candidate"; const root=document.getElementById("root"); if(root) createRoot(root).render(<h1>{value}</h1>);',
    );
  }
  const revision = (
    await jobs.finish({ jobId: next.job.id, title: 'Candidate' }, { deferActivation: true })
  ).revision;
  commit((state) => {
    recordControl(state, {
      jobId: next.job.id,
      revisionId: revision.id,
      autonomy: { action: 'strengthen-verification', reasons: ['business-evidence-missing'] },
    });
    state.draft = 'Unsent draft must survive';
    state.draftConnectorGuides = [];
  });
  const runtime = studio.runtime();

  async function get() {
    const response = await fetch(runtime.url + '/api/candidate-request?revision=' + revision.id);
    return { status: response.status, body: await response.json() };
  }

  async function post(input, headers = {}) {
    const response = await fetch(runtime.url + '/api/candidate-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: runtime.url, ...headers },
      body: JSON.stringify(input),
    });
    return { status: response.status, body: await response.json() };
  }

  return {
    root,
    studio,
    store,
    jobs,
    commit,
    base,
    revision,
    parentId: next.job.id,
    runtime,
    get,
    post,
  };
}

const input = (review) => ({
  version: review.version,
  revisionId: review.revision.id,
  reviewKey: review.reviewKey,
  request: 'Restore the missing spaces and preformatted newlines only.',
});

test('HTTP prepares and queues an explicit candidate request without activation or draft loss', async (t) => {
  const f = await fixture(t);
  const before = f.store.read();
  const review = await f.get();
  assert.equal(review.status, 200, JSON.stringify(review.body));
  assert.equal(review.body.canRequest, true);
  assert.equal(review.body.activeRevision, f.base.id);
  assert.equal(f.store.read().version, before.version, 'reading the review must not mutate state');
  const result = await f.post(input(review.body));
  assert.equal(result.status, 200, JSON.stringify(result.body));
  const { state, job } = result.body;
  assert.equal(state.activeRevision, f.base.id);
  assert.equal(job.baseRevision, f.base.id);
  assert.equal(job.candidateRequest.sourceRevision, f.revision.id);
  assert.equal(job.candidateRequest.parentJobId, f.parentId);
  assert.match(job.candidateRequest.sourceFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(job.correction, undefined);
  assert.equal(job.recovery, undefined);
  assert.equal(state.draft, before.draft);
  assert.deepEqual(state.draftConnectorGuides, before.draftConnectorGuides);
  assert.deepEqual(
    state.jobs.find((entry) => entry.id === f.parentId),
    before.jobs.find((entry) => entry.id === f.parentId),
  );
  assert.deepEqual(state.revisions, before.revisions);
  assert.deepEqual(state.checks, before.checks);
});

test('claim prioritizes the linked request and copies React candidate sources, keeping the active static base', async (t) => {
  const f = await fixture(t, { react: true });
  let ordinary;
  f.commit((state) => {
    ordinary = queueRequest(state, { request: 'Unrelated queued request' });
  });
  const source = path.join(f.root, 'revisions', f.revision.id, 'app');
  const original = fs.readFileSync(path.join(source, 'src/main.tsx'));
  const ledger = path.join(f.root, '.devmethod/agent.json');
  fs.writeFileSync(ledger, JSON.stringify({ attempts: 2, knownTokens: 80, unknownUsage: true }));
  const ledgerBefore = fs.readFileSync(ledger);
  const view = await f.get();
  assert.equal(view.status, 200, JSON.stringify(view.body));
  const created = await f.post(input(view.body));
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const claimed = f.jobs.claim('local test worker, not a provider');
  assert.equal(claimed.job.id, created.body.job.id);
  assert.equal(claimed.job.baseRevision, f.base.id);
  assert.deepEqual(fs.readFileSync(path.join(claimed.workDirectory, 'src/main.tsx')), original);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(claimed.workDirectory, 'package.json'))).devmethod.profile,
    'react-ts',
  );
  assert.deepEqual(fs.readFileSync(path.join(source, 'src/main.tsx')), original);
  assert.equal(f.store.read().jobs.find((job) => job.id === ordinary.id).status, 'queued');
  assert.equal(f.store.read().activeRevision, f.base.id);
  assert.deepEqual(
    fs.readFileSync(ledger),
    ledgerBefore,
    'local queuing and claim must not reset usage',
  );
});

test('duplicate candidate requests and replayed CAS are refused without mutating state', async (t) => {
  const f = await fixture(t);
  const view = await f.get();
  assert.equal(view.status, 200);
  const first = await f.post(input(view.body));
  assert.equal(first.status, 200, JSON.stringify(first.body));
  const before = f.store.read();
  assert.equal((await f.post(input(view.body))).status, 409);
  const current = await f.get();
  assert.equal(current.status, 200);
  assert.equal(current.body.canRequest, false);
  assert.equal((await f.post(input(current.body))).status, 409);
  assert.deepEqual(f.store.read(), before);
});

test('disk source changes invalidate a prepared request without a state-version change', async (t) => {
  const f = await fixture(t);
  const review = await f.get();
  assert.equal(review.status, 200);
  const before = f.store.read();
  fs.appendFileSync(
    path.join(f.root, 'revisions', f.revision.id, 'app/index.html'),
    '<p>Changed outside state</p>',
  );
  assert.equal((await f.post(input(review.body))).status, 409);
  assert.deepEqual(f.store.read(), before);
});

test('claim refuses a queued candidate request after its context changes', async (t) => {
  const f = await fixture(t);
  const review = await f.get();
  assert.equal(review.status, 200);
  const created = await f.post(input(review.body));
  assert.equal(created.status, 200, JSON.stringify(created.body));
  f.commit((state) => {
    state.brief.criteria = [{ id: 'changed', text: 'A new criterion' }];
  });
  const before = f.store.read();
  assert.throws(() => f.jobs.claim('must not receive stale work'));
  assert.deepEqual(f.store.read(), before);
  assert.equal(fs.existsSync(path.join(f.root, 'work', created.body.job.id)), false);
});

test('claim refuses candidate sources altered after the request was queued', async (t) => {
  const f = await fixture(t);
  const view = await f.get();
  assert.equal(view.status, 200);
  const created = await f.post(input(view.body));
  assert.equal(created.status, 200, JSON.stringify(created.body));
  fs.appendFileSync(
    path.join(f.root, 'revisions', f.revision.id, 'app/index.html'),
    '<p>Untracked alteration</p>',
  );
  const before = f.store.read();
  assert.throws(() => f.jobs.claim('must not copy tampered sources'));
  assert.deepEqual(f.store.read(), before);
});

test('HTTP candidate request refuses worker authority, foreign origin and client-supplied provenance', async (t) => {
  const f = await fixture(t);
  const view = await f.get();
  assert.equal(view.status, 200);
  const before = f.store.read();
  for (const [label, headers] of [
    ['worker bearer', { Authorization: 'Bearer ' + f.runtime.token }],
    ['foreign origin', { Origin: 'https://foreign.invalid' }],
  ]) {
    assert.equal((await f.post(input(view.body), headers)).status, 403, label);
  }
  for (const extra of [
    { source: 'user' },
    { baseRevision: f.revision.id },
    { candidateRequest: { sourceRevision: f.revision.id } },
  ]) {
    assert.equal((await f.post({ ...input(view.body), ...extra })).status, 400);
  }
  assert.deepEqual(f.store.read(), before);
});

test('a current version cannot make an old review key authorize changed criteria', async (t) => {
  const f = await fixture(t);
  const view = await f.get();
  assert.equal(view.status, 200);
  f.commit((state) => {
    state.brief.criteria = [{ id: 'revised', text: 'Changed scope after review' }];
  });
  const before = f.store.read();
  assert.equal((await f.post({ ...input(view.body), version: before.version })).status, 409);
  assert.deepEqual(f.store.read(), before);
});

test('claim rejects a candidate request whose active base changed after queuing', async (t) => {
  const f = await fixture(t);
  const view = await f.get();
  assert.equal(view.status, 200);
  const created = await f.post(input(view.body));
  assert.equal(created.status, 200, JSON.stringify(created.body));
  f.commit((state) => {
    state.activeRevision = null;
  });
  const before = f.store.read();
  assert.throws(() => f.jobs.claim('must not receive work from a stale base'));
  assert.deepEqual(f.store.read(), before);
});
