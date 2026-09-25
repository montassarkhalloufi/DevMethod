import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { startStudio } from '../scripts/studio/server.mjs';
import { updateProject, queueRequest, activateRevision } from '../scripts/studio/domain.mjs';
import { createControlPlane } from '../scripts/studio/control-plane.mjs';
import {
  configureProjectConnector,
  reportConnectorProbe,
  prepareExternalQualityRun,
} from '../scripts/studio/connectors.mjs';
import { importExternalQualityResult } from '../scripts/studio/quality.mjs';
import { evaluateControl } from '../dist/control-plane/engine.js';

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-control-'));
  let studio = await startStudio({ workspace: root, port: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  studio.store.commit(studio.store.read().version, (state) =>
    updateProject(state, {
      name: 'Control fixture',
      idea: 'Observer des fichiers de test',
      mode: 'delegated',
      constraints: [],
    }),
  );
  const api = async (route = '', input, headers) => {
    const url = studio.runtime().url;
    const response = await fetch(
      url + '/api/control' + route,
      input === undefined
        ? { headers }
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Origin: url, ...headers },
            body: JSON.stringify(input),
          },
    );
    return { status: response.status, value: await response.json() };
  };
  const deliver = (files) => {
    studio.store.commit(studio.store.read().version, (state) =>
      queueRequest(state, { request: 'Fixture locale pour tester les preuves' }),
    );
    const claim = studio.jobs.claim('local-test');
    for (const [name, text] of Object.entries(files))
      fs.writeFileSync(path.join(claim.workDirectory, name), text);
    studio.jobs.finish({
      jobId: claim.job.id,
      title: 'Version de test',
      summary: 'Fichiers créés par le test, aucune génération modèle.',
    });
    return studio.store.read().revisions.at(-1).id;
  };
  return {
    api,
    deliver,
    get studio() {
      return studio;
    },
    async restart() {
      await studio.close();
      studio = await startStudio({ workspace: root, port: 0 });
    },
  };
}

const proof = (report, id) => report.snapshot.nodes.find((node) => node.checkId === id);

test('real checks have run IDs, retries are idempotent and revision invalidation is targeted', async (t) => {
  const f = await fixture(t);
  await f.api();
  const first = f.deliver({
    'index.html': '<!doctype html><h1>Test</h1>',
    'main.js': 'const value = 1;',
    'data.json': '{"value":1}',
  });
  assert.equal(f.studio.store.read().activeRevision, null);
  let report = (await f.api('?revision=' + first)).value;
  assert.equal(report.snapshot.decision.effective, 'Verify');
  const request = { revisionId: first, checkId: 'source-syntax', requestId: randomUUID() };
  report = (await f.api('/verify', request)).value;
  assert.equal(proof(report, 'source-syntax').outcome, 'passed');
  const runId = proof(report, 'source-syntax').runId;
  assert.ok(runId);
  const count = f.studio.store.read().checks.length;
  assert.equal(proof((await f.api('/verify', request)).value, 'source-syntax').runId, runId);
  assert.equal(f.studio.store.read().checks.length, count);
  assert.equal((await f.api('/verify', { ...request, checkId: 'json-format' })).status, 409);
  await f.api('/verify', { revisionId: first, checkId: 'json-format' });
  f.studio.store.commit(f.studio.store.read().version, (state) =>
    activateRevision(state, { id: first, reason: 'Périmètre de la fixture' }),
  );
  const second = f.deliver({ 'data.json': '{"value":2}' });
  report = (await f.api('?revision=' + second)).value;
  assert.equal(proof(report, 'source-syntax').freshness, 'current');
  assert.equal(proof(report, 'json-format').freshness, 'stale');
  assert.equal(proof(report, 'visual-comparison').status, 'missing');
  assert.equal(report.snapshot.decision.effective, 'Verify');
  report = (await f.api('/verify', { revisionId: second, checkId: 'json-format' })).value;
  assert.equal(proof(report, 'json-format').freshness, 'current');
  assert.equal(proof(report, 'json-format').revisionId, second);
  assert.equal(
    report.snapshot.decision.effective,
    'Verify',
    'unexecuted browser and visual proofs still prevent auto continuation',
  );
  assert.equal(
    (await f.api('/verify', { revisionId: second, checkId: 'visual-comparison' })).status,
    409,
  );
  const missing = report.snapshot.evidence.missing;
  assert.ok(missing > 0);
});

test('human decisions are revision scoped, concurrent safe, append only and restored after restart', async (t) => {
  const f = await fixture(t);
  await f.api();
  const revisionId = f.deliver({
    'index.html': '<h1>Test</h1>',
    'permissions.json': '{"access":"read"}',
  });
  let report = (await f.api('?revision=' + revisionId)).value;
  assert.equal(report.snapshot.decision.effective, 'Human Decision');
  const item = report.attention.find((entry) => entry.riskIds.includes('permission-change'));
  const decision = {
    version: report.version,
    snapshotKey: report.snapshot.key,
    itemId: item.id,
    resolution: 'accept',
    reason: 'La fixture ne donne accès à aucun service externe.',
  };
  assert.equal((await f.api('/decide', { ...decision, version: report.version - 1 })).status, 409);
  assert.equal((await f.api('/decide', { ...decision, reason: '' })).status, 400);
  report = (await f.api('/decide', decision)).value;
  assert.equal(report.snapshot.decision.effective, 'Verify');
  assert.equal(report.interventions.length, 1);
  assert.equal((await f.api('/decide', decision)).value.interventions.length, 1);
  assert.ok(report.snapshot.nodes.some((node) => node.kind === 'human'));
  assert.throws(
    () =>
      f.studio.store.commit(f.studio.store.read().version, (state) => {
        state.controlPlane.interventions = [];
      }),
    /passé/,
  );
  const saved = structuredClone(f.studio.store.read().controlPlane);
  await f.restart();
  const restored = (await f.api('?revision=' + revisionId)).value;
  assert.deepEqual(restored.interventions, saved.interventions);
  assert.deepEqual(restored.history, saved.history);
  assert.deepEqual(evaluateControl(saved.snapshot.input, saved), saved);
  assert.equal(restored.attention.filter((entry) => entry.id === item.id).length, 1);
});

test('routes reject forged input and worker decisions; unavailable sources never create green evidence', async (t) => {
  const f = await fixture(t);
  const empty = await f.api();
  assert.ok(empty.value.snapshot.risk.limits.some((text) => text.includes('Aucune version')));
  assert.notEqual(empty.value.snapshot.decision.effective, 'Auto-Continue');
  assert.equal((await f.api('', undefined, { Origin: 'https://foreign.example' })).status, 403);
  assert.equal((await f.api('', undefined, { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal((await f.api('?revision=unknown')).status, 404);
  assert.equal((await f.api('/read', { unknown: true })).status, 400);
  assert.equal(
    (await f.api('/decide', {}, { Authorization: 'Bearer ' + f.studio.runtime().token })).status,
    403,
  );
  const id = f.deliver({ 'index.html': '<h1>Test</h1>' });
  const plane = await createControlPlane({
    store: f.studio.store,
    broker: {
      actions() {
        throw new Error('private-provider-value');
      },
    },
  });
  const unavailable = plane.read(id);
  assert.equal(unavailable.snapshot.decision.effective, 'Verify');
  assert.ok(unavailable.snapshot.input.sourceIssues.some((text) => text.includes('MCP')));
  assert.equal(JSON.stringify(unavailable).includes('private-provider-value'), false);
  fs.writeFileSync(
    path.join(f.studio.store.root, 'revisions', id, 'app/index.html'),
    '<h1>Changed outside Studio</h1>',
  );
  const divergent = (await f.api('?revision=' + id)).value;
  assert.notEqual(divergent.snapshot.decision.effective, 'Auto-Continue');
  assert.equal(divergent.snapshot.evidence.current, 0);
});

test('repeated failure stops new jobs persistently and mode changes recalculate the decision', async (t) => {
  const f = await fixture(t);
  await f.api();
  for (let index = 0; index < 2; index++) {
    f.studio.store.commit(f.studio.store.read().version, (state) =>
      queueRequest(state, { request: 'Reproduire un échec de fixture' }),
    );
    const { job } = f.studio.jobs.claim('test');
    f.studio.jobs.fail({ jobId: job.id, error: 'Identical bounded fixture failure' });
  }
  const stopped = (await f.api()).value;
  assert.equal(stopped.snapshot.decision.effective, 'Bounded Stop');
  assert.throws(() => f.studio.jobs.claim('blocked'), /Bounded Stop/);
  await f.restart();
  assert.equal((await f.api()).value.snapshot.decision.effective, 'Bounded Stop');
  f.studio.store.commit(f.studio.store.read().version, (state) =>
    updateProject(state, { ...state.project, mode: 'guided' }),
  );
  const guided = (await f.api()).value;
  assert.equal(guided.snapshot.decision.requested, 'guided');
  assert.equal(guided.snapshot.decision.effective, 'Bounded Stop');
  assert.ok(guided.history.length > stopped.history.length);
});

test('current host-attested coverage permits a scoped continuation and keeps user-reserved application blocked', async (t) => {
  const f = await fixture(t);
  f.studio.store.commit(f.studio.store.read().version, (state) => {
    state.brief.criteria = [{ id: 'heading', text: 'Afficher le titre de la fixture' }];
  });
  await f.api();
  const revisionId = f.deliver({ 'index.html': '<!doctype html><h1>Protocol fixture</h1>' });
  let report = (await f.api('?revision=' + revisionId)).value;
  assert.equal(
    (await f.api('/continue', { version: report.version, snapshotKey: report.snapshot.key }))
      .status,
    409,
  );
  for (const node of report.snapshot.nodes.filter((entry) => entry.canRun))
    await f.api('/verify', { revisionId, checkId: node.checkId });
  const store = f.studio.store;
  configureProjectConnector(store, {
    id: 'browser-fixture',
    optionId: 'playwright',
    purpose: 'diagnostics',
    profileRef: 'host:control-protocol-fixture',
    secretRefs: [],
  });
  reportConnectorProbe(store, {
    connectionId: 'browser-fixture',
    connectionVersion: 1,
    eventId: 'fixture-probe',
    status: 'available',
    tool: { name: 'Protocol fixture only', version: '1' },
    capabilities: ['browser-testing'],
    observedAt: new Date().toISOString(),
  });
  for (const checkId of ['business-journey', 'end-to-end', 'visual-comparison']) {
    const ticket = prepareExternalQualityRun(store, {
      connectionId: 'browser-fixture',
      revisionId,
      checkId,
    });
    importExternalQualityResult(store, {
      runId: ticket.runId,
      connectionId: ticket.connectionId,
      revisionId,
      fingerprint: ticket.fingerprint,
      tool: ticket.tool,
      source: { kind: 'host-local' },
      startedAt: ticket.admittedAt,
      finishedAt: new Date().toISOString(),
      status: 'passed',
      observed:
        'Attestation simulée pour tester le contrat du pont ; aucune validation navigateur réelle.',
      findings: [],
      metrics: {},
    });
  }
  report = (await f.api('?revision=' + revisionId)).value;
  assert.equal(report.snapshot.evidence.missing, 0);
  assert.equal(report.snapshot.decision.effective, 'Auto-Continue');
  assert.equal(report.continuation.available, true);
  const applied = await f.api(
    '/continue',
    { version: report.version, snapshotKey: report.snapshot.key },
    { Authorization: 'Bearer ' + f.studio.runtime().token },
  );
  assert.equal(applied.status, 200);
  assert.equal(store.read().activeRevision, revisionId);
  assert.equal(store.read().decisions.at(-1).source, 'agent');
  assert.equal(applied.value.continuation.available, false);
  const next = f.deliver({ 'index.html': '<!doctype html><h1>New revision</h1>' });
  const fresh = (await f.api('?revision=' + next)).value;
  assert.equal(fresh.snapshot.decision.effective, 'Verify');
  assert.equal(store.read().activeRevision, revisionId);
  store.commit(store.read().version, (state) =>
    updateProject(state, { ...state.project, mode: 'guided' }),
  );
  const reserved = (await f.api('?revision=' + next)).value;
  assert.equal(reserved.snapshot.decision.effective, 'Human Decision');
  assert.equal(reserved.continuation.available, false);
});
