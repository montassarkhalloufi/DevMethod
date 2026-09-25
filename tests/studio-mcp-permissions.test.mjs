import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { queueRequest, cancelJob } from '../scripts/studio/domain.mjs';
import { digest } from '../scripts/studio/files.mjs';
import { createMcpBroker } from '../scripts/studio/mcp-broker.mjs';
import { createMcpPolicies } from '../scripts/studio/mcp-policy.mjs';
import { exportProject } from '../scripts/studio/bundle.mjs';

function fixture(t, options = {}) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-permissions-'));
  const store = createStudioStore(path.join(root, 'project'));
  fs.writeFileSync(path.join(store.root, '.devmethod/data.json'), '{}');
  const schema = {
    type: 'object',
    properties: { text: { type: 'string' } },
    required: ['text'],
    additionalProperties: false,
  };
  const connection = {
    id: randomUUID(),
    version: 1,
    name: 'Local fixture',
    provider: 'custom',
    url: 'http://localhost:6543/mcp',
    auth: 'none',
    status: 'connected',
    tools: [
      {
        name: 'fixture.write',
        inputSchema: schema,
        inputSchemaFingerprint: digest(JSON.stringify(schema)),
      },
    ],
  };
  const directory = path.join(root, 'private');
  fs.mkdirSync(directory);
  const policies = createMcpPolicies(directory, () => connection);
  let clock = Date.now(),
    implementation = async () => ({ content: [{ type: 'text', text: 'Private fixture result' }] });
  const calls = [];
  const manager = {
    list: () => ({ connections: [connection] }),
    getTools: () => structuredClone(connection.tools),
    permission: policies.permission,
    invoke: async (...args) => {
      args[3].beforeCall();
      calls.push(args);
      return implementation(...args);
    },
  };
  const broker = createMcpBroker({ store, manager, now: () => clock, ...options });
  const jobs = createJobs(store, { mcpContext: broker.claimContext });
  broker.select({ connectionIds: [connection.id] });
  t.after(() => {
    broker.close();
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const claim = () => {
    store.commit(store.read().version, (state) =>
      queueRequest(state, { request: 'Tester un accord local.' }),
    );
    return jobs.claim('fixture');
  };
  const policy = (permission) =>
    policies.update({
      connectionId: connection.id,
      version: policies.read(connection.id).version,
      updates: connection.tools.map((tool) => ({
        toolName: tool.name,
        inputSchemaFingerprint: tool.inputSchemaFingerprint,
        permission,
      })),
    });
  const input = (jobId, extra = {}) => ({
    requestId: randomUUID(),
    jobId,
    connectionId: connection.id,
    toolName: 'fixture.write',
    arguments: { text: 'Exact private fixture arguments' },
    ...extra,
  });
  return {
    root,
    store,
    connection,
    policies,
    directory,
    manager,
    broker,
    jobs,
    calls,
    claim,
    policy,
    input,
    advance: (ms) => {
      clock += ms;
    },
    implementation: (value) => {
      implementation = value;
    },
  };
}

async function terminal(broker, requestId) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = broker.actions({ requestId }).actions[0];
    if (value.status !== 'executing') return value;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Fixture action did not finish');
}

test('default ask persists exact arguments; one human approval invokes once and replay never repeats the effect', async (t) => {
  const f = fixture(t),
    { job } = f.claim(),
    input = f.input(job.id);
  const pending = await f.broker.call(input);
  assert.equal(pending.status, 'pending');
  assert.deepEqual(pending.arguments, input.arguments);
  assert.equal(pending.connectionUrl, f.connection.url);
  assert.equal(f.calls.length, 0);
  const approved = f.broker.decide({ requestId: pending.requestId, decision: 'allow' });
  assert.equal(approved.status, 'executing');
  assert.equal(
    f.broker.decide({ requestId: pending.requestId, decision: 'allow' }).status,
    'executing',
  );
  const done = await terminal(f.broker, pending.requestId);
  assert.equal(done.status, 'completed');
  assert.equal(done.result.content[0].text, 'Private fixture result');
  assert.equal((await f.broker.call(input)).status, 'completed');
  assert.equal(f.calls.length, 1);
  await assert.rejects(f.broker.call({ ...input, arguments: { text: 'Different' } }), {
    code: 'request-conflict',
  });
  const bundle = exportProject(f.store.root, f.store.read());
  assert.equal(bundle.includes(Buffer.from('Exact private fixture arguments')), false);
  assert.equal(bundle.includes(Buffer.from('Private fixture result')), false);
});

test('policies use CAS and exact schema fingerprints; bulk rules do not grant future tools or changed endpoints', (t) => {
  const f = fixture(t);
  assert.equal(f.policies.read(f.connection.id).bulkPermission, 'ask');
  const saved = f.policy('allow');
  assert.equal(saved.bulkPermission, 'allow');
  assert.throws(
    () => f.policies.update({ connectionId: f.connection.id, version: 0, updates: [] }),
    { code: 'policy-conflict' },
  );
  f.connection.tools.push({ ...f.connection.tools[0], name: 'fixture.new' });
  assert.equal(f.policies.read(f.connection.id).tools[1].permission, 'ask');
  f.connection.tools[0].inputSchemaFingerprint = 'a'.repeat(64);
  assert.equal(f.policies.read(f.connection.id).tools[0].permission, 'ask');
  const restored = createMcpPolicies(f.directory, () => f.connection);
  assert.equal(restored.read(f.connection.id).version, saved.version + 2);
  f.connection.url = 'https://another.example/mcp';
  assert.equal(restored.read(f.connection.id).bulkPermission, 'ask');
});

test('output-only contract changes invalidate CAS, pending consent and prior grants without resurrection', async (t) => {
  const f = fixture(t);
  const original = structuredClone(f.connection.tools[0]);
  const saved = f.policy('allow');
  const { job } = f.claim();
  f.policy('ask');
  const pending = await f.broker.call(f.input(job.id));
  const beforeChange = f.policies.read(f.connection.id).version;
  f.connection.tools[0].outputSchemaFingerprint = 'c'.repeat(64);
  const changed = f.policies.read(f.connection.id);
  assert.equal(changed.tools[0].permission, 'ask');
  assert.ok(changed.version > saved.version);
  assert.throws(
    () => f.policies.update({ connectionId: f.connection.id, version: beforeChange, updates: [] }),
    { code: 'policy-conflict' },
  );
  assert.equal(
    f.broker.decide({ requestId: pending.requestId, decision: 'allow' }).status,
    'cancelled',
  );
  f.policy('allow');
  f.connection.tools[0] = original;
  assert.equal(f.policies.read(f.connection.id).tools[0].permission, 'ask');
  f.connection.tools[0].outputSchemaFingerprint = 'c'.repeat(64);
  assert.equal(f.policies.read(f.connection.id).tools[0].permission, 'ask');
  assert.equal(f.calls.length, 0);
});

test('captured and current policy use stricter permission; relaxed policy cannot authorize a running job', async (t) => {
  for (const [captured, current, expected] of [
    ['allow', 'ask', 'pending'],
    ['ask', 'allow', 'pending'],
    ['deny', 'allow', 'denied'],
    ['allow', 'deny', 'denied'],
  ]) {
    const f = fixture(t);
    f.policy(captured);
    const { job } = f.claim();
    f.policy(current);
    if (expected === 'denied')
      await assert.rejects(f.broker.call(f.input(job.id)), { code: 'policy-denied' });
    else assert.equal((await f.broker.call(f.input(job.id))).status, expected);
    assert.equal(f.calls.length, 0);
  }
});

test('pending consent survives broker reload, expires after ten minutes and cannot be replayed', async (t) => {
  const f = fixture(t),
    { job } = f.claim(),
    pending = await f.broker.call(f.input(job.id));
  const restored = createMcpBroker({ store: f.store, manager: f.manager });
  assert.equal(restored.actions({ requestId: pending.requestId }).actions[0].status, 'pending');
  restored.close();
  f.advance(600001);
  assert.equal(
    f.broker.decide({ requestId: pending.requestId, decision: 'allow' }).status,
    'expired',
  );
  assert.equal(f.calls.length, 0);
});

test('job cancellation, schema change, reconnection, deselection and deny invalidate pending consent', async (t) => {
  for (const kind of ['job', 'schema', 'output-schema', 'connection', 'selection', 'policy']) {
    const f = fixture(t),
      { job } = f.claim(),
      pending = await f.broker.call(f.input(job.id));
    if (kind === 'job')
      f.store.commit(f.store.read().version, (state) => cancelJob(state, { jobId: job.id }));
    if (kind === 'schema') f.connection.tools[0].inputSchemaFingerprint = 'b'.repeat(64);
    if (kind === 'output-schema') f.connection.tools[0].outputSchemaFingerprint = 'b'.repeat(64);
    if (kind === 'connection') f.connection.version += 1;
    if (kind === 'selection') f.broker.select({ connectionIds: [] });
    if (kind === 'policy') f.policy('deny');
    assert.equal(
      f.broker.decide({ requestId: pending.requestId, decision: 'allow' }).status,
      kind === 'policy' ? 'denied' : 'cancelled',
    );
    assert.equal(f.calls.length, 0);
  }
});

test('explicit refusal and legacy calls without IDs are durable and deduplicated', async (t) => {
  const f = fixture(t),
    { job } = f.claim(),
    input = f.input(job.id, { requestId: undefined });
  const pending = await f.broker.call(input);
  assert.equal((await f.broker.call(input)).requestId, pending.requestId);
  assert.equal(
    f.broker.decide({ requestId: pending.requestId, decision: 'deny' }).status,
    'denied',
  );
  assert.equal((await f.broker.call(input)).status, 'denied');
  assert.equal(f.calls.length, 0);
});

test('in-flight receipt after process loss becomes unknown, and retries never repeat an ambiguous effect', async (t) => {
  const f = fixture(t),
    { job } = f.claim(),
    input = f.input(job.id);
  await f.broker.call(input);
  const file = path.join(f.store.root, '.devmethod/mcp-actions.json');
  const persisted = JSON.parse(fs.readFileSync(file, 'utf8'));
  persisted.actions[0].status = 'executing';
  fs.writeFileSync(file, JSON.stringify(persisted));
  const restored = createMcpBroker({ store: f.store, manager: f.manager });
  assert.equal((await restored.call(input)).status, 'unknown');
  assert.equal(
    restored.decide({ requestId: input.requestId, decision: 'allow' }).status,
    'unknown',
  );
  assert.equal(f.calls.length, 0);
  restored.close();
});

test('allow executes synchronously, timeout records unknown and identical retries do not execute again', async (t) => {
  const f = fixture(t, { timeoutMs: 300 });
  f.policy('allow');
  const { job } = f.claim(),
    input = f.input(job.id);
  f.implementation(() => new Promise(() => {}));
  const result = await f.broker.call(input);
  assert.equal(result.status, 'unknown');
  assert.equal(result.error.code, 'call-timeout');
  assert.equal((await f.broker.call(input)).status, 'unknown');
  assert.equal(f.calls.length, 1);
});

test('old snapshots acquire ask semantics instead of silently granting tool execution', async (t) => {
  const f = fixture(t);
  f.policy('allow');
  const { job } = f.claim();
  const file = path.join(f.store.root, `.devmethod/mcp-jobs/${job.id}.json`);
  const snapshot = JSON.parse(fs.readFileSync(file, 'utf8'));
  snapshot.format = 1;
  for (const connection of snapshot.connections)
    for (const tool of connection.tools) delete tool.permission;
  fs.writeFileSync(file, JSON.stringify(snapshot));
  assert.equal((await f.broker.call(f.input(job.id))).status, 'pending');
  assert.equal(f.calls.length, 0);
});

test('an executed effect with failed result persistence remains unknown and cannot be repeated', async (t) => {
  const f = fixture(t);
  f.policy('allow');
  const { job } = f.claim(),
    input = f.input(job.id);
  const file = path.join(f.store.root, '.devmethod/mcp-actions.json');
  f.implementation(async () => {
    fs.renameSync(file, file + '.saved');
    fs.mkdirSync(file);
    return { content: [{ type: 'text', text: 'Effect happened in local fixture' }] };
  });
  const result = await f.broker.call(input);
  assert.equal(result.status, 'unknown');
  assert.equal(result.error.code, 'result-storage-failed');
  assert.equal(f.broker.actions({ requestId: input.requestId }).actions[0].status, 'unknown');
  assert.equal((await f.broker.call(input)).status, 'unknown');
  assert.equal(f.calls.length, 1);
});
