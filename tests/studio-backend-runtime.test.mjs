import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { probeRuntimeService, getRuntimeServices } from '../scripts/studio/backend-runtime.mjs';
import {
  runtimeSourceCatalog,
  readRuntimeSource,
  readProjectServices,
} from '../scripts/studio/source.mjs';
import { validateProjectManifest, sourceProfile } from '../scripts/studio/profile.mjs';
import { fileManifest, digest } from '../scripts/studio/files.mjs';

async function server(t, handler) {
  const instance = http.createServer(handler);
  await new Promise((resolve) => instance.listen(0, '127.0.0.1', resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        instance.closeAllConnections();
        instance.close(resolve);
      }),
  );
  return { instance, origin: `http://127.0.0.1:${instance.address().port}` };
}

test('runtime catalog exposes exact shipped code only and its identity covers every exposed file', () => {
  const catalog = runtimeSourceCatalog();
  assert.equal(catalog.readOnly, true);
  assert.equal(catalog.id, 'runtime-' + digest(JSON.stringify(catalog.files)));
  for (const file of catalog.files) {
    const actual = fs.readFileSync(
      fileURLToPath(new URL('../scripts/studio/' + file.path, import.meta.url)),
    );
    const source = readRuntimeSource(file.path);
    assert.equal(source.content, actual.toString('utf8'));
    assert.equal(source.sha256, digest(actual));
    assert.equal(source.revisionId, catalog.id);
    assert.equal(source.scope, 'runtime');
  }
  for (const name of ['../server.mjs', 'server.mjs', '.devmethod/runtime.json', '/etc/hosts'])
    assert.throws(() => readRuntimeSource(name), /absent du runtime/);
});

test('a real healthy HTTP response proves only the JSON read contract and never returns business data', async (t) => {
  const calls = [];
  const local = await server(t, (request, response) => {
    calls.push([request.method, request.url]);
    response.end(JSON.stringify({ version: 7, data: { privateName: 'must-not-leak' } }));
  });
  const result = await getRuntimeServices({ previewOrigin: local.origin });
  assert.equal(result.processModel, 'single-node-process');
  assert.equal(result.services[0].health.status, 'healthy');
  assert.equal(result.services[0].health.dataVersion, 7);
  assert.equal(result.services[1].execution, 'not_started');
  assert.equal(result.services[1].health.status, 'not_checked');
  assert.deepEqual(calls, [['GET', '/api/data']]);
  assert.ok(!JSON.stringify(result).includes('must-not-leak'));
  assert.equal(result.capabilities.customBackendExecution, false);
});

test('a service that never replies really times out and a closed port really fails to connect', async (t) => {
  let connections = 0;
  const hung = await server(t, () => {
    connections++;
  });
  const timeout = await probeRuntimeService(hung.origin, { timeoutMs: 50 });
  assert.equal(timeout.status, 'timeout');
  assert.equal(timeout.error.code, 'HEALTH_TIMEOUT');
  assert.equal(connections, 1);
  assert.ok(timeout.elapsedMs >= 40 && timeout.elapsedMs < 2000);
  const closed = await server(t, (_request, response) => response.end('{}'));
  await new Promise((resolve) => closed.instance.close(resolve));
  const refused = await probeRuntimeService(closed.origin);
  assert.equal(refused.status, 'unreachable');
  assert.equal(refused.error.code, 'CONNECTION_FAILED');
});

test('probe rejects invalid contracts, oversized bodies and HTTP redirects without following them', async (t) => {
  let scenario = 'invalid';
  const local = await server(t, (_request, response) => {
    if (scenario === 'redirect') {
      response.writeHead(302, { Location: 'http://example.invalid/secret' });
      response.end();
    } else
      response.end(
        scenario === 'oversized' ? 'a'.repeat(2 * 1024 * 1024 + 1) : '{"version":1,"data":[]}',
      );
  });
  assert.equal((await probeRuntimeService(local.origin)).error.code, 'INVALID_DATA_RESPONSE');
  scenario = 'oversized';
  assert.equal((await probeRuntimeService(local.origin)).error.code, 'RESPONSE_TOO_LARGE');
  scenario = 'redirect';
  assert.equal((await probeRuntimeService(local.origin)).error.code, 'HTTP_STATUS');
  for (const origin of [
    'https://127.0.0.1:1234',
    'http://localhost:1234',
    'http://127.0.0.1:1234/path',
    'http://user@127.0.0.1:1234',
    'http://example.org:1234',
  ])
    assert.throws(() => probeRuntimeService(origin), /loopback/);
  assert.throws(() => probeRuntimeService(local.origin, { timeoutMs: 5001 }), /délai/);
});

const manifest = () => ({
  topology: 'services',
  services: [
    { id: 'api', name: 'API métier', root: 'services/api', runtime: 'Node / Fastify' },
    { id: 'worker', name: 'Traitements', root: 'services/worker', runtime: 'Python' },
  ],
});

test('a project manifest links real immutable backend source while declaring that execution is not connected', (t) => {
  const workspace = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-services-'));
  t.after(() => fs.rmSync(workspace, { force: true, recursive: true }));
  const root = path.join(workspace, 'revisions/one/app');
  fs.mkdirSync(path.join(root, 'services/api'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'services/api/server.mjs'),
    'throw new Error("never execute project code");',
  );
  fs.writeFileSync(path.join(root, 'devmethod.project.json'), JSON.stringify(manifest()));
  const files = fileManifest(root);
  const state = { revisions: [{ id: 'one', files }] };
  const value = readProjectServices(workspace, state, 'one');
  assert.equal(value.topology, 'services');
  assert.equal(value.services[0].execution, 'not_connected');
  assert.deepEqual(
    value.services[0].files.map((file) => file.path),
    ['services/api/server.mjs'],
  );
  assert.deepEqual(value.services[1].files, []);
  assert.equal(sourceProfile(root, files), 'static');
  assert.equal(readProjectServices(workspace, state, 'missing'), null);
  fs.appendFileSync(path.join(root, 'devmethod.project.json'), ' ');
  assert.throws(() => readProjectServices(workspace, state, 'one'), /correspond plus/);
});

test('project manifests reject unsafe roots, duplicate IDs and executable or ambiguous extra fields', () => {
  assert.deepEqual(validateProjectManifest(manifest()), manifest());
  for (const root of [
    '../api',
    '/api',
    'C:\\api',
    'api/../web',
    'api//source',
    'api/./source',
    'api/',
  ]) {
    const value = manifest();
    value.services[0].root = root;
    assert.throws(() => validateProjectManifest(value), /relatif sûr/);
  }
  const duplicate = manifest();
  duplicate.services[1].id = 'api';
  assert.throws(() => validateProjectManifest(duplicate), /unique/);
  const command = manifest();
  command.services[0].command = 'npm start';
  assert.throws(() => validateProjectManifest(command), /connus/);
  assert.throws(
    () => validateProjectManifest({ ...manifest(), healthUrl: 'http://private/' }),
    /inconnu/,
  );
  assert.throws(
    () => validateProjectManifest({ topology: 'microservice', services: [] }),
    /Topologie/,
  );
  const monolith = {
    topology: 'monolith',
    services: [{ id: 'app', name: 'Application', root: '.', runtime: 'Node' }],
  };
  assert.deepEqual(validateProjectManifest(monolith), monolith);
});
