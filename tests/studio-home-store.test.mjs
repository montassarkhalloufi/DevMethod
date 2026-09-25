import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createHomeStore } from '../scripts/studio/home-store.mjs';
import { createStudioStore } from '../scripts/studio/store.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-home-store-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('creation is serialized and idempotent across restart without changing the saved project', async (t) => {
  const root = fixture(t),
    store = createHomeStore(root);
  const input = {
    requestId: randomUUID(),
    kind: 'new',
    name: 'Projet local',
    idea: 'Une idée\nDeux lignes.',
  };
  const results = await Promise.all([store.create(input), store.create(input)]);
  assert.deepEqual(results[0], results[1]);
  const project = results[0],
    file = path.join(project.workspace, '.devmethod/studio.json');
  assert.equal(path.dirname(project.workspace), path.join(root, 'projects'));
  const before = fs.readFileSync(file);
  assert.equal(JSON.parse(before).project.idea, input.idea);
  assert.equal(store.read().projects.length, 1);
  await assert.rejects(store.create({ ...input, name: 'Different' }), { status: 409 });
  await store.close();
  const reopened = createHomeStore(root);
  try {
    assert.deepEqual(await reopened.create(input), project);
    assert.deepEqual(fs.readFileSync(file), before);
  } finally {
    await reopened.close();
  }
});

test('closing drains accepted mutations and refuses later work before releasing its lock', async (t) => {
  const root = fixture(t),
    store = createHomeStore(root);
  const accepted = store.create({ requestId: randomUUID(), kind: 'new', name: 'Accepted' });
  const closing = store.close();
  await assert.rejects(store.create({ requestId: randomUUID(), kind: 'new' }), { status: 409 });
  const project = await accepted;
  await closing;
  assert.throws(() => store.read(), { status: 409 });
  const reopened = createHomeStore(root);
  try {
    assert.deepEqual(reopened.read().projects, [project]);
  } finally {
    await reopened.close();
  }
});

test('existing projects are inspected without mutation and raw source directories are not initialized', async (t) => {
  const root = fixture(t),
    workspace = path.join(root, 'existing');
  const projectStore = createStudioStore(workspace);
  projectStore.commit(projectStore.read().version, (state) => {
    state.project.name = 'Déjà existant';
    state.draft = 'Conserver';
  });
  const stateFile = path.join(workspace, '.devmethod/studio.json'),
    before = fs.readFileSync(stateFile);
  const store = createHomeStore(path.join(root, 'home'));
  try {
    const project = await store.create({ requestId: randomUUID(), kind: 'existing', workspace });
    assert.equal(project.name, 'Déjà existant');
    assert.deepEqual(fs.readFileSync(stateFile), before);
    assert.equal(fs.existsSync(path.join(workspace, '.devmethod/studio.lock')), true);
    await assert.rejects(store.create({ requestId: randomUUID(), kind: 'existing', workspace }), {
      status: 409,
    });
    const source = path.join(root, 'raw');
    fs.mkdirSync(source);
    fs.writeFileSync(path.join(source, 'main.py'), 'print("original")');
    await assert.rejects(
      store.create({ requestId: randomUUID(), kind: 'existing', workspace: source }),
      /Importer/,
    );
    assert.deepEqual(fs.readdirSync(source), ['main.py']);
  } finally {
    await store.close();
    projectStore.close();
  }
});

test('real import preserves source bytes and failed imports do not register a partial project', async (t) => {
  const root = fixture(t),
    source = path.join(root, 'source');
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'main.py'), 'print("original")');
  const store = createHomeStore(path.join(root, 'home'));
  try {
    const project = await store.create({
      requestId: randomUUID(),
      kind: 'imported',
      source,
      name: 'Mon carnet',
    });
    const state = JSON.parse(
      fs.readFileSync(path.join(project.workspace, '.devmethod/studio.json')),
    );
    assert.equal(project.name, 'Mon carnet');
    assert.equal(state.project.name, project.name);
    assert.equal(state.revisions[0].profile, 'source-only');
    assert.deepEqual(state.checks, []);
    assert.equal(
      fs.readFileSync(
        path.join(project.workspace, 'revisions', state.activeRevision, 'app/main.py'),
        'utf8',
      ),
      'print("original")',
    );
    assert.equal(fs.readFileSync(path.join(source, 'main.py'), 'utf8'), 'print("original")');
    assert.deepEqual(fs.readdirSync(source), ['main.py']);
    fs.symlinkSync(path.join(source, 'main.py'), path.join(source, 'linked.py'));
    await assert.rejects(
      store.create({ requestId: randomUUID(), kind: 'imported', source }),
      /symbolique/,
    );
    assert.equal(store.read().projects.length, 1);
    assert.equal(fs.readdirSync(path.join(root, 'home/projects')).length, 1);
  } finally {
    await store.close();
  }
});

test('registry lock, corruption, shape and the 200 project limit are explicit and preserve data', async (t) => {
  const root = fixture(t),
    store = createHomeStore(root);
  assert.throws(() => createHomeStore(root), { status: 409 });
  await assert.rejects(
    store.create({ requestId: randomUUID(), kind: 'new', workspace: '/elsewhere' }),
    /chemins/,
  );
  await assert.rejects(
    store.create({ requestId: randomUUID(), kind: 'new', token: 'sentinel' }),
    /invalide/,
  );
  await store.close();
  const projects = Array.from({ length: 200 }, (_, index) => ({
    id: randomUUID(),
    name: 'Project ' + index,
    kind: 'existing',
    workspace: path.join(root, 'fixture-' + index),
    createdAt: new Date().toISOString(),
    lastOpenedAt: null,
  }));
  const registry = {
    format: 1,
    projects,
    receipts: projects.map((project) => ({
      requestId: randomUUID(),
      projectId: project.id,
      fingerprint: 'a'.repeat(64),
    })),
  };
  const file = path.join(root, 'home.json');
  fs.writeFileSync(file, JSON.stringify(registry));
  const full = createHomeStore(root);
  try {
    await assert.rejects(full.create({ requestId: randomUUID(), kind: 'new' }), { status: 429 });
  } finally {
    await full.close();
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(file)), registry);
  fs.writeFileSync(file, '{broken');
  assert.throws(() => createHomeStore(root));
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
  assert.equal(fs.existsSync(path.join(root, 'home.lock')), false);
});

test('failed lock writes clean up their new file and never remove a pre-existing lock', async (t) => {
  const root = fixture(t);
  for (const code of ['ENOSPC', 'EIO']) {
    const directory = path.join(root, code),
      lockFile = path.join(directory, 'home.lock');
    const open = fs.openSync,
      write = fs.writeFileSync;
    let descriptor;
    const openMock = t.mock.method(fs, 'openSync', (file, ...args) => {
      const result = open(file, ...args);
      if (file === lockFile) descriptor = result;
      return result;
    });
    const writeMock = t.mock.method(fs, 'writeFileSync', (file, content, ...args) => {
      if (file === lockFile || (typeof file === 'number' && file === descriptor)) {
        write(file, '', ...args);
        throw Object.assign(new Error('Injected lock write failure'), { code });
      }
      return write(file, content, ...args);
    });
    try {
      assert.throws(() => createHomeStore(directory), { code });
    } finally {
      writeMock.mock.restore();
      openMock.mock.restore();
    }
    assert.equal(fs.existsSync(lockFile), false, code + ' must not leave an unowned lock');
    const retried = createHomeStore(directory);
    try {
      const before = fs.readFileSync(lockFile);
      assert.throws(() => createHomeStore(directory), { status: 409 });
      assert.deepEqual(fs.readFileSync(lockFile), before);
    } finally {
      await retried.close();
    }
  }
});
