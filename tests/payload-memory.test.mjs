import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { initialize } from '../dist/init.js';
import { diagnose } from '../dist/doctor.js';
import { previewUpdate } from '../dist/update.js';
import { hashFileSha256 } from '../dist/filesystem.js';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-payload-memory-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  initialize({ destination: root, tool: 'codex', selected: ['project-foundation'] });
  return root;
}

function writeRepeated(file, count) {
  const block = Buffer.alloc(64 * 1024, 'x');
  const hash = createHash('sha256');
  const descriptor = fs.openSync(file, 'w');
  try {
    for (let i = 0; i < count; i++) {
      fs.writeSync(descriptor, block);
      hash.update(block);
    }
  } finally {
    fs.closeSync(descriptor);
  }
  return hash.digest('hex');
}

function preventWholeFileRead(t, file) {
  const originalRead = fs.readFileSync;
  t.mock.method(fs, 'readFileSync', function (target, ...args) {
    assert.notEqual(String(target), file, 'custom payload must not be buffered in full');
    return originalRead.call(this, target, ...args);
  });
  syncBuiltinESMExports();
  t.after(() => {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  });
}

test('large customized payloads retain exact hashes without whole-file reads', (t) => {
  const root = fixture(t);
  const name = 'PROJECT_PROFILE.md';
  const file = path.join(root, name);
  const expected = writeRepeated(file, 256);
  preventWholeFileRead(t, file);
  const tracked = new Set();
  const originalOpen = fs.openSync;
  const originalRead = fs.readSync;
  const originalClose = fs.closeSync;
  let bytesRead = 0;
  t.mock.method(fs, 'openSync', function (target, ...args) {
    const descriptor = originalOpen.call(this, target, ...args);
    if (String(target) === file) tracked.add(descriptor);
    return descriptor;
  });
  t.mock.method(fs, 'readSync', function (descriptor, buffer, offset, length, position) {
    if (tracked.has(descriptor))
      assert.ok(length <= 64 * 1024, 'payload reads must use bounded blocks');
    const count = originalRead.call(this, descriptor, buffer, offset, length, position);
    if (tracked.has(descriptor)) bytesRead += count;
    return count;
  });
  t.mock.method(fs, 'closeSync', function (descriptor) {
    tracked.delete(descriptor);
    return originalClose.call(this, descriptor);
  });
  syncBuiltinESMExports();

  const diagnostics = diagnose(root);
  assert.equal(diagnostics.status, 'warning');
  assert.ok(diagnostics.findings.some((f) => f.code === 'file-modified' && f.path === name));
  assert.equal(bytesRead, 16 * 1024 * 1024);
  bytesRead = 0;
  const report = previewUpdate(root);
  assert.equal(report.status, 'warning');
  const entry = report.entries.find((e) => e.path === name);
  assert.equal(entry.classification, 'customized');
  assert.equal(entry.installedSha256, expected);
  assert.equal(
    bytesRead,
    16 * 1024 * 1024,
    'update must reuse the hashes collected for diagnostics',
  );
  assert.equal(tracked.size, 0);
  assert.equal(fs.statSync(file).size, 16 * 1024 * 1024);
});

test('stream hashing handles empty files, short reads and closes on read failures', (t) => {
  const root = fixture(t);
  assert.throws(() => hashFileSha256(root), /Expected a regular file/);
  const file = path.join(root, 'sample.bin');
  fs.writeFileSync(file, '');
  assert.equal(hashFileSha256(file), createHash('sha256').update('').digest('hex'));
  const content = Buffer.from('Short reads must not lose the final bytes.');
  fs.writeFileSync(file, content);
  const expected = createHash('sha256').update(content).digest('hex');
  const originalRead = fs.readSync;
  const originalClose = fs.closeSync;
  let failRead = false;
  let closes = 0;
  t.mock.method(fs, 'readSync', function (descriptor, buffer, offset, length, position) {
    if (failRead) throw new Error('Injected read failure');
    return originalRead.call(this, descriptor, buffer, offset, Math.min(length, 3), position);
  });
  t.mock.method(fs, 'closeSync', function (descriptor) {
    closes++;
    return originalClose.call(this, descriptor);
  });
  syncBuiltinESMExports();
  t.after(() => {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  });
  assert.equal(hashFileSha256(file), expected);
  failRead = true;
  assert.throws(() => hashFileSha256(file), /Injected read failure/);
  assert.equal(closes, 2);
});

test('init refuses size conflicts before reading existing payload bytes', (t) => {
  const root = fixture(t);
  const file = path.join(root, 'PROJECT_PROFILE.md');
  writeRepeated(file, 256);
  preventWholeFileRead(t, file);
  assert.throws(
    () => initialize({ destination: root, tool: 'codex', selected: ['project-foundation'] }),
    /Conflict; no files written: PROJECT_PROFILE.md/,
  );
  assert.equal(fs.statSync(file).size, 16 * 1024 * 1024);
});

test('init refuses oversized existing manifests before parsing their bytes', (t) => {
  const root = fixture(t);
  const file = path.join(root, 'kit-manifest.json');
  writeRepeated(file, 17);
  preventWholeFileRead(t, file);
  assert.throws(
    () => initialize({ destination: root, tool: 'codex', selected: ['project-foundation'] }),
    /Manifest must be a regular file no larger than 1 MiB/,
  );
  assert.equal(fs.statSync(file).size, 17 * 64 * 1024);
});
