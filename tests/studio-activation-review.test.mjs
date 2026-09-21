import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { approvePlan, queueRequest, claimJob, finishJob } from '../scripts/studio/domain.mjs';
import { fileManifest } from '../scripts/studio/files.mjs';
import {
  readActivationReview,
  activateReviewedRevision,
} from '../scripts/studio/activation-review.mjs';
import { runProjectQuality } from '../scripts/studio/quality.mjs';
import { exportProject } from '../scripts/studio/bundle.mjs';
import { restoreArchive } from '../scripts/studio/archive.mjs';
import { configureBrowserVerification } from '../scripts/studio/browser-configuration.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'activation-review-'));
  const store = createStudioStore(root);
  fs.writeFileSync(path.join(root, '.devmethod/data.json'), '{}');
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  store.commit(store.read().version, (state) => {
    state.project.idea = 'Save input';
    state.brief.outcome = 'Save input';
    state.brief.criteria = [{ id: 'save', text: 'Retain saved input' }];
    approvePlan(state, { reason: 'Test scope' });
  });
  for (const id of ['first', 'second']) {
    const app = path.join(root, 'revisions', id, 'app');
    fs.mkdirSync(app, { recursive: true });
    fs.writeFileSync(path.join(app, 'index.html'), '<!doctype html><title>Test</title>');
    fs.writeFileSync(path.join(app, 'main.js'), 'const answer = 42;');
    let job;
    store.commit(store.read().version, (state) => {
      job = queueRequest(state, { request: 'Build test candidate' });
    });
    store.commit(store.read().version, (state) => {
      claimJob(state, { worker: 'fixture' });
    });
    store.commit(store.read().version, (state) => {
      finishJob(
        state,
        {
          jobId: job.id,
          revision: {
            id,
            jobId: job.id,
            title: id,
            summary: '',
            createdAt: new Date().toISOString(),
            files: fileManifest(app),
          },
        },
        {
          deferActivation: true,
          checks: [
            {
              label: 'Fixture syntax receipt',
              kind: 'command',
              protocol: 'studio-javascript-syntax-v1',
              status: 'passed',
              command: 'fixture',
            },
            {
              label: 'Fixture document receipt',
              kind: 'command',
              protocol: 'studio-document-syntax-v1',
              status: 'passed',
              command: 'fixture',
            },
          ],
        },
      );
    });
  }
  return { root, store };
}

const request = (view) => ({
  version: view.version,
  id: view.revision.id,
  reviewKey: view.reviewKey,
  reason: 'Adoption locale explicite avec limites examinées',
});

test('changing the local browser configuration invalidates review even without changing the evidence graph', (t) => {
  const { store } = fixture(t);
  configureBrowserVerification(store, { version: 0, enabled: true, channel: 'chrome' });
  const view = readActivationReview(store, { revisionId: 'first' });
  configureBrowserVerification(store, { version: 1, enabled: false, channel: 'msedge' });
  const next = readActivationReview(store, { revisionId: 'first' });
  assert.notEqual(
    next.control.consequences.contextFingerprint,
    view.control.consequences.contextFingerprint,
  );
  assert.deepEqual(next.control, {
    ...view.control,
    consequences: {
      ...view.control.consequences,
      contextFingerprint: next.control.consequences.contextFingerprint,
    },
  });
  assert.notEqual(next.reviewKey, view.reviewKey);
  assert.throws(() => activateReviewedRevision(store, request(view)), { status: 409 });
});

test('exact historical candidate is reviewed, adoption preserves stopped execution and survives archive restore', (t) => {
  const { store, root } = fixture(t);
  const agent = { automatic: false, usageUnknown: true, attempts: 2, maxJobs: 2 };
  const support = { agent };
  const view = readActivationReview(store, { revisionId: 'first', ...support });
  assert.equal(view.control.graph.revisionId, 'first');
  assert.equal(view.canActivate, true);
  assert.equal(view.control.autonomy.action, 'stop');
  assert.equal(
    readActivationReview(store, { revisionId: 'first', ...support }).reviewKey,
    view.reviewKey,
  );
  const { state } = activateReviewedRevision(store, request(view), support);
  assert.equal(state.activeRevision, 'first');
  assert.equal(agent.automatic, false);
  const review = state.decisions.at(-1).review;
  assert.equal(review.revisionId, 'first');
  assert.ok(review.reasons.includes('usage-unknown'));
  assert.ok(!JSON.stringify(review).includes('jobs'));
  const destination = path.join(root, 'restored');
  restoreArchive(exportProject(root, state), destination);
  const restored = createStudioStore(destination);
  try {
    assert.deepEqual(restored.read().decisions.at(-1).review, review);
  } finally {
    restored.close();
  }
});

test('actual quality execution invalidates an open review even when studio version is held constant', async (t) => {
  const { store } = fixture(t);
  const view = readActivationReview(store, { revisionId: 'first' });
  // A real quality adapter persists its journal, without copying its optional legacy check.
  const qualityStore = { root: store.root, read: () => store.read(), commit: () => store.read() };
  await runProjectQuality(qualityStore, 'first', 'source-syntax');
  assert.equal(store.read().version, view.version);
  assert.throws(() => activateReviewedRevision(store, request(view)), { status: 409 });
});

for (const change of ['criteria', 'delegation', 'source', 'revision', 'agent'])
  test(`${change} changes refuse stale adoption`, (t) => {
    const { store, root } = fixture(t);
    const view = readActivationReview(store, { revisionId: 'first' });
    let input = request(view),
      support = {};
    if (change === 'source')
      fs.appendFileSync(path.join(root, 'revisions/first/app/index.html'), 'altered');
    else if (change === 'revision') input = { ...input, id: 'second' };
    else if (change === 'agent') support = { agent: { usageUnknown: true } };
    else
      store.commit(store.read().version, (state) => {
        if (change === 'criteria') state.brief.criteria[0].text = 'Different requirement';
        else state.project.delegation = { adoption: 'agent', structure: 'agent', visual: 'user' };
      });
    assert.throws(() => activateReviewedRevision(store, input, support), { status: 409 });
    assert.equal(store.read().activeRevision, null);
    if (change === 'source')
      assert.equal(readActivationReview(store, { revisionId: 'first' }).canActivate, false);
  });

test('worker completion cannot forge a user adoption review', (t) => {
  const { store } = fixture(t);
  const view = readActivationReview(store, { revisionId: 'first' });
  const adopted = activateReviewedRevision(store, request(view)).state.decisions.at(-1);
  store.commit(store.read().version, (state) => {
    queueRequest(state, { request: 'Inspect' });
  });
  store.commit(store.read().version, (state) => {
    claimJob(state, { worker: 'fixture' });
  });
  assert.throws(
    () =>
      store.commit(store.read().version, (state) =>
        finishJob(state, {
          jobId: state.jobs.at(-1).id,
          decisions: [{ ...adopted, id: 'forged', source: 'agent' }],
        }),
      ),
    /Examen réservé/,
  );
});

test('unresolved tool transport is recorded without becoming an execution permission', (t) => {
  const { store } = fixture(t);
  const support = { liveActions: [{ requestId: 'unknown-request', status: 'unknown' }] };
  const old = readActivationReview(store, { revisionId: 'first' });
  assert.throws(() => activateReviewedRevision(store, request(old), support), { status: 409 });
  const current = readActivationReview(store, { revisionId: 'first', ...support });
  const { state } = activateReviewedRevision(store, request(current), support);
  const review = state.decisions.at(-1).review;
  assert.equal(review.action, 'stop');
  assert.deepEqual(review.riskFactors, [{ id: 'external-outcome-unknown', severity: 'critical' }]);
  assert.equal(
    readActivationReview(store, { revisionId: 'first', ...support }).control.autonomy.action,
    'stop',
  );
  assert.equal(review.evidence[0].provenance, 'studio-executor');
});
