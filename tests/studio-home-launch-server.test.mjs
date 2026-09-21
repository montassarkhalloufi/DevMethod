import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { startStudioHome } from '../scripts/studio/home-server.mjs';
import { homeLaunchLimits } from '../scripts/studio/home-launch.mjs';
import { connectorOptions, connectorCapabilities } from '../scripts/studio/connectors-catalog.mjs';

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'home-launch-http-'));
  const home = await startStudioHome({ directory: root, port: 0 });
  t.after(async () => {
    await home.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const { url } = home.runtime();
  return {
    root,
    url,
    post(route, input, origin = url) {
      return fetch(url + '/api/home/' + route, {
        method: 'POST',
        headers: { Origin: origin, 'Content-Type': 'application/json' },
        body: typeof input === 'string' ? input : JSON.stringify(input),
      });
    },
  };
}

test('home catalog exposes only application offers and capabilities without registering or connecting anything', async (t) => {
  const f = await fixture(t);
  const response = await fetch(f.url + '/api/home/catalog?language=fr');
  assert.equal(response.status, 200);
  const catalog = await response.json();
  assert.deepEqual(
    catalog.options,
    connectorOptions.filter((entry) => entry.purpose === 'application'),
  );
  assert.deepEqual(
    catalog.capabilities,
    connectorCapabilities.filter((entry) => entry.purpose === 'application'),
  );
  assert.ok(catalog.options.some((entry) => entry.id === 'stripe'));
  assert.equal(
    catalog.options.some((entry) => entry.id === 'node-test'),
    false,
  );
  assert.deepEqual((await (await fetch(f.url + '/api/home')).json()).projects, []);
  assert.deepEqual(fs.readdirSync(f.root).sort(), ['home.json', 'home.lock']);
});

test('projects accept bounded attachment bodies above64KiB while other routes keep their smaller limit', async (t) => {
  const f = await fixture(t);
  const content = 'x'.repeat(96000);
  const input = {
    requestId: randomUUID(),
    kind: 'new',
    idea: 'Projet avec référence',
    launch: {
      action: 'build',
      projectType: 'prototype',
      connectors: ['brevo'],
      links: [],
      attachments: [
        { name: 'notes.txt', mime: 'text/plain', base64: Buffer.from(content).toString('base64') },
      ],
    },
  };
  const denied = await f.post('projects', input, 'https://foreign.invalid');
  assert.equal(denied.status, 403);
  const response = await f.post('projects', input);
  assert.equal(response.status, 200);
  const { project } = await response.json();
  const state = JSON.parse(fs.readFileSync(path.join(project.workspace, '.devmethod/studio.json')));
  assert.equal(state.jobs[0].status, 'queued');
  assert.equal(state.references.length, 1);
  assert.equal(
    fs.readFileSync(path.join(project.workspace, state.references[0].file), 'utf8'),
    content,
  );
  const replay = await f.post('projects', input);
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).project.id, project.id);
  const largeOpen = await f.post('open', ' '.repeat(65536) + JSON.stringify({ id: project.id }));
  assert.equal(largeOpen.status, 400);
  assert.equal(fs.existsSync(path.join(project.workspace, '.devmethod/runtime.json')), false);
  const largeProject = await f.post(
    'projects',
    ' '.repeat(homeLaunchLimits.bodyBytes) +
      JSON.stringify({ requestId: randomUUID(), kind: 'new' }),
  );
  assert.equal(largeProject.status, 400);
  const opened = await f.post('open', { id: project.id });
  assert.equal(opened.status, 200);
  const child = await opened.json();
  const runtime = await (await fetch(child.url + '/api/runtime')).json();
  assert.equal(runtime.agent.automatic, false);
  assert.equal((await (await fetch(child.url + '/api/state')).json()).jobs[0].status, 'queued');
  assert.equal((await (await fetch(f.url + '/api/home')).json()).projects.length, 1);
});

test('malformed launch errors omit supplied credentials and leave no managed workspace', async (t) => {
  const f = await fixture(t);
  const response = await f.post('projects', {
    requestId: randomUUID(),
    kind: 'new',
    idea: 'Un projet',
    launch: {
      action: 'plan',
      projectType: 'slides',
      links: ['https://someone:sentinel-password@example.test/'],
    },
  });
  assert.equal(response.status, 400);
  assert.doesNotMatch(await response.text(), /sentinel-password|someone|example\.test/);
  assert.deepEqual(fs.readdirSync(f.root).sort(), ['home.json', 'home.lock']);
});
