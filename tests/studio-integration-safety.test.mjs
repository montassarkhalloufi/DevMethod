import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import {
  updateProject,
  queueRequest,
  setDraft,
  approvePlan,
  hasApprovedPlan,
  chooseDesign,
} from '../scripts/studio/domain.mjs';
import { createPreview } from '../scripts/studio/preview.mjs';
import { startStudio } from '../scripts/studio/server.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-safety-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function activeWork(t) {
  const root = fixture(t),
    store = createStudioStore(root);
  t.after(() => store.close());
  store.commit(1, (state) =>
    updateProject(state, {
      name: 'Ateliers',
      idea: 'Réserver localement',
      mode: 'delegated',
      constraints: ['Aucun compte'],
    }),
  );
  store.commit(2, (state) => queueRequest(state, { request: 'Une inscription persistante' }));
  const jobs = createJobs(store),
    claim = jobs.claim('agent-test');
  fs.writeFileSync(
    path.join(claim.workDirectory, 'index.html'),
    '<!doctype html><title>Ateliers</title><h1>Réserver</h1>',
  );
  return { root, store, jobs, claim };
}

test('starting Studio in its own package directory fails before creating project state', async (t) => {
  const root = fixture(t),
    packageRoot = path.join(root, 'package');
  // A disposable copy protects the actual source repository if the guard regresses.
  const source = fileURLToPath(new URL('../scripts/studio/', import.meta.url));
  const target = path.join(packageRoot, 'scripts', 'studio');
  fs.cpSync(source, target, { recursive: true });
  fs.cpSync(
    fileURLToPath(new URL('../dist/control-plane/', import.meta.url)),
    path.join(packageRoot, 'dist/control-plane'),
    { recursive: true },
  );
  const { startStudio } = await import(pathToFileURL(path.join(target, 'server.mjs')).href);
  await assert.rejects(startStudio({ workspace: packageRoot, port: 0 }), /distinct du dépôt/);
  assert.equal(fs.existsSync(path.join(packageRoot, '.devmethod')), false);
});

test('a project-context change during execution refuses adoption and preserves work', (t) => {
  const { root, store, jobs, claim } = activeWork(t);
  store.commit(store.read().version, (state) =>
    updateProject(state, { ...state.project, idea: 'Réserver avec liste d’attente' }),
  );
  const before = store.read();
  assert.throws(
    () =>
      jobs.finish({
        jobId: claim.job.id,
        title: 'Ancien périmètre',
        summary: 'Résultat devenu obsolète',
      }),
    { status: 409 },
  );
  assert.deepEqual(store.read(), before);
  assert.equal(fs.existsSync(path.join(claim.workDirectory, 'index.html')), true);
  assert.equal(fs.existsSync(path.join(root, 'revisions')), false);
});

test('typing a next request during execution does not invalidate the current result', (t) => {
  const { store, jobs, claim } = activeWork(t);
  store.commit(store.read().version, (state) =>
    setDraft(state, { text: 'Prochaine idée encore non envoyée' }),
  );
  const result = jobs.finish({
    jobId: claim.job.id,
    title: 'Inscription',
    summary: 'Première tranche',
  });
  assert.equal(result.state.revisions.length, 1);
  assert.equal(result.state.draft, 'Prochaine idée encore non envoyée');
});

function requestPreview(server, { origin, payload }) {
  return new Promise((resolve, reject) => {
    const request = Readable.from([Buffer.from(payload)]);
    Object.assign(request, {
      headers: { host: '127.0.0.1:19099', origin, 'content-type': 'application/json' },
      url: '/api/data',
      method: 'POST',
    });
    let status;
    const timer = setTimeout(() => reject(new Error('Preview did not handle the request')), 2000);
    server.emit('request', request, {
      writeHead(value) {
        status = value;
      },
      end(content) {
        clearTimeout(timer);
        resolve({ status, body: JSON.parse(content) });
      },
    });
  });
}

test('malicious Origin and malformed preview JSON are handled without losing persisted data', async (t) => {
  const root = fixture(t);
  const preview = createPreview({
    workspace: root,
    getState: () => ({ activeRevision: null, revisions: [] }),
  });
  preview.address = () => ({ port: 19099 });
  const malicious = await requestPreview(preview, {
    origin: 'https://outside.example',
    payload: JSON.stringify({ version: 1, data: { stolen: true } }),
  });
  assert.equal(malicious.status, 403);
  const malformed = await requestPreview(preview, {
    origin: 'http://127.0.0.1:19099',
    payload: '{broken',
  });
  assert.equal(malformed.status, 400);
  const persisted = JSON.parse(fs.readFileSync(path.join(root, '.devmethod/data.json'), 'utf8'));
  assert.deepEqual(persisted, { version: 1, data: {} });
  const valid = await requestPreview(preview, {
    origin: 'http://127.0.0.1:19099',
    payload: JSON.stringify({ version: 1, data: { registration: 'Préservée' } }),
  });
  assert.equal(valid.status, 200);
  assert.equal(valid.body.data.registration, 'Préservée');
});

test('failed preview initialization preserves corrupt data and releases the project lock', async (t) => {
  const root = fixture(t);
  createStudioStore(root).close();
  const file = path.join(root, '.devmethod/data.json');
  fs.writeFileSync(file, '{broken');
  await assert.rejects(startStudio({ workspace: root, port: 0 }));
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
  assert.equal(fs.existsSync(path.join(root, '.devmethod/studio.lock')), false);
  const reopened = createStudioStore(root);
  reopened.close();
});

test('a metadata-only scope proposal after an approved app creates no revision and reopens approval', (t) => {
  const { store, jobs, claim } = activeWork(t);
  const first = jobs.finish({ jobId: claim.job.id, title: 'Version initiale' });
  store.commit(store.read().version, (state) => {
    updateProject(state, { ...state.project, mode: 'devauto' });
    state.brief = {
      outcome: 'Réserver localement',
      scope: ['Inscription'],
      excluded: [],
      criteria: [{ id: 'c1', text: 'Conserver une inscription' }],
    };
    approvePlan(state, { reason: 'Périmètre relu' });
    queueRequest(state, { request: 'Explorer une liste d’attente, sans code avant mon accord' });
  });
  const next = jobs.claim('agent-test');
  const proposed = { ...store.read().brief, scope: ['Inscription', 'Liste d’attente'] };
  const result = jobs.finish({ jobId: next.job.id, title: 'Périmètre proposé', brief: proposed });
  assert.equal(result.revision, undefined);
  assert.equal(result.state.revisions.length, 1);
  assert.equal(result.state.activeRevision, first.revision.id);
  assert.deepEqual(result.state.brief, proposed);
  assert.equal(result.state.jobs.at(-1).status, 'ready');
  assert.equal(hasApprovedPlan(result.state), false);
});

test('runtime exposes effective delegation and visual reservation through the public API', async (t) => {
  const root = fixture(t),
    studio = await startStudio({ workspace: root, port: 0 });
  t.after(() => studio.close());
  const origin = studio.runtime().url;
  const readRuntime = async () => (await fetch(origin + '/api/runtime')).json();
  const legacy = await readRuntime();
  assert.deepEqual(legacy.delegation, { structure: 'user', visual: 'agent', adoption: 'user' });
  assert.deepEqual(legacy.approval.missing, ['structure']);
  assert.equal(legacy.approval.recorded.visual, false);
  const response = await fetch(origin + '/api/project', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: studio.store.read().version,
      name: 'Visual first',
      idea: 'Build after the visual choice',
      mode: 'guided',
      constraints: [],
      delegation: { structure: 'agent', visual: 'user', adoption: 'agent' },
    }),
  });
  assert.equal(response.status, 200);
  const reserved = await readRuntime();
  assert.deepEqual(reserved.delegation, { structure: 'agent', visual: 'user', adoption: 'agent' });
  assert.deepEqual(reserved.approval.missing, ['visual']);
  assert.equal(reserved.planApproved, false);
  assert.equal(reserved.token, undefined);
  assert.equal(reserved.agent.automatic, false);
});

test('a visual choice changed during a claimed job refuses its result and retains its work', (t) => {
  const root = fixture(t),
    store = createStudioStore(root);
  t.after(() => store.close());
  store.commit(1, (state) => {
    updateProject(state, {
      name: 'Visual',
      idea: 'An app',
      mode: 'guided',
      constraints: [],
      delegation: { structure: 'agent', visual: 'user', adoption: 'agent' },
    });
    state.references.push({
      id: 'ref',
      name: 'Choice.png',
      mime: 'image/png',
      file: 'references/choice.png',
    });
    state.designs.push(
      ...['first', 'second'].map((id) => ({ id, title: id, description: 'Fixture', file: 'ref' })),
    );
    chooseDesign(state, { id: 'first', reason: 'Initial choice' });
    queueRequest(state, { request: 'Build selected design' });
  });
  const jobs = createJobs(store),
    claim = jobs.claim('fixture');
  fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), '<h1>First design</h1>');
  store.commit(store.read().version, (state) =>
    chooseDesign(state, { id: 'second', reason: 'Changed choice during execution' }),
  );
  assert.throws(() => jobs.finish({ jobId: claim.job.id, title: 'Old visual result' }), {
    status: 409,
  });
  assert.equal(store.read().revisions.length, 0);
  assert.equal(store.read().selectedDesignId, 'second');
  assert.equal(
    fs.readFileSync(path.join(claim.workDirectory, 'index.html'), 'utf8'),
    '<h1>First design</h1>',
  );
});
