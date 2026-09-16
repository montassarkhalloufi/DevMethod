import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { archiveFiles, restoreArchive } from '../scripts/studio/archive.mjs';
import { exportProject } from '../scripts/studio/bundle.mjs';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { queueRequest, updateProject } from '../scripts/studio/domain.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-archive-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

const entry = (name, text = 'fixture') => ({ name, bytes: Buffer.from(text) });
const required = () => [entry('.devmethod/studio.json', '{}'), entry('launch.mjs', '// fixture')];

function checksum(block) {
  block.fill(32, 148, 156);
  block.write(
    block
      .reduce((sum, n) => sum + n, 0)
      .toString(8)
      .padStart(6, '0') + '\0 ',
    148,
  );
}

test('portable export restores code, current data and decisions without runtime credentials', (t) => {
  const root = fixture(t),
    store = createStudioStore(path.join(root, 'source'));
  t.after(() => store.close());
  store.commit(store.read().version, (state) => {
    updateProject(state, { name: 'Export', idea: 'Fixture', mode: 'delegated', constraints: [] });
    queueRequest(state, { request: 'Fixture export' });
  });
  const jobs = createJobs(store),
    claim = jobs.claim('fixture');
  fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), '<h1>Code conservé</h1>');
  jobs.finish({ jobId: claim.job.id, title: 'Export', summary: 'Fixture réelle' });
  fs.writeFileSync(
    path.join(store.root, '.devmethod/data.json'),
    JSON.stringify({ version: 3, data: { loans: ['Objet conservé'] } }),
  );
  fs.writeFileSync(
    path.join(store.root, '.devmethod/runtime.json'),
    JSON.stringify({ token: 'NEVER_EXPORT_RUNTIME_TOKEN' }),
  );
  fs.writeFileSync(path.join(store.root, '.devmethod/agent.json'), 'NEVER_EXPORT_PROVIDER_LEDGER');
  fs.writeFileSync(path.join(store.root, '.env'), 'NEVER_EXPORT_UNTRACKED_SECRET');
  const bytes = exportProject(store.root, store.read());
  for (const secret of [
    'NEVER_EXPORT_RUNTIME_TOKEN',
    'NEVER_EXPORT_PROVIDER_LEDGER',
    'NEVER_EXPORT_UNTRACKED_SECRET',
  ])
    assert.equal(bytes.includes(Buffer.from(secret)), false);
  const target = path.join(root, 'restored');
  assert.ok(restoreArchive(bytes, target) >= 7);
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(target, '.devmethod/studio.json'))),
    store.read(),
  );
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(target, '.devmethod/data.json'))), {
    version: 3,
    data: { loans: ['Objet conservé'] },
  });
  assert.match(fs.readFileSync(path.join(target, 'launch.mjs'), 'utf8'), /createPreview/);
  assert.equal(fs.existsSync(path.join(target, '.devmethod/runtime.json')), false);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(target, '.devmethod/agent.json'))).unknownUsage,
    true,
  );
  const revision = store.read().revisions[0];
  const code = path.join(store.root, 'revisions', revision.id, 'app/index.html');
  fs.writeFileSync(code, 'changed outside Studio');
  assert.throws(() => exportProject(store.root, store.read()), /modifiée hors/);
});

test('traversal and duplicate entries are rejected before extracting any file', (t) => {
  const root = fixture(t);
  const names = [
    '../outside.txt',
    '/outside.txt',
    'references/../../outside.txt',
    'references\\outside.txt',
    'launch.mjs',
  ];
  for (const [index, name] of names.entries()) {
    const target = path.join(root, String(index));
    assert.throws(() => restoreArchive(archiveFiles([...required(), entry(name)]), target));
    assert.deepEqual(fs.existsSync(target) ? fs.readdirSync(target) : [], []);
  }
  assert.equal(fs.existsSync(path.join(root, 'outside.txt')), false);
});

test('corrupted headers, unsupported symlink entries and truncated contents are rejected', (t) => {
  const root = fixture(t);
  const corrupt = archiveFiles(required());
  corrupt[0] ^= 1;
  assert.throws(() => restoreArchive(corrupt, path.join(root, 'corrupt')), /corrompue/);
  const symlink = archiveFiles(required());
  symlink[156] = '2'.charCodeAt(0);
  checksum(symlink.subarray(0, 512));
  assert.throws(() => restoreArchive(symlink, path.join(root, 'link')), /non prise en charge/);
  const truncated = archiveFiles([
    entry('.devmethod/studio.json', 'x'.repeat(1500)),
    entry('launch.mjs'),
  ]).subarray(0, 1024);
  assert.throws(() => restoreArchive(truncated, path.join(root, 'short')), /invalide/);
});

test('restoration refuses existing files and a symbolic destination without touching targets', (t) => {
  const root = fixture(t),
    existing = path.join(root, 'existing');
  fs.mkdirSync(existing);
  fs.writeFileSync(path.join(existing, 'keep.txt'), 'keep');
  assert.throws(() => restoreArchive(archiveFiles(required()), existing), /dossier vide/);
  assert.equal(fs.readFileSync(path.join(existing, 'keep.txt'), 'utf8'), 'keep');
  const real = path.join(root, 'real'),
    link = path.join(root, 'link');
  fs.mkdirSync(real);
  try {
    fs.symlinkSync(real, link, 'dir');
  } catch (error) {
    if (error.code === 'EPERM') {
      t.skip('Symlink privilege unavailable');
      return;
    }
    throw error;
  }
  assert.throws(() => restoreArchive(archiveFiles(required()), link), /symbolique/);
  assert.deepEqual(fs.readdirSync(real), []);
});

test('archive parent-file collisions reject the whole extraction before partial writes', (t) => {
  const root = fixture(t),
    target = path.join(root, 'restore');
  const bytes = archiveFiles([...required(), entry('app'), entry('app/index.html')]);
  assert.throws(() => restoreArchive(bytes, target));
  assert.deepEqual(
    fs.existsSync(target) ? fs.readdirSync(target) : [],
    [],
    'No usable-looking partial project after failed restore',
  );
});

test('export refuses symlink references instead of copying their outside target', (t) => {
  const root = fixture(t),
    workspace = path.join(root, 'workspace');
  const store = createStudioStore(workspace);
  t.after(() => store.close());
  fs.writeFileSync(
    path.join(workspace, '.devmethod/data.json'),
    JSON.stringify({ version: 1, data: {} }),
  );
  fs.mkdirSync(path.join(workspace, 'references'));
  const outside = path.join(root, 'outside.txt');
  fs.writeFileSync(outside, 'PRIVATE_OUTSIDE_REFERENCE');
  try {
    fs.symlinkSync(outside, path.join(workspace, 'references/ref.txt'));
  } catch (error) {
    if (error.code === 'EPERM') {
      t.skip('Symlink privilege unavailable');
      return;
    }
    throw error;
  }
  const state = store.read();
  state.references.push({
    id: 'ref',
    file: 'references/ref.txt',
    name: 'Reference',
    mime: 'text/plain',
  });
  assert.throws(() => exportProject(workspace, state), /symbolique/);
  assert.equal(fs.readFileSync(outside, 'utf8'), 'PRIVATE_OUTSIDE_REFERENCE');
});

test('missing archive terminator and appended nonzero junk are refused before writes', (t) => {
  const root = fixture(t),
    archive = archiveFiles(required());
  for (const [index, bytes] of [
    archive.subarray(0, archive.length - 1024),
    Buffer.concat([archive, Buffer.alloc(512, 1)]),
  ].entries()) {
    const target = path.join(root, String(index));
    assert.throws(() => restoreArchive(bytes, target), /Fin d’archive/);
    assert.deepEqual(fs.existsSync(target) ? fs.readdirSync(target) : [], []);
  }
});

test('USTAR prefix preserves long valid application paths in a real project export', (t) => {
  const root = fixture(t),
    store = createStudioStore(path.join(root, 'source'));
  t.after(() => store.close());
  store.commit(1, (state) => {
    updateProject(state, {
      name: 'Long asset',
      idea: 'Registration form',
      mode: 'delegated',
      constraints: [],
    });
    queueRequest(state, { request: 'A nested component stylesheet' });
  });
  const jobs = createJobs(store),
    claim = jobs.claim('fixture');
  const relative = 'assets/components/registration/registration-form.css';
  fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), '<h1>Registration</h1>');
  fs.mkdirSync(path.dirname(path.join(claim.workDirectory, relative)), { recursive: true });
  fs.writeFileSync(path.join(claim.workDirectory, relative), 'body { color: navy; }');
  const { revision } = jobs.finish({ jobId: claim.job.id, title: 'Nested assets' });
  fs.writeFileSync(
    path.join(store.root, '.devmethod/data.json'),
    JSON.stringify({ version: 1, data: {} }),
  );
  const exported = exportProject(store.root, store.read());
  const destination = path.join(root, 'restored');
  restoreArchive(exported, destination);
  const restored = path.join(destination, 'revisions', revision.id, 'app', relative);
  assert.equal(fs.readFileSync(restored, 'utf8'), 'body { color: navy; }');
});

test('archive validates the recomposed prefix and name before writing anything', (t) => {
  const root = fixture(t);
  for (const [index, prefix] of ['../outside', '/absolute', 'safe/..'].entries()) {
    const bytes = archiveFiles([...required(), entry('payload.txt')]);
    const header = bytes.subarray(2048, 2560);
    header.write(prefix, 345, 155);
    checksum(header);
    const destination = path.join(root, String(index));
    assert.throws(() => restoreArchive(bytes, destination));
    assert.equal(fs.existsSync(destination), false);
  }
});
