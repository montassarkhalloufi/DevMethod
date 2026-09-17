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
import { validateMcpArguments } from '../scripts/studio/mcp-schema.mjs';

const makeTool = (
  schema = {
    type: 'object',
    properties: { query: { type: 'string', minLength: 1 } },
    required: ['query'],
    additionalProperties: false,
  },
) => ({
  name: 'demo.search',
  description: 'Local mock only',
  inputSchema: schema,
  inputSchemaFingerprint: digest(JSON.stringify(schema)),
});

function fixture(t, options = {}) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-mcp-broker-'));
  const store = createStudioStore(root),
    id = randomUUID(),
    secondId = randomUUID();
  const entries = [id, secondId].map((id) => ({
    id,
    version: 1,
    name: 'Local mock MCP',
    provider: 'custom',
    status: 'connected',
    tools: [makeTool()],
  }));
  const calls = [];
  let implementation = async () => ({ content: [{ type: 'text', text: 'Local mock result' }] });
  const manager = {
    list: () => ({ connections: structuredClone(entries) }),
    getTools: (id) => structuredClone(entries.find((entry) => entry.id === id).tools),
    invoke: async (...args) => {
      calls.push(args);
      return implementation(...args);
    },
  };
  const broker = createMcpBroker({ store, manager, ...options });
  const jobs = createJobs(store, { mcpContext: broker.claimContext });
  t.after(() => {
    broker.close();
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const claim = () => {
    store.commit(store.read().version, (state) =>
      queueRequest(state, { request: 'Inspecter le service explicitement sélectionné' }),
    );
    return jobs.claim('manual-host');
  };
  return {
    root,
    store,
    id,
    secondId,
    entries,
    manager,
    broker,
    jobs,
    calls,
    claim,
    implementation: (value) => {
      implementation = value;
    },
  };
}

const request = (jobId, connectionId) => ({
  jobId,
  connectionId,
  toolName: 'demo.search',
  arguments: { query: 'Demo' },
});

test('claim persists exact selected permissions; host can discover schemas and invoke without fabricating project evidence', async (t) => {
  const f = fixture(t);
  f.broker.select({ connectionIds: [f.id] });
  const claimed = f.claim(),
    before = f.store.read();
  assert.equal(claimed.context.mcp.execution, 'manual-host-only');
  assert.equal(claimed.context.mcp.nativeRunner, false);
  assert.equal(claimed.context.mcp.connections[0].id, f.id);
  f.entries[0].tools[0].outputSchema = { type: 'object' };
  assert.match(claimed.context.mcp.instructions, /not general permission/);
  assert.deepEqual(claimed.context.mcp.commands.call.slice(0, 4), [
    'devmethod',
    'studio',
    'mcp',
    'call',
  ]);
  assert.equal(
    f.broker.tools({ jobId: claimed.job.id, connectionId: f.id }).tools[0].inputSchema,
    undefined,
  );
  assert.equal(
    f.broker.tools({ jobId: claimed.job.id, connectionId: f.id }).tools[0].outputSchema,
    undefined,
  );
  assert.equal(
    f.broker.tools({ jobId: claimed.job.id, connectionId: f.id, toolName: 'demo.search' }).tools[0]
      .inputSchema.type,
    'object',
  );
  const restored = createMcpBroker({ store: f.store, manager: f.manager });
  const result = await restored.call(request(claimed.job.id, f.id));
  restored.close();
  assert.equal(result.result.content[0].text, 'Local mock result');
  assert.equal(result.isError, false);
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.calls[0].slice(0, 3), [f.id, 'demo.search', { query: 'Demo' }]);
  assert.deepEqual(f.store.read(), before);
  const persisted = JSON.parse(
    fs.readFileSync(path.join(f.root, `.devmethod/mcp-jobs/${claimed.job.id}.json`), 'utf8'),
  );
  assert.deepEqual(persisted.connections, [
    {
      id: f.id,
      version: 1,
      tools: [{ name: 'demo.search', inputSchemaFingerprint: makeTool().inputSchemaFingerprint }],
    },
  ]);
});

test('unknown arguments and fields, unsupported schemas and changed tools never reach provider', async (t) => {
  const f = fixture(t);
  f.broker.select({ connectionIds: [f.id] });
  const { job } = f.claim(),
    valid = request(job.id, f.id);
  for (const input of [
    { ...valid, arguments: {} },
    { ...valid, arguments: { query: 2 } },
    { ...valid, arguments: { query: 'ok', secret: 'extra' } },
    { ...valid, env: {} },
    { ...valid, toolName: '../read' },
    { ...valid, arguments: { query: 'a'.repeat(66000) } },
  ])
    await assert.rejects(f.broker.call(input));
  f.entries[0].tools = [makeTool({ type: 'object', properties: { query: { type: 'number' } } })];
  await assert.rejects(f.broker.call(valid), { status: 409, code: 'tool-changed' });
  assert.equal(f.calls.length, 0);
  await assert.rejects(
    validateMcpArguments({ type: 'object', $ref: 'https://untrusted.invalid/schema' }, {}),
    { code: 'unsupported-schema' },
  );
  await assert.rejects(
    validateMcpArguments(
      { type: 'object', properties: { value: { type: 'integer', minimum: 2, maximum: 3 } } },
      { value: 4 },
    ),
    { code: 'invalid-arguments' },
  );
});

test('selection cannot extend a running job; revocation and reconnect invalidate prior authority', async (t) => {
  const f = fixture(t);
  f.broker.select({ connectionIds: [f.id] });
  const { job } = f.claim();
  f.broker.select({ connectionIds: [f.id, f.secondId] });
  await assert.rejects(f.broker.call(request(job.id, f.secondId)), { status: 403 });
  f.broker.select({ connectionIds: [f.secondId] });
  await assert.rejects(f.broker.call(request(job.id, f.id)), { status: 403 });
  f.broker.select({ connectionIds: [f.id] });
  f.entries[0].version++;
  await assert.rejects(f.broker.call(request(job.id, f.id)), {
    status: 409,
    code: 'connection-changed',
  });
  assert.equal(f.calls.length, 0);
});

test('a cancelled or stale job cannot discover tools or call them', async (t) => {
  const f = fixture(t);
  f.broker.select({ connectionIds: [f.id] });
  const { job } = f.claim();
  f.store.commit(f.store.read().version, (state) => cancelJob(state, { jobId: job.id }));
  assert.throws(() => f.broker.tools({ jobId: job.id, connectionId: f.id }), { status: 409 });
  await assert.rejects(f.broker.call(request(job.id, f.id)), { status: 409 });
  const other = f.claim();
  const changed = f.store.read();
  changed.activeRevision = 'different-baseline';
  const stale = createMcpBroker({
    store: { root: f.root, read: () => changed },
    manager: f.manager,
  });
  await assert.rejects(stale.call(request(other.job.id, f.id)), { status: 409 });
  stale.close();
  assert.equal(f.calls.length, 0);
});

test('in-flight results are withheld after deselection and calls are serialized per job', async (t) => {
  const f = fixture(t);
  f.broker.select({ connectionIds: [f.id] });
  const { job } = f.claim();
  let release, arrived;
  const started = new Promise((resolve) => {
    arrived = resolve;
  });
  f.implementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
        arrived();
      }),
  );
  const pending = f.broker.call(request(job.id, f.id));
  await started;
  await assert.rejects(f.broker.call(request(job.id, f.id)), { status: 409, code: 'busy' });
  f.broker.select({ connectionIds: [] });
  release({ content: [{ type: 'text', text: 'Late private content' }] });
  await assert.rejects(pending, { status: 403, code: 'not-selected' });
  assert.equal(f.calls.length, 1);
});

test('MCP isError remains a tool failure; unsafe thrown errors and oversized output are not returned', async (t) => {
  const f = fixture(t);
  f.broker.select({ connectionIds: [f.id] });
  const { job } = f.claim(),
    valid = request(job.id, f.id);
  f.implementation(async () => ({
    isError: true,
    content: [{ type: 'text', text: 'Mock refusal' }],
  }));
  assert.equal((await f.broker.call(valid)).isError, true);
  f.implementation(async () => {
    throw new Error('provider-token-MUST-NOT-LEAK');
  });
  await assert.rejects(
    f.broker.call(valid),
    (error) => error.status === 502 && !error.message.includes('MUST-NOT-LEAK'),
  );
  f.implementation(async () => ({ content: [{ type: 'text', text: 'x'.repeat(262145) }] }));
  await assert.rejects(f.broker.call(valid), { status: 413 });
  assert.equal(f.store.read().checks.length, 0);
});

test('timeout aborts once, does not retry, and reports unknown external effects', async (t) => {
  const f = fixture(t, { timeoutMs: 5000 });
  f.broker.select({ connectionIds: [f.id] });
  const { job } = f.claim();
  f.implementation(
    (_id, _name, _args, { signal }) =>
      new Promise((_, reject) =>
        signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }),
      ),
  );
  await assert.rejects(
    f.broker.call(request(job.id, f.id)),
    (error) => error.status === 504 && /effet externe.*inconnu/.test(error.message),
  );
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0][3].signal.aborted, true);
});

test('missing or corrupt immutable permissions and symlink destinations fail closed', async (t) => {
  const f = fixture(t);
  f.broker.select({ connectionIds: [f.id] });
  const { job } = f.claim(),
    file = path.join(f.root, `.devmethod/mcp-jobs/${job.id}.json`);
  fs.writeFileSync(file, '{broken');
  await assert.rejects(f.broker.call(request(job.id, f.id)), {
    status: 409,
    code: 'invalid-snapshot',
  });
  fs.unlinkSync(file);
  fs.symlinkSync(path.join(f.root, '.devmethod/studio.json'), file);
  await assert.rejects(f.broker.call(request(job.id, f.id)), { status: 409 });
  assert.equal(f.calls.length, 0);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(f.root, '.devmethod/studio.json'))).jobs[0].status,
    'running',
  );
});

test('schema validation honors 2020-12 constraints and refuses async or unknown executable vocabulary', async () => {
  const schema = {
    type: 'object',
    allOf: [{ properties: { query: { type: 'string' } } }],
    unevaluatedProperties: false,
  };
  await validateMcpArguments(schema, { query: 'allowed' });
  await assert.rejects(validateMcpArguments(schema, { query: 'allowed', unexpected: true }), {
    code: 'invalid-arguments',
  });
  await assert.rejects(validateMcpArguments({ type: 'object', required: ['constructor'] }, {}), {
    code: 'invalid-arguments',
  });
  await assert.rejects(
    validateMcpArguments({ type: 'object', $async: true, required: ['missing'] }, {}),
    { code: 'unsupported-schema' },
  );
  await assert.rejects(validateMcpArguments({ type: 'object', customConstraint: true }, {}), {
    code: 'unsupported-schema',
  });
  await validateMcpArguments(
    {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: { date: { type: 'string', format: 'date-time' } },
    },
    { date: 'format is an annotation' },
  );
});

test('corrupt selection fails claim without persisting private parser excerpts into job state', (t) => {
  const f = fixture(t);
  fs.writeFileSync(
    path.join(f.root, '.devmethod/mcp-selection.json'),
    'private-selection-sentinel not-json',
  );
  assert.throws(f.claim, { code: 'context-unavailable' });
  const state = f.store.read();
  assert.equal(state.jobs[0].status, 'failed');
  assert.equal(JSON.stringify(state).includes('private-selection-sentinel'), false);
});
