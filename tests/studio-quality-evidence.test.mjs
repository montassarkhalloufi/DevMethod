import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { evaluateControl } from '../scripts/studio/control-policy.mjs';
import { createControlView } from '../scripts/studio/public/control-view.js';
import { fileManifest } from '../scripts/studio/files.mjs';
import {
  qualitySnapshot,
  writeQualityRun,
  readQualityRuns,
} from '../scripts/studio/quality-storage.mjs';
import {
  activeQualityRuns,
  readControlEvidence,
  readControlQuality,
} from '../scripts/studio/quality-evidence.mjs';
import { readProjectControl } from '../scripts/studio/control.mjs';
import { businessCriteriaFingerprint } from '../scripts/studio/quality-criteria.mjs';
import { configureProjectConnector, reportConnectorProbe } from '../scripts/studio/connectors.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'quality-evidence-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const id = randomUUID(),
    source = path.join(root, 'revisions', id, 'app');
  fs.mkdirSync(source, { recursive: true });
  fs.writeFileSync(path.join(source, 'main.js'), 'const answer = 42;');
  const revision = { id, files: fileManifest(source) };
  const state = {
    version: 1,
    activeRevision: id,
    revisions: [revision],
    checks: [],
    events: [],
    decisions: [],
    brief: { criteria: [{ id: 'save', text: 'Keep entered data' }] },
  };
  const store = {
    root,
    read: () => structuredClone(state),
    commit: (_, mutate) => {
      mutate(state);
      state.version++;
      return structuredClone(state);
    },
  };
  const run = (extra = {}) => {
    const timestamp = new Date().toISOString();
    const value = {
      schemaVersion: 1,
      id: randomUUID(),
      checkId: 'source-syntax',
      title: 'Controlled receipt fixture',
      revisionId: id,
      fingerprint: qualitySnapshot(store, revision).fingerprint,
      status: 'passed',
      tool: 'Fixture',
      environment: 'Controlled test fixture, no provider call',
      expected: 'Mapping contract',
      startedAt: timestamp,
      finishedAt: timestamp,
      observed: 'Fixture result',
      findings: [],
      limits: ['Fixture only'],
      events: [],
      ...extra,
    };
    writeQualityRun(store, value);
    return value;
  };
  return { root, id, source, state, store, run };
}

test('real local adapter receipt maps once with its linked historical check', async (t) => {
  const f = fixture(t);
  const { runProjectQuality } = await import('../scripts/studio/quality.mjs');
  await runProjectQuality(f.store, f.id, 'source-syntax');
  const evidence = readControlEvidence(f.store, f.id);
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].trusted, true);
  assert.equal(evidence[0].provenance, 'studio-adapter');
  assert.equal(evidence[0].executor, 'studio');
  assert.equal(evidence[0].status, 'passed');
  assert.equal(evidence[0].linkedCheckId, f.state.checks[0].id);
  assert.deepEqual(evidence[0].criterionIds, []);
});

test('host business reports retain claimed scope without gaining verified criteria or Studio trust', (t) => {
  const f = fixture(t);
  const run = f.run({
    checkId: 'business-journey',
    source: { kind: 'host-api' },
    businessCriteria: {
      criteria: f.state.brief.criteria,
      fingerprint: businessCriteriaFingerprint(f.state),
    },
  });
  const evidence = readControlEvidence(f.store, f.id)[0];
  assert.equal(evidence.id, `quality:${run.id}`);
  assert.equal(evidence.provenance, 'host-attested');
  assert.equal(evidence.trusted, false);
  assert.equal(evidence.executor, undefined);
  assert.deepEqual(evidence.criterionIds, []);
  assert.deepEqual(evidence.reportedCriterionIds, ['save']);
  // Exercise the persisted report → quality normalizer → graph → UI contract.
  // A fixture report names a criterion; neither this test nor its UI attest that it ran.
  const control = evaluateControl({
    state: { ...f.state, project: { mode: 'guided' }, jobs: [] },
    revisionId: f.id,
    evidence: [evidence],
    admission: { allowed: true },
  });
  assert.equal(
    control.graph.edges.some((edge) => edge.relation === 'covers'),
    false,
  );
  const dom = new JSDOM('<html lang="fr" data-studio-language-ready><main></main>');
  t.after(() => dom.window.close());
  const root = dom.window.document.querySelector('main');
  root.append(...createControlView(dom.window.document, control, f.id));
  assert.match(
    root.textContent,
    /Critères déclarés par le rapport : save\. Cette déclaration ne démontre pas leur couverture\./,
  );
  assert.match(root.textContent, /Provenance : attestation de l’agent hôte/);
  assert.match(root.textContent, /Des critères attendent une preuve de fonctionnement/);
});

test('criteria changes invalidate only business evidence; file changes invalidate dependent revision checks', (t) => {
  const f = fixture(t);
  const technical = f.run({ source: { kind: 'studio-adapter' } });
  const business = f.run({
    checkId: 'business-journey',
    source: { kind: 'host-api' },
    businessCriteria: {
      criteria: f.state.brief.criteria,
      fingerprint: businessCriteriaFingerprint(f.state),
    },
  });
  f.state.brief.criteria[0].text = 'Keep entered data after restart';
  let evidence = readControlEvidence(f.store, f.id);
  assert.equal(evidence.find((entry) => entry.id.endsWith(technical.id)).freshness, 'current');
  assert.equal(evidence.find((entry) => entry.id.endsWith(business.id)).freshness, 'reevaluate');
  fs.writeFileSync(path.join(f.source, 'main.js'), 'const changed = true;');
  evidence = readControlEvidence(f.store, f.id);
  assert.ok(evidence.every((entry) => entry.freshness === 'reevaluate'));
  assert.match(readControlQuality(f.store, f.id).issue, /diffèrent/);
});

test('provider configuration changes invalidate dependent evidence only', (t) => {
  const f = fixture(t);
  const configuration = {
    id: 'tool-1',
    optionId: 'node-check',
    purpose: 'diagnostics',
    profileRef: 'host:fixture',
    secretRefs: [],
  };
  configureProjectConnector(f.store, configuration);
  reportConnectorProbe(f.store, {
    connectionId: 'tool-1',
    connectionVersion: 1,
    eventId: 'probe-1',
    status: 'available',
    tool: { name: 'Node.js', version: process.versions.node },
    capabilities: ['code-quality'],
    observedAt: new Date().toISOString(),
  });
  const external = f.run({
    tool: 'Node.js',
    toolVersion: process.versions.node,
    source: { kind: 'host-local' },
    provider: { connectionId: 'tool-1', connectionVersion: 1, optionId: 'node-check' },
  });
  const local = f.run({ source: { kind: 'studio-adapter' } });
  assert.equal(
    readControlEvidence(f.store, f.id).find((entry) => entry.id.endsWith(external.id)).freshness,
    'current',
  );
  configureProjectConnector(f.store, {
    ...configuration,
    expectedVersion: 1,
    profileRef: 'host:changed',
  });
  const evidence = readControlEvidence(f.store, f.id);
  assert.equal(evidence.find((entry) => entry.id.endsWith(external.id)).freshness, 'reevaluate');
  assert.equal(evidence.find((entry) => entry.id.endsWith(local.id)).freshness, 'current');
});

test('running history is blocked after interruption; shared active execution is not falsely interrupted', (t) => {
  const f = fixture(t),
    run = f.run({ status: 'running', finishedAt: null });
  assert.equal(readControlEvidence(f.store, f.id)[0].status, 'blocked');
  activeQualityRuns.set(f.store, new Map([[run.id, run]]));
  assert.equal(readControlEvidence(f.store, f.id)[0].status, 'running');
  activeQualityRuns.delete(f.store);
  assert.equal(
    readQualityRuns(f.store)[0].status,
    'running',
    'read-only normalization preserves history',
  );
});

test('legacy or unknown adapter records never acquire trust; other revision stays obsolete', (t) => {
  const f = fixture(t);
  f.run();
  f.run({ checkId: 'business-journey', source: { kind: 'studio-adapter' } });
  const foreign = f.run({ revisionId: randomUUID(), source: { kind: 'studio-adapter' } });
  const evidence = readControlEvidence(f.store, f.id);
  assert.ok(evidence.filter((entry) => entry.revisionId === f.id).every((entry) => !entry.trusted));
  assert.equal(evidence.find((entry) => entry.id.endsWith(foreign.id)).freshness, 'obsolete');
  assert.throws(() => readControlEvidence(f.store, 'missing'), /inconnue/);
});

test('runtime control consumes real local quality checks and detects later source tampering', async (t) => {
  const f = fixture(t);
  f.state.project = { mode: 'delegated' };
  f.state.jobs = [];
  const { runProjectQuality } = await import('../scripts/studio/quality.mjs');
  await runProjectQuality(f.store, f.id, 'source-syntax');
  let control = readProjectControl(f.store, { automatic: true });
  const nodes = control.graph.nodes.filter((entry) => entry.type === 'evidence');
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].provenance, 'studio-adapter');
  assert.equal(nodes[0].freshness, 'current');
  assert.equal(nodes[0].trusted, true);
  assert.notEqual(control.autonomy.action, 'continue');
  fs.writeFileSync(path.join(f.source, 'main.js'), 'const broken = ;');
  control = readProjectControl(f.store, { automatic: true });
  assert.equal(control.autonomy.action, 'stop');
  assert.ok(control.autonomy.reasons.includes('context-changed'));
  assert.equal(
    control.graph.nodes.find((entry) => entry.type === 'evidence').freshness,
    'reevaluate',
  );
});

test('unreadable quality history stops control without making the project unreadable', (t) => {
  const f = fixture(t);
  f.state.project = { mode: 'delegated' };
  f.state.jobs = [];
  const run = f.run();
  const dir = path.join(f.root, '.devmethod', 'quality');
  fs.writeFileSync(path.join(dir, `${run.id}.json`), '{');
  const control = readProjectControl(f.store, { automatic: true });
  assert.equal(control.autonomy.action, 'stop');
  assert.ok(control.autonomy.reasons.includes('context-changed'));
});

const earlierExecution = {
  startedAt: '2026-09-21T08:00:00.000Z',
  finishedAt: '2026-09-21T08:00:01.000Z',
};
const laterExecution = {
  startedAt: '2026-09-21T08:00:02.000Z',
  finishedAt: '2026-09-21T08:00:03.000Z',
};

test('completed rerun supersedes only its previous same-scope result, preserving another failed check', (t) => {
  const f = fixture(t),
    source = { kind: 'studio-adapter' };
  const old = f.run({ ...earlierExecution, source, status: 'failed' });
  const other = f.run({
    ...earlierExecution,
    source,
    status: 'failed',
    checkId: 'relative-imports',
  });
  const latest = f.run({ ...laterExecution, source, status: 'passed' });
  const evidence = readControlEvidence(f.store, f.id);
  const previous = evidence.find((entry) => entry.id.endsWith(old.id));
  assert.equal(previous.status, 'failed');
  assert.equal(previous.freshness, 'obsolete');
  assert.equal(previous.supersededBy, `quality:${latest.id}`);
  assert.equal(evidence.find((entry) => entry.id.endsWith(other.id)).freshness, 'current');
  assert.equal(evidence.find((entry) => entry.id.endsWith(latest.id)).freshness, 'current');
  assert.equal(
    readQualityRuns(f.store).find((entry) => entry.id === old.id).supersededBy,
    undefined,
  );
});

for (const status of ['running', 'blocked'])
  test(`a ${status} rerun cannot supersede an earlier failure`, (t) => {
    const f = fixture(t),
      source = { kind: 'studio-adapter' };
    const old = f.run({ ...earlierExecution, source, status: 'failed' });
    f.run({ ...laterExecution, source, status });
    const previous = readControlEvidence(f.store, f.id).find((entry) => entry.id.endsWith(old.id));
    assert.equal(previous.freshness, 'current');
    assert.equal(previous.supersededBy, null);
  });

test('failed rerun supersedes passed result without using the old success as current evidence', (t) => {
  const f = fixture(t),
    source = { kind: 'studio-adapter' };
  const old = f.run({ ...earlierExecution, source });
  f.run({ ...laterExecution, source, status: 'failed' });
  assert.equal(
    readControlEvidence(f.store, f.id).find((entry) => entry.id.endsWith(old.id)).freshness,
    'obsolete',
  );
});

test('host result, different protocol and changed criteria cannot supersede local technical history', (t) => {
  const f = fixture(t),
    source = { kind: 'studio-adapter' };
  const old = f.run({ ...earlierExecution, source, status: 'failed' });
  f.run({ ...laterExecution, source: { kind: 'host-local' } });
  f.run({ ...laterExecution, source, protocol: 'other-protocol' });
  f.run({
    ...laterExecution,
    source,
    businessCriteria: { fingerprint: 'different', criteria: [] },
  });
  assert.equal(
    readControlEvidence(f.store, f.id).find((entry) => entry.id.endsWith(old.id)).freshness,
    'current',
  );
});

test('indistinguishable execution timestamps remain unresolved instead of inventing an ordering', (t) => {
  const f = fixture(t),
    source = { kind: 'studio-adapter' };
  f.run({ ...earlierExecution, source, status: 'failed' });
  f.run({ ...earlierExecution, source, status: 'passed' });
  assert.ok(readControlEvidence(f.store, f.id).every((entry) => entry.freshness === 'current'));
});

test('control graph retains explicit replacement without treating the earlier failure as current', (t) => {
  const f = fixture(t);
  f.state.project = { mode: 'delegated' };
  f.state.jobs = [];
  const source = { kind: 'studio-adapter' };
  const previous = f.run({ ...earlierExecution, source, status: 'failed' });
  const latest = f.run({ ...laterExecution, source, status: 'passed' });
  const control = readProjectControl(f.store, { automatic: true });
  assert.ok(
    control.graph.edges.some(
      (edge) =>
        edge.from === `evidence:quality:${previous.id}` &&
        edge.to === `evidence:quality:${latest.id}` &&
        edge.relation === 'superseded-by',
    ),
  );
  assert.equal(control.autonomy.action, 'strengthen-verification');
});
