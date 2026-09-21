import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { queueRequest, cancelJob } from '../scripts/studio/domain.mjs';
import { createMcpBroker } from '../scripts/studio/mcp-broker.mjs';
import { readControlTools } from '../scripts/studio/control-tools.mjs';
import { digest } from '../scripts/studio/files.mjs';

// Real broker and persistence; the provider adapter is a controlled local fixture.
function fixture(t, { now = Date.now, initialPermission = 'ask' } = {}) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'control-tools-'));
  const store = createStudioStore(root),
    id = randomUUID();
  const schema = {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query'],
    additionalProperties: false,
  };
  const tool = {
    name: 'fixture.search',
    description: 'Local fixture',
    inputSchema: schema,
    inputSchemaFingerprint: digest(JSON.stringify(schema)),
  };
  let permission = initialPermission,
    calls = 0;
  let invoke = async () => ({ content: [{ type: 'text', text: 'PRIVATE_RESPONSE' }] });
  const manager = {
    permission: () => permission,
    list: () => ({
      connections: [
        {
          id,
          version: 1,
          name: 'PRIVATE_CONNECTION',
          url: 'https://private.example',
          provider: 'custom',
          status: 'connected',
          tools: [tool],
        },
      ],
    }),
    getTools: () => [tool],
    invoke: async (...args) => {
      args[3].beforeCall();
      calls++;
      return invoke(...args);
    },
  };
  const broker = createMcpBroker({ store, manager, now });
  const jobs = createJobs(store, { mcpContext: broker.claimContext });
  broker.select({ connectionIds: [id] });
  store.commit(store.read().version, (state) => queueRequest(state, { request: 'Local fixture' }));
  const claim = jobs.claim('fixture');
  const input = {
    jobId: claim.job.id,
    connectionId: id,
    toolName: tool.name,
    arguments: { query: 'PRIVATE_ARGUMENT' },
  };
  t.after(() => {
    broker.close();
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  return {
    store,
    root,
    broker,
    manager,
    input,
    setPermission: (value) => {
      permission = value;
    },
    setInvoke: (value) => {
      invoke = value;
    },
    calls: () => calls,
  };
}

test('pending identity is stable and secret-bearing arguments, result, URL and connection label never enter control', async (t) => {
  const f = fixture(t);
  const action = await f.broker.call(f.input);
  const file = path.join(f.root, '.devmethod/mcp-actions.json');
  const bytes = fs.readFileSync(file);
  const control = readControlTools(f.store, f.input.jobId);
  assert.equal(control.pending[0].requestId, action.requestId);
  assert.equal(control.pending[0].permission, 'awaiting-approval');
  assert.equal(control.pending[0].toolName, 'fixture.search');
  assert.deepEqual(readControlTools(f.store, f.input.jobId), control);
  assert.deepEqual(fs.readFileSync(file), bytes);
  assert.doesNotMatch(JSON.stringify(control), /PRIVATE_|private.example|arguments/);
  assert.equal(f.calls(), 0);
  assert.deepEqual(readControlTools(f.store, 'another-job').pending, []);
  f.broker.decide({ requestId: action.requestId, decision: 'deny' });
  assert.equal(readControlTools(f.store, f.input.jobId).failures[0].status, 'denied');
  assert.equal((await f.broker.call(f.input)).status, 'denied');
  assert.equal(f.calls(), 0);
});

for (const isError of [false, true])
  test(`completed provider response isError=${isError} is transport-only evidence`, async (t) => {
    const f = fixture(t, { initialPermission: 'allow' });
    f.setInvoke(async () => ({ isError, content: [{ type: 'text', text: 'PRIVATE_RESPONSE' }] }));
    await f.broker.call(f.input);
    const control = readControlTools(f.store, f.input.jobId);
    assert.equal(control.evidence[0].kind, 'mcp-transport');
    assert.equal(control.evidence[0].status, isError ? 'failed' : 'passed');
    assert.equal(control.failures.length, isError ? 1 : 0);
    assert.doesNotMatch(JSON.stringify(control), /PRIVATE_|private.example/);
    assert.deepEqual(readControlTools(f.store, 'another-job').evidence, []);
    assert.equal(f.store.read().checks.length, 0);
  });

test('live executing observation never rewrites the journal; unknown remains a global stop after restart without misattribution', async (t) => {
  const f = fixture(t, { initialPermission: 'allow' });
  let started;
  const running = new Promise((resolve) => {
    started = resolve;
  });
  f.setInvoke(
    (_id, _tool, _args, options) =>
      new Promise((_resolve, reject) => {
        started();
        options.signal.addEventListener('abort', () => reject(new Error('fixture interruption')), {
          once: true,
        });
      }),
  );
  const invocation = f.broker.call(f.input);
  await running;
  const file = path.join(f.root, '.devmethod/mcp-actions.json');
  const bytes = fs.readFileSync(file);
  assert.equal(readControlTools(f.store, f.input.jobId).pending[0].status, 'executing');
  assert.equal(readControlTools(f.store, f.input.jobId).externalOutcomeUnknown, false);
  assert.deepEqual(fs.readFileSync(file), bytes);
  f.broker.close();
  assert.equal((await invocation).status, 'unknown');
  const restarted = createMcpBroker({ store: f.store, manager: f.manager });
  t.after(() => restarted.close());
  const unrelated = readControlTools(f.store, 'another-job');
  assert.equal(unrelated.externalOutcomeUnknown, true);
  assert.deepEqual(unrelated.evidence, []);
  assert.deepEqual(unrelated.failures, []);
  assert.equal(readControlTools(f.store, f.input.jobId).failures[0].status, 'unknown');
  assert.equal(f.calls(), 1);
});

test('expired and cancelled pending permissions do not remain requests for approval', async (t) => {
  const expired = fixture(t, { now: () => Date.now() - 601000 });
  await expired.broker.call(expired.input);
  const result = readControlTools(expired.store, expired.input.jobId);
  assert.deepEqual(result.pending, []);
  assert.equal(result.failures[0].status, 'expired');
  const cancelled = fixture(t);
  await cancelled.broker.call(cancelled.input);
  cancelled.store.commit(cancelled.store.read().version, (state) =>
    cancelJob(state, { jobId: cancelled.input.jobId }),
  );
  assert.equal(
    readControlTools(cancelled.store, cancelled.input.jobId).failures[0].status,
    'cancelled',
  );
  assert.equal(cancelled.calls(), 0);
});

test('corrupt persisted action fails closed without modifying its bytes', async (t) => {
  const f = fixture(t);
  await f.broker.call(f.input);
  const file = path.join(f.root, '.devmethod/mcp-actions.json');
  const value = JSON.parse(fs.readFileSync(file));
  value.actions[0].arguments.query = 'tampered';
  fs.writeFileSync(file, JSON.stringify(value));
  const bytes = fs.readFileSync(file);
  assert.throws(() => readControlTools(f.store, f.input.jobId), /invalide/);
  assert.deepEqual(fs.readFileSync(file), bytes);
});

test('malformed ledger errors never expose private parser excerpts', (t) => {
  const f = fixture(t);
  const file = path.join(f.root, '.devmethod/mcp-actions.json');
  fs.writeFileSync(file, '{PRIVATE_SECRET');
  assert.throws(
    () => readControlTools(f.store, f.input.jobId),
    (error) => {
      assert.match(error.message, /illisible/);
      assert.doesNotMatch(error.message, /PRIVATE_SECRET/);
      return true;
    },
  );
});

test('live unknown downgrades a durable action without rewriting storage or promoting live success', async (t) => {
  const f = fixture(t);
  const action = await f.broker.call(f.input);
  const file = path.join(f.root, '.devmethod/mcp-actions.json');
  const before = fs.readFileSync(file);
  const unknown = readControlTools(f.store, f.input.jobId, [
    { requestId: action.requestId, status: 'unknown' },
  ]);
  assert.equal(unknown.externalOutcomeUnknown, true);
  assert.equal(unknown.failures[0].status, 'unknown');
  assert.deepEqual(fs.readFileSync(file), before);
  const success = readControlTools(f.store, f.input.jobId, [
    { requestId: action.requestId, status: 'completed', isError: false },
  ]);
  assert.equal(success.pending.length, 1);
  assert.deepEqual(success.evidence, []);
});
