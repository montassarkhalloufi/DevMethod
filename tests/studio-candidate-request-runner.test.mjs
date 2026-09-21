import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { setImmediate } from 'node:timers/promises';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { createAgentRunner } from '../scripts/studio/runner.mjs';
import {
  queueRequest,
  queueCorrection,
  recordControl,
  updateProject,
} from '../scripts/studio/domain.mjs';
import {
  readCandidateRequest,
  requestCandidateChanges,
} from '../scripts/studio/candidate-request.mjs';
import {
  readInterventionReview,
  recordInterventionReview,
} from '../scripts/studio/intervention-review.mjs';
import {
  createMcpActionsStore,
  mcpActionFingerprint,
} from '../scripts/studio/mcp-actions-store.mjs';

// Executors and native-tool preparation below are controlled doubles, never a provider.
async function fixture(t, { tools = false, held = false, repaired = false } = {}) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'candidate-runner-'));
  const store = createStudioStore(root);
  const jobs = createJobs(
    store,
    tools ? { mcpContext: () => ({ supported: true, connections: [{ id: 'fixture' }] }) } : {},
  );
  let runner;
  t.after(async () => {
    await runner?.close();
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const commit = (fn) => store.commit(store.read().version, fn);
  commit((state) =>
    updateProject(state, {
      name: 'Controlled candidate runner',
      idea: 'Preserve sources',
      mode: 'delegated',
      constraints: [],
    }),
  );
  fs.writeFileSync(
    path.join(root, '.devmethod/data.json'),
    JSON.stringify({ version: 1, data: {} }),
  );
  commit((state) => queueRequest(state, { request: 'Baseline' }));
  let claim = jobs.claim('local fixture');
  fs.writeFileSync(
    path.join(claim.workDirectory, 'index.html'),
    '<!doctype html><h1>Baseline</h1>',
  );
  const base = (await jobs.finish({ jobId: claim.job.id, title: 'Baseline' })).revision;
  commit((state) => queueRequest(state, { request: 'Candidate' }));
  claim = jobs.claim('local fixture');
  fs.writeFileSync(
    path.join(claim.workDirectory, 'index.html'),
    '<!doctype html><h1>Candidate prose</h1>',
  );
  if (repaired) fs.writeFileSync(path.join(claim.workDirectory, 'bad.js'), 'const value = ;');
  let revision = (
    await jobs.finish({ jobId: claim.job.id, title: 'Candidate' }, { deferActivation: true })
  ).revision;
  if (repaired) {
    commit((state) => {
      recordControl(state, {
        jobId: claim.job.id,
        revisionId: revision.id,
        autonomy: { action: 'continue', operation: 'correct', reasons: ['technical-failure'] },
      });
      queueCorrection(state, { revisionId: revision.id });
    });
    claim = jobs.claim('local automatic correction fixture');
    fs.writeFileSync(path.join(claim.workDirectory, 'bad.js'), 'const value = 1;');
    revision = (
      await jobs.finish(
        { jobId: claim.job.id, title: 'Repaired parent' },
        { deferActivation: true },
      )
    ).revision;
  }
  commit((state) =>
    recordControl(state, {
      jobId: claim.job.id,
      revisionId: revision.id,
      autonomy: { action: 'strengthen-verification', reasons: ['business-evidence-missing'] },
    }),
  );
  if (held) {
    const view = readInterventionReview(store, { revisionId: revision.id });
    recordInterventionReview(store, {
      version: view.version,
      revisionId: revision.id,
      reviewKey: view.reviewKey,
      resolution: 'keep-stopped',
      assessment: { persistentData: 'unknown', contractChanged: 'unknown' },
      scope: 'Synthetic fixture scope',
      reason: 'Explicit fixture stop',
    });
  }
  let ordinary;
  commit((state) => {
    ordinary = queueRequest(state, { request: 'Ordinary request must remain queued' });
  });
  const view = readCandidateRequest(store, { revisionId: revision.id });
  assert.equal(view.canRequest, true, view.reason);
  const { job } = requestCandidateChanges(store, {
    version: view.version,
    revisionId: revision.id,
    reviewKey: view.reviewKey,
    request: 'Correct prose from preserved candidate',
  });
  return {
    root,
    store,
    jobs,
    commit,
    base,
    revision,
    ordinary,
    job,
    start(execute, extra = {}) {
      runner = createAgentRunner({ store, jobs, options: { maxJobs: 1 }, execute, ...extra });
      return runner;
    },
  };
}

async function settled(runner) {
  const until = Date.now() + 5000;
  while (runner.status().running) {
    assert.ok(Date.now() < until, 'Controlled runner should settle');
    await setImmediate();
  }
}

test('one reserved admission runs the linked candidate before an ordinary request and admits new independent receipts', async (t) => {
  const f = await fixture(t);
  const before = f.store.read();
  let calls = 0;
  const runner = f.start(async ({ directory }) => {
    calls++;
    assert.match(
      fs.readFileSync(path.join(directory, 'app/index.html'), 'utf8'),
      /Candidate prose/,
    );
    const context = JSON.parse(fs.readFileSync(path.join(directory, 'context.json')));
    assert.equal(context.request, f.job.request);
    fs.writeFileSync(
      path.join(directory, 'app/index.html'),
      '<!doctype html><h1>Candidate prose corrected</h1>',
    );
    return {
      ok: true,
      result: { title: 'Corrected candidate' },
      usage: { inputTokens: 2, outputTokens: 1 },
    };
  });
  runner.wake();
  await settled(runner);
  const state = f.store.read();
  assert.equal(calls, 1);
  assert.equal(runner.status().attempts, 1);
  assert.equal(state.jobs.find((job) => job.id === f.job.id).status, 'ready');
  assert.equal(state.jobs.find((job) => job.id === f.ordinary.id).status, 'queued');
  assert.equal(state.activeRevision, f.base.id);
  const delivered = state.revisions.find((revision) => revision.jobId === f.job.id);
  assert.ok(delivered);
  assert.notEqual(delivered.id, f.revision.id);
  assert.ok(
    state.checks.some(
      (check) =>
        check.revisionId === delivered.id &&
        check.executor === 'studio' &&
        check.status === 'passed',
    ),
  );
  assert.deepEqual(
    state.checks.filter((check) => check.revisionId === f.revision.id),
    before.checks.filter((check) => check.revisionId === f.revision.id),
  );
  runner.wake();
  await settled(runner);
  assert.equal(calls, 1);
});

for (const barrier of ['closed', 'unknown', 'exhausted', 'held']) {
  test(`explicit candidate request cannot bypass ${barrier}`, async (t) => {
    const f = await fixture(t, { held: barrier === 'held' });
    if (['unknown', 'exhausted'].includes(barrier))
      fs.writeFileSync(
        path.join(f.root, '.devmethod/agent.json'),
        JSON.stringify({
          attempts: barrier === 'exhausted' ? 1 : 0,
          knownTokens: 0,
          unknownUsage: barrier === 'unknown',
          runs: barrier === 'exhausted' ? [{ jobId: 'historical', status: 'completed' }] : [],
        }),
      );
    let calls = 0;
    const runner = f.start(async () => {
      calls++;
      throw new Error('Executor must not be called');
    });
    if (barrier === 'closed') await runner.close();
    runner.wake();
    await settled(runner);
    assert.equal(calls, 0);
    assert.equal(f.store.read().jobs.find((job) => job.id === f.job.id).status, 'queued');
    assert.equal(f.store.read().activeRevision, f.base.id);
  });
}

for (const change of ['source', 'context', 'pending-tool']) {
  test(`revalidates ${change} after asynchronous tool preparation and before provider dispatch`, async (t) => {
    const f = await fixture(t, { tools: true });
    let calls = 0,
      prepared = 0,
      closed = 0;
    const runner = f.start(
      async () => {
        calls++;
        throw new Error('Executor must not be called');
      },
      {
        createNativeTools: async (jobId) => {
          prepared++;
          await setImmediate();
          if (change === 'source')
            fs.appendFileSync(
              path.join(f.root, 'revisions', f.revision.id, 'app/index.html'),
              '<p>Altered</p>',
            );
          if (change === 'context')
            f.commit((state) => {
              state.brief.criteria = [{ id: 'changed', text: 'Changed scope' }];
            });
          if (change === 'pending-tool') {
            const entry = {
              requestId: randomUUID(),
              jobId,
              baseRevision: f.base.id,
              connectionId: randomUUID(),
              connectionVersion: 1,
              toolName: 'fixture.pending',
              inputSchemaFingerprint: 'a'.repeat(64),
              contractFingerprint: 'b'.repeat(64),
              arguments: {},
              status: 'pending',
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 600000).toISOString(),
            };
            entry.fingerprint = mcpActionFingerprint(entry);
            createMcpActionsStore(f.root, Date.now).save(entry);
          }
          return {
            close: async () => {
              closed++;
            },
          };
        },
      },
    );
    runner.wake();
    await settled(runner);
    assert.equal(prepared, 1, 'Must reach the actual preparation boundary');
    assert.equal(calls, 0);
    assert.equal(closed, 1);
    assert.equal(runner.status().usageUnknown, false, 'No provider was started');
    assert.equal(f.store.read().activeRevision, f.base.id);
    assert.equal(f.store.read().jobs.find((job) => job.id === f.ordinary.id).status, 'queued');
  });
}

test('explicit descendant preserves the already consumed automatic correction limit', async (t) => {
  const f = await fixture(t, { repaired: true });
  let calls = 0;
  const runner = f.start(
    async ({ directory }) => {
      calls++;
      fs.writeFileSync(path.join(directory, 'app/bad.js'), 'const broken = ;');
      return {
        ok: true,
        result: { title: 'Failed explicit descendant' },
        usage: { inputTokens: 1, outputTokens: 1 },
      };
    },
    { options: { maxJobs: 3 } },
  );
  runner.wake();
  await settled(runner);
  const state = f.store.read();
  const descendant = state.jobs.find((job) => job.id === f.job.id);
  assert.equal(calls, 1);
  assert.equal(descendant.control.action, 'stop');
  assert.ok(descendant.control.reasons.includes('correction-limit'));
  assert.equal(state.jobs.filter((job) => job.correction).length, 1);
  assert.equal(state.jobs.find((job) => job.id === f.ordinary.id).status, 'queued');
  assert.equal(state.activeRevision, f.base.id);
});

test('failed automatic correction without a revision remains counted when an explicit request branches from the original candidate', async (t) => {
  const { projectControl } = await import('../scripts/studio/control.mjs');
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'candidate-failed-branch-'));
  const store = createStudioStore(root);
  const jobs = createJobs(store);
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const commit = (fn) => store.commit(store.read().version, fn);
  commit((state) => {
    updateProject(state, {
      name: 'Failed branch fixture',
      idea: 'Preserve correction limit',
      mode: 'delegated',
      constraints: [],
    });
    queueRequest(state, { request: 'Initial application' });
  });
  const parent = jobs.claim('controlled initial worker');
  fs.writeFileSync(
    path.join(parent.workDirectory, 'index.html'),
    '<!doctype html><h1>Candidate</h1>',
  );
  fs.writeFileSync(path.join(parent.workDirectory, 'bad.js'), 'const broken = ;');
  const original = (
    await jobs.finish(
      { jobId: parent.job.id, title: 'Original failed candidate' },
      { deferActivation: true },
    )
  ).revision;
  commit((state) => {
    recordControl(state, {
      jobId: parent.job.id,
      revisionId: original.id,
      autonomy: { action: 'continue', operation: 'correct', reasons: ['technical-failure'] },
    });
    queueCorrection(state, { revisionId: original.id });
  });
  // The automatic child is actually claimed, then fails without delivering sources.
  assert.equal(
    projectControl(store.read(), { automatic: true }, parent.job.id).autonomy.action,
    'continue',
    'The queued direct automatic correction must remain admissible',
  );
  const automatic = jobs.claim('controlled automatic worker');
  assert.equal(
    projectControl(store.read(), { automatic: true }, parent.job.id).autonomy.action,
    'continue',
    'The running direct automatic correction must not invalidate its own admission',
  );
  jobs.fail({ jobId: automatic.job.id, error: 'Known failure, no revision produced' });
  assert.equal(
    store.read().revisions.some((revision) => revision.jobId === automatic.job.id),
    false,
  );
  const view = readCandidateRequest(store, { revisionId: original.id });
  assert.equal(view.canRequest, true, view.reason);
  const explicit = requestCandidateChanges(store, {
    version: view.version,
    revisionId: original.id,
    reviewKey: view.reviewKey,
    request: 'A separate explicit correction request',
  }).job;
  const claimed = jobs.claim('controlled explicit worker');
  assert.equal(claimed.job.id, explicit.id);
  fs.writeFileSync(path.join(claimed.workDirectory, 'bad.js'), 'const stillBroken = ;');
  const delivered = (
    await jobs.finish(
      { jobId: explicit.id, title: 'Explicit failed candidate' },
      { deferActivation: true },
    )
  ).revision;
  assert.ok(delivered);
  const control = projectControl(store.read(), { automatic: true }, explicit.id);
  assert.equal(control.autonomy.action, 'stop');
  assert.ok(control.autonomy.reasons.includes('correction-limit'));
  const before = store.read();
  assert.throws(() => commit((state) => queueCorrection(state, { revisionId: delivered.id })));
  assert.deepEqual(store.read(), before);
});
