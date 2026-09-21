import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createMcpManager } from '../scripts/studio/mcp-manager.mjs';
import { mockMcpServer } from './fixtures/mcp-server.mjs';

function fixture(t, options = {}) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'mcp-storage-'));
  const manager = createMcpManager({
    directory: path.join(root, 'private'),
    getOrigin: () => 'http://127.0.0.1:4330',
    ...options,
  });
  t.after(async () => {
    await manager.close();
    fs.rmSync(root, { force: true, recursive: true });
  });
  const mkdir = fs.mkdirSync;
  let failing = false;
  t.mock.method(fs, 'mkdirSync', (...args) => {
    if (failing) throw Object.assign(new Error('private-disk-error'), { code: 'ENOSPC' });
    return mkdir(...args);
  });
  return {
    manager,
    fail: (value) => {
      failing = value;
    },
  };
}

const config = (server, auth = 'none') => ({
  provider: 'custom',
  name: 'Storage fixture',
  url: server.url,
  auth,
});

test('failed connection and refresh admission preserve the prior state and remain retryable after disk recovery', async (t) => {
  const server = await mockMcpServer(t),
    { manager, fail } = fixture(t);
  fail(true);
  assert.throws(() => manager.connect(config(server)));
  assert.deepEqual(manager.list().connections, []);
  fail(false);
  const { connection } = await manager.connect(config(server));
  const before = manager.list().connections[0];
  fail(true);
  assert.throws(() => manager.refresh(connection.id));
  assert.deepEqual(manager.list().connections[0], before);
  assert.throws(() =>
    manager.connect({ ...config(server), id: connection.id, name: 'Replacement' }),
  );
  assert.deepEqual(manager.list().connections[0], before);
  fail(false);
  assert.equal((await manager.refresh(connection.id)).connection.status, 'connected');
  assert.equal(server.state.calls, 0);
});

test('a failed OAuth callback admission keeps its state usable after disk recovery', async (t) => {
  const server = await mockMcpServer(t, 'oauth'),
    { manager, fail } = fixture(t);
  const started = await manager.connect(config(server, 'oauth'));
  const redirect = await fetch(started.authorizationUrl, { redirect: 'manual' });
  const callback = new URL(redirect.headers.get('location'));
  fail(true);
  assert.throws(() => manager.completeAuthorization(callback.searchParams));
  assert.equal(manager.list().connections[0].status, 'authorization-required');
  assert.equal(server.state.tokens, 0);
  fail(false);
  assert.equal(
    (await manager.completeAuthorization(callback.searchParams)).connection.status,
    'connected',
  );
  assert.equal(server.state.tokens, 1);
});

test('OAuth expiry cannot crash the process when private storage becomes unavailable', async (t) => {
  const server = await mockMcpServer(t, 'oauth'),
    { manager, fail } = fixture(t, { authorizationTTL: 100 });
  const started = await manager.connect(config(server, 'oauth'));
  fail(true);
  await delay(150);
  assert.equal(manager.list().connections[0].status, 'error');
  assert.equal(manager.list().connections[0].error.code, 'oauth-expired');
  fail(false);
  assert.equal(
    (await manager.refresh(started.connection.id)).connection.status,
    'authorization-required',
  );
  assert.equal(server.state.tokens, 0);
});
