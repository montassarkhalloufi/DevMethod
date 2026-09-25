import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { startStudioHome } from '../scripts/studio/home-server.mjs';
import { mockMcpServer } from './fixtures/mcp-server.mjs';

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'mcp-http-'));
  const home = await startStudioHome({ directory, port: 0 }),
    origin = home.runtime().url;
  t.after(async () => {
    await home.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    directory,
    origin,
    home,
    async post(route, input, headers = {}) {
      const response = await fetch(origin + route, {
        method: 'POST',
        headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(input),
      });
      return { status: response.status, data: await response.json() };
    },
  };
}

test('home HTTP OAuth discovery/callback exposes sanitized tools, while project launch stores only validated selected IDs/context', async (t) => {
  const server = await mockMcpServer(t, 'oauth'),
    f = await fixture(t);
  const input = { provider: 'custom', name: 'Fixture OAuth', url: server.url, auth: 'oauth' };
  assert.equal(
    (await f.post('/api/mcp/connect', input, { Origin: 'https://foreign.invalid' })).status,
    403,
  );
  const initial = await (await fetch(f.origin + '/api/mcp')).json();
  assert.equal(initial.supported, true);
  assert.equal(initial.nativeRunner, false);
  assert.equal(initial.connections.length, 0);
  const connection = await f.post('/api/mcp/connect', input);
  assert.equal(connection.status, 200);
  assert.equal(connection.data.connection.status, 'authorization-required');
  const launch = {
    requestId: randomUUID(),
    kind: 'new',
    idea: 'Use selected fixture tools',
    launch: {
      action: 'plan',
      projectType: 'app',
      mcpConnectionIds: [connection.data.connection.id],
    },
  };
  assert.equal((await f.post('/api/home/projects', launch)).status, 409);
  assert.equal(fs.existsSync(path.join(f.directory, 'projects')), false);
  const authorization = await fetch(connection.data.authorizationUrl, { redirect: 'manual' });
  const callback = authorization.headers.get('location');
  assert.equal(new URL(callback).origin, f.origin);
  assert.equal((await fetch(callback)).status, 200);
  assert.equal((await fetch(callback)).status, 400);
  const index = await (await fetch(f.origin + '/api/mcp')).json();
  assert.equal(index.connections[0].status, 'connected');
  assert.doesNotMatch(
    JSON.stringify(index),
    /fixture-access-secret|fixture-refresh-secret|code_verifier|client_id/,
  );
  const created = await f.post('/api/home/projects', launch);
  assert.equal(created.status, 200);
  const workspace = created.data.project.workspace;
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(workspace, '.devmethod/mcp-selection.json'), 'utf8')),
    { format: 1, connectionIds: [connection.data.connection.id] },
  );
  const stateText = fs.readFileSync(path.join(workspace, '.devmethod/studio.json'), 'utf8');
  assert.match(stateText, /Fixture OAuth/);
  assert.match(stateText, /fixture\.read/);
  assert.match(stateText, /ne reçoit pas automatiquement ces outils/);
  assert.doesNotMatch(
    stateText,
    /fixture-access-secret|fixture-refresh-secret|client_id|code_verifier/,
  );
  assert.equal(JSON.parse(stateText).jobs.length, 1);
  assert.equal(server.state.calls, 0);
  const disconnected = await f.post('/api/mcp/disconnect', { id: connection.data.connection.id });
  assert.equal(disconnected.data.connection.status, 'disconnected');
  assert.equal(
    (await f.post('/api/home/projects', launch)).data.project.id,
    created.data.project.id,
  );
  assert.equal(
    (await f.post('/api/home/projects', { ...launch, requestId: randomUUID() })).status,
    409,
  );
});

test('home rejects unknown/forged MCP selections and raw malformed credentials before writes without echoing them', async (t) => {
  const f = await fixture(t);
  const launch = {
    requestId: randomUUID(),
    kind: 'new',
    idea: 'Invalid selection',
    launch: { action: 'build', projectType: 'app', mcpConnectionIds: [randomUUID()] },
  };
  assert.equal((await f.post('/api/home/projects', launch)).status, 409);
  assert.equal(
    (
      await f.post('/api/home/projects', {
        ...launch,
        launch: { ...launch.launch, mcpConnections: [{ name: 'fake connected' }] },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await f.post('/api/home/projects', {
        ...launch,
        launch: { ...launch.launch, mcpConnectionIds: Array(13).fill(randomUUID()) },
      })
    ).status,
    400,
  );
  const rejected = await f.post('/api/mcp/connect', {
    provider: 'custom',
    name: 'bad',
    url: 'https://user:sentinel-secret@invalid.test/mcp',
    auth: 'bearer',
    bearerToken: 'sentinel-token',
  });
  assert.equal(rejected.status, 400);
  assert.doesNotMatch(JSON.stringify(rejected), /sentinel/);
  assert.equal((await (await fetch(f.origin + '/api/home')).json()).projects.length, 0);
  assert.equal(
    (await fetch(f.origin + '/api/mcp/callback?state=bad&code=private-code')).status,
    400,
  );
});
