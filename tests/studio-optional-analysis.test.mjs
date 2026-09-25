import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as domain from '../scripts/studio/domain.mjs';

async function unpackedStudio(t, { missingModule = false } = {}) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'studio-optional-')));
  let studio;
  t.after(async () => {
    await studio?.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const packageRoot = path.join(root, 'package');
  const scripts = path.join(packageRoot, 'scripts/studio');
  fs.cpSync(fileURLToPath(new URL('../scripts/studio', import.meta.url)), scripts, {
    recursive: true,
  });
  // The shipped pure Control Plane domain is part of Studio itself, not an
  // installed analyzer dependency. Keep it in this unpacked package fixture.
  fs.cpSync(
    fileURLToPath(new URL('../dist/control-plane', import.meta.url)),
    path.join(packageRoot, 'dist/control-plane'),
    { recursive: true },
  );
  if (missingModule) fs.rmSync(path.join(scripts, 'intelligence.mjs'));
  assert.equal(fs.existsSync(path.join(packageRoot, 'node_modules')), false);
  const { startStudio } = await import(pathToFileURL(path.join(scripts, 'server.mjs')).href);
  studio = await startStudio({ workspace: path.join(root, 'project'), port: 0 });
  return { studio, url: studio.runtime().url };
}

test('Studio without installed dependencies keeps static creation, preview and source available while analysis fails explicitly', async (t) => {
  const { studio, url } = await unpackedStudio(t);
  studio.store.commit(studio.store.read().version, (state) => {
    domain.updateProject(state, {
      name: 'Static fixture',
      idea: 'A local note',
      mode: 'delegated',
      constraints: [],
    });
    domain.queueRequest(state, { request: 'Create the note' });
  });
  const claim = studio.jobs.claim('fixture');
  fs.writeFileSync(
    path.join(claim.workDirectory, 'index.html'),
    '<h1>Static note</h1><script src="app.js"></script>',
  );
  fs.writeFileSync(
    path.join(claim.workDirectory, 'app.js'),
    'document.body.dataset.ready = "true";',
  );
  const { revision } = studio.jobs.finish({ jobId: claim.job.id, title: 'Static note' });
  assert.equal((await fetch(url)).status, 200);
  assert.equal((await fetch(url + '/api/state')).status, 200);
  const source = await fetch(
    url + '/api/source?' + new URLSearchParams({ revision: revision.id, path: 'app.js' }),
  );
  assert.equal(source.status, 200);
  assert.equal((await source.json()).content, 'document.body.dataset.ready = "true";');
  assert.match(await (await fetch(studio.runtime().previewOrigin)).text(), /Static note/);
  const stateBefore = studio.store.read();
  for (const route of ['/api/project/model', '/api/project/checks']) {
    const response = await fetch(url + route + '?revision=' + revision.id);
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /TypeScript.*dépendances.*redémarr/i);
  }
  const run = await fetch(url + '/api/project/checks/run', {
    method: 'POST',
    headers: { Origin: url, 'Content-Type': 'application/json' },
    body: JSON.stringify({ revisionId: revision.id, checkId: 'source-syntax' }),
  });
  assert.equal(run.status, 503);
  assert.deepEqual(studio.store.read(), stateBefore);
  const control = await fetch(url + '/api/control');
  assert.equal(control.status, 200);
  const snapshot = (await control.json()).snapshot;
  assert.equal(snapshot.decision.effective, 'Verify');
  assert.equal(snapshot.evidence.current, 0);
  assert.ok(snapshot.input.sourceIssues.some((issue) => issue.includes('Qualité indisponible')));
  assert.equal((await fetch(url + '/api/state')).status, 200);
});

test('an internally missing analyzer is not reported as an optional dependency', async (t) => {
  const { url } = await unpackedStudio(t, { missingModule: true });
  const response = await fetch(url + '/api/project/model');
  assert.notEqual(response.status, 503);
  assert.match((await response.json()).error, /Cannot find module.*intelligence\.mjs/);
});
