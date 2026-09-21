import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startStudio } from '../scripts/studio/server.mjs';
import { restoreArchive } from '../scripts/studio/archive.mjs';

const app =
  '<!doctype html><html><body><h1>Application réelle</h1><script src="app.js"></script></body></html>';

async function setup(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-studio-integration-'));
  const workspace = path.join(root, 'workspace');
  let studio = await startStudio({ workspace, port: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const request = async (route, input, worker = false) => {
    const runtime = studio.runtime();
    const response = await fetch(runtime.url + route, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(worker ? { Authorization: 'Bearer ' + runtime.token } : { Origin: runtime.url }),
      },
      body: JSON.stringify({ version: studio.store.read().version, ...input }),
    });
    return { status: response.status, body: await response.json() };
  };
  return {
    root,
    workspace,
    get studio() {
      return studio;
    },
    request,
    async restart() {
      await studio.close();
      studio = await startStudio({ workspace, port: 0 });
    },
  };
}

test('real files, isolated preview, conflicts, code rollback, export and restart retain data', async (t) => {
  const env = await setup(t);
  assert.equal(
    (
      await env.request('/api/project', {
        name: 'Test',
        idea: 'Suivre des inscriptions',
        mode: 'delegated',
        constraints: [],
      })
    ).status,
    200,
  );
  assert.equal(
    (await env.request('/api/requests', { request: 'Créer une inscription persistante.' })).status,
    200,
  );
  const claim = await env.request('/api/jobs/claim', { worker: 'Test worker' }, true);
  assert.equal(claim.status, 200);
  fs.writeFileSync(path.join(claim.body.workDirectory, 'index.html'), app);
  fs.writeFileSync(
    path.join(claim.body.workDirectory, 'app.js'),
    "document.body.dataset.ready = 'yes';",
  );
  const finished = await env.request(
    '/api/jobs/finish',
    { jobId: claim.body.job.id, title: 'v1', summary: 'Test fixture, not generated.' },
    true,
  );
  assert.equal(finished.status, 200, JSON.stringify(finished.body));
  const first = finished.body.state.activeRevision;
  let origin = env.studio.runtime().previewOrigin;
  assert.match(await (await fetch(origin + '/')).text(), /Application réelle/);
  const dataWrite = async (version, data) =>
    fetch(origin + '/api/data', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ version, data }),
    });
  assert.equal((await dataWrite(1, { inscriptions: ['Amina'] })).status, 200);
  assert.equal((await dataWrite(1, { inscriptions: [] })).status, 409);
  await env.request('/api/draft', { text: 'Saisie à conserver' });
  await env.request('/api/requests', {
    request: 'Changer le titre sans supprimer les inscriptions.',
  });
  const secondClaim = (await env.request('/api/jobs/claim', { worker: 'Test worker' }, true)).body;
  assert.equal(fs.readFileSync(path.join(secondClaim.workDirectory, 'index.html'), 'utf8'), app);
  fs.writeFileSync(
    path.join(secondClaim.workDirectory, 'index.html'),
    app.replace('réelle', 'évoluée'),
  );
  const second = (
    await env.request(
      '/api/jobs/finish',
      { jobId: secondClaim.job.id, title: 'v2', summary: 'Changed title' },
      true,
    )
  ).body;
  assert.notEqual(second.state.activeRevision, first);
  const review = await (
    await fetch(env.studio.runtime().url + `/api/activation-review?revision=${first}`)
  ).json();
  assert.equal(
    (
      await env.request('/api/activate', {
        id: first,
        reviewKey: review.reviewKey,
        reason: 'Retour au titre précédent après examen des preuves et inconnues.',
      })
    ).status,
    200,
  );
  assert.equal(env.studio.store.read().activeRevision, first);
  assert.deepEqual((await (await fetch(origin + '/api/data')).json()).data, {
    inscriptions: ['Amina'],
  });
  await env.request('/api/draft', { text: 'Encore une saisie à conserver' });
  await env.restart();
  origin = env.studio.runtime().previewOrigin;
  assert.equal(env.studio.store.read().draft, 'Encore une saisie à conserver');
  assert.deepEqual((await (await fetch(origin + '/api/data')).json()).data, {
    inscriptions: ['Amina'],
  });
  const archive = Buffer.from(
    await (await fetch(env.studio.runtime().url + '/api/export')).arrayBuffer(),
  );
  const restored = path.join(env.root, 'restored');
  assert.ok(restoreArchive(archive, restored) > 5);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(restored, '.devmethod/data.json'))).data, {
    inscriptions: ['Amina'],
  });
  assert.equal(fs.existsSync(path.join(restored, '.devmethod/runtime.json')), false);
});

test('origin and worker boundaries reject forged mutations, token not exposed', async (t) => {
  const env = await setup(t),
    runtime = env.studio.runtime();
  const publicRuntime = await (await fetch(runtime.url + '/api/runtime')).json();
  assert.equal(publicRuntime.token, undefined);
  const response = await fetch(runtime.url + '/api/project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://example.org' },
    body: '{}',
  });
  assert.equal(response.status, 403);
  assert.equal((await env.request('/api/jobs/claim', { worker: 'browser' })).status, 403);
  assert.equal((await env.request('/api/requests', { version: -1, request: 'stale' })).status, 409);
});

test('cancelled worker cannot finish or change active code', async (t) => {
  const env = await setup(t);
  await env.request('/api/project', {
    name: 'Test',
    idea: 'Annulation',
    mode: 'guided',
    constraints: [],
  });
  await env.request('/api/requests', { request: 'Créer.' });
  const claim = (await env.request('/api/jobs/claim', { worker: 'test' }, true)).body;
  fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), app);
  await env.request('/api/jobs/cancel', { jobId: claim.job.id });
  assert.equal(
    (
      await env.request(
        '/api/jobs/finish',
        { jobId: claim.job.id, title: 'late', summary: 'late' },
        true,
      )
    ).status,
    409,
  );
  assert.equal(env.studio.store.read().revisions.length, 0);
});

test('element targeting identifies the selected repeated heading and ignores foreign messages', async (t) => {
  const { JSDOM } = await import('jsdom');
  const env = await setup(t);
  await env.request('/api/project', {
    name: 'Cible',
    idea: 'Deux blocs',
    mode: 'delegated',
    constraints: [],
  });
  await env.request('/api/requests', { request: 'Créer deux blocs.' });
  const claim = (await env.request('/api/jobs/claim', { worker: 'Fixture' }, true)).body;
  fs.writeFileSync(
    path.join(claim.workDirectory, 'index.html'),
    '<!doctype html><html><body><section><h2>Même titre</h2></section><section><h2>Même titre</h2></section></body></html>',
  );
  await env.request(
    '/api/jobs/finish',
    { jobId: claim.job.id, title: 'Cibles', summary: 'Fixture réelle.' },
    true,
  );
  const dom = new JSDOM(await (await fetch(env.studio.runtime().previewOrigin + '/')).text(), {
    runScripts: 'dangerously',
  });
  t.after(() => dom.window.close());
  const received = [];
  dom.window.postMessage = (value, origin) => received.push({ value, origin });
  const target = dom.window.document.querySelectorAll('h2')[1];
  const select = (origin) =>
    dom.window.dispatchEvent(
      new dom.window.MessageEvent('message', {
        source: dom.window,
        origin,
        data: { type: 'devmethod-select', enabled: true },
      }),
    );
  select('https://untrusted.example');
  target.click();
  assert.equal(received.length, 0);
  select(env.studio.runtime().url);
  target.click();
  assert.equal(received.length, 1);
  assert.equal(received[0].origin, env.studio.runtime().url);
  assert.equal(dom.window.document.querySelector(received[0].value.selector), target);
});
