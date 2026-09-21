import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import {
  activateRevision,
  claimJob,
  finishJob,
  queueRequest,
  updateProject,
  proposeDecision,
  selectProposalOption,
  approveProposal,
} from '../scripts/studio/domain.mjs';
import {
  readInterventionReview,
  recordInterventionReview,
} from '../scripts/studio/intervention-review.mjs';
import { readProjectControl } from '../scripts/studio/control.mjs';
import { qualitySnapshot, writeQualityRun } from '../scripts/studio/quality-storage.mjs';
import { exportProject } from '../scripts/studio/bundle.mjs';
import { restoreArchive } from '../scripts/studio/archive.mjs';

// Actual syntax admission; application behavior and user identity are not tested here.
async function fixture(t, script = 'const candidate = 2;') {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'intervention-review-'));
  let store = createStudioStore(root);
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  fs.writeFileSync(
    path.join(root, '.devmethod/data.json'),
    JSON.stringify({ version: 1, data: {} }),
  );
  store.commit(store.read().version, (state) => {
    updateProject(state, {
      name: 'Local review fixture',
      idea: 'Save a value',
      mode: 'delegated',
      constraints: [],
    });
    state.brief.criteria = [{ id: 'save', text: 'Retain saved value' }];
  });
  const jobs = createJobs(store),
    revisions = [];
  for (const name of ['base', 'candidate']) {
    store.commit(store.read().version, (state) =>
      queueRequest(state, { request: `Create ${name}` }),
    );
    const claim = jobs.claim('fixture');
    fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), `<h1>${name}</h1>`);
    fs.writeFileSync(
      path.join(claim.workDirectory, 'main.js'),
      name === 'base' ? 'const candidate = 1;' : script,
    );
    const { revision } = await jobs.finish(
      { jobId: claim.job.id, title: name },
      { deferActivation: true },
    );
    revisions.push(revision);
    if (name === 'base')
      store.commit(store.read().version, (state) =>
        activateRevision(state, { id: revision.id, reason: 'Synthetic fixture base' }),
      );
  }
  const [base, revision] = revisions;
  return {
    root,
    base,
    revision,
    get store() {
      return store;
    },
    restart() {
      store.close();
      store = createStudioStore(root);
      return store;
    },
  };
}

const input = (view, overrides = {}) => ({
  version: view.version,
  revisionId: view.revision.id,
  reviewKey: view.reviewKey,
  resolution: 'accept-local',
  assessment: { persistentData: 'not-affected', contractChanged: 'not-affected' },
  scope: 'Local synthetic fixture',
  reason: 'Explicit local interpretation for protocol test',
  ...overrides,
});
const review = (f) => readInterventionReview(f.store, { revisionId: f.revision.id });
const control = (f, agent = { automatic: true }) =>
  readProjectControl(f.store, agent, undefined, undefined, f.revision.id);

// This synthetic journal record exercises binding, not browser execution or semantic proof.
function syntheticReceipt(f) {
  return {
    schemaVersion: 1,
    id: randomUUID(),
    checkId: 'source-syntax',
    revisionId: f.revision.id,
    fingerprint: qualitySnapshot(f.store, f.revision).fingerprint,
    source: { kind: 'studio-adapter' },
    status: 'passed',
    title: 'Synthetic exact journal binding fixture',
    tool: 'fixture',
    environment: 'unit test',
    expected: 'Journal binding',
    observed: 'Synthetic receipt only',
    startedAt: new Date().toISOString(),
    findings: [],
    events: [],
    limits: ['No behavior proof'],
  };
}

test('local acceptance reviews consequence unknowns but leaves missing business evidence and usage barriers', async (t) => {
  const f = await fixture(t),
    before = control(f);
  assert.ok(before.risk.unknowns.includes('persistentData'));
  assert.ok(before.risk.unknowns.includes('contractChanged'));
  const result = recordInterventionReview(f.store, input(review(f)));
  const after = control(f);
  assert.deepEqual(
    new Set(after.risk.reviewedUnknowns),
    new Set(['persistentData', 'contractChanged']),
  );
  assert.ok(
    after.risk.unknowns.includes('persistentData'),
    'interpretation does not erase factual uncertainty',
  );
  assert.ok(after.risk.unknowns.includes('contractChanged'));
  assert.ok(after.autonomy.reasons.includes('business-evidence-missing'));
  assert.notEqual(after.autonomy.action, 'continue');
  assert.equal(result.decision.intervention.revisionId, f.revision.id);
  assert.ok(
    control(f, { automatic: true, usageUnknown: true }).autonomy.reasons.includes('usage-unknown'),
  );
  assert.notEqual(
    control(f, { automatic: false, attempts: 1, maxJobs: 1 }).autonomy.action,
    'continue',
  );
});

test('accepted positive indications remain visible risk factors, never changed into negative facts', async (t) => {
  const f = await fixture(t, 'fetch("/api/data");');
  recordInterventionReview(
    f.store,
    input(review(f), { assessment: { persistentData: 'affected', contractChanged: 'affected' } }),
  );
  const result = control(f);
  for (const id of ['persistent-data', 'contract-changed']) {
    assert.ok(
      result.risk.factors.some((factor) => factor.id === id),
      id,
    );
    assert.ok(result.risk.acceptedFactors.includes(id), id);
  }
  assert.notEqual(result.autonomy.action, 'continue', 'acceptance is not business coverage');
});

test('keep-stopped survives context changes and restart until an explicit replacement', async (t) => {
  const f = await fixture(t);
  const held = recordInterventionReview(
    f.store,
    input(review(f), {
      resolution: 'keep-stopped',
      assessment: { persistentData: 'unknown', contractChanged: 'unknown' },
    }),
  ).decision;
  fs.writeFileSync(
    path.join(f.root, '.devmethod/data.json'),
    JSON.stringify({ version: 2, data: {} }),
  );
  f.restart();
  const heldControl = control(f);
  assert.equal(heldControl.autonomy.action, 'stop');
  assert.ok(heldControl.autonomy.reasons.includes('consequences-held'));
  const replacement = recordInterventionReview(f.store, input(review(f))).decision;
  const history = f.store.read().decisions;
  assert.deepEqual(
    history.find((item) => item.id === held.id),
    { ...held, status: 'superseded' },
  );
  assert.equal(history.find((item) => item.id === replacement.id).status, 'active');
  assert.ok(!control(f).autonomy.reasons.includes('consequences-held'));
});

test('local acceptance survives same-workspace restart but restored copies require reevaluation', async (t) => {
  const f = await fixture(t);
  const saved = recordInterventionReview(f.store, input(review(f))).decision;
  f.restart();
  assert.deepEqual(f.store.read().decisions.at(-1), saved);
  assert.equal(control(f).risk.reviewedUnknowns.length, 2);
  const target = path.join(f.root, 'restored');
  restoreArchive(exportProject(f.root, f.store.read()), target);
  const restored = createStudioStore(target);
  try {
    assert.deepEqual(restored.read().decisions.at(-1), saved);
    const restoredControl = readProjectControl(
      restored,
      { automatic: true },
      undefined,
      undefined,
      f.revision.id,
    );
    assert.deepEqual(restoredControl.risk.reviewedUnknowns, []);
    const next = readInterventionReview(restored, { revisionId: f.revision.id });
    assert.ok(next.consequences.reviews.some((item) => item.freshness === 'reevaluate'));
  } finally {
    restored.close();
  }
});

test('journal replacement outside state version invalidates confirmation and previously accepted interpretation', async (t) => {
  const f = await fixture(t),
    receipt = syntheticReceipt(f);
  writeQualityRun(f.store, receipt);
  recordInterventionReview(f.store, input(review(f)));
  const view = review(f),
    version = f.store.read().version;
  writeQualityRun(f.store, { ...receipt, observed: 'Changed receipt bytes under the same id' });
  assert.equal(f.store.read().version, version);
  assert.throws(() => recordInterventionReview(f.store, input(view)), { status: 409 });
  assert.deepEqual(control(f).risk.reviewedUnknowns, []);
});

test('historical interpretation preserves the observations examined without application data values', async (t) => {
  const f = await fixture(t, 'fetch("/api/data");');
  fs.writeFileSync(
    path.join(f.root, '.devmethod/data.json'),
    JSON.stringify({ version: 8, data: { sensitiveKey: 'private-value' } }),
  );
  const receipt = syntheticReceipt(f);
  writeQualityRun(f.store, receipt);
  const saved = recordInterventionReview(
    f.store,
    input(review(f), {
      assessment: { persistentData: 'affected', contractChanged: 'affected' },
    }),
  ).decision;
  assert.equal(saved.intervention.observations?.data.version, 8);
  assert.equal(saved.intervention.observations.data.nonEmpty, true);
  assert.ok(
    saved.intervention.observations.signals.some((signal) => signal.kind === 'persistent-data'),
  );
  assert.ok(
    saved.intervention.observations.evidence.some((entry) => entry.id.includes(receipt.id)),
  );
  assert.doesNotMatch(JSON.stringify(saved), /sensitiveKey|private-value/);
  fs.writeFileSync(
    path.join(f.root, '.devmethod/data.json'),
    JSON.stringify({ version: 9, data: {} }),
  );
  writeQualityRun(f.store, { ...receipt, status: 'failed', observed: 'Changed after review' });
  assert.deepEqual(f.store.read().decisions.at(-1), saved);
  const current = review(f).consequences.reviews.at(-1);
  assert.equal(current.freshness, 'reevaluate');
  assert.deepEqual(current.observations, saved.intervention.observations);
});

test('completion cannot forge a user intervention or supersede its reserved bare topic', async (t) => {
  const f = await fixture(t),
    saved = recordInterventionReview(f.store, input(review(f))).decision;
  f.store.commit(f.store.read().version, (state) =>
    queueRequest(state, { request: 'Inspect candidate' }),
  );
  f.store.commit(f.store.read().version, (state) => claimJob(state, { worker: 'fixture' }));
  for (const bare of [false, true]) {
    const before = f.store.read(),
      forged = { ...saved, id: randomUUID(), source: 'agent' };
    if (bare) delete forged.intervention;
    assert.throws(() =>
      f.store.commit(before.version, (state) =>
        finishJob(state, {
          jobId: state.jobs.at(-1).id,
          decisions: [forged],
        }),
      ),
    );
    assert.deepEqual(f.store.read(), before);
  }
});

test('an already open delegated visual proposal cannot supersede a retained intervention stop', async (t) => {
  const f = await fixture(t);
  const held = recordInterventionReview(
    f.store,
    input(review(f), {
      resolution: 'keep-stopped',
      assessment: { persistentData: 'unknown', contractChanged: 'unknown' },
    }),
  ).decision;
  let proposalId;
  f.store.commit(f.store.read().version, (state) => {
    const proposal = proposeDecision(state, {
      topic: 'Historic free topic',
      stage: 'visual',
      question: 'Controlled authority regression',
      options: [
        {
          id: 'choice',
          title: 'Bypass',
          consequences: [],
          preview: {
            kind: 'revision',
            revisionId: f.revision.id,
            status: 'implemented',
          },
        },
      ],
    });
    // Existing proposal files remain readable after introducing the reserved topic.
    proposal.topic = held.topic;
    proposalId = proposal.id;
  });
  f.store.commit(f.store.read().version, (state) =>
    selectProposalOption(state, { proposalId, optionId: 'choice' }),
  );
  const before = f.store.read();
  assert.throws(() =>
    f.store.commit(before.version, (state) =>
      approveProposal(
        state,
        {
          proposalId,
          optionId: 'choice',
          reason: 'Attempt to replace the explicit stop',
        },
        { actor: 'agent' },
      ),
    ),
  );
  assert.deepEqual(f.store.read(), before);
  assert.ok(control(f).autonomy.reasons.includes('consequences-held'));
});
