import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { safeFile, copyFiles, digest } from '../scripts/studio/files.mjs';
import { archiveFiles, restoreArchive } from '../scripts/studio/archive.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-paths-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

const bundle = () =>
  archiveFiles([
    { name: '.devmethod/studio.json', bytes: Buffer.from('{}') },
    { name: 'launch.mjs', bytes: Buffer.from('// local launch') },
  ]);

function link(t, target, destination) {
  try {
    fs.symlinkSync(target, destination, 'dir');
    return true;
  } catch (error) {
    if (error.code === 'EPERM') {
      t.skip('Symlink privilege unavailable');
      return false;
    }
    throw error;
  }
}

test('all existing destination ancestors are checked before creating archive directories', (t) => {
  const root = fixture(t),
    real = path.join(root, 'real'),
    alias = path.join(root, 'alias');
  fs.mkdirSync(real);
  if (!link(t, real, alias)) return;
  assert.throws(() => restoreArchive(bundle(), path.join(alias, 'new', 'project')), /symbolique/);
  assert.deepEqual(fs.readdirSync(real), []);
  assert.throws(() => safeFile(path.join(alias, 'new'), 'app.js'), /symbolique/);
});

test('dangling ancestor links and copy destinations are refused without writing through them', (t) => {
  const root = fixture(t),
    missing = path.join(root, 'missing'),
    alias = path.join(root, 'alias');
  if (!link(t, missing, alias)) return;
  assert.throws(() => restoreArchive(bundle(), path.join(alias, 'project')), /symbolique/);
  assert.equal(fs.existsSync(missing), false);
  const source = path.join(root, 'source');
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'index.html'), 'hello');
  assert.throws(
    () =>
      copyFiles(source, path.join(alias, 'project'), [
        { path: 'index.html', bytes: 5, sha256: digest(Buffer.from('hello')) },
      ]),
    /symbolique/,
  );
  assert.equal(fs.existsSync(missing), false);
});

test('invalid footer and file-directory conflicts fail before destination creation', (t) => {
  const root = fixture(t);
  const destination = path.join(root, 'new');
  const noFooter = bundle().subarray(0, -1024);
  assert.throws(() => restoreArchive(noFooter, destination), /archive/i);
  assert.equal(fs.existsSync(destination), false);
  const conflict = archiveFiles([
    { name: '.devmethod/studio.json', bytes: Buffer.from('{}') },
    { name: 'launch.mjs', bytes: Buffer.from('// local') },
    { name: 'folder', bytes: Buffer.from('file') },
    { name: 'folder/child', bytes: Buffer.from('child') },
  ]);
  assert.throws(() => restoreArchive(conflict, destination), /conflit/);
  assert.equal(fs.existsSync(destination), false);
});

test('disk failure during extraction leaves an existing empty destination unchanged', (t) => {
  const root = fixture(t),
    destination = path.join(root, 'project');
  fs.mkdirSync(destination);
  const originalWrite = fs.writeFileSync;
  fs.writeFileSync = function (file, ...args) {
    if (String(file).endsWith(path.sep + 'launch.mjs')) throw new Error('Disk-full probe');
    return originalWrite.call(this, file, ...args);
  };
  try {
    assert.throws(() => restoreArchive(bundle(), destination), /Disk-full probe/);
  } finally {
    fs.writeFileSync = originalWrite;
  }
  assert.deepEqual(fs.readdirSync(destination), []);
  assert.deepEqual(fs.readdirSync(root), ['project']);
});

test('successful extraction atomically supplies the complete bundle', (t) => {
  const root = fixture(t),
    destination = path.join(root, 'project');
  fs.mkdirSync(destination);
  assert.equal(restoreArchive(bundle(), destination), 2);
  assert.equal(fs.readFileSync(path.join(destination, 'launch.mjs'), 'utf8'), '// local launch');
  assert.deepEqual(fs.readdirSync(root), ['project']);
});

test('a concurrent user file prevents installation and is preserved', (t) => {
  const root = fixture(t),
    destination = path.join(root, 'project');
  fs.mkdirSync(destination);
  const originalWrite = fs.writeFileSync;
  fs.writeFileSync = function (file, ...args) {
    const result = originalWrite.call(this, file, ...args);
    if (String(file).endsWith(path.sep + 'launch.mjs'))
      originalWrite.call(this, path.join(destination, 'user.txt'), 'Conserver');
    return result;
  };
  try {
    assert.throws(() => restoreArchive(bundle(), destination), /dossier vide/);
  } finally {
    fs.writeFileSync = originalWrite;
  }
  assert.deepEqual(fs.readdirSync(destination), ['user.txt']);
  assert.equal(fs.readFileSync(path.join(destination, 'user.txt'), 'utf8'), 'Conserver');
  assert.deepEqual(fs.readdirSync(root), ['project']);
});
