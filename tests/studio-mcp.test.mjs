import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import dns from 'node:dns/promises';
import { createMcpManager } from '../scripts/studio/mcp-manager.mjs';
import { publicAddress, mcpTarget, createMcpFetch } from '../scripts/studio/mcp-network.mjs';
import { mockMcpServer } from './fixtures/mcp-server.mjs';

function managerFixture(t, options = {}) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'mcp-manager-'));
  const manager = createMcpManager({
    directory: path.join(root, 'private'),
    getOrigin: () => 'http://127.0.0.1:4330',
    ...options,
  });
  t.after(async () => {
    await manager.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { root, manager };
}

const config = (server, auth = 'none') => ({
  provider: 'custom',
  name: 'Local protocol fixture',
  url: server.url,
  auth,
});

async function authorize(server, manager, result) {
  assert.equal(result.connection.status, 'authorization-required');
  const url = new URL(result.authorizationUrl);
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(url.searchParams.get('state'));
  const response = await fetch(url, { redirect: 'manual' });
  const callback = new URL(response.headers.get('location'));
  return { callback, result: await manager.completeAuthorization(callback.searchParams) };
}

test('real Streamable HTTP initialize and paginated tools/list establish connection without calling tools', async (t) => {
  const server = await mockMcpServer(t),
    { manager } = managerFixture(t);
  const result = await manager.connect(config(server));
  assert.equal(result.connection.status, 'connected');
  assert.deepEqual(
    result.connection.tools.map((tool) => tool.name),
    ['fixture.read', 'fixture_write'],
  );
  assert.equal(result.connection.tools[0].inputSchema, undefined);
  assert.equal(manager.getTools(result.connection.id)[0].inputSchema.type, 'object');
  assert.equal(server.state.initialized, 1);
  assert.equal(server.state.listed, 2);
  assert.equal(server.state.calls, 0);
  server.state.listError = true;
  const failed = await manager.refresh(result.connection.id);
  assert.equal(failed.connection.status, 'error');
  assert.doesNotMatch(JSON.stringify(failed), /private-error-sentinel/);
  assert.throws(() => manager.getTools(result.connection.id), { status: 409 });
});

test('Bearer stays private, transport failures never echo it, disconnect erases credentials and persistence requires explicit refresh', async (t) => {
  const server = await mockMcpServer(t, 'bearer'),
    { manager, root } = managerFixture(t);
  const result = await manager.connect({
    ...config(server, 'bearer'),
    bearerToken: server.state.access,
  });
  assert.equal(result.connection.status, 'connected');
  assert.doesNotMatch(JSON.stringify(manager.list()), /fixture-access-secret/);
  const file = path.join(root, 'private/connections.json');
  assert.match(fs.readFileSync(file, 'utf8'), /fixture-access-secret/);
  if (process.platform !== 'win32') {
    assert.equal(fs.statSync(file).mode & 0o777, 0o600);
    assert.equal(fs.statSync(path.dirname(file)).mode & 0o777, 0o700);
  }
  await manager.close();
  const restored = createMcpManager({
    directory: path.dirname(file),
    getOrigin: () => 'http://127.0.0.1:4330',
  });
  t.after(() => restored.close());
  assert.equal(restored.list().connections[0].status, 'disconnected');
  assert.equal((await restored.refresh(result.connection.id)).connection.status, 'connected');
  const version = restored.list().connections[0].version;
  assert.equal(restored.disconnect(result.connection.id).connection.version, version + 1);
  assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /fixture-access-secret/);
  assert.equal(restored.list().connections[0].tools.length, 0);
});

test('OAuth discovery/DCR/PKCE callback, single use and rotating refresh are exercised against a real local provider fixture', async (t) => {
  let clock = Date.now();
  const server = await mockMcpServer(t, 'oauth'),
    { manager, root } = managerFixture(t, { now: () => clock });
  const started = await manager.connect(config(server, 'oauth'));
  assert.equal(server.state.calls, 0);
  assert.equal(server.state.tokens, 0);
  await assert.rejects(
    async () =>
      manager.completeAuthorization(new URLSearchParams({ state: 'a'.repeat(43), code: 'wrong' })),
    { status: 400 },
  );
  const validState = new URL(started.authorizationUrl).searchParams.get('state');
  await assert.rejects(
    async () => manager.completeAuthorization(new URLSearchParams({ state: validState })),
    { status: 400 },
  );
  await assert.rejects(
    async () =>
      manager.completeAuthorization(
        new URLSearchParams({ state: validState, code: 'wrong', iss: 'https://other.invalid' }),
      ),
    { status: 400 },
  );
  assert.equal(manager.list().connections[0].status, 'authorization-required');
  const { callback, result } = await authorize(server, manager, started);
  assert.equal(result.connection.status, 'connected');
  assert.equal(server.state.registers, 1);
  assert.equal(server.state.tokens, 1);
  assert.equal(server.state.registration.token_endpoint_auth_method, 'none');
  await assert.rejects(async () => manager.completeAuthorization(callback.searchParams), {
    status: 400,
  });
  clock += 61000;
  const [refreshed, simultaneous] = await Promise.all([
    manager.refresh(result.connection.id),
    manager.refresh(result.connection.id),
  ]);
  assert.deepEqual(refreshed, simultaneous);
  assert.equal(refreshed.connection.status, 'connected');
  assert.equal(refreshed.connection.version, result.connection.version);
  assert.equal(server.state.refreshes, 1);
  assert.equal(server.state.registers, 1);
  const stored = fs.readFileSync(path.join(root, 'private/connections.json'), 'utf8');
  assert.match(stored, /fixture-refresh-secret-rotated/);
  assert.doesNotMatch(
    JSON.stringify(manager.list()),
    /fixture-(?:access|refresh)-secret|code_verifier|client_id/,
  );
  assert.equal(server.state.calls, 0);
  clock += 61000;
  server.state.denied = true;
  const expiredGrant = await manager.refresh(result.connection.id);
  assert.equal(expiredGrant.connection.status, 'authorization-required');
  assert.equal(server.state.refreshes, 2);
  assert.equal(server.state.registers, 1);
  assert.doesNotMatch(
    JSON.stringify(expiredGrant),
    /private-error-sentinel|fixture-refresh-secret/,
  );
});

test('legacy SSE fallback performs real initialization/discovery and explicit local DNS is resolved once per socket', async (t) => {
  const server = await mockMcpServer(t),
    { manager } = managerFixture(t);
  server.state.sse = true;
  const result = await manager.connect(config(server));
  assert.equal(result.connection.status, 'connected');
  assert.equal(server.state.calls, 0);
  assert.equal(server.state.listed, 2);
  server.state.sse = false;
  let resolutions = 0;
  t.mock.method(dns, 'lookup', async () => {
    resolutions++;
    return [{ address: resolutions === 1 ? '127.0.0.1' : '169.254.169.254', family: 4 }];
  });
  const url = server.url.replace('127.0.0.1', 'localhost');
  const response = await createMcpFetch(url)(url);
  assert.equal(response.status, 405);
  await response.text();
  assert.equal(resolutions, 1);
});

test('OAuth cancellation, expiration and disconnect reject late callbacks and never retain tokens', async (t) => {
  let clock = Date.now();
  const server = await mockMcpServer(t, 'oauth'),
    { manager, root } = managerFixture(t, { now: () => clock });
  let started = await manager.connect(config(server, 'oauth'));
  const cancelledState = new URL(started.authorizationUrl).searchParams.get('state');
  manager.disconnect(started.connection.id);
  await assert.rejects(
    async () =>
      manager.completeAuthorization(new URLSearchParams({ state: cancelledState, code: 'late' })),
    { status: 400 },
  );
  started = await manager.connect({ ...config(server, 'oauth'), id: started.connection.id });
  clock += 600001;
  assert.equal(manager.list().connections[0].error.code, 'oauth-expired');
  await assert.rejects(
    async () =>
      manager.completeAuthorization(
        new URLSearchParams({
          state: new URL(started.authorizationUrl).searchParams.get('state'),
          code: 'late',
        }),
      ),
    { status: 400 },
  );
  assert.equal(server.state.tokens, 0);
  assert.doesNotMatch(
    fs.readFileSync(path.join(root, 'private/connections.json'), 'utf8'),
    /code_verifier|fixture-access-secret/,
  );
});

test('custom input, redirects, private destinations and metadata redirects fail closed', async (t) => {
  const server = await mockMcpServer(t),
    { manager } = managerFixture(t);
  for (const url of [
    'file:///tmp/server',
    'http://192.168.0.1/mcp',
    'https://user:secret@example.test/mcp',
    'https://example.test/mcp#token',
    'https://example.test/mcp?token=secret',
  ])
    assert.throws(() => manager.connect({ ...config(server), url }), { status: 400 });
  for (const address of [
    '127.0.0.1',
    '0.0.0.0',
    '10.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '192.168.0.1',
    '::1',
    '::ffff:127.0.0.1',
    'fd00::1',
    'fe80::1',
  ])
    assert.equal(publicAddress(address), false);
  await assert.rejects(mcpTarget('http://127.0.0.1:1/private', 'https://example.com/mcp'), {
    status: 400,
  });
  server.state.redirect = 'http://127.0.0.1:1/private';
  assert.equal((await manager.connect(config(server))).connection.status, 'error');
  const oauth = await mockMcpServer(t, 'oauth');
  oauth.state.tokenEndpoint = 'http://127.0.0.1:1/private';
  const result = await manager.connect(config(oauth, 'oauth'));
  assert.equal(result.connection.status, 'error');
  assert.equal(oauth.state.registers, 0);
});

test('only discovery succeeds automatically; explicit internal invoke preserves tool errors and aborting cannot revive disconnected state', async (t) => {
  const server = await mockMcpServer(t),
    { manager } = managerFixture(t);
  const { connection } = await manager.connect(config(server));
  server.state.toolError = true;
  const result = await manager.invoke(connection.id, 'fixture.read', {});
  assert.equal(result.isError, true);
  assert.equal(server.state.calls, 1);
  server.state.hang = true;
  const pending = manager.refresh(connection.id);
  manager.disconnect(connection.id);
  await assert.rejects(pending, { code: 'cancelled' });
  assert.equal(manager.list().connections[0].status, 'disconnected');
});

test('tool and response bounds and sensitive tool metadata fail without a connected state', async (t) => {
  const server = await mockMcpServer(t, 'bearer'),
    { manager } = managerFixture(t, { operationTimeout: 5000 });
  // Paginated discovery must reach validation, independently of timeout behavior.
  const input = { ...config(server, 'bearer'), bearerToken: server.state.access };
  server.state.tools = Array.from({ length: 201 }, (_, index) => ({
    name: 'tool_' + index,
    inputSchema: { type: 'object' },
  }));
  let result = await manager.connect(input);
  assert.equal(result.connection.error.code, 'tool-limit');
  server.state.tools = [
    { name: 'private', description: server.state.access, inputSchema: { type: 'object' } },
  ];
  result = await manager.connect({ ...input, id: result.connection.id });
  assert.equal(result.connection.error.code, 'sensitive-result');
  assert.doesNotMatch(JSON.stringify(result), /fixture-access-secret/);
  server.state.tools = [
    { name: 'huge', inputSchema: { type: 'object', description: 'x'.repeat(65537) } },
  ];
  result = await manager.connect({ ...input, id: result.connection.id });
  assert.equal(result.connection.status, 'error');
  assert.equal(server.state.calls, 0);
});

test(
  'a timed-out connection fails without establishing a connected state',
  { timeout: 5000 },
  async (t) => {
    const server = await mockMcpServer(t, 'bearer'),
      { manager } = managerFixture(t, { operationTimeout: 100 });
    server.state.hang = true;
    const result = await manager.connect({
      ...config(server, 'bearer'),
      bearerToken: server.state.access,
    });
    assert.equal(result.connection.status, 'error');
    assert.equal(result.connection.error.code, 'connection-failed');
    assert.equal(manager.list().connections[0].status, 'error');
    assert.equal(server.state.calls, 0);
  },
);

test('discovery retains output contracts without compiling provider schemas; a changed contract prevents invocation', async (t) => {
  const server = await mockMcpServer(t),
    { manager } = managerFixture(t);
  server.state.tools[0].outputSchema = {
    type: 'object',
    properties: { label: { type: 'string' } },
    required: ['label'],
  };
  const { connection } = await manager.connect(config(server));
  assert.equal(connection.status, 'connected');
  assert.equal(connection.tools[0].outputSchema, undefined);
  assert.deepEqual(
    manager.getTools(connection.id)[0].outputSchema,
    server.state.tools[0].outputSchema,
  );
  server.state.tools[0].outputSchema.required = [];
  await assert.rejects(manager.invoke(connection.id, 'fixture.read', {}), { code: 'tool-changed' });
  assert.equal(server.state.calls, 0);
});
