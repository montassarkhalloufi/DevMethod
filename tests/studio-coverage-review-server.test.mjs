import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { startStudio } from '../scripts/studio/server.mjs';
import { updateProject, queueRequest } from '../scripts/studio/domain.mjs';
import { configureBrowserVerification } from '../scripts/studio/browser-configuration.mjs';
import { readBrowserScenarios } from '../scripts/studio/browser-scenarios.mjs';
import { captureBusinessCriteria } from '../scripts/studio/quality-criteria.mjs';
import { qualitySnapshot, writeQualityRun } from '../scripts/studio/quality-storage.mjs';

// Synthetic journal fixture for HTTP authority and binding only. No browser,
// provider or human assessment is exercised or claimed by these tests.
async function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'coverage-http-fixture-'));
  const studio = await startStudio({ workspace: root, port: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  studio.store.commit(studio.store.read().version, (state) => {
    updateProject(state, {
      name: 'Synthetic coverage HTTP fixture',
      idea: 'Retain a saved value',
      mode: 'delegated',
      constraints: [],
    });
    state.brief.criteria = [{ id: 'durable', text: 'The saved value survives a restart.' }];
    queueRequest(state, { request: 'Create a synthetic protocol fixture' });
  });
  const claim = studio.jobs.claim('controlled-fixture-worker');
  fs.writeFileSync(
    path.join(claim.workDirectory, 'index.html'),
    '<!doctype html><input aria-label="Value"><button>Save</button>',
  );
  const manifest = {
    schemaVersion: 1,
    scenarios: [
      {
        id: 'save',
        title: 'Synthetic persistence scenario',
        criterionIds: ['durable'],
        steps: [
          { action: 'fill', target: { role: 'textbox', name: 'Value' }, value: '{{nonce}}' },
          { action: 'click', target: { role: 'button', name: 'Save' } },
          { action: 'restart' },
          { action: 'expectValue', target: { role: 'textbox', name: 'Value' }, value: '{{nonce}}' },
        ],
      },
    ],
  };
  fs.writeFileSync(
    path.join(claim.workDirectory, 'devmethod.browser.json'),
    JSON.stringify(manifest),
  );
  const { revision } = await studio.jobs.finish(
    { jobId: claim.job.id, title: 'Synthetic coverage candidate' },
    { deferActivation: true },
  );
  const configuration = configureBrowserVerification(studio.store, {
    version: 0,
    enabled: true,
    automatic: false,
    channel: 'chrome',
  });
  const snapshot = qualitySnapshot(studio.store, revision);
  const protocol = readBrowserScenarios(snapshot);
  const date = new Date().toISOString();
  const receipt = {
    schemaVersion: 1,
    id: randomUUID(),
    checkId: 'business-browser',
    source: { kind: 'studio-adapter' },
    title: 'Synthetic receipt; not an actual browser execution',
    revisionId: revision.id,
    fingerprint: snapshot.fingerprint,
    status: 'passed',
    protocol: 'studio-browser-v1',
    tool: 'Controlled fixture',
    toolVersion: '1.63.0',
    environment: 'Synthetic HTTP fixture',
    expected: 'Synthetic declared persistence assertion',
    observed: 'Synthetic result for authority tests only.',
    startedAt: date,
    finishedAt: date,
    findings: [],
    events: [],
    limits: ['Synthetic receipt: no real browser or human validation.'],
    browserConfigurationVersion: configuration.version,
    browserConfigurationId: configuration.configurationId,
    browserChannel: configuration.channel,
    browserDriverVersion: configuration.driverVersion,
    reportedCriterionIds: ['durable'],
    businessCriteria: captureBusinessCriteria(studio.store.read()),
    browser: {
      protocol: 'studio-browser-v1',
      driverVersion: '1.63.0',
      browserVersion: 'synthetic-fixture',
      channel: 'chrome',
      sourceFingerprint: snapshot.fingerprint,
      manifestFingerprint: protocol.manifestFingerprint,
      scenarios: [
        {
          id: 'save',
          title: manifest.scenarios[0].title,
          criterionIds: ['durable'],
          status: 'passed',
          executedSteps: 4,
          assertions: [{ step: 4, action: 'expectValue', status: 'passed' }],
        },
      ],
    },
  };
  writeQualityRun(studio.store, receipt);
  const runtime = studio.runtime();
  const get = async ({ revisionId = revision.id, receiptId = receipt.id, headers } = {}) => {
    const response = await fetch(
      runtime.url +
        '/api/coverage-review?' +
        new URLSearchParams({ revision: revisionId, receipt: receiptId }),
      { headers },
    );
    return { status: response.status, body: await response.json() };
  };
  const review = async () => {
    const response = await get();
    assert.equal(response.status, 200, JSON.stringify(response.body));
    return response.body;
  };
  const post = async (input, headers = { Origin: runtime.url }) => {
    const response = await fetch(runtime.url + '/api/coverage-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(input),
    });
    return { status: response.status, body: await response.json() };
  };
  return { root, studio, revision, receipt, manifest, snapshot, runtime, review, get, post };
}

function input(view) {
  return {
    version: view.version,
    revisionId: view.revision.id,
    receiptId: view.receipt.id,
    reviewKey: view.reviewKey,
    criterionId: 'durable',
    scenarioIds: ['save'],
    conclusion: 'sufficient',
    scope: 'Only the declared local restart scenario.',
    reason: 'Controlled HTTP fixture decision; no human acceptance claimed.',
  };
}

test('HTTP coverage reads exact steps without consent, then records only an explicit scoped user assessment', async (t) => {
  const f = await fixture(t);
  const before = f.studio.store.read(),
    agent = f.studio.runtime().agent;
  const view = await f.review();
  assert.equal(view.version, before.version);
  assert.deepEqual(view.revision, { id: f.revision.id, title: f.revision.title });
  assert.equal(view.receipt.id, f.receipt.id);
  assert.equal(view.receipt.status, 'passed');
  assert.equal(view.receipt.freshness, 'current');
  assert.equal(view.receipt.protocol, 'studio-browser-v1');
  assert.equal(view.receipt.driverVersion, '1.63.0');
  assert.equal(view.receipt.browserVersion, 'synthetic-fixture');
  assert.equal(view.canReview, true);
  assert.deepEqual(view.criteria, before.brief.criteria);
  assert.deepEqual(view.scenarios[0].steps, f.manifest.scenarios[0].steps);
  assert.deepEqual(view.scenarios[0].assertions, f.receipt.browser.scenarios[0].assertions);
  assert.equal(view.scenarios[0].canCover, true);
  assert.deepEqual(view.reviews, []);
  assert.deepEqual(f.studio.store.read(), before);
  const request = input(view);
  const saved = await f.post(request);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  const decision = saved.body.decision;
  assert.equal(decision.source, 'user');
  assert.equal(decision.reason, request.reason);
  const coverage = decision.coverage;
  assert.equal(coverage.schemaVersion, 1);
  for (const key of ['revisionId', 'receiptId', 'reviewKey', 'scenarioIds', 'conclusion', 'scope'])
    assert.deepEqual(coverage[key], request[key]);
  assert.equal(coverage.fingerprint, f.snapshot.fingerprint);
  assert.equal(coverage.manifestFingerprint, f.receipt.browser.manifestFingerprint);
  assert.equal(coverage.criteriaFingerprint, f.receipt.businessCriteria.fingerprint);
  assert.deepEqual(coverage.criterion, before.brief.criteria[0]);
  assert.match(coverage.receiptFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(coverage.protocol, 'studio-browser-v1');
  assert.equal(coverage.driverVersion, '1.63.0');
  assert.equal(coverage.browserVersion, 'synthetic-fixture');
  assert.ok(Number.isFinite(Date.parse(coverage.createdAt)));
  const state = f.studio.store.read();
  assert.equal(state.version, before.version + 1);
  assert.deepEqual(state.decisions.at(-1), decision);
  for (const key of ['jobs', 'checks', 'activeRevision', 'project'])
    assert.deepEqual(state[key], before[key]);
  assert.deepEqual(f.studio.runtime().agent, agent);
  const reviewed = (await f.review()).reviews.find((entry) => entry.decisionId === decision.id);
  for (const key of ['criterionId', 'conclusion', 'scope', 'reason', 'scenarioIds'])
    assert.deepEqual(reviewed[key], request[key]);
  assert.equal(reviewed.freshness, 'current');
});

function rawHostRequest(url, method, payload) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      url,
      {
        method,
        headers: {
          Host: 'foreign.invalid',
          Origin: new URL(url).origin,
          'Content-Type': 'application/json',
        },
      },
      (response) => {
        response.resume();
        response.once('end', () => resolve(response.statusCode));
        response.once('error', reject);
      },
    );
    request.once('error', reject);
    request.end(payload === undefined ? undefined : JSON.stringify(payload));
  });
}

test('HTTP coverage rejects worker credentials, foreign origin and Host without mutation', async (t) => {
  const f = await fixture(t),
    request = input(await f.review());
  const before = f.studio.store.read();
  for (const [label, headers] of [
    ['worker token without origin', { Authorization: 'Bearer ' + f.runtime.token }],
    [
      'worker token with same origin',
      { Origin: f.runtime.url, Authorization: 'Bearer ' + f.runtime.token },
    ],
    ['foreign origin', { Origin: 'https://foreign.invalid' }],
  ])
    assert.equal((await f.post(request, headers)).status, 403, label);
  // fetch may normalize Host; raw HTTP preserves the adversarial header on the wire.
  assert.equal(
    await rawHostRequest(f.runtime.url + '/api/coverage-review', 'POST', request),
    403,
    'foreign Host on POST',
  );
  assert.equal(
    await rawHostRequest(
      f.runtime.url +
        '/api/coverage-review?' +
        new URLSearchParams({ revision: f.revision.id, receipt: f.receipt.id }),
      'GET',
    ),
    403,
    'foreign Host on GET',
  );
  assert.deepEqual(f.studio.store.read(), before);
});

test('HTTP coverage refuses unexpected authority fields and incomplete decisions', async (t) => {
  const f = await fixture(t),
    request = input(await f.review());
  const before = f.studio.store.read();
  for (const bad of [
    { ...request, activate: true },
    { ...request, source: 'user' },
    { ...request, allowExternal: true },
    { ...request, approved: true },
    { ...request, reviewKey: undefined },
    { ...request, reason: ' ' },
    { ...request, scope: ' ' },
    { ...request, conclusion: 'approved' },
    { ...request, scenarioIds: [] },
    null,
    [],
  ])
    assert.equal((await f.post(bad)).status, 400, JSON.stringify(bad));
  assert.deepEqual(f.studio.store.read(), before);
});

test('HTTP coverage reports unknown revision and receipt identities without fallback', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.get({ revisionId: randomUUID() })).status, 404);
  assert.equal((await f.get({ receiptId: randomUUID() })).status, 404);
});

for (const changed of ['criteria', 'source', 'receipt'])
  test(`HTTP coverage rejects an open review after ${changed} changes`, async (t) => {
    const f = await fixture(t),
      request = input(await f.review());
    const before = f.studio.store.read();
    if (changed === 'criteria')
      f.studio.store.commit(before.version, (state) => {
        state.brief.criteria[0].text = 'A changed requirement';
      });
    if (changed === 'source')
      fs.appendFileSync(
        path.join(f.root, 'revisions', f.revision.id, 'app/index.html'),
        '<p>Changed bytes</p>',
      );
    if (changed === 'receipt') {
      f.receipt.observed = 'Changed synthetic receipt after the review was opened.';
      f.receipt.browser.browserVersion = 'different-synthetic-fixture';
      writeQualityRun(f.studio.store, f.receipt);
    }
    if (changed !== 'criteria')
      assert.equal(
        f.studio.store.read().version,
        before.version,
        'Source and journal changes do not increment Studio state',
      );
    const current = f.studio.store.read();
    const response = await f.post(request);
    assert.equal(response.status, 409, JSON.stringify(response.body));
    assert.deepEqual(f.studio.store.read(), current);
  });

for (const conclusion of ['partial', 'irrelevant'])
  test(`HTTP coverage preserves a ${conclusion} assessment without turning it into sufficiency`, async (t) => {
    const f = await fixture(t),
      request = { ...input(await f.review()), conclusion };
    const saved = await f.post(request);
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    assert.equal(saved.body.decision.coverage.conclusion, conclusion);
    const review = (await f.review()).reviews.find(
      (entry) => entry.decisionId === saved.body.decision.id,
    );
    assert.equal(review.conclusion, conclusion);
    assert.equal(f.studio.store.read().activeRevision, null);
  });
