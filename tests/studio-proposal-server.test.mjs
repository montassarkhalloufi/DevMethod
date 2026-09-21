import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startStudio } from '../scripts/studio/server.mjs';
import { digest } from '../scripts/studio/files.mjs';

async function setup(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-proposal-http-'));
  const studio = await startStudio({ workspace: path.join(root, 'project'), port: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { force: true, recursive: true });
  });
  const post = async (route, input, { worker = false, origin } = {}) => {
    const runtime = studio.runtime();
    const response = await fetch(runtime.url + route, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(worker
          ? { Authorization: 'Bearer ' + runtime.token }
          : { Origin: origin || runtime.url }),
      },
      body: JSON.stringify({ version: studio.store.read().version, ...input }),
    });
    return { status: response.status, body: await response.json() };
  };
  const initial = await post('/api/project', {
    name: 'Comparaison HTTP',
    idea: 'Choisir une solution puis la réaliser.',
    mode: 'delegated',
    constraints: [],
  });
  assert.equal(initial.status, 200);
  return { studio, post, get: (route) => fetch(studio.runtime().url + route) };
}

const proposal = () => ({
  id: 'navigation',
  topic: 'Navigation des activités',
  stage: 'implementation',
  question: 'Comment retrouver les activités ?',
  options: [
    { id: 'list', title: 'Liste filtrable', consequences: ['Un écran compact.'] },
    { id: 'calendar', title: 'Calendrier', consequences: ['Vue des dates, davantage de place.'] },
  ],
  recommendation: { optionId: 'list', reason: 'Le besoin actuel tient dans une liste.' },
});

test('worker proposal approval requires current CAS and delegation, preserves the draft and records only agent authority', async (t) => {
  for (const structure of ['user', 'agent']) {
    const env = await setup(t);
    await env.post('/api/project', {
      ...env.studio.store.read().project,
      delegation: { structure, visual: 'agent', adoption: 'user' },
    });
    await env.post('/api/proposals', proposal(), { worker: true });
    await env.post(
      '/api/proposals/select',
      { proposalId: 'navigation', optionId: 'list' },
      { worker: true },
    );
    const version = env.studio.store.read().version;
    await env.post('/api/draft', { text: 'Saisie non envoyée à conserver.' });
    const before = env.studio.store.read();
    const route = '/api/proposals/delegate-approval';
    const input = {
      proposalId: 'navigation',
      optionId: 'list',
      reason: 'Choix dans la délégation.',
    };
    assert.equal((await env.post(route, input)).status, 403);
    assert.equal((await env.post(route, { ...input, version }, { worker: true })).status, 409);
    assert.equal(
      (await env.post(route, { ...input, actor: 'user' }, { worker: true })).status,
      400,
    );
    assert.deepEqual(env.studio.store.read(), before);
    const response = await env.post(route, input, { worker: true });
    if (structure === 'user') {
      assert.equal(response.status, 409);
      assert.deepEqual(env.studio.store.read(), before);
      continue;
    }
    assert.equal(response.status, 200, JSON.stringify(response.body));
    const state = response.body.state;
    assert.equal(state.proposals[0].resolution.source, 'agent');
    assert.equal(state.decisions.at(-1).source, 'agent');
    assert.equal(state.jobs.length, 1);
    assert.equal(state.jobs[0].status, 'queued');
    assert.equal(state.draft, before.draft);
    assert.equal(state.activeRevision, null);
    assert.deepEqual(state.checks, []);
    assert.equal((await env.post(route, input, { worker: true })).status, 409);
    assert.deepEqual(env.studio.store.read(), state);
  }
});

async function prepareMaster(env, visual) {
  await env.post('/api/project', {
    ...env.studio.store.read().project,
    delegation: { structure: 'agent', visual, adoption: 'user' },
  });
  const imported = await env.post('/api/references', {
    name: 'Master de transport',
    mime: 'image/png',
    base64:
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=',
  });
  assert.equal(imported.status, 200);
  await env.post('/api/requests', {
    request: 'Préparer une direction avec une référence existante.',
  });
  const claim = await env.post('/api/jobs/claim', { worker: 'Fixture' }, { worker: true });
  const finished = await env.post(
    '/api/jobs/finish',
    {
      jobId: claim.body.job.id,
      designs: [
        { id: 'direction', title: 'Direction', description: '', file: imported.body.reference.id },
      ],
    },
    { worker: true },
  );
  assert.equal(finished.status, 200, JSON.stringify(finished.body));
  await env.post('/api/design', { id: 'direction', reason: 'Choisir la direction.' });
  const master = await env.post(
    '/api/design/master',
    {
      id: 'master',
      designId: 'direction',
      referenceId: imported.body.reference.id,
    },
    { worker: true },
  );
  assert.equal(master.status, 200, JSON.stringify(master.body));
}

test('worker master approval cannot override a visual reservation or impersonate a user and requires current CAS', async (t) => {
  for (const visual of ['user', 'agent']) {
    const env = await setup(t);
    await prepareMaster(env, visual);
    const version = env.studio.store.read().version;
    await env.post('/api/draft', { text: 'Autre réflexion.' });
    const before = env.studio.store.read();
    const route = '/api/design/master/delegate-approval';
    const input = { masterId: 'master', reason: 'Examen du master sous délégation.' };
    assert.equal((await env.post(route, input)).status, 403);
    assert.equal((await env.post(route, { ...input, version }, { worker: true })).status, 409);
    assert.equal(
      (await env.post(route, { ...input, approvedBy: 'user' }, { worker: true })).status,
      400,
    );
    assert.deepEqual(env.studio.store.read(), before);
    const response = await env.post(route, input, { worker: true });
    if (visual === 'user') {
      assert.equal(response.status, 409);
      assert.deepEqual(env.studio.store.read(), before);
      continue;
    }
    assert.equal(response.status, 200, JSON.stringify(response.body));
    const state = response.body.state;
    assert.equal(state.designJourney.masters[0].approvedBy, 'agent');
    assert.equal(state.designJourney.masters[0].source, 'agent');
    assert.equal(state.designJourney.masters[0].approvalReason, input.reason);
    assert.deepEqual(state.jobs, before.jobs);
    assert.deepEqual(state.decisions, before.decisions);
    assert.equal(state.draft, before.draft);
    assert.equal(state.activeRevision, null);
    assert.equal((await (await env.get('/api/runtime')).json()).approval.visualBlock, null);
    assert.equal((await env.post(route, input, { worker: true })).status, 409);
    assert.deepEqual(env.studio.store.read(), state);
  }
});

test('HTTP selection is not approval; approval queues exactly one job without adoption, checks or lost composer input', async (t) => {
  const env = await setup(t);
  const created = await env.post('/api/proposals', proposal(), { worker: true });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const unselected = await env.post('/api/proposals/approve', {
    proposalId: 'navigation',
    optionId: 'list',
    reason: 'Choix explicite.',
  });
  assert.equal(unselected.status, 409);
  const selected = await env.post('/api/proposals/select', {
    proposalId: 'navigation',
    optionId: 'list',
  });
  assert.equal(selected.status, 200);
  assert.equal(selected.body.state.proposals[0].resolution, null);
  assert.equal(selected.body.state.jobs.length, 0);
  assert.equal(selected.body.state.decisions.length, 0);
  await env.post('/api/draft', { text: 'Une autre idée non envoyée.' });
  const approved = await env.post('/api/proposals/approve', {
    proposalId: 'navigation',
    optionId: 'list',
    reason: 'Je préfère la densité.',
  });
  assert.equal(approved.status, 200, JSON.stringify(approved.body));
  const state = approved.body.state;
  assert.equal(state.proposals[0].resolution.source, 'user');
  assert.equal(state.proposals[0].resolution.optionId, 'list');
  assert.equal(state.jobs.length, 1);
  assert.equal(state.jobs[0].status, 'queued');
  assert.match(state.jobs[0].request, /Liste filtrable/);
  assert.equal(state.activeRevision, null);
  assert.deepEqual(state.revisions, []);
  assert.deepEqual(state.checks, []);
  assert.equal(state.draft, 'Une autre idée non envoyée.');
  const duplicate = await env.post('/api/proposals/approve', {
    proposalId: 'navigation',
    optionId: 'list',
    reason: 'Double clic.',
  });
  assert.equal(duplicate.status, 409);
  assert.deepEqual(env.studio.store.read(), state);
});

test('worker creation is protected and a worker token cannot impersonate browser approval', async (t) => {
  const env = await setup(t);
  const before = env.studio.store.read();
  assert.equal((await env.post('/api/proposals', proposal())).status, 403);
  assert.deepEqual(env.studio.store.read(), before);
  assert.equal(
    (await env.post('/api/proposals', { ...proposal(), source: 'user' }, { worker: true })).status,
    400,
  );
  assert.deepEqual(env.studio.store.read(), before);
  assert.equal((await env.post('/api/proposals', proposal(), { worker: true })).status, 200);
  assert.equal(
    (await env.post('/api/proposals/select', { proposalId: 'navigation', optionId: 'list' }))
      .status,
    200,
  );
  const selected = env.studio.store.read();
  const input = {
    proposalId: 'navigation',
    optionId: 'list',
    reason: 'Ne doit pas devenir un accord humain.',
  };
  assert.equal(
    (await env.post('/api/proposals/approve', input, { origin: 'https://untrusted.example' }))
      .status,
    403,
  );
  assert.equal((await env.post('/api/proposals/approve', input, { worker: true })).status, 403);
  const authorityChange = await env.post(
    '/api/project',
    {
      ...selected.project,
      mode: 'delegated',
      delegation: { structure: 'agent', visual: 'agent', adoption: 'agent' },
    },
    { worker: true },
  );
  assert.equal(authorityChange.status, 403);
  for (const route of [
    '/api/design/master/approve',
    '/api/design',
    '/api/approve',
    '/api/activate',
    '/api/jobs/recover-work',
    '/api/control/discard',
  ])
    assert.equal((await env.post(route, {}, { worker: true })).status, 403);
  assert.deepEqual(env.studio.store.read(), selected);
});

test('a changed project context invalidates a selected proposal without resolving or queuing it', async (t) => {
  const env = await setup(t);
  await env.post('/api/proposals', proposal(), { worker: true });
  await env.post('/api/proposals/select', { proposalId: 'navigation', optionId: 'list' });
  await env.post('/api/project', {
    ...env.studio.store.read().project,
    idea: 'Le besoin a changé : ajouter des équipes.',
  });
  const before = env.studio.store.read();
  const stale = await env.post('/api/proposals/approve', {
    proposalId: 'navigation',
    optionId: 'list',
    reason: 'Ancien choix.',
  });
  assert.equal(stale.status, 409);
  assert.match(stale.body.error, /contexte ou la version a changé/);
  assert.deepEqual(env.studio.store.read(), before);
});

test('visual approval keeps a simulation identified and does not activate code or queue implementation', async (t) => {
  const env = await setup(t);
  await env.post('/api/project', {
    ...env.studio.store.read().project,
    delegation: { structure: 'agent', visual: 'user', adoption: 'user' },
  });
  const imported = await env.post('/api/references', {
    name: 'Image de test de transport',
    mime: 'image/png',
    base64:
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=',
  });
  assert.equal(imported.status, 200);
  const input = proposal();
  input.stage = 'visual';
  input.options = input.options.map((option) => ({
    ...option,
    preview: { kind: 'image', referenceId: imported.body.reference.id, status: 'simulation' },
  }));
  assert.equal((await env.post('/api/proposals', input, { worker: true })).status, 200);
  await env.post('/api/proposals/select', { proposalId: 'navigation', optionId: 'list' });
  const result = await env.post('/api/proposals/approve', {
    proposalId: 'navigation',
    optionId: 'list',
    reason: 'Choix de la direction uniquement.',
  });
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.state.proposals[0].resolution.preview.status, 'simulation');
  assert.equal(result.body.state.selectedDesignId, null);
  assert.equal(result.body.state.activeRevision, null);
  assert.deepEqual(result.body.state.jobs, []);
  assert.deepEqual(result.body.state.checks, []);
  assert.equal((await (await env.get('/api/runtime')).json()).approval.visualApproved, false);
});

test('HTTP runtime catalog and real health probes expose known sources and declared services without changing data', async (t) => {
  const env = await setup(t);
  await env.post('/api/requests', { request: 'Fixture HTTP, sans génération modèle.' });
  const claimed = await env.post('/api/jobs/claim', { worker: 'Test HTTP' }, { worker: true });
  assert.equal(claimed.status, 200);
  const work = claimed.body.workDirectory;
  fs.mkdirSync(path.join(work, 'backend'));
  fs.writeFileSync(
    path.join(work, 'index.html'),
    '<!doctype html><h1>Fixture backend déclaré</h1>',
  );
  fs.writeFileSync(path.join(work, 'backend/main.mjs'), 'throw new Error("must never run");');
  fs.writeFileSync(
    path.join(work, 'devmethod.project.json'),
    JSON.stringify({
      topology: 'monolith',
      services: [{ id: 'api', name: 'API déclarée', root: 'backend', runtime: 'Node' }],
    }),
  );
  const finished = await env.post(
    '/api/jobs/finish',
    {
      jobId: claimed.body.job.id,
      title: 'Fixture réelle',
      summary: 'Sources de test créées localement.',
    },
    { worker: true },
  );
  assert.equal(finished.status, 200, JSON.stringify(finished.body));
  const before = env.studio.store.read();
  const dataUrl = env.studio.runtime().previewOrigin + '/api/data';
  const dataBefore = await (await fetch(dataUrl)).json();
  const response = await env.get('/api/runtime/services?revision=' + before.activeRevision);
  assert.equal(response.status, 200);
  const runtime = await response.json();
  assert.equal(runtime.processModel, 'single-node-process');
  assert.equal(runtime.services.length, 3);
  assert.ok(runtime.services.every((service) => service.health.status === 'healthy'));
  assert.equal(runtime.project.services[0].execution, 'not_connected');
  assert.deepEqual(
    runtime.project.services[0].files.map((file) => file.path),
    ['backend/main.mjs'],
  );
  assert.equal(JSON.stringify(runtime).includes(env.studio.runtime().token), false);
  const source = await (await env.get('/api/source?scope=runtime&path=preview.mjs')).json();
  assert.equal(source.revisionId, runtime.sources.id);
  assert.equal(source.sha256, digest(source.content));
  assert.match(source.content, /createPreview/);
  assert.equal((await env.get('/api/source?scope=runtime&path=server.mjs')).status, 404);
  assert.deepEqual(await (await fetch(dataUrl)).json(), dataBefore);
  assert.deepEqual(env.studio.store.read(), before);
});

test('the comparison origin reads current data but cannot alter it, while the application remains writable', async (t) => {
  const env = await setup(t);
  const runtime = env.studio.runtime();
  assert.notEqual(runtime.comparisonPreviewOrigin, runtime.previewOrigin);
  assert.notEqual(runtime.comparisonPreviewOrigin, runtime.editorPreviewOrigin);
  const comparisonURL = runtime.comparisonPreviewOrigin + '/api/data';
  const activeURL = runtime.previewOrigin + '/api/data';
  const initial = await (await fetch(comparisonURL)).json();
  const write = async (url, data) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: new URL(url).origin },
      body: JSON.stringify(data),
    });
  const before = env.studio.store.read();
  const rejected = await write(comparisonURL, { version: initial.version, data: { unsafe: true } });
  assert.equal(rejected.status, 405);
  assert.deepEqual(await (await fetch(activeURL)).json(), initial);
  const accepted = await write(activeURL, {
    version: initial.version,
    data: { preserved: 'real data' },
  });
  assert.equal(accepted.status, 200);
  assert.deepEqual(await (await fetch(comparisonURL)).json(), await accepted.json());
  assert.deepEqual(env.studio.store.read(), before);
});
