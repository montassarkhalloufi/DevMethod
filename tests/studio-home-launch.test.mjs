import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createHomeStore } from '../scripts/studio/home-store.mjs';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { hasApprovedPlan } from '../scripts/studio/domain.mjs';
import { prepareHomeLaunch, homeLaunchLimits } from '../scripts/studio/home-launch.mjs';

const baseLaunch = {
  action: 'plan',
  projectType: 'website',
  design: '',
  connectors: [],
  links: [],
  attachments: [],
};
const reference = (content = 'Conserver cette référence.', name = 'notes.md') => ({
  name,
  mime: 'text/markdown',
  base64: Buffer.from(content).toString('base64'),
});
const png = {
  name: 'reference.png',
  mime: 'image/png',
  base64:
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j9WkAAAAASUVORK5CYII=',
};

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'home-launch-'));
  const store = createHomeStore(root);
  t.after(async () => {
    await store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { root, store };
}

const readState = (project) =>
  JSON.parse(fs.readFileSync(path.join(project.workspace, '.devmethod/studio.json')));

test('rich planning creates one waiting request, preserves chosen context and reference bytes across replay', async (t) => {
  const { root, store } = fixture(t);
  const input = {
    requestId: randomUUID(),
    kind: 'new',
    idea: 'Carnet de balades\nPartager des parcours personnels.',
    launch: {
      ...baseLaunch,
      design: 'Sobre et lumineux',
      connectors: ['stripe', 'postgresql'],
      links: ['https://example.test/reference'],
      attachments: [reference(), png],
    },
  };
  const [project, replay] = await Promise.all([store.create(input), store.create(input)]);
  assert.deepEqual(replay, project);
  assert.equal(project.name, 'Carnet de balades');
  const state = readState(project);
  assert.equal(state.project.name, project.name);
  assert.equal(state.project.idea, input.idea);
  assert.equal(state.project.mode, 'guided');
  assert.equal(hasApprovedPlan(state), false);
  assert.equal(state.jobs.length, 1);
  assert.equal(state.jobs[0].status, 'queued');
  assert.equal(state.jobs[0].worker, null);
  assert.deepEqual([state.revisions, state.checks, state.decisions], [[], [], []]);
  const request = state.jobs[0].request;
  assert.match(request, /Planifier ce projet uniquement/);
  assert.match(
    request,
    /ne créer ni modifier de code applicatif avant une nouvelle demande explicite/,
  );
  for (const value of [
    input.idea,
    input.launch.design,
    'stripe',
    'postgresql',
    input.launch.links[0],
    'notes.md',
    'reference.png',
  ])
    assert.ok(request.includes(value), value);
  assert.ok(request.length <= 20000);
  assert.match(state.project.constraints.join('\n'), /intentions d’intégration, sans connexion/);
  assert.equal(state.references.length, 2);
  for (const [index, record] of state.references.entries()) {
    assert.deepEqual(
      fs.readFileSync(path.join(project.workspace, record.file)),
      Buffer.from(input.launch.attachments[index].base64, 'base64'),
    );
    assert.match(record.file, /^references\/[a-f0-9-]+\.(md|png)$/);
  }
  assert.equal(fs.readdirSync(path.join(project.workspace, 'references')).length, 2);
  const before = fs.readFileSync(path.join(project.workspace, '.devmethod/studio.json'));
  await assert.rejects(store.create({ ...input, launch: { ...input.launch, action: 'build' } }), {
    status: 409,
  });
  await store.close();
  const reopened = createHomeStore(root);
  try {
    assert.deepEqual(await reopened.create(input), project);
  } finally {
    await reopened.close();
  }
  assert.deepEqual(fs.readFileSync(path.join(project.workspace, '.devmethod/studio.json')), before);
  const projectStore = createStudioStore(project.workspace);
  try {
    const claim = createJobs(projectStore).claim('Fixture host');
    assert.equal(claim.job.request, request);
    assert.deepEqual(claim.context.references, state.references);
    assert.deepEqual(claim.context.project.constraints, state.project.constraints);
  } finally {
    projectStore.close();
  }
});

test('build queues methodology without approvals; legacy creation stays idle and explicit names remain valid', async (t) => {
  const { store } = fixture(t);
  const project = await store.create({
    requestId: randomUUID(),
    kind: 'new',
    name: 'Nom explicite',
    idea: 'Idée initiale',
    launch: { action: 'build', projectType: 'app' },
  });
  const state = readState(project);
  assert.equal(project.name, 'Nom explicite');
  assert.match(state.jobs[0].request, /Démarrer la construction/);
  assert.match(state.jobs[0].request, /Ne pas inventer d’accord ni contourner les choix réservés/);
  assert.equal(hasApprovedPlan(state), false);
  assert.deepEqual(state.project.delegation, undefined);
  assert.equal(state.jobs[0].status, 'queued');
  const legacy = await store.create({
    requestId: randomUUID(),
    kind: 'new',
    idea: 'Simple brouillon',
  });
  assert.equal(legacy.name, 'Nouveau projet');
  assert.deepEqual(readState(legacy).jobs, []);
  assert.deepEqual(readState(legacy).references, []);
  const whitespaceTitle = await store.create({
    requestId: randomUUID(),
    kind: 'new',
    idea: '\n\tTitre\tdu projet\rDétails',
    launch: { action: 'plan', projectType: 'website' },
  });
  assert.equal(whitespaceTitle.name, 'Titre du projet');
  assert.equal(
    prepareHomeLaunch({ action: 'plan', projectType: 'website' }, 'a'.repeat(79) + ' suffix').name,
    'a'.repeat(79),
  );
  for (const projectType of ['website', 'app', 'prototype', 'slides']) {
    const prepared = prepareHomeLaunch(
      { action: 'plan', projectType },
      'a'.repeat(100) + '\nDétails',
    );
    assert.equal(prepared.name.length, 80);
    assert.ok(prepared.constraints[0].includes(projectType));
  }
});

test('malformed rich inputs and composed request overflow are rejected before project writes', async (t) => {
  const { root, store } = fixture(t);
  const valid = { requestId: randomUUID(), kind: 'new', idea: 'Un projet', launch: baseLaunch };
  const invalidLaunches = [
    null,
    [],
    { ...baseLaunch, extra: true },
    { ...baseLaunch, action: 'deploy' },
    { ...baseLaunch, projectType: '__proto__' },
    { ...baseLaunch, projectType: ['app'] },
    { ...baseLaunch, design: null },
    { ...baseLaunch, design: 'x'.repeat(2001) },
    { ...baseLaunch, design: 'bad\u0000' },
    { ...baseLaunch, connectors: null },
    { ...baseLaunch, connectors: ['not-a-service'] },
    { ...baseLaunch, connectors: ['node-test'] },
    { ...baseLaunch, connectors: Array(13).fill('stripe') },
    { ...baseLaunch, links: null },
    { ...baseLaunch, links: ['file:///private/local'] },
    { ...baseLaunch, links: ['https://user:sentinel-password@example.test/'] },
    { ...baseLaunch, links: ['https://example.test/' + 'x'.repeat(2000)] },
    { ...baseLaunch, links: Array(6).fill('https://example.test/') },
    { ...baseLaunch, attachments: null },
  ];
  for (const launch of invalidLaunches)
    await assert.rejects(store.create({ ...valid, launch }), { status: 400 });
  for (const idea of [undefined, '', ' '.repeat(10), 'x'.repeat(16001)])
    await assert.rejects(store.create({ ...valid, idea }), { status: 400 });
  for (const kind of ['existing', 'imported'])
    await assert.rejects(
      store.create({
        ...valid,
        idea: undefined,
        kind,
        ...(kind === 'existing' ? { workspace: root } : { source: root }),
      }),
      { status: 400 },
    );
  await assert.rejects(
    store.create({
      ...valid,
      idea: 'x'.repeat(16000),
      launch: {
        ...baseLaunch,
        design: 'd'.repeat(2000),
        links: [
          'https://example.test/' + 'x'.repeat(1900),
          'https://example.test/' + 'y'.repeat(1900),
        ],
      },
    }),
    /composé dépasse 20000/,
  );
  assert.deepEqual(store.read().projects, []);
  assert.deepEqual(fs.readdirSync(root).sort(), ['home.json', 'home.lock']);
});

test('attachments enforce closed metadata, canonical base64, safe names, MIME and byte boundaries', async (t) => {
  const { root, store } = fixture(t);
  const input = { requestId: randomUUID(), kind: 'new', idea: 'Références', launch: baseLaunch };
  const invalid = [
    { ...reference(), name: '../notes.md' },
    { ...reference(), name: 'folder\\notes.md' },
    { ...reference(), name: 'a\u0000.md' },
    { ...reference(), name: 'a'.repeat(257) },
    { ...reference(), extra: true },
    { ...reference(), mime: 'text/html' },
    { ...reference(), mime: '__proto__' },
    { ...reference(), mime: ['text/plain'] },
    { ...reference(), base64: '' },
    { ...reference(), base64: 'Zg' },
    { ...reference(), base64: 'Zh==' },
    { ...reference(), base64: 'Zg==\n' },
    { ...reference(), base64: Buffer.from([0xff]).toString('base64') },
    { ...reference(), mime: 'image/png' },
    reference('a'.repeat(homeLaunchLimits.attachmentBytes + 1)),
  ];
  for (const entry of invalid)
    await assert.rejects(
      store.create({ ...input, launch: { ...baseLaunch, attachments: [entry] } }),
      { status: 400 },
    );
  await assert.rejects(
    store.create({ ...input, launch: { ...baseLaunch, attachments: Array(5).fill(reference()) } }),
    { status: 400 },
  );
  assert.deepEqual(fs.readdirSync(root).sort(), ['home.json', 'home.lock']);
  const maximum = reference('x'.repeat(homeLaunchLimits.attachmentBytes));
  const project = await store.create({
    ...input,
    launch: { ...baseLaunch, attachments: Array(4).fill(maximum) },
  });
  const state = readState(project);
  assert.equal(state.references.length, 4);
  assert.equal(
    state.references.reduce(
      (sum, record) => sum + fs.statSync(path.join(project.workspace, record.file)).size,
      0,
    ),
    homeLaunchLimits.totalAttachmentBytes,
  );
});

test('reference write failure removes the entire new workspace and permits the same request retry', async (t) => {
  const { root, store } = fixture(t);
  const input = {
    requestId: randomUUID(),
    kind: 'new',
    idea: 'Atomic creation',
    launch: {
      ...baseLaunch,
      attachments: [reference('first', 'first.md'), reference('second', 'second.md')],
    },
  };
  const write = fs.writeFileSync;
  let references = 0;
  const mocked = t.mock.method(fs, 'writeFileSync', (file, ...args) => {
    if (
      typeof file === 'string' &&
      file.includes(path.sep + 'references' + path.sep) &&
      ++references === 2
    )
      throw Object.assign(new Error('Injected reference failure'), { code: 'EIO' });
    return write(file, ...args);
  });
  try {
    await assert.rejects(store.create(input), { code: 'EIO' });
  } finally {
    mocked.mock.restore();
  }
  assert.deepEqual(store.read().projects, []);
  assert.deepEqual(fs.readdirSync(path.join(root, 'projects')), []);
  const project = await store.create(input);
  assert.equal(readState(project).jobs.length, 1);
  assert.equal(fs.readdirSync(path.join(project.workspace, 'references')).length, 2);
});
