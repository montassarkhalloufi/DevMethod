import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { setImmediate, setTimeout as delay } from 'node:timers/promises';
import { createStudioStore } from '../scripts/studio/store.mjs';
import {
  createMcpActionsStore,
  mcpActionFingerprint,
} from '../scripts/studio/mcp-actions-store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { queueRequest, updateProject } from '../scripts/studio/domain.mjs';
import { createAgentRunner } from '../scripts/studio/runner.mjs';
import { configureBrowserVerification } from '../scripts/studio/browser-configuration.mjs';
import { qualityAdapters } from '../scripts/studio/quality-adapters.mjs';
import { readControlQuality } from '../scripts/studio/quality-evidence.mjs';

// Controlled provider and quality services: orchestration tests, no LLM or browser execution.
function fixture(t, changes = {}) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'runner-browser-'));
  const store = createStudioStore(root);
  store.commit(store.read().version, (state) =>
    updateProject(state, {
      name: 'Fixture',
      idea: 'Save input',
      mode: 'delegated',
      constraints: [],
    }),
  );
  const jobs = createJobs(store);
  let runner,
    calls = 0,
    reads = 0,
    providers = 0,
    evidence = null;
  let config = {
    version: 1,
    configurationId: randomUUID(),
    enabled: true,
    automatic: true,
    channel: 'chrome',
    driverAvailable: true,
    driverVersion: '1.63.0',
    ...changes.configuration,
  };
  let actions = [];
  const report = (revisionId) => ({
    revisionId,
    fingerprint: 'fixture-fingerprint',
    localChanges: false,
    checks: [{ id: 'business-browser', canRun: changes.canRun !== false, evidence }],
  });
  const quality = {
    readBrowserConfiguration: () => ({ ...config }),
    readProjectQuality: async (_store, revisionId) => {
      reads++;
      await changes.read?.({ revisionId, store });
      return report(revisionId);
    },
    runProjectQuality: async (_store, revisionId, checkId, options) => {
      calls++;
      assert.equal(checkId, 'business-browser');
      assert.equal(store.read().activeRevision, null);
      assert.equal(store.read().jobs.at(-1).status, 'ready');
      assert.equal(store.read().jobs.at(-1).control, undefined);
      await changes.run?.({ options, revisionId, store });
      evidence = receipt(revisionId, changes.resultStatus ?? 'passed');
      return report(revisionId);
    },
  };
  runner = createAgentRunner({
    store,
    jobs,
    options: { maxJobs: 1, ...changes.options },
    browserQuality: changes.realQuality ? undefined : quality,
    getLiveActions: () => actions,
    execute: async ({ directory }) => {
      providers++;
      fs.writeFileSync(
        path.join(directory, 'app/index.html'),
        '<!doctype html><h1>Controlled candidate</h1>',
      );
      await changes.execute?.({ store, directory });
      return {
        ok: true,
        result: { title: 'Candidate', summary: 'Controlled fixture' },
        usage: { inputTokens: 1, outputTokens: 1 },
      };
    },
  });
  t.after(async () => {
    await runner.close();
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  return {
    root,
    store,
    runner,
    quality,
    report,
    get calls() {
      return calls;
    },
    get reads() {
      return reads;
    },
    get providers() {
      return providers;
    },
    config: (value) => {
      config = { ...config, ...value };
    },
    actions: (value) => {
      actions = value;
    },
    evidence: (value) => {
      evidence = value;
    },
    queue() {
      store.commit(store.read().version, (state) =>
        queueRequest(state, { request: 'Build fixture' }),
      );
      runner.wake();
    },
  };
}

function receipt(revisionId, status) {
  return {
    id: randomUUID(),
    revisionId,
    checkId: 'business-browser',
    source: { kind: 'studio-adapter' },
    freshness: 'current',
    fingerprint: 'fixture-fingerprint',
    status,
    finishedAt: new Date().toISOString(),
  };
}

async function settled(runner) {
  const deadline = Date.now() + 5000;
  while (runner.status().running) {
    assert.ok(Date.now() < deadline, 'Controlled runner settles');
    await setImmediate();
  }
}

test('runner verifies its exact completed candidate after provider budget closes and before final control', async (t) => {
  const f = fixture(t);
  f.queue();
  await settled(f.runner);
  assert.equal(f.calls, 1);
  const state = f.store.read(),
    verification = f.runner.status().verification;
  assert.equal(verification.revisionId, state.revisions[0].id);
  assert.equal(verification.jobId, state.jobs[0].id);
  assert.equal(verification.status, 'passed');
  assert.ok(verification.receiptId);
  assert.equal(f.providers, 1);
  assert.equal(f.runner.status().attempts, 1);
  assert.equal(f.runner.status().knownTokens, 2);
  assert.equal(state.activeRevision, null);
  assert.equal(state.jobs[0].control.action, 'stop');
  assert.ok(state.jobs[0].control.reasons.includes('budget-closed'));
});

for (const configuration of [
  { automatic: false },
  { enabled: false },
  { configurationId: null },
  { driverAvailable: false },
])
  test(`automatic browser opt-in is required: ${JSON.stringify(configuration)}`, async (t) => {
    const f = fixture(t, { configuration });
    f.queue();
    await settled(f.runner);
    assert.equal(f.calls, 0);
    assert.equal(f.reads, 0);
    assert.equal(f.runner.status().verification, null);
    assert.equal(f.providers, 1);
  });

test('missing or invalid scenario contract remains blocked without quality dispatch', async (t) => {
  const f = fixture(t, { canRun: false });
  f.queue();
  await settled(f.runner);
  assert.equal(f.calls, 0);
  assert.equal(f.runner.status().verification.status, 'blocked');
  assert.equal(f.store.read().activeRevision, null);
});

for (const status of ['passed', 'failed', 'blocked'])
  test(`a current terminal ${status} receipt for the exact question is reused`, async (t) => {
    let saved;
    const f = fixture(t, {
      read: ({ revisionId }) => {
        saved = receipt(revisionId, status);
        f.evidence(saved);
      },
    });
    f.queue();
    await settled(f.runner);
    assert.equal(f.calls, 0);
    assert.equal(f.runner.status().verification.status, status);
    assert.equal(f.runner.status().verification.receiptId, saved.id);
  });

test('an obsolete or host-attested receipt cannot replace a new Studio check', async (t) => {
  for (const altered of [
    { freshness: 'reevaluate' },
    { source: { kind: 'host-attested' } },
    { finishedAt: null },
  ]) {
    const f = fixture(t, {
      read: ({ revisionId }) => f.evidence({ ...receipt(revisionId, 'passed'), ...altered }),
    });
    f.queue();
    await settled(f.runner);
    assert.equal(f.calls, 1);
  }
});

test('configuration is revalidated after awaiting quality discovery before dispatch', async (t) => {
  const f = fixture(t, { read: () => f.config({ automatic: false }) });
  f.queue();
  await settled(f.runner);
  assert.equal(f.calls, 0);
  assert.equal(f.runner.status().verification.status, 'blocked');
  assert.deepEqual(f.store.read().jobs[0].control.reasons, ['interrupted']);
});

function toolEntry(f, status) {
  const entry = {
    requestId: randomUUID(),
    jobId: f.store.read().jobs[0].id,
    baseRevision: null,
    connectionId: randomUUID(),
    connectionVersion: 1,
    toolName: 'fixture.read',
    inputSchemaFingerprint: 'a'.repeat(64),
    contractFingerprint: 'b'.repeat(64),
    arguments: {},
    status,
    isError: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 600000).toISOString(),
  };
  entry.fingerprint = mcpActionFingerprint(entry);
  createMcpActionsStore(f.root, Date.now).save(entry);
}

for (const toolStatus of ['pending', 'executing', 'completed', 'unknown'])
  test(`tool ${toolStatus} after delivery prevents automatic browser dispatch`, async (t) => {
    const f = fixture(t, { execute: () => toolEntry(f, toolStatus) });
    f.queue();
    await settled(f.runner);
    assert.equal(f.calls, 0);
    assert.equal(f.runner.status().verification.status, 'blocked');
  });

test('wake while the candidate is ready preserves an ongoing verification and its distinct status', async (t) => {
  let enter, finish;
  const entered = new Promise((resolve) => {
    enter = resolve;
  });
  const f = fixture(t, {
    run: ({ options }) => {
      enter(options);
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  f.queue();
  const options = await entered;
  assert.equal(f.runner.status().verification.status, 'running');
  assert.match(f.runner.status().message, /Vérification navigateur/);
  f.runner.wake();
  assert.equal(options.signal.aborted, false);
  finish();
  await settled(f.runner);
  assert.equal(f.runner.status().verification.status, 'passed');
});

for (const change of ['configuration', 'context', 'tools', 'close'])
  test(`${change} interruption rejects late passing browser results and preserves the candidate`, async (t) => {
    let enter, release;
    const entered = new Promise((resolve) => {
      enter = resolve;
    });
    const f = fixture(t, {
      run: ({ options }) => {
        enter(options);
        return new Promise((resolve) => {
          release = resolve;
        });
      },
    });
    f.queue();
    const options = await entered;
    let closing;
    if (change === 'configuration') f.config({ configurationId: randomUUID() });
    if (change === 'context')
      f.store.commit(f.store.read().version, (state) => {
        state.brief.outcome = 'Changed requirement';
      });
    if (change === 'tools') f.actions([{ requestId: 'live-unknown', status: 'unknown' }]);
    if (change === 'close') closing = f.runner.close();
    const deadline = Date.now() + 3000;
    while (!options.signal.aborted) {
      assert.ok(Date.now() < deadline);
      await delay(10);
    }
    release();
    await closing;
    await settled(f.runner);
    assert.equal(f.runner.status().verification.status, 'blocked');
    assert.equal(f.store.read().jobs[0].status, 'ready');
    assert.equal(f.store.read().jobs.length, 1);
    assert.equal(f.store.read().jobs[0].control.action, 'stop');
    assert.deepEqual(f.store.read().jobs[0].control.reasons, ['interrupted']);
    assert.equal(f.providers, 1);
    assert.equal(f.store.read().activeRevision, null);
  });

for (const outcome of ['passed', 'failed'])
  test(`real quality journal ${outcome} result is consumed by supervision without promoting declared criteria`, async (t) => {
    let executions = 0;
    t.mock.method(qualityAdapters, 'browser', async (snapshot, options) => {
      executions++;
      assert.equal(options.channel, 'chrome');
      assert.equal(options.timeoutMs, 60000);
      assert.equal(options.signal.aborted, false);
      assert.equal(f.store.read().jobs[0].control, undefined);
      return {
        status: outcome,
        observed: 'Controlled adapter receipt, not real browser evidence.',
        findings: [],
        limits: ['Injected adapter fixture. No browser or provider invoked.'],
        browser: {
          protocol: 'studio-browser-v1',
          driverVersion: '1.63.0',
          browserVersion: 'controlled-fixture',
          channel: 'chrome',
          sourceFingerprint: snapshot.fingerprint,
          scenarios: [
            {
              id: 'save',
              title: 'Controlled assertion',
              criterionIds: ['save'],
              status: outcome,
              executedSteps: 1,
              assertions: [{ step: 1, action: 'expectVisible', status: outcome }],
            },
          ],
        },
      };
    });
    const f = fixture(t, {
      realQuality: true,
      options: { maxJobs: 2 },
      execute: ({ directory }) => {
        fs.writeFileSync(
          path.join(directory, 'app/devmethod.browser.json'),
          JSON.stringify({
            schemaVersion: 1,
            scenarios: [
              {
                id: 'save',
                title: 'Controlled fixture',
                criterionIds: ['save'],
                steps: [
                  {
                    action: 'expectVisible',
                    target: { role: 'heading', name: 'Controlled candidate' },
                  },
                ],
              },
            ],
          }),
        );
      },
    });
    f.store.commit(f.store.read().version, (state) => {
      state.brief.criteria = [{ id: 'save', text: 'Persist a value' }];
    });
    configureBrowserVerification(f.store, {
      version: 0,
      enabled: true,
      automatic: true,
      channel: 'chrome',
    });
    f.queue();
    await settled(f.runner);
    assert.equal(executions, 1);
    const state = f.store.read();
    const evidence = readControlQuality(f.store, state.revisions[0].id).evidence.find(
      (item) => item.checkId === 'business-browser',
    );
    assert.equal(evidence.status, outcome);
    assert.equal(evidence.executor, 'studio');
    assert.equal(evidence.provenance, 'studio-adapter');
    assert.deepEqual(evidence.reportedCriterionIds, ['save']);
    assert.deepEqual(evidence.criterionIds, []);
    assert.equal(f.runner.status().verification.receiptId, evidence.id.slice('quality:'.length));
    assert.equal(
      state.jobs[0].control.action,
      outcome === 'passed' ? 'strengthen-verification' : 'arbitrate',
    );
    assert.deepEqual(state.jobs[0].control.reasons, [
      outcome === 'passed' ? 'business-evidence-missing' : 'diagnosis-required',
    ]);
    assert.equal(state.activeRevision, null);
    assert.equal(state.jobs.length, 1);
  });
