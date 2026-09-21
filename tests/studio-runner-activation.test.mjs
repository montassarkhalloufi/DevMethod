import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setImmediate } from 'node:timers/promises';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { createAgentRunner } from '../scripts/studio/runner.mjs';
import {
  activateRevision,
  discardControlledCandidate,
  queueRequest,
  updateProject,
} from '../scripts/studio/domain.mjs';
import { configureBrowserVerification } from '../scripts/studio/browser-configuration.mjs';
import { qualityAdapters } from '../scripts/studio/quality-adapters.mjs';
import { runProjectQuality } from '../scripts/studio/quality.mjs';
import { readQualityRuns, writeQualityRun } from '../scripts/studio/quality-storage.mjs';
import { readBrowserScenarios } from '../scripts/studio/browser-scenarios.mjs';
import { readCoverageReview, recordCoverageReview } from '../scripts/studio/coverage-review.mjs';
import {
  readInterventionReview,
  recordInterventionReview,
} from '../scripts/studio/intervention-review.mjs';
import { readProjectControl } from '../scripts/studio/control.mjs';

// Real admission, journal, reviews and control. Provider and browser adapter are
// controlled doubles; these tests claim neither browser behavior nor human approval.
async function fixture(
  t,
  { afterControl, usage = { inputTokens: 2, outputTokens: 1 }, alternateBase = false } = {},
) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'runner-activation-'));
  const store = createStudioStore(root),
    jobs = createJobs(store);
  let runner,
    providerCalls = 0,
    revision,
    favorable,
    ledgerBeforeApply;
  t.after(async () => {
    await runner?.close();
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  fs.writeFileSync(
    path.join(root, '.devmethod/data.json'),
    JSON.stringify({ version: 1, data: {} }),
  );
  store.commit(store.read().version, (state) => {
    updateProject(state, {
      name: 'Synthetic activation',
      idea: 'Display a heading',
      mode: 'delegated',
      constraints: [],
    });
    state.brief.criteria = [{ id: 'heading', text: 'Display the expected heading.' }];
  });
  let alternate;
  if (alternateBase) {
    store.commit(store.read().version, (state) =>
      queueRequest(state, { request: 'Prepare historical alternative' }),
    );
    const claim = jobs.claim('fixture-preparation');
    fs.writeFileSync(
      path.join(claim.workDirectory, 'index.html'),
      '<h1>Historical alternative</h1>',
    );
    alternate = (
      await jobs.finish(
        { jobId: claim.job.id, title: 'Historical alternative' },
        { deferActivation: true },
      )
    ).revision;
  }
  configureBrowserVerification(store, {
    version: 0,
    enabled: true,
    automatic: false,
    channel: 'chrome',
  });
  t.mock.method(qualityAdapters, 'browser', async (snapshot) => {
    const manifest = readBrowserScenarios(snapshot);
    return {
      status: 'passed',
      observed: 'Synthetic browser adapter result for orchestration only.',
      findings: [],
      limits: ['No real browser or human proof.'],
      browser: {
        protocol: 'studio-browser-v1',
        driverVersion: '1.63.0',
        browserVersion: 'controlled-fixture',
        channel: 'chrome',
        sourceFingerprint: snapshot.fingerprint,
        manifestFingerprint: manifest.manifestFingerprint,
        scenarios: [
          {
            id: 'heading',
            title: 'Controlled heading',
            criterionIds: ['heading'],
            status: 'passed',
            executedSteps: 1,
            assertions: [{ step: 1, action: 'expectVisible', status: 'passed' }],
          },
        ],
      },
    };
  });
  const ledgerFile = path.join(root, '.devmethod/agent.json');
  const originalFinish = jobs.finish.bind(jobs);
  t.mock.method(jobs, 'finish', async (...args) => {
    const completed = await originalFinish(...args);
    revision = completed.revision;
    await runProjectQuality(store, revision.id, 'business-browser');
    const receipt = readQualityRuns(store).find((run) => run.checkId === 'business-browser');
    const coverage = readCoverageReview(store, { revisionId: revision.id, receiptId: receipt.id });
    recordCoverageReview(store, {
      version: coverage.version,
      revisionId: revision.id,
      receiptId: receipt.id,
      reviewKey: coverage.reviewKey,
      criterionId: 'heading',
      scenarioIds: ['heading'],
      conclusion: 'sufficient',
      scope: 'Synthetic heading only',
      reason: 'Controlled API interpretation, not human proof.',
    });
    const view = readInterventionReview(store, { revisionId: revision.id });
    recordInterventionReview(store, {
      version: view.version,
      revisionId: revision.id,
      reviewKey: view.reviewKey,
      resolution: 'accept-local',
      assessment: { persistentData: 'not-affected', contractChanged: 'not-affected' },
      scope: 'Local fixture',
      reason: 'Controlled local consequence interpretation.',
    });
    favorable = readProjectControl(
      store,
      runner.status(),
      completed.job?.id,
      undefined,
      revision.id,
    );
    ledgerBeforeApply = fs.readFileSync(ledgerFile);
    return { ...completed, state: store.read() };
  });
  const commit = store.commit.bind(store);
  let injected = false;
  t.mock.method(store, 'commit', (version, mutate) => {
    const result = commit(version, mutate);
    const controlled = result.jobs.find(
      (job) => revision && job.control?.revisionId === revision.id,
    );
    if (!injected && controlled) {
      injected = true;
      afterControl?.({ store, revision, alternate, job: controlled, commit });
    }
    return result;
  });
  runner = createAgentRunner({
    store,
    jobs,
    options: { maxJobs: 5 },
    execute: async ({ directory }) => {
      providerCalls++;
      fs.writeFileSync(
        path.join(directory, 'app/index.html'),
        '<!doctype html><h1>Fixture heading</h1>',
      );
      fs.writeFileSync(
        path.join(directory, 'app/devmethod.browser.json'),
        JSON.stringify({
          schemaVersion: 1,
          scenarios: [
            {
              id: 'heading',
              title: 'Controlled heading',
              criterionIds: ['heading'],
              steps: [
                { action: 'expectVisible', target: { role: 'heading', name: 'Fixture heading' } },
              ],
            },
          ],
        }),
      );
      return {
        ok: true,
        result: { title: 'Controlled candidate', summary: 'Provider fixture only' },
        usage,
      };
    },
  });
  const queue = () => {
    let job;
    store.commit(store.read().version, (state) => {
      job = queueRequest(state, { request: 'Create candidate' });
    });
    return job;
  };
  return {
    root,
    store,
    jobs,
    runner,
    queue,
    get revision() {
      return revision;
    },
    get favorable() {
      return favorable;
    },
    get calls() {
      return providerCalls;
    },
    ledger: () => fs.readFileSync(ledgerFile),
    get ledgerBeforeApply() {
      return ledgerBeforeApply;
    },
  };
}

async function settled(runner) {
  for (let turns = 0; runner.status().running; turns++) {
    assert.ok(turns < 100000, 'controlled runner must settle');
    await setImmediate();
  }
}

test('runner consumes a genuinely favorable control once without rewriting history or admitting another provider call', async (t) => {
  const f = await fixture(t);
  f.queue();
  f.runner.wake();
  await settled(f.runner);
  assert.equal(f.favorable.autonomy.action, 'continue');
  assert.equal(f.favorable.autonomy.operation, 'activate');
  const state = f.store.read();
  assert.equal(state.activeRevision, f.revision.id);
  assert.equal(state.jobs[0].status, 'ready');
  assert.equal(state.jobs[0].control.action, 'continue');
  assert.equal(state.jobs[0].control.operation, 'activate');
  const adoption = state.decisions.filter((decision) => decision.topic === 'Version active');
  assert.equal(adoption.length, 1);
  assert.equal(adoption[0].source, 'agent');
  assert.deepEqual(f.ledger(), f.ledgerBeforeApply);
  f.runner.wake();
  await settled(f.runner);
  assert.deepEqual(f.store.read(), state);
  assert.equal(f.calls, 1);
});

for (const change of ['delegation', 'receipt', 'held', 'base']) {
  test(`fresh ${change} barrier after favorable control prevents application and dispatch of a waiting request`, async (t) => {
    const f = await fixture(t, {
      alternateBase: change === 'base',
      afterControl: ({ store, revision, alternate, commit }) => {
        if (change === 'base')
          commit(store.read().version, (state) =>
            activateRevision(state, {
              id: alternate.id,
              reason: 'Concurrent explicit selection of another base',
            }),
          );
        if (change === 'delegation')
          commit(store.read().version, (state) => {
            state.project.delegation = { structure: 'agent', adoption: 'user', visual: 'agent' };
          });
        if (change === 'receipt') {
          const receipt = readQualityRuns(store).find((run) => run.checkId === 'business-browser');
          writeQualityRun(store, {
            ...receipt,
            observed: 'Changed evidence after the favorable verdict',
          });
        }
        if (change === 'held') {
          const view = readInterventionReview(store, { revisionId: revision.id });
          recordInterventionReview(store, {
            version: view.version,
            revisionId: revision.id,
            reviewKey: view.reviewKey,
            resolution: 'keep-stopped',
            assessment: { persistentData: 'unknown', contractChanged: 'unknown' },
            scope: 'Controlled stop',
            reason: 'Stop after the verdict.',
          });
        }
      },
    });
    f.queue();
    f.runner.wake();
    await settled(f.runner);
    assert.equal(
      f.favorable.autonomy.operation,
      'activate',
      'setup must have produced a real favorable verdict',
    );
    assert.notEqual(f.store.read().activeRevision, f.revision.id);
    assert.deepEqual(f.ledger(), f.ledgerBeforeApply);
    const queued = f.queue();
    f.runner.wake();
    await settled(f.runner);
    assert.equal(f.calls, 1, 'a historical continue recommendation is not a resolved candidate');
    assert.equal(f.store.read().jobs.find((job) => job.id === queued.id).status, 'queued');
    assert.equal(
      f.store.read().jobs.find((job) => job.id === f.revision.jobId).control.operation,
      'activate',
      'historical control is immutable',
    );
  });
}

test('unknown provider usage cannot be overridden by otherwise sufficient local reviews', async (t) => {
  const f = await fixture(t, { usage: null });
  f.queue();
  f.runner.wake();
  await settled(f.runner);
  assert.equal(f.runner.status().usageUnknown, true);
  assert.ok(f.favorable.autonomy.reasons.includes('usage-unknown'));
  assert.equal(f.store.read().activeRevision, null);
  const queued = f.queue();
  f.runner.wake();
  await settled(f.runner);
  assert.equal(f.calls, 1);
  assert.equal(f.store.read().jobs.find((job) => job.id === queued.id).status, 'queued');
  assert.deepEqual(f.ledger(), f.ledgerBeforeApply);
});

test('explicitly discarding an unapplied continue/activate releases preserved requests without resetting usage', async (t) => {
  const f = await fixture(t, {
    afterControl: ({ store }) => {
      const receipt = readQualityRuns(store).find((run) => run.checkId === 'business-browser');
      writeQualityRun(store, { ...receipt, observed: 'Receipt changed before activation' });
    },
  });
  const parent = f.queue();
  f.runner.wake();
  await settled(f.runner);
  const parentControl = f.store.read().jobs.find((job) => job.id === parent.id).control;
  assert.equal(parentControl.action, 'continue');
  assert.equal(parentControl.operation, 'activate');
  assert.equal(f.store.read().activeRevision, null);
  const pending = f.queue();
  f.runner.wake();
  await settled(f.runner);
  assert.equal(f.calls, 1);
  assert.equal(f.store.read().jobs.find((job) => job.id === pending.id).status, 'queued');
  const ledgerBefore = f.ledger();
  const correctionState = f.store.read();
  correctionState.jobs.find((job) => job.id === parent.id).control.operation = 'correct';
  assert.throws(() =>
    discardControlledCandidate(correctionState, {
      jobId: parent.id,
      reason: 'A queued correction is not an unapplied adoption',
    }),
  );
  f.store.commit(f.store.read().version, (state) =>
    discardControlledCandidate(state, {
      jobId: parent.id,
      reason: 'Explicitly set aside this unadopted fixture candidate',
    }),
  );
  assert.deepEqual(f.ledger(), ledgerBefore, 'discard itself does not modify the provider ledger');
  assert.equal(f.calls, 1, 'the local decision itself does not invoke a provider');
  assert.equal(f.store.read().activeRevision, null);
  const discarded = f.store.read().decisions.at(-1);
  assert.equal(discarded.source, 'user');
  assert.equal(discarded.topic, `control:${parent.id}`);
  f.runner.wake();
  await settled(f.runner);
  const after = f.store.read();
  assert.equal(f.calls, 2, 'exactly the preserved request runs after the explicit action');
  assert.equal(after.jobs.find((job) => job.id === pending.id).status, 'ready');
  assert.equal(after.jobs.find((job) => job.id === pending.id).baseRevision, pending.baseRevision);
  assert.deepEqual(after.jobs.find((job) => job.id === parent.id).control, parentControl);
  const ledgerAfter = JSON.parse(f.ledger()),
    ledgerEarlier = JSON.parse(ledgerBefore);
  assert.equal(ledgerAfter.attempts, ledgerEarlier.attempts + 1);
  assert.equal(ledgerAfter.knownTokens, ledgerEarlier.knownTokens + 3);
  assert.deepEqual(ledgerAfter.runs.slice(0, ledgerEarlier.runs.length), ledgerEarlier.runs);
});
