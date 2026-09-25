import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  prepareConnectorGuide,
  prepareConnectorGuides,
  readConnectorGuides,
} from '../scripts/studio/connector-guides.mjs';
import { createHomeStore } from '../scripts/studio/home-store.mjs';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { queueRequest, updateProject, setDraft } from '../scripts/studio/domain.mjs';
import {
  configureProjectConnector,
  readProjectConnectors,
  prepareConnectorIntegration,
} from '../scripts/studio/connectors.mjs';

const slack = (answers = {}, flowId = 'slack-bot') => ({
  optionId: 'slack',
  guideVersion: 1,
  flowId,
  answers: { actions: ['send-messages'], audience: 'selected-public-channels', ...answers },
});
const notion = {
  optionId: 'notion',
  guideVersion: 1,
  flowId: 'notion-context',
  answers: { actions: ['read-content'] },
};
const linear = {
  optionId: 'linear',
  guideVersion: 1,
  flowId: 'linear-read',
  answers: { resources: ['issues'] },
};

function directory(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-guide-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function project(t) {
  const root = directory(t),
    store = createStudioStore(root);
  t.after(() => store.close());
  return { root, store };
}

test('Slack derives only requested scopes and keeps bot, user and per-user OAuth distinct', () => {
  const bot = prepareConnectorGuide(slack());
  assert.deepEqual(
    bot.permissions.map((entry) => entry.scope),
    ['chat:write'],
  );
  assert.equal(bot.nativeConnection, null);
  assert.equal(bot.access, 'not-connected');
  assert.match(bot.summary.join(' '), /invité/);
  const privateBot = prepareConnectorGuide(
    slack({ actions: ['read-history'], audience: 'selected-private-channels' }),
  );
  assert.deepEqual(
    privateBot.permissions.map((entry) => entry.scope),
    ['groups:history'],
  );
  const user = prepareConnectorGuide(
    slack(
      { actions: ['read-history', 'send-messages'], audience: 'direct-messages' },
      'slack-user',
    ),
  );
  assert.deepEqual(
    user.permissions.map((entry) => entry.scope),
    ['chat:write', 'im:history'],
  );
  assert.match(user.prerequisites.join(' '), /user_scope/);
  const appUser = prepareConnectorGuide(slack({ audience: 'private-channels' }, 'slack-app-user'));
  assert.match(appUser.prerequisites.join(' '), /isolation de ses tokens/);
  assert.equal(appUser.nativeConnection, null);
  assert.notEqual(user.setupFingerprint, appUser.setupFingerprint);
  assert.equal(readConnectorGuides().guides[0].flows[2].usage, 'app-user');
});

test('Notion describes intent without a readonly grant; Linear has a real distinct readonly endpoint', () => {
  const read = prepareConnectorGuide(notion),
    write = prepareConnectorGuide({ ...notion, answers: { actions: ['prepare-changes'] } });
  assert.equal(read.nativeConnection.url, 'https://mcp.notion.com/mcp');
  assert.deepEqual(read.permissions, write.permissions);
  assert.match(read.summary.join(' '), /ne limitent pas techniquement/);
  assert.notEqual(read.setupFingerprint, write.setupFingerprint);
  const linearRead = prepareConnectorGuide(linear),
    linearWrite = prepareConnectorGuide({ ...linear, flowId: 'linear-write' });
  assert.equal(linearRead.nativeConnection.url, 'https://mcp.linear.app/mcp/readonly');
  assert.equal(linearWrite.nativeConnection.url, 'https://mcp.linear.app/mcp');
  assert.deepEqual(
    linearRead.permissions.map((entry) => entry.scope),
    ['read'],
  );
  assert.match(linearWrite.summary.join(' '), /n’autorise pas une action externe/);
});

test('unknown keys, scope injection, secrets, invalid combinations and ambiguous answers are rejected', () => {
  for (const input of [
    null,
    [],
    { ...slack(), guideVersion: '1' },
    { ...slack(), guideVersion: 2 },
    { ...slack(), optionId: 'missing' },
    { ...slack(), flowId: 'linear-write' },
    { ...slack(), scopes: ['admin'] },
    { ...slack(), secret: 'not-a-real-secret' },
    slack({ actions: [] }),
    slack({ actions: ['send-messages', 'send-messages'] }),
    slack({ actions: 'send-messages' }),
    slack({ actions: ['admin'] }),
    slack({ audience: ['selected-public-channels'] }),
    slack({ audience: 'direct-messages' }),
    slack({ extra: 'injected' }),
    { ...slack(), answers: {} },
    slack({ audience: 'selected-public-channels' }, 'slack-user'),
    { ...notion, answers: { actions: ['read-only-guaranteed'] } },
  ])
    assert.throws(() => prepareConnectorGuide(input), { status: 400 });
  assert.throws(() => prepareConnectorGuides([slack(), slack()]), /seul parcours/);
  assert.throws(() => prepareConnectorGuides(Array.from({ length: 13 }, () => notion)), /12/);
  const a = prepareConnectorGuide(slack({ actions: ['read-history', 'send-messages'] }));
  const b = prepareConnectorGuide(slack({ actions: ['send-messages', 'read-history'] }));
  assert.deepEqual(a, b, 'multiselect order has no semantic effect');
});

test('project configuration validates API guides, CAS and persistence without connected status', (t) => {
  const { root, store } = project(t),
    before = store.read();
  const config = { id: 'slack-app', optionId: 'slack', purpose: 'application', guide: slack() };
  configureProjectConnector(store, config);
  const first = readProjectConnectors(store).connections[0];
  assert.equal(first.status, 'configured');
  assert.equal(first.probe, null);
  assert.deepEqual(first.guide, slack());
  const file = path.join(root, '.devmethod/connectors.json'),
    bytes = fs.readFileSync(file);
  assert.throws(
    () =>
      configureProjectConnector(store, { ...config, guide: slack({ actions: ['read-history'] }) }),
    { status: 409 },
  );
  assert.throws(
    () => configureProjectConnector(store, { ...config, guide: notion, expectedVersion: 1 }),
    { status: 400 },
  );
  assert.deepEqual(fs.readFileSync(file), bytes);
  configureProjectConnector(store, {
    ...config,
    guide: slack({ actions: ['read-history'] }),
    expectedVersion: 1,
  });
  assert.equal(readProjectConnectors(store).connections[0].version, 2);
  configureProjectConnector(store, {
    id: config.id,
    optionId: 'slack',
    purpose: 'application',
    expectedVersion: 2,
  });
  assert.deepEqual(
    readProjectConnectors(store).connections[0].guide.answers.actions,
    ['read-history'],
    'old UI cannot silently erase a saved guide',
  );
  assert.deepEqual(store.read(), before, 'configuration creates no job, check or provider grant');
  store.close();
  const reopened = createStudioStore(root);
  try {
    assert.equal(readProjectConnectors(reopened).connections[0].guide.flowId, 'slack-bot');
  } finally {
    reopened.close();
  }
});

test('Home carries MCP guide intent without API intentions, replays normalized inputs and rejects changed setup', async (t) => {
  const root = directory(t),
    home = createHomeStore(root);
  t.after(() => home.close());
  const input = {
    requestId: randomUUID(),
    kind: 'new',
    idea: 'Préparer un tableau de suivi',
    launch: { action: 'plan', projectType: 'app', connectorGuides: [notion, linear] },
  };
  const created = await home.create(input);
  assert.deepEqual(await home.create(input), created);
  await assert.rejects(
    home.create({
      ...input,
      launch: {
        ...input.launch,
        connectorGuides: [{ ...notion, flowId: 'notion-documentation' }, linear],
      },
    }),
    { status: 409 },
  );
  await home.close();
  const reopened = createHomeStore(root);
  try {
    assert.deepEqual(await reopened.create(input), created);
  } finally {
    await reopened.close();
  }
  const store = createStudioStore(created.workspace);
  try {
    const state = store.read();
    assert.equal(state.jobs.length, 1);
    assert.equal(state.jobs[0].connectorGuides.length, 2);
    assert.match(state.jobs[0].request, /Parcours préparé : Notion/);
    assert.deepEqual(state.checks, []);
    assert.equal(fs.existsSync(path.join(created.workspace, '.devmethod/connectors.json')), false);
    const claim = createJobs(store).claim('Fixture guide host');
    assert.deepEqual(claim.context.connectorGuides, state.jobs[0].connectorGuides);
    assert.equal(claim.context.mcp.supported, false, 'guide does not create a live connection');
  } finally {
    store.close();
  }
});

test('existing integration transmits immutable structured choices to a job, not only a prompt', (t) => {
  const { store } = project(t),
    jobs = createJobs(store);
  store.commit(store.read().version, (state) => {
    updateProject(state, {
      name: 'Guide fixture',
      idea: 'Integration fixture',
      mode: 'delegated',
      constraints: [],
    });
    queueRequest(state, { request: 'Fixture base' });
  });
  const base = jobs.claim('Fixture host');
  assert.deepEqual(base.context.connectorGuides, [], 'legacy jobs remain readable');
  fs.writeFileSync(path.join(base.workDirectory, 'index.html'), '<h1>Fixture</h1>');
  const revision = jobs.finish({
    jobId: base.job.id,
    title: 'Fixture',
    summary: 'Local source fixture',
  }).revision;
  configureProjectConnector(store, {
    id: 'slack',
    optionId: 'slack',
    purpose: 'application',
    guide: slack(),
  });
  const prepared = prepareConnectorIntegration(store, {
    connectionId: 'slack',
    revisionId: revision.id,
    capability: 'messaging',
  });
  assert.deepEqual(prepared.connectorGuides, [slack()]);
  store.commit(store.read().version, (state) =>
    queueRequest(state, { request: prepared.prompt, connectorGuides: prepared.connectorGuides }),
  );
  const saved = store.read().jobs.at(-1).connectorGuides;
  configureProjectConnector(store, {
    id: 'slack',
    optionId: 'slack',
    purpose: 'application',
    expectedVersion: 1,
    guide: slack({ actions: ['read-history'] }),
  });
  assert.throws(
    () =>
      store.commit(store.read().version, (state) => {
        state.jobs.at(-1).connectorGuides = prepareConnectorGuides([
          slack({ actions: ['read-history'] }),
        ]);
      }),
    /demande|immuable|modifi/i,
  );
  const claim = jobs.claim('Second fixture host');
  assert.deepEqual(claim.context.connectorGuides, saved);
  assert.deepEqual(
    claim.context.connectorGuides[0].permissions.map((entry) => entry.scope),
    ['chat:write'],
  );
  assert.match(claim.context.connectorGuideInstructions, /not connected accounts or permissions/);
});

test('draft guide choices survive restart, old-client saves, conflicts and invalid secret-bearing changes', (t) => {
  const { root, store } = project(t);
  const unsorted = slack({ actions: ['read-history', 'send-messages'] });
  store.commit(store.read().version, (state) =>
    setDraft(state, { text: 'Préparer Slack', connectorGuides: [unsorted] }),
  );
  const saved = store.read();
  assert.deepEqual(saved.draftConnectorGuides[0].answers.actions, [
    'send-messages',
    'read-history',
  ]);
  store.commit(saved.version, (state) =>
    setDraft(state, { text: 'Texte modifié par un ancien client' }),
  );
  assert.deepEqual(store.read().draftConnectorGuides, saved.draftConnectorGuides);
  const before = fs.readFileSync(path.join(root, '.devmethod/studio.json'));
  assert.throws(
    () =>
      store.commit(saved.version, (state) =>
        setDraft(state, { text: 'Conflit', connectorGuides: [] }),
      ),
    { status: 409 },
  );
  assert.throws(
    () =>
      store.commit(store.read().version, (state) =>
        setDraft(state, {
          text: 'Ne pas sauvegarder',
          connectorGuides: [{ ...slack(), token: 'fixture-sensitive-value' }],
        }),
      ),
    { status: 400 },
  );
  assert.deepEqual(fs.readFileSync(path.join(root, '.devmethod/studio.json')), before);
  store.close();
  const reopened = createStudioStore(root);
  try {
    assert.deepEqual(reopened.read().draftConnectorGuides, saved.draftConnectorGuides);
    reopened.commit(reopened.read().version, (state) =>
      queueRequest(state, { request: state.draft, connectorGuides: state.draftConnectorGuides }),
    );
    assert.equal(reopened.read().draft, '');
    assert.deepEqual(reopened.read().draftConnectorGuides, []);
    assert.deepEqual(
      reopened.read().jobs[0].connectorGuides[0].input,
      saved.draftConnectorGuides[0],
    );
    reopened.commit(reopened.read().version, (state) =>
      setDraft(state, { text: 'Suite', connectorGuides: [notion] }),
    );
    reopened.commit(reopened.read().version, (state) =>
      setDraft(state, { text: 'Sans guide', connectorGuides: [] }),
    );
    assert.deepEqual(reopened.read().draftConnectorGuides, []);
  } finally {
    reopened.close();
  }
});
