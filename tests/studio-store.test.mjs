import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createStudioStore,
  createInitialStudioState,
  validateStudioState,
} from '../scripts/studio/store.mjs';
import { setDraft, queueRequest, claimJob, finishJob } from '../scripts/studio/domain.mjs';

function fixture(t) {
  // macOS /var is itself a system symlink; use the canonical directory.
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-store-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('CAS rejects stale writes and mutable read/commit results cannot change stored state', (t) => {
  const root = fixture(t);
  const store = createStudioStore(root);
  t.after(() => store.close());
  const first = store.read();
  first.project.name = 'Mutation extérieure';
  assert.equal(store.read().project.name, '');
  const result = store.commit(1, (draft) => setDraft(draft, { text: 'Conserver cette saisie' }));
  result.draft = 'Écraser';
  assert.equal(store.read().draft, 'Conserver cette saisie');
  assert.throws(() => store.commit(1, (draft) => setDraft(draft, { text: 'Perte' })), {
    status: 409,
  });
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(root, '.devmethod/studio.json'))).draft,
    'Conserver cette saisie',
  );
  let retainedDraft;
  store.commit(2, (draft) => {
    retainedDraft = draft;
  });
  retainedDraft.draft = 'Mutation différée';
  assert.equal(store.read().draft, 'Conserver cette saisie');
});

test('a second writer is refused and clean restart interrupts running work without retry', (t) => {
  const root = fixture(t);
  const store = createStudioStore(root);
  assert.throws(() => createStudioStore(root), { status: 409 });
  store.commit(1, (state) => queueRequest(state, { request: 'Construire' }));
  store.commit(2, (state) => claimJob(state, { worker: 'worker' }));
  store.close();
  store.close();
  const reopened = createStudioStore(root);
  t.after(() => reopened.close());
  const state = reopened.read();
  assert.equal(state.version, 4);
  assert.equal(state.jobs[0].status, 'interrupted');
  assert.throws(
    () =>
      reopened.commit(4, (draft) =>
        finishJob(draft, {
          jobId: state.jobs[0].id,
          brief: { outcome: 'Too late', scope: [], excluded: [], criteria: [] },
        }),
      ),
    { status: 409 },
  );
  assert.equal(reopened.read().jobs.length, 1);
});

test('failed validation or mutator never changes disk, memory or version', (t) => {
  const root = fixture(t);
  const store = createStudioStore(root);
  t.after(() => store.close());
  const file = path.join(root, '.devmethod/studio.json');
  const before = fs.readFileSync(file, 'utf8');
  assert.throws(
    () =>
      store.commit(1, (draft) => {
        draft.draft = 'Modified';
        throw new Error('Abort');
      }),
    /Abort/,
  );
  assert.throws(() =>
    store.commit(1, (draft) => {
      draft.project.mode = 'unbounded';
    }),
  );
  assert.throws(
    () =>
      store.commit(1, async (draft) => {
        draft.draft = 'Async';
      }),
    /synchrone/,
  );
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  assert.deepEqual(store.read(), createInitialStudioState());
});

test('durable malformed state fails visibly, is preserved, and does not retain the lock', (t) => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, '.devmethod'));
  const file = path.join(root, '.devmethod/studio.json');
  fs.writeFileSync(file, '{broken');
  assert.throws(() => createStudioStore(root), /aucun remplacement/);
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
  assert.equal(fs.existsSync(path.join(root, '.devmethod/studio.lock')), false);
});

test('recorded requests cannot be silently rewritten or removed', (t) => {
  const store = createStudioStore(fixture(t));
  t.after(() => store.close());
  store.commit(1, (state) => queueRequest(state, { request: 'Besoin original' }));
  assert.throws(
    () =>
      store.commit(2, (state) => {
        state.jobs[0].request = 'Besoin falsifié';
      }),
    /réécrit/,
  );
  assert.throws(
    () =>
      store.commit(2, (state) => {
        state.jobs = [];
      }),
    /supprimé/,
  );
  assert.equal(store.read().jobs[0].request, 'Besoin original');
});

test('symlinks including dangling canonical-state links are refused without touching target', (t) => {
  const root = fixture(t);
  const target = path.join(root, 'outside.json');
  fs.mkdirSync(path.join(root, '.devmethod'));
  try {
    fs.symlinkSync(target, path.join(root, '.devmethod/studio.json'));
  } catch (error) {
    if (error.code === 'EPERM') {
      t.skip('Symlink privilege unavailable');
      return;
    }
    throw error;
  }
  assert.throws(() => createStudioStore(root), /symbolique/);
  assert.equal(fs.existsSync(target), false);
  const linked = path.join(root, 'linked');
  fs.symlinkSync(root, linked, 'dir');
  assert.throws(() => createStudioStore(linked), /symbolique/);
});

test('validation rejects traversal, unknown references and invented successful checks', () => {
  for (const invalid of [
    '../outside.png',
    '/outside.png',
    'references/../outside.png',
    'references\\outside.png',
  ]) {
    const state = createInitialStudioState();
    state.references.push({ id: 'ref', name: 'Image', mime: 'image/png', file: invalid });
    assert.throws(() => validateStudioState(state));
  }
  const state = createInitialStudioState();
  state.designs.push({ id: 'design', title: 'Agenda', description: '', file: 'missing' });
  assert.throws(() => validateStudioState(state), /image importée/);
  state.designs = [];
  state.checks.push({
    id: 'check',
    revisionId: 'missing',
    label: 'Build',
    kind: 'command',
    status: 'passed',
    command: 'node --check app.js',
    createdAt: new Date().toISOString(),
  });
  assert.throws(() => validateStudioState(state), /révision connue/);
});
