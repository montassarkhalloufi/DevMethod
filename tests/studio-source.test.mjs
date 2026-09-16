import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readSource } from '../scripts/studio/source.mjs';
import { digest } from '../scripts/studio/files.mjs';

function fixture(t, bytes, name = 'index.html') {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-source-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, 'revisions/version-a/app', name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes);
  const state = {
    revisions: [
      { id: 'version-a', files: [{ path: name, bytes: bytes.length, sha256: digest(bytes) }] },
    ],
  };
  return {
    root,
    file,
    state,
    read: (revision = 'version-a', relative = name) => readSource(root, state, revision, relative),
  };
}

test('source returns the actual pinned bytes and refuses other files, revisions and traversal', (t) => {
  const value = '<h1>Bonjour</h1><script>unsafeMarkup()</script>';
  const f = fixture(t, Buffer.from(value));
  assert.equal(f.read().content, value);
  assert.equal(f.read().binary, false);
  assert.throws(() => f.read('version-b'), /absent/);
  assert.throws(() => f.read('version-a', '../../.devmethod/runtime.json'), /absent/);
  fs.writeFileSync(f.file, value.replace('Bonjour', 'Bonsoir'));
  assert.throws(() => f.read(), /changé/);
});

test('source does not follow a substituted symlink', (t) => {
  const f = fixture(t, Buffer.from('source'));
  fs.unlinkSync(f.file);
  fs.symlinkSync('/etc/hosts', f.file);
  assert.throws(() => f.read(), /symbolique/);
});

test('source distinguishes binary and bounds text without breaking UTF-8', (t) => {
  const binary = fixture(t, Buffer.from([137, 80, 78, 71, 0]), 'asset.png');
  assert.equal(binary.read().binary, true);
  assert.equal(binary.read().content, null);
  const large = fixture(t, Buffer.from('é'.repeat(150000)), 'long.txt');
  assert.equal(large.read().truncated, true);
  assert.ok(Buffer.byteLength(large.read().content) <= 256 * 1024);
  assert.ok(!large.read().content.includes('\uFFFD'));
});

test('source preserves a UTF-8 BOM for an exact comparison', (t) => {
  const f = fixture(t, Buffer.from('\uFEFFsource'));
  assert.equal(f.read().content, '\uFEFFsource');
});
