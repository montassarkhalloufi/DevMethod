import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { initialize, tools } from '../dist/init.js';
import { previewUpdate } from '../dist/update.js';

const hash = (value) => createHash('sha256').update(value).digest('hex');

function fixture(t, tool = 'codex', selected) {
  const destination = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-update-'));
  t.after(() => fs.rmSync(destination, { recursive: true, force: true }));
  initialize({ destination, tool, selected });
  return destination;
}

function edit(destination, change) {
  const file = path.join(destination, 'kit-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  change(manifest);
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
}

function snapshot(root, prefix = '') {
  return fs
    .readdirSync(path.join(root, prefix), { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const relative = path.join(prefix, entry.name);
      return entry.isDirectory()
        ? snapshot(root, relative)
        : [[relative, fs.readFileSync(path.join(root, relative), 'hex')]];
    });
}

for (const tool of Object.keys(tools))
  test(`preview ${tool} full/subset provenance is deterministic and read-only`, (t) => {
    for (const selected of [undefined, ['scoped-delivery']]) {
      const destination = fixture(t, tool, selected);
      const before = snapshot(destination);
      const report = previewUpdate(destination);
      assert.equal(report.status, 'ok');
      assert.equal(report.provenance, 'recorded');
      assert.equal(report.installed.packageName, 'devmethod-ai');
      assert.deepEqual(report.installed, report.candidate);
      assert.ok(
        report.entries.every((e) => e.classification === 'unchanged' && !e.candidateChanged),
      );
      assert.deepEqual(snapshot(destination), before);
      assert.equal(initialize({ destination, tool, selected }).new, 0);
    }
  });
test('legacy manifest remains untouched and provenance is unknown', (t) => {
  const destination = fixture(t);
  edit(destination, (m) => {
    delete m.provenance;
  });
  const before = snapshot(destination);
  assert.equal(initialize({ destination, tool: 'codex' }).new, 0);
  const report = previewUpdate(destination);
  assert.equal(report.provenance, 'unknown');
  assert.equal(report.status, 'warning');
  assert.deepEqual(snapshot(destination), before);
});
test('comparison distinguishes upstream edits, local customization, additions, removals and collisions without writes', (t) => {
  const destination = fixture(t);
  const updated = 'PROJECT_PROFILE.md';
  const customized = 'START_HERE.md';
  const removed = '.agents/skills/project-foundation/references/old.md';
  const removedCustomized = '.agents/skills/project-foundation/references/old-custom.md';
  let added;
  edit(destination, (m) => {
    added = Object.keys(m.files).find((n) => n.includes('/references/') && n !== removed);
    delete m.files[added];
    m.files[updated] = hash('old release');
    m.files[removed] = hash('old reference');
    m.files[removedCustomized] = hash('old reference');
  });
  fs.writeFileSync(path.join(destination, updated), 'old release');
  fs.appendFileSync(path.join(destination, customized), '\nPrivate project customization');
  fs.writeFileSync(path.join(destination, removed), 'old reference');
  fs.writeFileSync(path.join(destination, removedCustomized), 'local customization');
  const before = snapshot(destination);
  const report = previewUpdate(destination);
  const entry = (name) => report.entries.find((e) => e.path === name);
  assert.equal(entry(updated).classification, 'updated');
  assert.equal(entry(customized).classification, 'customized');
  assert.equal(entry(customized).candidateChanged, false);
  assert.equal(entry(removed).classification, 'removed');
  assert.equal(entry(removedCustomized).classification, 'conflict');
  assert.equal(entry(removedCustomized).candidateSha256, undefined);
  assert.equal(entry(added).classification, 'added');
  assert.equal(entry(added).collision, true);
  assert.deepEqual(snapshot(destination), before);
  fs.unlinkSync(path.join(destination, added));
  assert.equal(
    previewUpdate(destination).entries.find((e) => e.path === added).collision,
    undefined,
  );
  fs.unlinkSync(path.join(destination, customized));
  assert.equal(previewUpdate(destination).status, 'error');
});
test('preview refuses traversal and symbolic paths and malformed provenance', (t) => {
  for (const invalid of [
    '../private.md',
    '/etc/passwd',
    'C:/private.md',
    '.agents/skills/project-foundation/references/../../private.md',
  ]) {
    const destination = fixture(t);
    edit(destination, (m) => {
      m.files[invalid] = hash('secret');
    });
    assert.equal(previewUpdate(destination).status, 'error');
    assert.deepEqual(previewUpdate(destination).entries, []);
  }
  const destination = fixture(t);
  const skillRoot = path.join(destination, '.agents/skills');
  fs.renameSync(skillRoot, path.join(destination, 'moved'));
  fs.symlinkSync(
    path.join(destination, 'moved'),
    skillRoot,
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  assert.equal(previewUpdate(destination).status, 'error');
  const malformed = fixture(t);
  edit(malformed, (m) => {
    m.provenance.packageVersion = {};
  });
  assert.equal(previewUpdate(malformed).status, 'error');
});
test('update-preview JSON and CLI exit codes', (t) => {
  const destination = fixture(t);
  const cli = (args) =>
    spawnSync(process.execPath, ['dist/cli.js', 'update-preview', '--dest', destination, ...args], {
      encoding: 'utf8',
    });
  let result = cli(['--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, 'ok');
  assert.equal(cli(['--tool', 'codex']).status, 2);
  fs.unlinkSync(path.join(destination, 'DEVMETHOD-LICENSE'));
  result = cli(['--json']);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).status, 'error');
});
