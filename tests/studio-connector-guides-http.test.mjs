import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startStudio } from '../scripts/studio/server.mjs';
import { startStudioHome } from '../scripts/studio/home-server.mjs';

const input = {
  optionId: 'linear',
  guideVersion: 1,
  flowId: 'linear-read',
  answers: { resources: ['issues'] },
};

async function fixture(t, kind) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'guide-http-'));
  const server =
    kind === 'home'
      ? await startStudioHome({ directory: root, port: 0 })
      : await startStudio({ workspace: root, port: 0, previewPort: 0, agent: null });
  t.after(async () => {
    await server.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const url = server.runtime().url;
  return { server, url, root };
}

async function post(url, route, value, origin = url) {
  const response = await fetch(url + route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(value),
  });
  return { status: response.status, value: await response.json() };
}

for (const kind of ['home', 'project'])
  test(`${kind} guide routes are bounded, same-origin and pure`, async (t) => {
    const f = await fixture(t, kind);
    const list = await fetch(f.url + '/api/connectors/guides');
    assert.equal(list.status, 200);
    assert.deepEqual(
      (await list.json()).guides.map((entry) => entry.optionId),
      ['slack', 'notion', 'linear', 'github-mcp'],
    );
    const prepared = await post(f.url, '/api/connectors/guides/prepare', input);
    assert.equal(prepared.status, 200);
    assert.equal(prepared.value.nativeConnection.url, 'https://mcp.linear.app/mcp/readonly');
    assert.equal(prepared.value.access, 'not-connected');
    assert.equal(
      (await post(f.url, '/api/connectors/guides/prepare', input, 'https://untrusted.invalid'))
        .status,
      403,
    );
    assert.equal(
      (await post(f.url, '/api/connectors/guides/prepare', { ...input, scopes: ['admin'] })).status,
      400,
    );
    assert.equal(
      (await post(f.url, '/api/connectors/guides/prepare', { ...input, extra: 'a'.repeat(65537) }))
        .status,
      400,
    );
    assert.equal(fs.existsSync(path.join(f.root, '.devmethod/connectors.json')), false);
    if (kind === 'project') {
      assert.deepEqual(f.server.store.read().jobs, []);
      const draft = await post(f.url, '/api/draft', {
        version: f.server.store.read().version,
        text: 'Préparer le contexte Linear',
        connectorGuides: [input],
      });
      assert.equal(draft.status, 200);
      assert.deepEqual(draft.value.state.draftConnectorGuides, [input]);
      const reloadedState = await (await fetch(f.url + '/api/state')).json();
      assert.deepEqual(reloadedState.draftConnectorGuides, [input]);
      const queued = await post(f.url, '/api/requests', {
        version: f.server.store.read().version,
        request: 'Préparer le contexte Linear',
        connectorGuides: [input],
      });
      assert.equal(queued.status, 200);
      assert.equal(
        queued.value.job.connectorGuides[0].setupFingerprint,
        prepared.value.setupFingerprint,
      );
      const claim = f.server.jobs.claim('HTTP fixture host');
      assert.equal(claim.context.connectorGuides[0].input.flowId, 'linear-read');
      assert.equal(claim.context.mcp.supported, false);
    } else assert.deepEqual((await (await fetch(f.url + '/api/home')).json()).projects, []);
  });
