import test from 'node:test';
import assert from 'node:assert/strict';
import { createNativeToolsSession } from '../scripts/studio/native-tools-session.mjs';

async function fixture(t) {
  const state = {
    activeRevision: null,
    jobs: [{ id: 'fixed-job', status: 'running', baseRevision: null }],
  };
  const calls = [];
  const broker = Object.fromEntries(
    ['tools', 'call', 'actions'].map((name) => [
      name,
      (input) => {
        calls.push({ name, input });
        return { status: 'pending', requestId: input.requestId };
      },
    ]),
  );
  const session = await createNativeToolsSession({
    store: { read: () => state },
    broker,
    jobId: 'fixed-job',
  });
  t.after(() => session.close());
  const request = (route, input = {}, headers = {}) =>
    fetch(new URL(route, session.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
        ...headers,
      },
      body: JSON.stringify(input),
    });
  return { state, calls, session, request, broker };
}

test('native capability binds every operation to its claimed job, never approving or changing settings', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.request('/tools', { connectionId: 'connection' })).status, 200);
  assert.deepEqual(f.calls[0].input, { connectionId: 'connection', jobId: 'fixed-job' });
  assert.equal(
    (await f.request('/tools', { connectionId: 'connection', jobId: 'other' })).status,
    400,
  );
  assert.equal((await f.request('/actions/decide', { decision: 'allow' })).status, 404);
  assert.equal(
    (await f.request('/call', { connectionId: 'connection', toolName: 'write', arguments: {} }))
      .status,
    400,
  );
  assert.equal(f.calls.length, 1);
});

test('wrong tokens and browser requests never reach the broker', async (t) => {
  const f = await fixture(t);
  for (const headers of [
    { Authorization: 'Bearer wrong' },
    { Origin: f.session.url },
    { 'Sec-Fetch-Site': 'cross-site' },
  ])
    assert.equal((await f.request('/actions', {}, headers)).status, 403);
  assert.equal(f.calls.length, 0);
});

test('ended or stale jobs lose the capability', async (t) => {
  const f = await fixture(t);
  f.state.jobs[0].status = 'ready';
  assert.equal((await f.request('/actions')).status, 409);
  f.state.jobs[0].status = 'running';
  f.state.activeRevision = 'changed';
  assert.equal((await f.request('/actions')).status, 409);
  assert.equal(f.calls.length, 0);
});

test('unexpected broker exceptions do not expose private content', async (t) => {
  const f = await fixture(t);
  f.broker.actions = () => {
    throw new Error('private-provider-error-sentinel');
  };
  const response = await f.request('/actions');
  assert.equal(response.status, 400);
  assert.doesNotMatch(await response.text(), /private-provider-error-sentinel/);
});
