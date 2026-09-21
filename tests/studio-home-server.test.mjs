import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { startStudioHome } from '../scripts/studio/home-server.mjs';
import { startStudio } from '../scripts/studio/server.mjs';
import { createStudioStore } from '../scripts/studio/store.mjs';

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-home-server-'));
  const home = await startStudioHome({ directory: path.join(root, 'home'), port: 0 });
  t.after(async () => {
    await home.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const { url } = home.runtime();

  async function post(route, input, headers = {}) {
    const response = await fetch(url + '/api/home/' + route, {
      method: 'POST',
      headers: { Origin: url, 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(input),
    });
    return { status: response.status, value: await response.json() };
  }

  return { root, home, url, post };
}

test('home creates and opens independent real sessions and closes only its owned projects', async (t) => {
  const f = await fixture(t);
  assert.deepEqual(await (await fetch(f.url + '/api/home')).json(), {
    projects: [],
    limits: { projects: 200 },
  });
  const created = await f.post('projects', {
    requestId: randomUUID(),
    kind: 'new',
    name: 'First',
    idea: 'Keep project',
  });
  assert.equal(created.status, 200);
  const opened = await Promise.all([
    f.post('open', { id: created.value.project.id }),
    f.post('open', { id: created.value.project.id }),
  ]);
  assert.equal(opened[0].status, 200);
  assert.equal(opened[0].value.url, opened[1].value.url);
  assert.ok(opened[0].value.project.lastOpenedAt);
  const runtime = await (await fetch(opened[0].value.url + '/api/runtime')).json();
  assert.equal(runtime.homeUrl, f.url);
  assert.equal(runtime.token, undefined);
  assert.equal(runtime.agent.automatic, false);
  const before = await (await fetch(opened[0].value.url + '/api/state')).json();
  const second = await f.post('projects', { requestId: randomUUID(), kind: 'new', name: 'Second' });
  const secondOpen = await f.post('open', { id: second.value.project.id });
  assert.notEqual(secondOpen.value.url, opened[0].value.url);
  assert.deepEqual(await (await fetch(opened[0].value.url + '/api/state')).json(), before);
  await f.home.close();
  for (const project of [created.value.project, second.value.project]) {
    assert.equal(fs.existsSync(path.join(project.workspace, '.devmethod/studio.lock')), false);
    assert.equal(fs.existsSync(path.join(project.workspace, '.devmethod/runtime.json')), false);
  }
});

test('home refuses foreign origins, host confusion, oversized bodies and unknown paths without echoing input', async (t) => {
  const f = await fixture(t);
  const input = { requestId: randomUUID(), kind: 'new' };
  assert.equal(
    (await f.post('projects', input, { Origin: 'https://untrusted.invalid' })).status,
    403,
  );
  const foreignHostStatus = await new Promise((resolve, reject) => {
    const request = http.get(
      f.url + '/api/home',
      { headers: { Host: 'other.invalid' } },
      (response) => {
        response.resume();
        resolve(response.statusCode);
      },
    );
    request.on('error', reject);
  });
  assert.equal(foreignHostStatus, 403);
  assert.equal((await f.post('projects', { ...input, idea: 'x'.repeat(65537) })).status, 400);
  const malformed = await fetch(f.url + '/api/home/projects', {
    method: 'POST',
    headers: { Origin: f.url, 'Content-Type': 'application/json' },
    body: '{"secret":"sentinel-private-value",broken',
  });
  assert.equal(malformed.status, 400);
  assert.doesNotMatch(await malformed.text(), /sentinel-private-value/);
  assert.equal((await fetch(f.url + '/api/unknown')).status, 404);
  assert.equal((await (await fetch(f.url + '/api/home')).json()).projects.length, 0);
});

test('an externally locked project stays alive and is never reset or stopped by home', async (t) => {
  const f = await fixture(t);
  const workspace = path.join(f.root, 'foreign');
  const foreign = await startStudio({ workspace, port: 0, previewPort: 0 });
  t.after(() => foreign.close());
  const before = fs.readFileSync(path.join(workspace, '.devmethod/studio.json'));
  const created = await f.post('projects', {
    requestId: randomUUID(),
    kind: 'existing',
    workspace,
  });
  assert.equal(created.status, 200);
  const opened = await f.post('open', { id: created.value.project.id });
  assert.equal(opened.status, 409);
  assert.match(opened.value.error, /autre session/);
  await f.home.close();
  assert.equal((await fetch(foreign.runtime().url + '/api/state')).status, 200);
  assert.deepEqual(fs.readFileSync(path.join(workspace, '.devmethod/studio.json')), before);
});

test('persisted projects reopen after home restart and runtime.json is never used as an address', async (t) => {
  const f = await fixture(t),
    workspace = path.join(f.root, 'saved');
  const saved = createStudioStore(workspace);
  saved.close();
  fs.writeFileSync(path.join(workspace, '.devmethod/runtime.json'), '{malformed-untrusted-address');
  const input = { requestId: randomUUID(), kind: 'existing', workspace };
  const created = await f.post('projects', input);
  assert.equal(created.status, 200);
  const opened = await f.post('open', { id: created.value.project.id });
  assert.equal(opened.status, 200);
  assert.match(opened.value.url, /^http:\/\/127\.0\.0\.1:\d+$/);
  await f.home.close();
  const restarted = await startStudioHome({ directory: f.home.runtime().directory, port: 0 });
  try {
    const report = await (await fetch(restarted.runtime().url + '/api/home')).json();
    assert.equal(report.projects.length, 1);
    assert.equal(report.projects[0].id, created.value.project.id);
    assert.ok(report.projects[0].lastOpenedAt);
  } finally {
    await restarted.close();
  }
});

test('a failed listener releases only its own registry lock and leaves the running home intact', async (t) => {
  const f = await fixture(t),
    directory = path.join(f.root, 'occupied-port');
  await assert.rejects(startStudioHome({ directory, port: Number(new URL(f.url).port) }), {
    code: 'EADDRINUSE',
  });
  assert.equal(fs.existsSync(path.join(directory, 'home.lock')), false);
  assert.equal((await fetch(f.url + '/api/home')).status, 200);
  const retried = await startStudioHome({ directory, port: 0 });
  await retried.close();
});
