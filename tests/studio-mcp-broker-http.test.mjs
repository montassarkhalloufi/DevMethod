import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { startStudio } from '../scripts/studio/server.mjs';
import { createMcpManager } from '../scripts/studio/mcp-manager.mjs';
import { queueRequest } from '../scripts/studio/domain.mjs';
import { exportProject } from '../scripts/studio/bundle.mjs';
import { mockMcpServer } from './fixtures/mcp-server.mjs';

const execute = promisify(execFile),
  cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));

async function run(args) {
  try {
    return {
      code: 0,
      ...(await execute(process.execPath, [cli, 'studio', ...args], { timeout: 10000 })),
    };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

async function fixture(t, connected = true) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-mcp-http-'));
  const service = connected ? await mockMcpServer(t, 'bearer') : null;
  let studio;
  const manager = connected
    ? createMcpManager({
        directory: path.join(root, 'shared'),
        getOrigin: () => studio.runtime().url,
      })
    : undefined;
  const connection = connected
    ? (
        await manager.connect({
          provider: 'custom',
          name: 'Mock MCP local réel',
          url: service.url,
          auth: 'bearer',
          bearerToken: service.state.access,
        })
      ).connection
    : undefined;
  if (connection) {
    const policy = manager.policy(connection.id);
    manager.setPolicy({
      connectionId: connection.id,
      version: policy.version,
      updates: policy.tools.map((tool) => ({
        toolName: tool.name,
        inputSchemaFingerprint: tool.inputSchemaFingerprint,
        permission: 'allow',
      })),
    });
  }
  studio = await startStudio({
    workspace: path.join(root, 'project'),
    port: 0,
    mcpManager: manager,
  });
  t.after(async () => {
    await studio.close();
    await manager?.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const post = async (route, value, headers = { Origin: studio.runtime().url }) => {
    const response = await fetch(studio.runtime().url + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(value),
    });
    return { status: response.status, body: await response.json() };
  };
  return {
    root,
    service,
    manager,
    connection,
    studio,
    post,
    worker: () => ({ Authorization: 'Bearer ' + studio.runtime().token }),
  };
}

async function approveAction(f, requestId) {
  const decision = await f.post('/api/mcp/actions/decide', { requestId, decision: 'allow' });
  assert.equal(decision.status, 202, JSON.stringify(decision.body));
  for (let attempt = 0; attempt < 100; attempt++) {
    const response = await fetch(
      f.studio.runtime().url + '/api/mcp/actions?requestId=' + requestId,
    );
    const action = (await response.json()).actions[0];
    if (action.status !== 'executing') return action;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail('MCP action did not complete');
}

function queue(studio) {
  studio.store.commit(studio.store.read().version, (state) =>
    queueRequest(state, { request: 'Lire la fixture MCP locale, sans action fournisseur réel' }),
  );
}

test('real local MCP transport is callable from worker CLI only for the selected current job; no credentials or synthetic checks leak', async (t) => {
  const f = await fixture(t);
  assert.equal(f.connection.status, 'connected');
  assert.equal(f.service.state.calls, 0, 'discovery must not execute tools');
  const selection = await f.post('/api/mcp/selection', { connectionIds: [f.connection.id] });
  assert.equal(selection.status, 200);
  queue(f.studio);
  const claimed = await run(['claim', '--workspace', f.studio.store.root]);
  assert.equal(claimed.code, 0, claimed.stderr);
  const claim = JSON.parse(claimed.stdout),
    before = f.studio.store.read();
  assert.equal(claim.context.mcp.connections[0].tools[0].name, 'fixture.read');
  const file = path.join(f.root, 'mcp.json');
  fs.writeFileSync(
    file,
    JSON.stringify({
      jobId: claim.job.id,
      connectionId: f.connection.id,
      toolName: 'fixture.read',
    }),
  );
  const tools = await run(['mcp', 'tools', '--workspace', f.studio.store.root, '--file', file]);
  assert.equal(tools.code, 0, tools.stderr);
  assert.equal(JSON.parse(tools.stdout).tools[0].inputSchema.additionalProperties, false);
  const payload = {
    jobId: claim.job.id,
    connectionId: f.connection.id,
    toolName: 'fixture.read',
    arguments: { query: 'Local fixture only' },
  };
  fs.writeFileSync(file, JSON.stringify(payload));
  const call = await run(['mcp', 'call', '--workspace', f.studio.store.root, '--file', file]);
  assert.equal(call.code, 0, call.stderr);
  const pending = JSON.parse(call.stdout);
  assert.equal(
    pending.status,
    'pending',
    'Control Plane requires an exact human decision without delivery evidence',
  );
  assert.equal(f.service.state.calls, 0);
  const result = await approveAction(f, pending.requestId);
  assert.equal(result.result.content[0].text, 'Fixture result');
  assert.equal(result.isError, false);
  assert.equal(f.service.state.calls, 1);
  const { controlPlane: _plane, version: _version, ...afterData } = f.studio.store.read();
  const { controlPlane: _previousPlane, version: _previousVersion, ...beforeData } = before;
  assert.deepEqual(afterData, beforeData);
  assert.ok(_plane.history.length >= _previousPlane.history.length);
  assert.ok(_version >= _previousVersion);
  f.service.state.toolError = true;
  const refused = await f.post(
    '/api/mcp/call',
    { ...payload, requestId: randomUUID() },
    f.worker(),
  );
  assert.equal(refused.status, 202);
  assert.equal(refused.body.status, 'pending');
  assert.equal((await approveAction(f, refused.body.requestId)).isError, true);
  assert.equal(f.service.state.calls, 2);
  fs.writeFileSync(file, 'invalid fixture-private-value');
  const malformed = await run(['mcp', 'call', '--workspace', f.studio.store.root, '--file', file]);
  assert.equal(malformed.code, 1);
  assert.equal(JSON.stringify(malformed).includes('fixture-private-value'), false);
  const invalidBody = await fetch(f.studio.runtime().url + '/api/mcp/call', {
    method: 'POST',
    headers: { ...f.worker(), 'Content-Type': 'application/json' },
    body: 'invalid fixture-private-value',
  });
  assert.equal(invalidBody.status, 400);
  assert.equal((await invalidBody.text()).includes('fixture-private-value'), false);
  const serialized = JSON.stringify([claimed, tools, call, refused, f.studio.store.read()]);
  for (const token of [f.service.state.access, f.studio.runtime().token]) {
    assert.equal(serialized.includes(token), false);
    assert.equal(
      exportProject(f.studio.store.root, f.studio.store.read()).includes(Buffer.from(token)),
      false,
    );
  }
  assert.equal(f.studio.store.read().checks.length, 0);
  assert.equal(f.studio.store.read().revisions.length, 0);
});

test('HTTP policies and action approvals require the person; exact pending call runs only once after consent', async (t) => {
  const f = await fixture(t),
    url = f.studio.runtime().url;
  const read = async (route, headers = {}) => {
    const response = await fetch(url + route, { headers });
    return { status: response.status, body: await response.json() };
  };
  const policyPath = '/api/mcp/policy?connectionId=' + f.connection.id;
  const policy = await read(policyPath);
  assert.equal(policy.status, 200);
  const updates = policy.body.tools.map((tool) => ({
    toolName: tool.name,
    inputSchemaFingerprint: tool.inputSchemaFingerprint,
    permission: 'ask',
  }));
  const change = { connectionId: f.connection.id, version: policy.body.version, updates };
  assert.equal(
    (await f.post('/api/mcp/policy', change, { ...f.worker(), Origin: url })).status,
    403,
  );
  assert.equal(
    (await f.post('/api/mcp/policy', change, { Origin: 'https://untrusted.invalid' })).status,
    403,
  );
  assert.equal((await f.post('/api/mcp/policy', change)).status, 200);
  assert.equal((await f.post('/api/mcp/policy', change)).status, 409);
  await f.post('/api/mcp/selection', { connectionIds: [f.connection.id] });
  queue(f.studio);
  const { job } = f.studio.jobs.claim('manual host');
  const payload = {
    requestId: randomUUID(),
    jobId: job.id,
    connectionId: f.connection.id,
    toolName: 'fixture.read',
    arguments: { query: 'A private fixture query' },
  };
  const pending = await f.post('/api/mcp/call', payload, f.worker());
  assert.equal(pending.status, 202);
  assert.equal(pending.body.status, 'pending');
  assert.equal(f.service.state.calls, 0);
  const decision = { requestId: payload.requestId, decision: 'allow' };
  assert.equal(
    (await f.post('/api/mcp/actions/decide', decision, { ...f.worker(), Origin: url })).status,
    403,
  );
  assert.equal(
    (await f.post('/api/mcp/actions/decide', decision, { Origin: 'https://untrusted.invalid' }))
      .status,
    403,
  );
  const listing = await read('/api/mcp/actions?jobId=' + job.id);
  assert.equal(listing.body.actions[0].requestId, payload.requestId);
  assert.equal(
    (
      await read('/api/mcp/actions?requestId=' + payload.requestId, {
        Origin: 'https://untrusted.invalid',
      })
    ).status,
    403,
  );
  assert.equal((await f.post('/api/mcp/actions/decide', decision)).status, 202);
  let result;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    result = (await read('/api/mcp/actions?requestId=' + payload.requestId, f.worker())).body
      .actions[0];
    if (result.status !== 'executing') break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(result.status, 'completed');
  assert.equal(result.result.content[0].text, 'Fixture result');
  assert.equal((await f.post('/api/mcp/actions/decide', decision)).body.status, 'completed');
  assert.equal((await f.post('/api/mcp/call', payload, f.worker())).body.status, 'completed');
  assert.equal(f.service.state.calls, 1);
});

test('workers cannot manage shared MCP connections even with the person’s Origin', async (t) => {
  const f = await fixture(t);
  const before = f.manager.list();
  for (const route of ['connect', 'refresh', 'disconnect']) {
    const response = await f.post(
      '/api/mcp/' + route,
      { id: f.connection.id },
      { ...f.worker(), Origin: f.studio.runtime().url },
    );
    assert.equal(response.status, 403, route + ' must reject worker authority before validation');
    assert.deepEqual(f.manager.list(), before);
  }
});

test('project selection is same-origin user-only; tool calls require worker auth and reject late jobs/extra input', async (t) => {
  const f = await fixture(t),
    selection = { connectionIds: [f.connection.id] };
  assert.equal((await f.post('/api/mcp/selection', selection, f.worker())).status, 403);
  assert.equal(
    (
      await f.post('/api/mcp/selection', selection, {
        ...f.worker(),
        Origin: f.studio.runtime().url,
      })
    ).status,
    403,
  );
  assert.deepEqual(
    (await fetch(f.studio.runtime().url + '/api/mcp/selection').then((result) => result.json()))
      .connectionIds,
    [],
    'A worker token with a valid Origin cannot restore or change the person’s selection',
  );
  assert.equal(
    (await f.post('/api/mcp/selection', selection, { Origin: 'https://untrusted.invalid' })).status,
    403,
  );
  assert.equal((await f.post('/api/mcp/selection', { ...selection, tokens: [] })).status, 400);
  assert.equal((await f.post('/api/mcp/selection', selection)).status, 200);
  queue(f.studio);
  const { job } = f.studio.jobs.claim('manual host'),
    url = f.studio.runtime().url;
  const query = new URLSearchParams({ jobId: job.id, connectionId: f.connection.id });
  assert.equal((await fetch(url + '/api/mcp/tools?' + query)).status, 403);
  assert.equal(
    (await fetch(url + '/api/mcp/tools?' + query, { headers: { Origin: url } })).status,
    403,
  );
  assert.equal((await fetch(url + '/api/mcp/tools?' + query, { headers: f.worker() })).status, 200);
  assert.equal(
    (await fetch(url + '/api/mcp/tools?' + query + '&jobId=other', { headers: f.worker() })).status,
    400,
  );
  const payload = {
    jobId: job.id,
    connectionId: f.connection.id,
    toolName: 'fixture.read',
    arguments: {},
  };
  assert.equal((await f.post('/api/mcp/call', payload)).status, 403);
  assert.equal(
    (await f.post('/api/mcp/call', { ...payload, url: 'https://untrusted.invalid' }, f.worker()))
      .status,
    400,
  );
  assert.equal(
    (
      await f.post(
        '/api/mcp/call',
        { ...payload, arguments: { raw: 'x'.repeat(66000) } },
        f.worker(),
      )
    ).status,
    400,
  );
  f.studio.jobs.fail({ jobId: job.id, error: 'Explicit test interruption' });
  assert.equal((await f.post('/api/mcp/call', payload, f.worker())).status, 409);
  assert.equal(f.service.state.calls, 0);
});

test('permission is checked again after provider discovery immediately before tools/call', async (t) => {
  const f = await fixture(t);
  await f.post('/api/mcp/selection', { connectionIds: [f.connection.id] });
  queue(f.studio);
  const { job } = f.studio.jobs.claim('manual host');
  const invoke = f.manager.invoke,
    listed = f.service.state.listed;
  f.manager.invoke = (id, name, args, options) =>
    invoke(id, name, args, {
      ...options,
      beforeCall() {
        assert.ok(f.service.state.listed > listed);
        const policy = f.manager.policy(id);
        f.manager.setPolicy({
          connectionId: id,
          version: policy.version,
          updates: policy.tools.map((tool) => ({
            toolName: tool.name,
            inputSchemaFingerprint: tool.inputSchemaFingerprint,
            permission: 'deny',
          })),
        });
        options.beforeCall();
      },
    });
  const result = await f.post(
    '/api/mcp/call',
    {
      requestId: randomUUID(),
      jobId: job.id,
      connectionId: f.connection.id,
      toolName: 'fixture.read',
      arguments: {},
    },
    f.worker(),
  );
  assert.equal(result.body.status, 'pending');
  const decided = await approveAction(f, result.body.requestId);
  assert.equal(decided.status, 'cancelled');
  assert.equal(decided.error.code, 'policy-denied');
  assert.equal(f.service.state.calls, 0);
  assert.equal(f.manager.list().connections[0].status, 'connected');
});

test('standalone project honestly reports unavailable MCP and CLI documents bounded manual commands', async (t) => {
  const f = await fixture(t, false),
    url = f.studio.runtime().url;
  const selection = await (await fetch(url + '/api/mcp/selection')).json();
  assert.equal(selection.supported, false);
  assert.equal(selection.nativeRunner, false);
  assert.match(selection.reason, /accueil/);
  assert.equal((await f.post('/api/mcp/selection', { connectionIds: [] })).status, 501);
  queue(f.studio);
  const { job, context } = f.studio.jobs.claim('manual host');
  assert.equal(context.mcp.supported, false);
  assert.equal(f.studio.runtime().capabilities.mcpHostBridge, false);
  assert.equal(
    (
      await fetch(
        url +
          '/api/mcp/tools?' +
          new URLSearchParams({
            jobId: job.id,
            connectionId: '00000000-0000-4000-8000-000000000000',
          }),
        { headers: f.worker() },
      )
    ).status,
    501,
  );
  const help = await run(['mcp', '--help']);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /mcp tools\|call/);
  const missing = await run(['mcp', 'call', '--workspace', f.studio.store.root]);
  assert.equal(missing.code, 1);
  assert.match(missing.stderr, /--file payload.json/);
  assert.equal(missing.stdout, '');
});

test('a persistent Control Plane stop appearing during discovery prevents even an approved MCP dispatch', async (t) => {
  const f = await fixture(t);
  await f.post('/api/mcp/selection', { connectionIds: [f.connection.id] });
  queue(f.studio);
  const { job } = f.studio.jobs.claim('manual host');
  const invoke = f.manager.invoke;
  f.manager.invoke = (id, name, args, options) =>
    invoke(id, name, args, {
      ...options,
      beforeCall() {
        fs.writeFileSync(
          path.join(f.studio.store.root, '.devmethod/agent.json'),
          JSON.stringify({
            attempts: 1,
            knownTokens: 0,
            unknownUsage: true,
            runs: [{ jobId: job.id, status: 'failed', usage: null }],
          }),
        );
        options.beforeCall();
      },
    });
  const pending = await f.post(
    '/api/mcp/call',
    {
      requestId: randomUUID(),
      jobId: job.id,
      connectionId: f.connection.id,
      toolName: 'fixture.read',
      arguments: {},
    },
    f.worker(),
  );
  assert.equal(pending.body.status, 'pending');
  const action = await approveAction(f, pending.body.requestId);
  assert.equal(action.status, 'cancelled');
  assert.equal(action.error.code, 'control-plane-blocked');
  assert.equal(f.service.state.calls, 0);
  assert.equal(f.studio.store.read().controlPlane.snapshot.decision.effective, 'Bounded Stop');
});
