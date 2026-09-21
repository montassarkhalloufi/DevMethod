import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { updateProject, queueRequest, recordControl } from '../scripts/studio/domain.mjs';
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
import { exportProject } from '../scripts/studio/bundle.mjs';
import { restoreArchive } from '../scripts/studio/archive.mjs';

// Synthetic persisted receipt: tests integration and authority, never launches a browser.
async function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'coverage-review-'));
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

test('explicit sufficient assessment links exact evidence without adopting or resolving unknown consequences', async (t) => {
  const f = await fixture(t),
    before = f.store.read(),
    receipt = readQualityRuns(f.store);
  const ledger = path.join(f.store.root, '.devmethod/agent.json');
  const ledgerBefore = fs.existsSync(ledger) ? fs.readFileSync(ledger, 'utf8') : null;
  assert.deepEqual(f.evidence().criterionIds, []);
  assert.ok(f.control().autonomy.reasons.includes('business-evidence-missing'));
  const { decision } = recordCoverageReview(f.store, f.input());
  assert.deepEqual(f.evidence().criterionIds, ['heading']);
  const current = f.control();
  assert.ok(
    current.graph.nodes.some(
      (node) =>
        node.type === 'assessment' && node.decisionId === decision.id && node.source === 'user',
    ),
  );
  assert.ok(
    current.graph.edges.some(
      (edge) => edge.relation === 'covers' && edge.to === 'criterion:heading',
    ),
  );
  assert.deepEqual(current.autonomy.reasons, ['consequences-to-check']);
  assert.deepEqual(f.store.read().jobs, before.jobs);
  assert.equal(f.store.read().activeRevision, before.activeRevision);
  assert.deepEqual(f.store.read().project.delegation, before.project.delegation);
  assert.deepEqual(readQualityRuns(f.store), receipt);
  assert.equal(fs.existsSync(ledger) ? fs.readFileSync(ledger, 'utf8') : null, ledgerBefore);
});

for (const conclusion of ['partial', 'irrelevant'])
  test(`${conclusion} replaces sufficient interpretation while retaining history and reopening coverage`, async (t) => {
    const f = await fixture(t);
    const old = recordCoverageReview(f.store, f.input()).decision;
    const current = recordCoverageReview(f.store, f.input(conclusion)).decision;
    assert.equal(f.store.read().decisions.find((item) => item.id === old.id).status, 'superseded');
    assert.equal(current.status, 'active');
    assert.deepEqual(f.evidence().criterionIds, []);
    assert.equal(f.evidence().coverageReviews.length, 2);
    assert.ok(f.control().autonomy.reasons.includes('business-evidence-missing'));
  });

test('export preserves assessments and exact receipts but cannot restore local permission or effective coverage', async (t) => {
  const f = await fixture(t);
  const { decision } = recordCoverageReview(f.store, f.input());
  fs.writeFileSync(
    path.join(f.store.root, '.devmethod/data.json'),
    JSON.stringify({ version: 1, data: {} }),
  );
  const destination = path.join(f.root, 'restored');
  restoreArchive(exportProject(f.store.root, f.store.read()), destination);
  const restored = createStudioStore(destination);
  t.after(() => restored.close());
  assert.deepEqual(
    restored.read().decisions.find((item) => item.id === decision.id),
    decision,
  );
  assert.deepEqual(readQualityRuns(restored), readQualityRuns(f.store));
  assert.equal(fs.existsSync(path.join(destination, '.devmethod/browser.json')), false);
  const evidence = readControlEvidence(restored, f.revision.id).find(
    (item) => item.checkId === 'business-browser',
  );
  assert.equal(evidence.freshness, 'reevaluate');
  assert.deepEqual(evidence.criterionIds, []);
  assert.equal(evidence.coverageReviews[0].freshness, 'reevaluate');
});

test('a newer successful receipt never inherits an older assessment', async (t) => {
  const f = await fixture(t);
  recordCoverageReview(f.store, f.input());
  const newer = {
    ...f.run,
    id: randomUUID(),
    startedAt: '2026-09-21T11:00:00.000Z',
    finishedAt: '2026-09-21T11:00:01.000Z',
  };
  writeQualityRun(f.store, newer);
  assert.equal(f.evidence().freshness, 'obsolete');
  assert.deepEqual(f.evidence().criterionIds, []);
  assert.ok(f.control().autonomy.reasons.includes('business-evidence-missing'));
  const latest = readControlEvidence(f.store, f.revision.id).find(
    (item) => item.id === `quality:${newer.id}`,
  );
  assert.equal(latest.freshness, 'current');
  assert.deepEqual(latest.criterionIds, []);
});

test('changed criteria invalidate assessment while independent technical admission stays current', async (t) => {
  const f = await fixture(t);
  recordCoverageReview(f.store, f.input());
  const technical = f
    .control()
    .graph.nodes.filter((node) => node.type === 'evidence' && node.kind === 'technical');
  assert.ok(technical.length > 0);
  f.store.commit(f.store.read().version, (state) => {
    state.brief.criteria[0].text = 'The heading remains visible after restart.';
  });
  assert.equal(f.evidence().freshness, 'reevaluate');
  assert.deepEqual(f.evidence().criterionIds, []);
  const current = f.control();
  for (const node of technical)
    assert.equal(current.graph.nodes.find((item) => item.id === node.id).freshness, 'current');
  assert.ok(current.autonomy.reasons.includes('business-evidence-missing'));
});

test('receipt mutation between review and commit refuses the stale key without writing a decision', async (t) => {
  const f = await fixture(t),
    input = f.input(),
    before = f.store.read();
  f.run.observed = 'Changed after examination';
  writeQualityRun(f.store, f.run);
  assert.throws(
    () => recordCoverageReview(f.store, input),
    (error) => error.status === 409,
  );
  assert.deepEqual(f.store.read(), before);
});

test('worker finish cannot forge a user assessment by attaching coverage to an agent decision', async (t) => {
  const f = await fixture(t);
  const { decision } = recordCoverageReview(f.store, f.input());
  f.store.commit(f.store.read().version, (state) =>
    queueRequest(state, { request: 'Worker fixture' }),
  );
  const claim = f.jobs.claim('worker fixture'),
    before = f.store.read();
  await assert.rejects(
    async () =>
      f.jobs.finish({
        jobId: claim.job.id,
        decisions: [{ ...decision, id: randomUUID(), source: 'agent' }],
      }),
    /couverture|appréciation|utilisateur/i,
  );
  assert.deepEqual(f.store.read(), before);
});
