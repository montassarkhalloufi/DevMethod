import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createPreview } from '../scripts/studio/preview.mjs';
import { getRuntimeServices } from '../scripts/studio/backend-runtime.mjs';
import { digest, fileManifest } from '../scripts/studio/files.mjs';

async function fixture(t) {
  const workspace = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'dm-comparison-preview-'),
  );
  const source = path.join(workspace, 'revisions/candidate/app');
  fs.mkdirSync(source, { recursive: true });
  fs.writeFileSync(path.join(source, 'index.html'), '<!doctype html><h1>Version proposée</h1>');
  const state = {
    activeRevision: 'candidate',
    revisions: [{ id: 'candidate', files: fileManifest(source) }],
  };
  const application = createPreview({ workspace, getState: () => state });
  const comparison = createPreview({ workspace, getState: () => state, readOnlyData: true });
  t.after(async () => {
    await Promise.all(
      [application, comparison].map(
        (server) =>
          new Promise((resolve) => {
            server.closeAllConnections();
            server.close(resolve);
          }),
      ),
    );
    fs.rmSync(workspace, { force: true, recursive: true });
  });
  await Promise.all(
    [application, comparison].map(
      (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)),
    ),
  );
  const origin = (server) => `http://127.0.0.1:${server.address().port}`;
  return {
    application: origin(application),
    comparison: origin(comparison),
    data: path.join(workspace, '.devmethod/data.json'),
  };
}

const write = (origin, value, method = 'POST') =>
  fetch(origin + '/api/data', {
    method,
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });

test('comparison serves the real candidate on its own origin but refuses writes without changing persisted bytes', async (t) => {
  const f = await fixture(t);
  assert.notEqual(f.application, f.comparison);
  const inserted = await write(f.application, { version: 1, data: { registrations: ['Amina'] } });
  assert.equal(inserted.status, 200);
  const before = fs.readFileSync(f.data);
  const shown = await fetch(f.comparison + '/revisions/candidate/index.html');
  assert.equal(shown.status, 200);
  assert.match(await shown.text(), /Version proposée/);
  assert.match(shown.headers.get('content-security-policy'), /connect-src 'self'/);
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const refused = await write(f.comparison, { version: 2, data: { registrations: [] } }, method);
    assert.equal(refused.status, 405);
    assert.equal(refused.headers.get('allow'), 'GET');
    assert.match((await refused.json()).error, /comparaison.*lecture seule/);
  }
  assert.equal(digest(fs.readFileSync(f.data)), digest(before));
  assert.deepEqual(await (await fetch(f.application + '/api/data')).json(), {
    version: 2,
    data: { registrations: ['Amina'] },
  });
});

test('comparison reads current data, not a fake isolated snapshot, and service diagnostics expose its read-only contract', async (t) => {
  const f = await fixture(t);
  assert.equal((await write(f.application, { version: 1, data: { count: 1 } })).status, 200);
  assert.deepEqual(await (await fetch(f.comparison + '/api/data')).json(), {
    version: 2,
    data: { count: 1 },
  });
  assert.equal((await write(f.application, { version: 2, data: { count: 2 } })).status, 200);
  assert.deepEqual(await (await fetch(f.comparison + '/api/data')).json(), {
    version: 3,
    data: { count: 2 },
  });
  const before = digest(fs.readFileSync(f.data));
  const runtime = await getRuntimeServices({
    previewOrigin: f.application,
    comparisonPreviewOrigin: f.comparison,
  });
  const service = runtime.services.find((entry) => entry.id === 'comparison');
  assert.equal(service.access, 'read-only');
  assert.deepEqual(service.endpoints, ['GET /api/data']);
  assert.equal(service.health.status, 'healthy');
  assert.equal(service.health.dataVersion, 3);
  assert.equal(digest(fs.readFileSync(f.data)), before);
});
