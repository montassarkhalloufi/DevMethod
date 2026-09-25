import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { startStudio } from '../scripts/studio/server.mjs';
import { startStudioHome } from '../scripts/studio/home-server.mjs';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { queueRequest } from '../scripts/studio/domain.mjs';

const execute = promisify(execFile);
const sourceCli = new URL('../scripts/studio/cli.mjs', import.meta.url).href;
const fullInput = {
  optionId: 'github-mcp',
  guideVersion: 1,
  flowId: 'github-read',
  answers: { resources: ['code'] },
};
const partialInput = { ...fullInput, answers: {} };

async function http(origin, route, input, headers = {}) {
  const response = await fetch(origin + route, {
    ...(input !== undefined ? { method: 'POST', body: JSON.stringify(input) } : {}),
    headers: {
      ...(input !== undefined ? { Origin: origin, 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
  });
  return { status: response.status, body: await response.json() };
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-interactions-http-'));
  const sessions = new Set();
  t.after(async () => {
    await Promise.all([...sessions].map((session) => session.close()));
    fs.rmSync(root, { recursive: true, force: true });
  });
  return {
    root,
    async studio(workspace = path.join(root, 'project')) {
      const session = await startStudio({ workspace, port: 0, previewPort: 0 });
      sessions.add(session);
      return session;
    },
    async home() {
      const session = await startStudioHome({ directory: path.join(root, 'home'), port: 0 });
      sessions.add(session);
      return session;
    },
    async close(session) {
      await session.close();
      sessions.delete(session);
    },
  };
}

function claim(studio) {
  studio.store.commit(studio.store.read().version, (state) =>
    queueRequest(state, { request: 'Configurer le guide GitHub local de la fixture' }),
  );
  return studio.jobs.claim('Fixture host').job;
}

test('real Studio routes keep legacy projects readable and require human answers even with a valid worker token and Origin', async (t) => {
  const f = fixture(t),
    workspace = path.join(f.root, 'project');
  const oldStore = createStudioStore(workspace),
    original = oldStore.read();
  oldStore.close();
  const studio = await f.studio(workspace),
    origin = studio.runtime().url;
  assert.deepEqual(studio.store.read(), original);
  assert.deepEqual((await http(origin, '/api/connectors/interactions')).body, { interactions: [] });
  assert.deepEqual((await http(origin, '/api/connectors/guide-drafts')).body.drafts, []);
  assert.equal(
    fs.existsSync(path.join(workspace, '.devmethod/connector-interactions.json')),
    false,
  );
  const job = claim(studio),
    before = studio.store.read();
  const worker = { Authorization: 'Bearer ' + studio.runtime().token };
  const request = {
    jobId: job.id,
    eventId: 'github-guide-1',
    optionId: 'github-mcp',
    guideVersion: 1,
  };
  assert.equal((await http(origin, '/api/connectors/interactions/request', request)).status, 403);
  assert.equal(
    (
      await http(
        origin,
        '/api/connectors/interactions/request',
        { ...request, optionId: 'unknown' },
        worker,
      )
    ).status,
    400,
  );
  const created = await http(origin, '/api/connectors/interactions/request', request, worker);
  assert.equal(created.status, 200);
  assert.equal(created.body.interaction.status, 'pending');
  assert.equal(created.body.interaction.definition.optionId, 'github-mcp');
  assert.deepEqual(
    (await http(origin, '/api/connectors/interactions/request', request, worker)).body,
    created.body,
  );
  const mutation = {
    interactionId: created.body.interaction.id,
    expectedVersion: 1,
    input: partialInput,
    step: 1,
  };
  const draft = { optionId: 'github-mcp', expectedVersion: 0, input: partialInput, step: 1 };
  for (const [route, input] of [
    ['interactions/draft', mutation],
    ['interactions/answer', { ...mutation, input: fullInput }],
    ['guide-drafts', draft],
    ['guide-drafts/remove', { optionId: 'github-mcp', expectedVersion: 0 }],
  ]) {
    assert.equal((await http(origin, '/api/connectors/' + route, input, worker)).status, 403);
    assert.equal(
      (
        await http(origin, '/api/connectors/' + route, input, {
          Origin: 'https://untrusted.invalid',
        })
      ).status,
      403,
    );
  }
  const partial = await http(origin, '/api/connectors/interactions/draft', mutation);
  assert.equal(partial.status, 200);
  assert.equal(partial.body.interaction.version, 2);
  assert.deepEqual(partial.body.interaction.input, partialInput);
  const answered = await http(origin, '/api/connectors/interactions/answer', {
    ...mutation,
    expectedVersion: 2,
    input: fullInput,
  });
  assert.equal(answered.status, 200);
  assert.equal(answered.body.interaction.status, 'answered');
  assert.equal(answered.body.interaction.accessObservation.status, 'not-observed');
  assert.equal(answered.body.interaction.preparation.nativeConnection.providerId, 'github');
  assert.deepEqual(
    studio.store.read(),
    before,
    'Questionnaires never rewrite the immutable request/job',
  );
  const listed = await http(
    origin,
    '/api/connectors/interactions?jobId=' + job.id,
    undefined,
    worker,
  );
  assert.deepEqual(listed.body.interactions, [answered.body.interaction]);
  assert.ok(!JSON.stringify(listed.body).includes(studio.runtime().token));
  assert.equal(
    (
      await http(origin, '/api/connectors/interactions?jobId=' + job.id, undefined, {
        Origin: 'https://untrusted.invalid',
      })
    ).status,
    403,
  );
});

test('Home and project guide drafts persist across real server restarts with separate scopes and version conflicts', async (t) => {
  const f = fixture(t);
  let home = await f.home(),
    origin = home.runtime().url;
  const initial = await http(origin, '/api/connectors/guide-drafts');
  assert.equal(initial.status, 200);
  assert.match(initial.body.scopeId, /^home:/);
  assert.equal((await http(origin, '/api/connectors/interactions')).status, 409);
  const draft = { optionId: 'github-mcp', expectedVersion: 0, input: partialInput, step: 1 };
  assert.equal(
    (
      await http(origin, '/api/connectors/guide-drafts', draft, {
        Authorization: 'Bearer any-worker',
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await http(origin, '/api/connectors/guide-drafts', draft, {
        Origin: 'https://untrusted.invalid',
      })
    ).status,
    403,
  );
  const saved = await http(origin, '/api/connectors/guide-drafts', draft);
  assert.equal(saved.status, 200);
  assert.equal(saved.body.draft.version, 1);
  await f.close(home);
  home = await f.home();
  origin = home.runtime().url;
  const restored = await http(origin, '/api/connectors/guide-drafts');
  assert.equal(restored.body.scopeId, initial.body.scopeId);
  assert.deepEqual(restored.body.drafts, [saved.body.draft]);
  assert.equal(
    (await http(origin, '/api/connectors/guide-drafts', { ...draft, input: fullInput })).status,
    409,
  );
  assert.equal(
    (
      await http(origin, '/api/connectors/guide-drafts', {
        ...draft,
        expectedVersion: 1,
        input: { ...fullInput, bearerToken: 'fixture-sensitive' },
      })
    ).status,
    400,
  );
  const studio = await f.studio(),
    projectOrigin = studio.runtime().url;
  const projectRead = await http(projectOrigin, '/api/connectors/guide-drafts');
  assert.match(projectRead.body.scopeId, /^project:/);
  assert.notEqual(projectRead.body.scopeId, restored.body.scopeId);
  assert.deepEqual(projectRead.body.drafts, []);
  assert.equal(
    (
      await http(projectOrigin, '/api/connectors/guide-drafts', {
        ...draft,
        input: fullInput,
        step: 2,
      })
    ).status,
    200,
  );
  await f.close(studio);
  const reopened = await f.studio();
  assert.deepEqual(
    (await http(reopened.runtime().url, '/api/connectors/guide-drafts')).body.drafts[0].input,
    fullInput,
  );
  assert.deepEqual(
    (await http(origin, '/api/connectors/guide-drafts')).body.drafts[0].input,
    partialInput,
  );
  const removed = await http(origin, '/api/connectors/guide-drafts/remove', {
    optionId: 'github-mcp',
    expectedVersion: 1,
  });
  assert.equal(removed.status, 200);
  assert.equal(removed.body.draft.input, null);
  assert.ok(
    !fs
      .readFileSync(path.join(f.root, 'home/.devmethod/connector-guide-drafts.json'), 'utf8')
      .includes('fixture-sensitive'),
  );
});

async function cli(workspace, args, input, directory) {
  const file = path.join(directory, 'payload.json');
  fs.writeFileSync(file, JSON.stringify(input));
  try {
    return {
      code: 0,
      ...(await execute(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `import {runStudioCli} from ${JSON.stringify(sourceCli)}; await runStudioCli(process.argv.slice(1));`,
          ...args,
          '--workspace',
          workspace,
          '--file',
          file,
        ],
        { timeout: 10000 },
      )),
    };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

test('source worker CLI requests a known guide, reads human responses and lists MCP action receipts through real HTTP', async (t) => {
  const f = fixture(t),
    studio = await f.studio(),
    job = claim(studio);
  const request = {
    jobId: job.id,
    eventId: 'cli-guide',
    optionId: 'github-mcp',
    guideVersion: 1,
    flowId: 'github-read',
  };
  const created = await cli(studio.store.root, ['guide-request'], request, f.root);
  assert.equal(created.code, 0, created.stderr);
  const interaction = JSON.parse(created.stdout).interaction;
  assert.equal(interaction.requestedFlowId, 'github-read');
  const answer = await http(studio.runtime().url, '/api/connectors/interactions/answer', {
    interactionId: interaction.id,
    expectedVersion: 1,
    input: fullInput,
  });
  assert.equal(answer.status, 200);
  const read = await cli(studio.store.root, ['guide-responses'], { jobId: job.id }, f.root);
  assert.equal(read.code, 0, read.stderr);
  assert.equal(JSON.parse(read.stdout).interactions[0].status, 'answered');
  const actions = await cli(studio.store.root, ['mcp', 'actions'], { jobId: job.id }, f.root);
  assert.equal(actions.code, 0, actions.stderr);
  assert.deepEqual(JSON.parse(actions.stdout), { actions: [] });
  assert.ok(
    ![created.stdout, read.stdout, actions.stdout].join('').includes(studio.runtime().token),
  );
  const invalid = await cli(
    studio.store.root,
    ['guide-responses'],
    { jobId: job.id, bearerToken: 'fixture-sensitive' },
    f.root,
  );
  assert.notEqual(invalid.code, 0);
  assert.ok(!invalid.stderr.includes('fixture-sensitive'));
});
