import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { startStudio } from '../scripts/studio/server.mjs';
import { activateRevision, updateProject, queueRequest } from '../scripts/studio/domain.mjs';
import { configureBrowserVerification } from '../scripts/studio/browser-configuration.mjs';

// Real local syntax admission, synthetic application only: no browser/provider/human proof.
async function fixture(t, script = 'const title = "candidate";') {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'intervention-http-'));
  const studio = await startStudio({ workspace: root, port: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  studio.store.commit(studio.store.read().version, (state) => {
    updateProject(state, {
      name: 'Intervention fixture',
      idea: 'Retain a value',
      mode: 'delegated',
      constraints: [],
    });
    state.brief.criteria = [{ id: 'save', text: 'Retain a saved value after restart' }];
  });
  const revisions = [];
  for (const label of ['base', 'candidate']) {
    studio.store.commit(studio.store.read().version, (state) =>
      queueRequest(state, { request: `Create ${label}` }),
    );
    const claim = studio.jobs.claim('fixture-worker');
    fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), `<h1>${label}</h1>`);
    fs.writeFileSync(
      path.join(claim.workDirectory, 'main.js'),
      label === 'base' ? 'const title = "base";' : script,
    );
    const { revision } = await studio.jobs.finish(
      { jobId: claim.job.id, title: label },
      { deferActivation: true },
    );
    revisions.push(revision);
    if (label === 'base')
      studio.store.commit(studio.store.read().version, (state) =>
        activateRevision(state, { id: revision.id, reason: 'Synthetic base fixture' }),
      );
  }
  const [base, revision] = revisions;
  const runtime = studio.runtime();
  const get = async (revisionId = revision.id) => {
    const response = await fetch(
      runtime.url + '/api/intervention-review?' + new URLSearchParams({ revision: revisionId }),
    );
    return { status: response.status, body: await response.json() };
  };
  const review = async () => {
    const result = await get();
    assert.equal(result.status, 200, JSON.stringify(result.body));
    return result.body;
  };
  const post = async (input, headers = { Origin: runtime.url }) => {
    const response = await fetch(runtime.url + '/api/intervention-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(input),
    });
    return { status: response.status, body: await response.json() };
  };
  return { root, studio, runtime, base, revision, get, review, post };
}

const request = (view, overrides = {}) => ({
  version: view.version,
  revisionId: view.revision.id,
  reviewKey: view.reviewKey,
  resolution: 'accept-local',
  assessment: { persistentData: 'not-affected', contractChanged: 'not-affected' },
  scope: 'Synthetic local fixture only',
  reason: 'Test of explicit bounded review, no human proof.',
  ...overrides,
});

function rawHost(url, input) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          Host: 'foreign.invalid',
          Origin: new URL(url).origin,
          'Content-Type': 'application/json',
        },
      },
      (response) => {
        response.resume();
        response.on('end', () => resolve(response.statusCode));
      },
    );
    req.on('error', reject);
    req.end(JSON.stringify(input));
  });
}

test('HTTP intervention binds candidate and base, records interpretation without operational effects', async (t) => {
  const f = await fixture(t);
  const before = f.studio.store.read(),
    runtimeBefore = f.studio.runtime().agent;
  const dataFile = path.join(f.root, '.devmethod/data.json');
  const dataBefore = fs.readFileSync(dataFile);
  const view = await f.review();
  assert.equal(view.revision.id, f.revision.id);
  assert.equal(view.base.id, f.base.id);
  assert.equal(view.control.graph.revisionId, f.revision.id);
  assert.equal(view.canReview, true);
  assert.match(view.reviewKey, /^[a-f0-9]{64}$/);
  for (const key of ['fingerprint', 'baseFingerprint', 'contextFingerprint'])
    assert.match(view.consequences[key], /^[a-f0-9]{64}$/);
  const input = request(view);
  const result = await f.post(input);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  const { decision, state } = result.body;
  assert.equal(decision.source, 'user');
  assert.equal(decision.reason, input.reason);
  assert.equal(decision.intervention.revisionId, f.revision.id);
  assert.equal(decision.intervention.resolution, input.resolution);
  assert.deepEqual(decision.intervention.assessment, input.assessment);
  assert.deepEqual(state.decisions.slice(0, before.decisions.length), before.decisions);
  for (const key of ['activeRevision', 'jobs', 'checks', 'project', 'revisions'])
    assert.deepEqual(state[key], before[key], key);
  assert.deepEqual(fs.readFileSync(dataFile), dataBefore);
  assert.deepEqual(f.studio.runtime().agent, runtimeBefore);
  assert.equal((await f.post(input)).status, 409, 'a consumed confirmation is stale');
});

test('intervention authority rejects worker, foreign origin and raw foreign Host', async (t) => {
  const f = await fixture(t),
    view = await f.review(),
    before = f.studio.store.read();
  for (const [label, headers] of [
    ['worker', { Authorization: 'Bearer ' + f.runtime.token }],
    [
      'worker with local origin',
      { Authorization: 'Bearer ' + f.runtime.token, Origin: f.runtime.url },
    ],
    ['foreign origin', { Origin: 'https://foreign.invalid' }],
  ])
    assert.equal((await f.post(request(view), headers)).status, 403, label);
  assert.equal(
    await rawHost(f.runtime.url + '/api/intervention-review', request(view)),
    403,
    'raw foreign Host',
  );
  assert.deepEqual(f.studio.store.read(), before);
});

test('strict intervention input refuses missing assessments and forged authority or receipts', async (t) => {
  const f = await fixture(t),
    view = await f.review(),
    input = request(view),
    before = f.studio.store.read();
  for (const [label, value] of [
    ['missing assessment', { ...input, assessment: undefined }],
    ['incomplete assessment', { ...input, assessment: { persistentData: 'unknown' } }],
    [
      'boolean assessment',
      { ...input, assessment: { persistentData: false, contractChanged: false } },
    ],
    [
      'extra assessment authority',
      { ...input, assessment: { ...input.assessment, approved: true } },
    ],
    ['forged receipt', { ...input, receipt: { status: 'passed' } }],
    ['forged source', { ...input, source: 'user' }],
    ['empty scope', { ...input, scope: ' ' }],
    ['missing reason', { ...input, reason: undefined }],
    ['invalid resolution', { ...input, resolution: 'approve-all' }],
    ['invalid version', { ...input, version: '1' }],
  ])
    assert.equal((await f.post(value)).status, 400, label);
  assert.equal((await f.get('unknown')).status, 404);
  assert.equal((await f.post({ ...input, revisionId: 'unknown' })).status, 404);
  assert.equal((await f.post({ ...input, reviewKey: 'f'.repeat(64) })).status, 409);
  assert.deepEqual(f.studio.store.read(), before);
});

for (const change of ['state', 'data', 'candidate', 'base', 'browser']) {
  test(`${change} change invalidates intervention confirmation`, async (t) => {
    const f = await fixture(t),
      view = await f.review();
    if (change === 'state')
      f.studio.store.commit(view.version, (state) => {
        state.brief.criteria[0].text = 'Changed question';
      });
    if (change === 'data')
      fs.writeFileSync(
        path.join(f.root, '.devmethod/data.json'),
        JSON.stringify({ version: 1, data: { unseen: 'mutation' } }),
      );
    if (change === 'candidate' || change === 'base')
      fs.appendFileSync(
        path.join(
          f.root,
          'revisions',
          change === 'base' ? f.base.id : f.revision.id,
          'app/main.js',
        ),
        '\n// outside recorded manifest',
      );
    if (change === 'browser')
      configureBrowserVerification(f.studio.store, {
        version: 0,
        enabled: true,
        automatic: false,
        channel: 'chrome',
      });
    const before = f.studio.store.read();
    if (change !== 'state')
      assert.equal(before.version, view.version, 'disk context changes bypass the state counter');
    assert.equal((await f.post(request(view))).status, 409);
    assert.deepEqual(f.studio.store.read(), before);
    if (change === 'base' || change === 'candidate')
      assert.equal((await f.review()).canReview, false);
  });
}

for (const [label, script, field] of [
  ['persistent storage', 'localStorage.setItem("value", "fixture");', 'persistentData'],
  ['changed fetch contract', 'fetch("/api/changed-contract");', 'contractChanged'],
])
  test(`positive ${label} indication cannot be denied by not-affected assessment`, async (t) => {
    const f = await fixture(t, script),
      view = await f.review(),
      before = f.studio.store.read();
    const input = request(view, {
      assessment: {
        persistentData: 'affected',
        contractChanged: 'affected',
        [field]: 'not-affected',
      },
    });
    assert.equal((await f.post(input)).status, 409);
    assert.deepEqual(f.studio.store.read(), before);
  });
