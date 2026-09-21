import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { queueRequest, cancelJob } from '../scripts/studio/domain.mjs';
import { createConnectorInteractions } from '../scripts/studio/connector-interactions.mjs';
import { createConnectorGuideDrafts } from '../scripts/studio/connector-interactions-drafts.mjs';
import { connectorInteractionRoute } from '../scripts/studio/connector-interactions-routes.mjs';
import { prepareConnectorGuide } from '../scripts/studio/connector-guides.mjs';

const input = {
  optionId: 'notion',
  guideVersion: 1,
  flowId: 'notion-context',
  answers: { actions: ['read-content'] },
};
const partial = { ...input, answers: {} };

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-interaction-'));
  const store = createStudioStore(root);
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  store.commit(store.read().version, (state) =>
    queueRequest(state, { request: 'Fixture known guide', connectorGuides: [input] }),
  );
  const { job } = createJobs(store).claim('Fixture host');
  const interactions = createConnectorInteractions(store);
  const request = { jobId: job.id, eventId: 'guide-1', optionId: 'notion', guideVersion: 1 };
  return { root, store, job, interactions, request };
}

test('known guide request is idempotent, bounded and leaves original job and project state immutable', (t) => {
  const f = fixture(t),
    before = f.store.read();
  const result = f.interactions.request(f.request);
  assert.deepEqual(f.interactions.request(f.request), result);
  assert.deepEqual(f.store.read(), before);
  assert.equal(result.interaction.input, null);
  assert.equal(result.interaction.step, 0);
  assert.equal(result.interaction.status, 'pending');
  assert.throws(() => f.interactions.request({ ...f.request, optionId: 'slack' }), { status: 409 });
  for (const wrong of [
    { optionId: 'unknown' },
    { guideVersion: 2 },
    { flowId: 'slack-bot' },
    { token: 'fixture-sensitive' },
  ])
    assert.throws(() => f.interactions.request({ ...f.request, ...wrong }), { status: 400 });
  for (let i = 1; i < 12; i++)
    f.interactions.request({ ...f.request, eventId: 'guide-' + (i + 1) });
  assert.throws(() => f.interactions.request({ ...f.request, eventId: 'overflow' }), {
    status: 429,
  });
});

test('partial choices and step survive reopening, answer canonicalizes once and rejects stale writers', (t) => {
  const f = fixture(t),
    record = f.interactions.request(f.request).interaction;
  const saved = f.interactions.saveDraft({
    interactionId: record.id,
    expectedVersion: 1,
    input: partial,
    step: 1,
  });
  const reopened = createConnectorInteractions(f.store);
  assert.deepEqual(reopened.list(f.job.id).interactions[0], saved.interaction);
  assert.equal(saved.interaction.preparation, null);
  assert.throws(
    () => reopened.answer({ interactionId: record.id, expectedVersion: 2, input: partial }),
    { status: 400 },
  );
  assert.throws(() => reopened.saveDraft({ interactionId: record.id, expectedVersion: 1, input }), {
    status: 409,
  });
  const answer = { interactionId: record.id, expectedVersion: 2, input };
  const result = reopened.answer(answer);
  assert.deepEqual(reopened.answer(answer), result);
  assert.equal(result.interaction.status, 'answered');
  assert.equal(result.interaction.step, 2);
  assert.deepEqual(result.interaction.preparation, prepareConnectorGuide(input));
  assert.throws(
    () => reopened.saveDraft({ interactionId: record.id, expectedVersion: 3, input: partial }),
    { status: 409 },
  );
  assert.equal(f.store.read().jobs[0].connectorGuides[0].input.flowId, input.flowId);
});

test('unknown fields, PAT values and arbitrary options never enter the persisted journal', (t) => {
  const f = fixture(t),
    record = f.interactions.request(f.request).interaction;
  const file = path.join(f.root, '.devmethod/connector-interactions.json'),
    before = fs.readFileSync(file);
  for (const bad of [
    { ...partial, token: 'ghp_fixtureSensitive' },
    { ...input, answers: { actions: ['ghp_fixtureSensitive'] } },
    { ...partial, answers: { secret: 'fixture' } },
  ])
    assert.throws(
      () => f.interactions.saveDraft({ interactionId: record.id, expectedVersion: 1, input: bad }),
      { status: 400 },
    );
  assert.deepEqual(fs.readFileSync(file), before);
  const fixed = f.interactions.request({
    ...f.request,
    eventId: 'fixed-flow',
    flowId: 'notion-context',
  }).interaction;
  assert.throws(
    () =>
      f.interactions.saveDraft({
        interactionId: fixed.id,
        expectedVersion: 1,
        input: { ...input, flowId: 'notion-documentation' },
      }),
    { status: 400 },
  );
});

test('terminal and changed context cancel pending questions without erasing saved answers', (t) => {
  for (const kind of ['terminal', 'context']) {
    const f = fixture(t),
      record = f.interactions.request(f.request).interaction;
    f.interactions.saveDraft({ interactionId: record.id, expectedVersion: 1, input: partial });
    f.store.commit(f.store.read().version, (state) => {
      if (kind === 'terminal') cancelJob(state, { jobId: f.job.id });
      else state.project.name = 'Changed context';
    });
    assert.throws(
      () => f.interactions.answer({ interactionId: record.id, expectedVersion: 2, input }),
      { status: 409 },
    );
    const cancelled = createConnectorInteractions(f.store).list().interactions[0];
    assert.equal(cancelled.status, 'cancelled');
    assert.equal(cancelled.cancelReason, kind === 'terminal' ? 'job-terminal' : 'context-stale');
    assert.deepEqual(cancelled.input, partial);
  }
});

test('worker cannot start a fresh questionnaire after its original claimed context changed', (t) => {
  const f = fixture(t);
  f.store.commit(f.store.read().version, (state) => {
    state.project.name = 'New human context';
  });
  assert.throws(() => f.interactions.request(f.request), { status: 409 });
  assert.deepEqual(f.interactions.list().interactions, []);
});

test('prerequisites stay to configure while an independently observed MCP discovery is identified', (t) => {
  const f = fixture(t),
    manager = {
      list: () => ({
        connections: [
          {
            id: 'notion-1',
            provider: 'notion',
            url: 'https://mcp.notion.com/mcp',
            status: 'connected',
            version: 3,
            connectedAt: '2026-09-17T08:00:00.000Z',
            tools: [{ name: 'search' }],
          },
        ],
      }),
    };
  const interactions = createConnectorInteractions(f.store, { mcpManager: manager });
  const record = interactions.request(f.request).interaction;
  const result = interactions.answer({
    interactionId: record.id,
    expectedVersion: 1,
    input,
  }).interaction;
  assert.equal(result.preparation.access, 'not-connected');
  assert.ok(result.prerequisites.every((item) => item.status === 'to-configure'));
  assert.deepEqual(result.accessObservation, {
    status: 'verified',
    kind: 'mcp-discovery',
    connectionId: 'notion-1',
    connectionVersion: 3,
    observedAt: '2026-09-17T08:00:00.000Z',
    tools: 1,
  });
  assert.equal(f.interactions.list().interactions[0].accessObservation.status, 'not-observed');
});

test('draft scopes, reload, CAS and clearing retain monotonic versions and reject old delete retries', (t) => {
  const f = fixture(t),
    drafts = createConnectorGuideDrafts(f.root, { scope: 'project' });
  const first = drafts.save({ optionId: 'notion', expectedVersion: 0, input: partial, step: 1 });
  const reopened = createConnectorGuideDrafts(f.root, { scope: 'project' });
  assert.deepEqual(reopened.list().drafts, [first.draft]);
  assert.notEqual(
    first.scopeId,
    createConnectorGuideDrafts(f.root, { scope: 'home' }).list().scopeId,
  );
  const clear = { optionId: 'notion', expectedVersion: 1 };
  assert.equal(reopened.remove(clear).draft.version, 2);
  assert.equal(reopened.remove(clear).draft.version, 2);
  const third = reopened.save({ optionId: 'notion', expectedVersion: 2, input, step: 2 });
  assert.equal(third.draft.version, 3);
  assert.throws(() => reopened.remove(clear), { status: 409 });
  assert.deepEqual(reopened.list().drafts[0].input, input);
});

async function route(options, method, pathname, data, headers = {}) {
  const request = Readable.from(data === undefined ? [] : [Buffer.from(JSON.stringify(data))]);
  Object.assign(request, {
    method,
    headers: { host: '127.0.0.1:4330', 'content-type': 'application/json', ...headers },
  });
  let result;
  const response = {
    writeHead(status) {
      this.status = status;
    },
    end(value) {
      result = { status: this.status, value: JSON.parse(value) };
    },
    setHeader() {},
  };
  await connectorInteractionRoute(request, response, new URL(pathname, options.origin), options);
  return result;
}

test('HTTP gate separates worker requests and human responses even with valid bearer and Origin', async (t) => {
  const f = fixture(t),
    origin = 'http://127.0.0.1:4330';
  const options = {
    origin,
    worker: true,
    interactions: f.interactions,
    drafts: createConnectorGuideDrafts(f.root, { scope: 'project' }),
  };
  const requested = await route(
    options,
    'POST',
    '/api/connectors/interactions/request',
    f.request,
    { authorization: 'Bearer fixture' },
  );
  assert.equal(requested.status, 200);
  const answer = { interactionId: requested.value.interaction.id, expectedVersion: 1, input };
  for (const endpoint of [
    'interactions/answer',
    'interactions/draft',
    'guide-drafts',
    'guide-drafts/remove',
  ])
    assert.equal(
      (
        await route(options, 'POST', '/api/connectors/' + endpoint, answer, {
          authorization: 'Bearer fixture',
          origin,
        })
      ).status,
      403,
    );
  assert.equal(
    (
      await route(
        { ...options, worker: false },
        'POST',
        '/api/connectors/interactions/request',
        f.request,
        { origin },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await route(
        { ...options, worker: false },
        'POST',
        '/api/connectors/interactions/answer',
        answer,
        { origin },
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await route(options, 'GET', '/api/connectors/interactions?jobId=' + f.job.id, undefined, {
        authorization: 'Bearer fixture',
      })
    ).value.interactions[0].status,
    'answered',
  );
});
