import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { hasCommittedGuardInputs } from '../dist/guard-revision.js';

function fixture(t, objectFormat = 'sha1') {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'guard-revision-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, content) => fs.writeFileSync(path.join(root, file), content);
  const git = (...args) =>
    execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  const mission = {
    format: 1,
    id: 'REVISION',
    path: 'standard',
    owner: 'fixture',
    outcome: 'Verify committed inputs',
    scope: ['Revision guard'],
    exclusions: ['Native invocation'],
    invariants: ['Evidence belongs to the declared code'],
    uncertainties: [],
    status: 'active',
    nextAction: 'Verify',
    stopConditions: ['Revision mismatch'],
    dependencies: [],
    contradictions: [],
    sources: [
      {
        id: 'contract',
        path: 'contract.md',
        level: 'domain',
        reason: 'Expected behavior',
        authority: 'Fixture',
        kind: 'accepted-decision',
        revision: 'fixture',
      },
    ],
    acceptance: [
      {
        id: 'AC',
        description: 'Use the committed code',
        changes: ['code.ts'],
        verification: 'Local fixture',
        kind: 'automated',
      },
    ],
  };
  write('contract.md', 'Require matching committed inputs.\n');
  write('code.ts', 'export const value = 2;\n');
  write('.gitignore', 'report.json\nartifacts/\n');
  write('mission.json', JSON.stringify(mission));
  write('report.json', '{"format":1,"runs":[]}\n');
  fs.mkdirSync(path.join(root, 'artifacts'));
  write('artifacts/trace.txt', 'Initial observation\n');
  git('init', `--object-format=${objectFormat}`);
  git('config', 'core.autocrlf', 'false');
  git('add', '.');
  const commit = () =>
    git(
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '-m',
      'Fixture',
    );
  commit();
  const snapshot = () => ({
    format: 1,
    missionPath: 'mission.json',
    reportPath: 'report.json',
    artifactPath: 'artifacts',
    git: { commit: git('rev-parse', 'HEAD') },
    files: [
      { path: 'mission.json' },
      { path: 'contract.md' },
      { path: 'code.ts' },
      { path: 'report.json' },
      { path: 'artifacts/trace.txt' },
    ],
  });
  const saveMission = () => write('mission.json', JSON.stringify(mission));
  return { root, write, git, commit, mission, snapshot, saveMission };
}

test('committed raw bytes are accepted for both Git object formats', (t) => {
  for (const format of ['sha1', 'sha256']) {
    const f = fixture(t, format);
    assert.equal(hasCommittedGuardInputs(f.root, f.snapshot()), true, format);
  }
});

test('a code change with unchanged HEAD cannot reuse prior behavioral observations', (t) => {
  const f = fixture(t);
  const snapshot = f.snapshot();
  f.write('code.ts', 'export const value = 999;\n');
  assert.equal(hasCommittedGuardInputs(f.root, snapshot), false);
  f.write('code.ts', 'export const value = 2;\n');
  assert.equal(hasCommittedGuardInputs(f.root, snapshot), true);
  fs.unlinkSync(path.join(f.root, 'code.ts'));
  assert.equal(hasCommittedGuardInputs(f.root, snapshot), false);
});

test('declared sources and changes must already be present at the commit', (t) => {
  const f = fixture(t);
  f.write('new.ts', 'export const added = true;\n');
  f.mission.acceptance[0].changes = ['new.ts'];
  f.saveMission();
  f.git('add', 'mission.json');
  f.commit();
  assert.equal(hasCommittedGuardInputs(f.root, f.snapshot()), false);
  f.git('add', 'new.ts');
  f.commit();
  assert.equal(hasCommittedGuardInputs(f.root, f.snapshot()), true);
});

test('an untracked mission may select committed inputs, while other tracked edits are rejected', (t) => {
  const f = fixture(t);
  f.git('rm', '--cached', 'mission.json');
  f.commit();
  assert.equal(hasCommittedGuardInputs(f.root, f.snapshot()), true);
  f.write('.gitignore', 'Changed tracked configuration\n');
  assert.equal(hasCommittedGuardInputs(f.root, f.snapshot()), false);
});

test('index-only modifications and a different HEAD fail even with original worktree bytes', (t) => {
  const f = fixture(t);
  const snapshot = f.snapshot();
  f.write('code.ts', 'export const value = 3;\n');
  f.git('add', 'code.ts');
  f.write('code.ts', 'export const value = 2;\n');
  assert.equal(hasCommittedGuardInputs(f.root, snapshot), false);
  f.write('code.ts', 'export const value = 3;\n');
  f.commit();
  assert.equal(hasCommittedGuardInputs(f.root, snapshot), false);
  assert.equal(hasCommittedGuardInputs(f.root, f.snapshot()), true);
});

test('reports and declared artifacts must remain outside HEAD and the index', (t) => {
  const f = fixture(t);
  f.write('report.json', '{"format":1,"runs":["changed"]}\n');
  f.write('artifacts/trace.txt', 'New observation\n');
  assert.equal(hasCommittedGuardInputs(f.root, f.snapshot()), true);
  f.git('add', '--force', 'report.json', 'artifacts/trace.txt');
  assert.equal(hasCommittedGuardInputs(f.root, f.snapshot()), false);
  f.commit();
  f.git('rm', '--cached', 'report.json', 'artifacts/trace.txt');
  assert.equal(hasCommittedGuardInputs(f.root, f.snapshot()), false);
});

test('evidence cannot overlap a declared source or change', (t) => {
  const f = fixture(t);
  const snapshot = f.snapshot();
  snapshot.reportPath = 'code.ts';
  assert.equal(hasCommittedGuardInputs(f.root, snapshot), false);
  snapshot.reportPath = 'report.json';
  snapshot.artifactPath = 'contract.md';
  snapshot.files.push({ path: 'contract.md' });
  assert.equal(hasCommittedGuardInputs(f.root, snapshot), false);
});

test('raw-byte policy rejects CRLF conversion and does not run filters or external diff', (t) => {
  const f = fixture(t);
  f.write('.gitattributes', 'code.ts filter=probe\n');
  f.git('add', '.gitattributes');
  f.commit();
  const command = "node -e \"require('fs').writeFileSync('filter-fired','bad')\"";
  f.git('config', 'filter.probe.clean', command);
  f.git('config', 'filter.probe.smudge', command);
  f.git('config', 'diff.external', command);
  f.git('config', 'core.fsmonitor', command);
  const snapshot = f.snapshot();
  assert.equal(hasCommittedGuardInputs(f.root, snapshot), true);
  assert.equal(fs.existsSync(path.join(f.root, 'filter-fired')), false);
  f.write('code.ts', 'export const value = 2;\r\n');
  assert.equal(hasCommittedGuardInputs(f.root, snapshot), false);
  assert.equal(fs.existsSync(path.join(f.root, 'filter-fired')), false);
});

test('unverifiable secret paths, symlink objects and submodules fail closed', (t) => {
  const secret = fixture(t);
  secret.write('.env', 'FIXTURE_ONLY=true\n');
  secret.git('add', '.env');
  secret.commit();
  assert.equal(hasCommittedGuardInputs(secret.root, secret.snapshot()), false);

  const link = fixture(t);
  const blob = link.git('hash-object', 'code.ts');
  link.git('update-index', '--add', '--cacheinfo', `120000,${blob},link`);
  link.commit();
  link.write('link', 'code.ts');
  assert.equal(hasCommittedGuardInputs(link.root, link.snapshot()), false);

  const submodule = fixture(t);
  const revision = submodule.git('rev-parse', 'HEAD');
  submodule.git('update-index', '--add', '--cacheinfo', `160000,${revision},nested`);
  submodule.commit();
  assert.equal(hasCommittedGuardInputs(submodule.root, submodule.snapshot()), false);
});

test('oversized tracked files fail before reading their payload', (t) => {
  const f = fixture(t);
  const target = path.join(f.root, 'code.ts');
  const descriptor = fs.openSync(target, 'w');
  fs.ftruncateSync(descriptor, 8 * 1024 * 1024 + 1);
  fs.closeSync(descriptor);
  const originalRead = fs.readFileSync;
  fs.readFileSync = function (file, ...options) {
    assert.notEqual(file, target, 'Oversized payload must not be read');
    return originalRead.call(this, file, ...options);
  };
  try {
    assert.equal(hasCommittedGuardInputs(f.root, f.snapshot()), false);
  } finally {
    fs.readFileSync = originalRead;
  }
});

test('tracked content is bounded across files, including the 64 MiB boundary', (t) => {
  const f = fixture(t);
  const block = Buffer.alloc(8 * 1024 * 1024);
  for (let index = 0; index < 7; index++) f.write(`payload-${index}.bin`, block);
  f.git('add', '.');
  f.commit();
  assert.equal(hasCommittedGuardInputs(f.root, f.snapshot()), true);
  f.write('payload-7.bin', block);
  f.git('add', 'payload-7.bin');
  f.commit();
  // Eight payloads plus the small declared context exceed 64 MiB in total.
  assert.equal(hasCommittedGuardInputs(f.root, f.snapshot()), false);
});
