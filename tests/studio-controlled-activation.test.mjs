import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import {
  updateProject,
  queueRequest,
  recordControl,
  activateRevision,
  discardControlledCandidate,
  proposeDecision,
  selectProposalOption,
  approveProposal,
} from '../scripts/studio/domain.mjs';
import { configureBrowserVerification } from '../scripts/studio/browser-configuration.mjs';
import { readBrowserScenarios } from '../scripts/studio/browser-scenarios.mjs';
import { captureBusinessCriteria } from '../scripts/studio/quality-criteria.mjs';
import {
  writeQualityRun,
  qualitySnapshot,
  readQualityRuns,
} from '../scripts/studio/quality-storage.mjs';
import { readControlEvidence } from '../scripts/studio/quality-evidence.mjs';
import { readProjectControl } from '../scripts/studio/control.mjs';
import { readCoverageReview, recordCoverageReview } from '../scripts/studio/coverage-review.mjs';
import http from 'node:http';
import { applyControlledRevision } from '../scripts/studio/controlled-activation.mjs';
import {
  readInterventionReview,
  recordInterventionReview,
} from '../scripts/studio/intervention-review.mjs';
import { startStudio } from '../scripts/studio/server.mjs';
import { exportProject } from '../scripts/studio/bundle.mjs';
import { restoreArchive } from '../scripts/studio/archive.mjs';

// Synthetic persisted receipt: tests integration and authority, never launches a browser.
async function fixture(t, deferControl = false) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'controlled-activation-'));
  const store = createStudioStore(path.join(root, 'project'));
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  store.commit(store.read().version, (state) => {
    updateProject(state, {
      name: 'Coverage fixture',
      idea: 'Synthetic assertion review',
      mode: 'delegated',
      constraints: [],
    });
    state.brief.criteria = [{ id: 'heading', text: 'The expected heading is visible.' }];
    queueRequest(state, { request: 'Create fixture candidate' });
  });
  const jobs = createJobs(store),
    claim = jobs.claim('synthetic fixture');
  fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), '<h1>Fixture</h1>');
  fs.writeFileSync(
    path.join(claim.workDirectory, 'devmethod.browser.json'),
    JSON.stringify({
      schemaVersion: 1,
      scenarios: [
        {
          id: 'heading',
          title: 'Read heading',
          criterionIds: ['heading'],
          steps: [
            { action: 'expectText', target: { role: 'heading', name: 'Fixture' }, text: 'Fixture' },
          ],
        },
      ],
    }),
  );
  const { revision } = await jobs.finish(
    { jobId: claim.job.id, title: 'Fixture' },
    { deferActivation: true },
  );
  const configuration = configureBrowserVerification(store, {
    version: 0,
    enabled: true,
    channel: 'chrome',
  });
  const snapshot = qualitySnapshot(store, revision),
    manifest = readBrowserScenarios(snapshot);
  const run = {
    schemaVersion: 1,
    id: randomUUID(),
    checkId: 'business-browser',
    source: { kind: 'studio-adapter' },
    title: 'Synthetic journal, not browser execution',
    revisionId: revision.id,
    fingerprint: snapshot.fingerprint,
    status: 'passed',
    tool: 'Controlled fixture',
    environment: 'test',
    expected: 'Heading',
    observed: 'Synthetic successful assertion',
    startedAt: '2026-09-21T10:00:00.000Z',
    finishedAt: '2026-09-21T10:00:01.000Z',
    findings: [],
    events: [],
    limits: ['Synthetic integration fixture only.'],
    browserConfigurationVersion: configuration.version,
    browserConfigurationId: configuration.configurationId,
    browserChannel: 'chrome',
    browserDriverVersion: configuration.driverVersion,
    reportedCriterionIds: ['heading'],
    businessCriteria: captureBusinessCriteria(store.read()),
    browser: {
      protocol: 'studio-browser-v1',
      driverVersion: configuration.driverVersion,
      browserVersion: 'synthetic',
      channel: 'chrome',
      sourceFingerprint: snapshot.fingerprint,
      manifestFingerprint: manifest.manifestFingerprint,
      scenarios: [
        {
          id: 'heading',
          status: 'passed',
          executedSteps: 1,
          assertions: [{ step: 1, action: 'expectText', status: 'passed' }],
        },
      ],
    },
  };
  writeQualityRun(store, run);
  const control = () => readProjectControl(store, {}, claim.job.id, [], revision.id);
  if (!deferControl)
    store.commit(store.read().version, (state) =>
      recordControl(state, {
        jobId: claim.job.id,
        revisionId: revision.id,
        autonomy: control().autonomy,
      }),
    );
  const input = (conclusion = 'sufficient') => {
    const review = readCoverageReview(store, { revisionId: revision.id, receiptId: run.id });
    return {
      version: review.version,
      revisionId: revision.id,
      receiptId: run.id,
      reviewKey: review.reviewKey,
      criterionId: 'heading',
      scenarioIds: ['heading'],
      conclusion,
      scope: 'Visible heading in the synthetic scenario',
      reason: 'The selected assertion observes the exact heading obligation.',
    };
  };
  const evidence = () =>
    readControlEvidence(store, revision.id).find((item) => item.id === `quality:${run.id}`);
  return { root, store, jobs, revision, run, control, input, evidence };
}

const support = {
  agent: {
    automatic: true,
    running: false,
    usageUnknown: false,
    attempts: 1,
    maxJobs: 3,
    knownTokens: 20,
    maxTokens: 1000,
  },
  liveActions: [],
};
const applicationInput = (f) => ({ version: f.store.read().version, revisionId: f.revision.id });

async function eligible(t, recordFavorableControl = false) {
  const f = await fixture(t, recordFavorableControl);
  fs.writeFileSync(
    path.join(f.store.root, '.devmethod/data.json'),
    JSON.stringify({ version: 1, data: {} }),
  );
  recordCoverageReview(f.store, f.input());
  const view = readInterventionReview(f.store, { revisionId: f.revision.id, ...support });
  recordInterventionReview(
    f.store,
    {
      version: view.version,
      revisionId: f.revision.id,
      reviewKey: view.reviewKey,
      resolution: 'accept-local',
      assessment: { persistentData: 'affected', contractChanged: 'affected' },
      scope: 'Synthetic candidate only',
      reason: 'Controlled service integration, no human or browser execution.',
    },
    support,
  );
  const control = readProjectControl(f.store, support.agent, undefined, [], f.revision.id);
  assert.equal(control.autonomy.action, 'continue');
  assert.equal(control.autonomy.operation, 'activate');
  if (recordFavorableControl)
    f.store.commit(f.store.read().version, (state) =>
      recordControl(state, {
        jobId: f.revision.jobId,
        revisionId: f.revision.id,
        autonomy: control.autonomy,
      }),
    );
  return f;
}

const rejectStatus = (status) => (error) => error.status === status;

test('controlled application persists server evidence without rewriting job control, data, receipts or budget', async (t) => {
  const f = await eligible(t),
    before = f.store.read(),
    receipts = readQualityRuns(f.store);
  const data = fs.readFileSync(path.join(f.store.root, '.devmethod/data.json'), 'utf8');
  const ledger = path.join(f.store.root, '.devmethod/agent.json');
  const budget = fs.existsSync(ledger) ? fs.readFileSync(ledger, 'utf8') : null;
  const input = applicationInput(f);
  const result = applyControlledRevision(f.store, input, support);
  assert.equal(result.applied, true);
  assert.equal(result.state.activeRevision, f.revision.id);
  assert.equal(result.decision.source, 'agent');
  assert.equal(result.decision.topic, 'Version active');
  assert.ok(result.decision.application);
  assert.deepEqual(
    result.decision.application.coverageDecisionIds,
    before.decisions
      .filter((item) => item.coverage && item.status === 'active')
      .map((item) => item.id),
  );
  assert.deepEqual(result.state.jobs, before.jobs);
  assert.deepEqual(readQualityRuns(f.store), receipts);
  assert.equal(fs.readFileSync(path.join(f.store.root, '.devmethod/data.json'), 'utf8'), data);
  assert.equal(fs.existsSync(ledger) ? fs.readFileSync(ledger, 'utf8') : null, budget);
  assert.throws(() => applyControlledRevision(f.store, input, support), rejectStatus(409));
  const adopted = f.store.read();
  assert.equal(applyControlledRevision(f.store, applicationInput(f), support).applied, false);
  assert.deepEqual(f.store.read(), adopted);
});

for (const mutation of ['data', 'base', 'delegation', 'source', 'running'])
  test(`application rechecks ${mutation} instead of trusting a previously eligible control`, async (t) => {
    const f = await eligible(t);
    if (mutation === 'data')
      fs.writeFileSync(
        path.join(f.store.root, '.devmethod/data.json'),
        JSON.stringify({ version: 2, data: { fixture: true } }),
      );
    if (mutation === 'source')
      fs.appendFileSync(
        path.join(f.store.root, 'revisions', f.revision.id, 'app/index.html'),
        '<p>Changed</p>',
      );
    if (mutation === 'base') {
      f.store.commit(f.store.read().version, (state) =>
        queueRequest(state, { request: 'Different active base' }),
      );
      const claimed = f.jobs.claim('fixture');
      fs.writeFileSync(path.join(claimed.workDirectory, 'index.html'), '<h1>Other</h1>');
      const { revision } = await f.jobs.finish(
        { jobId: claimed.job.id, title: 'Other version' },
        { deferActivation: true },
      );
      f.store.commit(f.store.read().version, (state) =>
        activateRevision(state, { id: revision.id, reason: 'Explicit fixture switch' }),
      );
    }
    if (mutation === 'delegation')
      f.store.commit(f.store.read().version, (state) => {
        state.project.delegation = { structure: 'agent', visual: 'agent', adoption: 'user' };
      });
    if (mutation === 'running') {
      f.store.commit(f.store.read().version, (state) =>
        queueRequest(state, { request: 'Concurrent fixture' }),
      );
      f.jobs.claim('fixture');
    }
    const before = f.store.read();
    assert.throws(
      () => applyControlledRevision(f.store, applicationInput(f), support),
      rejectStatus(409),
    );
    assert.deepEqual(f.store.read(), before);
  });

for (const agent of [
  { ...support.agent, automatic: undefined },
  { ...support.agent, running: true },
  { ...support.agent, configuring: true },
  { ...support.agent, verification: { status: 'running' } },
  { ...support.agent, automatic: false },
  { ...support.agent, usageUnknown: true },
  { ...support.agent, attempts: 3, automatic: false },
])
  test(`stopped or unknown execution cannot apply (${JSON.stringify(agent)})`, async (t) => {
    const f = await eligible(t),
      before = f.store.read();
    assert.throws(
      () => applyControlledRevision(f.store, applicationInput(f), { ...support, agent }),
      rejectStatus(409),
    );
    assert.deepEqual(f.store.read(), before);
  });

test('strict input, unknown revision and a retained local stop cannot be bypassed', async (t) => {
  const f = await eligible(t);
  assert.throws(
    () => applyControlledRevision(f.store, { ...applicationInput(f), automatic: true }, support),
    rejectStatus(400),
  );
  assert.throws(
    () =>
      applyControlledRevision(f.store, { ...applicationInput(f), revisionId: 'missing' }, support),
    rejectStatus(404),
  );
  const view = readInterventionReview(f.store, { revisionId: f.revision.id, ...support });
  recordInterventionReview(
    f.store,
    {
      version: view.version,
      revisionId: f.revision.id,
      reviewKey: view.reviewKey,
      resolution: 'keep-stopped',
      assessment: { persistentData: 'unknown', contractChanged: 'unknown' },
      scope: 'Stop fixture',
      reason: 'No continuation authorized.',
    },
    support,
  );
  assert.throws(
    () => applyControlledRevision(f.store, applicationInput(f), support),
    rejectStatus(409),
  );
});

test('export retains application history without transferring authority and worker cannot forge it', async (t) => {
  const f = await eligible(t);
  const { decision } = applyControlledRevision(f.store, applicationInput(f), support);
  const destination = path.join(f.root, 'restored');
  restoreArchive(exportProject(f.store.root, f.store.read()), destination);
  const restored = createStudioStore(destination);
  t.after(() => restored.close());
  assert.deepEqual(
    restored.read().decisions.find((item) => item.id === decision.id),
    decision,
  );
  assert.equal(fs.existsSync(path.join(destination, '.devmethod/browser.json')), false);
  assert.notEqual(
    readProjectControl(restored, support.agent, undefined, [], f.revision.id).autonomy.action,
    'continue',
  );
  f.store.commit(f.store.read().version, (state) =>
    queueRequest(state, { request: 'Forged application fixture' }),
  );
  const claim = f.jobs.claim('fixture'),
    before = f.store.read();
  await assert.rejects(
    async () =>
      f.jobs.finish({ jobId: claim.job.id, decisions: [{ ...decision, id: randomUUID() }] }),
    /application|activation|réserv|contrôl/i,
  );
  assert.deepEqual(f.store.read(), before);
});

function hostileHost(url, payload) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      url + '/api/control/apply',
      { method: 'POST', headers: { Host: 'foreign.invalid', 'Content-Type': 'application/json' } },
      (response) => {
        response.resume();
        response.on('end', () => resolve(response.statusCode));
      },
    );
    request.on('error', reject);
    request.end(JSON.stringify(payload));
  });
}

test('HTTP application refuses worker, foreign origin/Host, oversized input and unavailable agent without mutation', async (t) => {
  const f = await eligible(t);
  f.store.close();
  const studio = await startStudio({ workspace: f.store.root, port: 0 });
  t.after(() => studio.close());
  const { url, token } = studio.runtime(),
    before = studio.store.read();
  const payload = { version: before.version, revisionId: f.revision.id };
  const post = (input = payload, headers = {}) =>
    fetch(url + '/api/control/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: url, ...headers },
      body: JSON.stringify(input),
    });
  assert.equal((await post(payload, { Authorization: `Bearer ${token}` })).status, 403);
  assert.equal((await post(payload, { Origin: 'https://foreign.invalid' })).status, 403);
  assert.equal(await hostileHost(url, payload), 403);
  const oversized = await post({ ...payload, extra: 'x'.repeat(5000) });
  assert.equal(oversized.status, 400);
  assert.match((await oversized.json()).error, /volumineux/);
  assert.equal((await post({ ...payload, version: payload.version - 1 })).status, 409);
  assert.equal((await post()).status, 409);
  assert.deepEqual(studio.store.read(), before);
});

test('explicit discard blocks application even after a favorable historical control', async (t) => {
  const f = await eligible(t, true);
  const historical = f.store.read().jobs.find((job) => job.id === f.revision.jobId).control;
  assert.equal(historical.action, 'continue');
  f.store.commit(f.store.read().version, (state) =>
    discardControlledCandidate(state, {
      jobId: f.revision.jobId,
      reason: 'Explicitly discard this otherwise eligible fixture.',
    }),
  );
  const discarded = f.store.read();
  assert.throws(
    () => applyControlledRevision(f.store, applicationInput(f), support),
    rejectStatus(409),
  );
  const current = readProjectControl(f.store, support.agent, undefined, [], f.revision.id);
  assert.equal(current.autonomy.action, 'stop');
  assert.ok(current.autonomy.reasons.includes('candidate-discarded'));
  assert.deepEqual(f.store.read(), discarded);
  assert.deepEqual(
    f.store.read().jobs.find((job) => job.id === f.revision.jobId).control,
    historical,
  );
});

async function discardedFixture(t) {
  const f = await eligible(t, true);
  f.store.commit(f.store.read().version, (state) =>
    discardControlledCandidate(state, {
      jobId: f.revision.jobId,
      reason: 'Retain explicit discard against unrelated decisions.',
    }),
  );
  return f;
}

test('worker cannot replace a retained discard with a bare control topic', async (t) => {
  const f = await discardedFixture(t);
  f.store.commit(f.store.read().version, (state) =>
    queueRequest(state, { request: 'Metadata-only worker fixture' }),
  );
  const claim = f.jobs.claim('synthetic-worker');
  const before = f.store.read();
  await assert.rejects(
    async () =>
      f.jobs.finish({
        jobId: claim.job.id,
        decisions: [
          {
            id: randomUUID(),
            topic: `control:${f.revision.jobId}`,
            choice: 'Resume instead',
            reason: 'Attempt to supersede an explicit discard',
            status: 'active',
            source: 'agent',
          },
        ],
      }),
    /contrôle|réserv|control/i,
  );
  assert.deepEqual(f.store.read(), before);
  assert.ok(
    readProjectControl(
      f.store,
      support.agent,
      undefined,
      [],
      f.revision.id,
    ).autonomy.reasons.includes('candidate-discarded'),
  );
});

test('delegated proposal approval cannot supersede a retained discard through its control topic', async (t) => {
  const f = await discardedFixture(t);
  let proposalId;
  f.store.commit(f.store.read().version, (state) => {
    const proposal = proposeDecision(state, {
      topic: 'Existing proposal topic',
      stage: 'visual',
      question: 'Controlled authority fixture',
      options: [
        {
          id: 'resume',
          title: 'Resume',
          consequences: [],
          preview: { kind: 'revision', revisionId: f.revision.id, status: 'implemented' },
        },
      ],
    });
    // Represent a previously persisted proposal; reading old free topics remains supported.
    proposal.topic = `control:${f.revision.jobId}`;
    proposalId = proposal.id;
  });
  f.store.commit(f.store.read().version, (state) =>
    selectProposalOption(state, { proposalId, optionId: 'resume' }),
  );
  const before = f.store.read();
  assert.throws(
    () =>
      f.store.commit(before.version, (state) =>
        approveProposal(
          state,
          { proposalId, optionId: 'resume', reason: 'Attempt to supersede an explicit discard' },
          { actor: 'agent' },
        ),
      ),
    /contrôle|réserv|control/i,
  );
  assert.deepEqual(f.store.read(), before);
  assert.ok(
    readProjectControl(
      f.store,
      support.agent,
      undefined,
      [],
      f.revision.id,
    ).autonomy.reasons.includes('candidate-discarded'),
  );
});
