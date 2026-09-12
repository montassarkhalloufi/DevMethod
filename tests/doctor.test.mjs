import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { initialize, tools } from '../dist/init.js';
import { diagnose } from '../dist/doctor.js';

function fixture(t, tool = 'codex', selected) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-doctor-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const destination = path.join(root, 'project with spaces');
  initialize({ destination, tool, selected });
  return { root, destination };
}

function editManifest(destination, edit) {
  const file = path.join(destination, 'kit-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  edit(manifest);
  fs.writeFileSync(file, JSON.stringify(manifest));
}

function snapshot(root, prefix = '') {
  return fs.readdirSync(path.join(root, prefix), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const relative = path.join(prefix, entry.name);
    return entry.isDirectory() ? snapshot(root, relative) : [[relative, fs.readFileSync(path.join(root, relative), 'hex')]];
  });
}

for (const tool of Object.keys(tools)) test(`doctor accepts full and subset ${tool} installations without changes`, t => {
  for (const selected of [undefined, ['scoped-delivery']]) {
    const { destination } = fixture(t, tool, selected);
    const before = snapshot(destination);
    const report = diagnose(destination);
    assert.equal(report.status, 'ok');
    assert.equal(report.tool, tool);
    assert.equal(report.checked, report.unchanged);
    assert.ok(report.checked > 5);
    assert.deepEqual(report.findings, []);
    assert.deepEqual(snapshot(destination), before);
  }
});

test('customized templates and skills are warnings, preserved byte for byte', t => {
  const { destination } = fixture(t);
  const names = ['PROJECT_PROFILE.md', '.agents/skills/project-foundation/SKILL.md'];
  for (const name of names) fs.appendFileSync(path.join(destination, name), '\nProject customization\n');
  const before = snapshot(destination);
  const report = diagnose(destination);
  assert.equal(report.status, 'warning');
  assert.deepEqual(report.findings.map(f => f.path).sort(), names.sort());
  assert.ok(report.findings.every(f => f.code === 'file-modified'));
  assert.deepEqual(snapshot(destination), before);
});

test('missing files and duplicate host copies are errors even alongside customization', t => {
  const { destination } = fixture(t);
  fs.appendFileSync(path.join(destination, 'PROJECT_PROFILE.md'), '\nCustomized');
  fs.unlinkSync(path.join(destination, '.agents/skills/scoped-delivery/SKILL.md'));
  fs.mkdirSync(path.join(destination, '.claude/skills/project-foundation'), { recursive: true });
  const report = diagnose(destination);
  assert.equal(report.status, 'error');
  assert.ok(report.findings.some(f => f.code === 'file-missing'));
  assert.ok(report.findings.some(f => f.code === 'duplicate-host'));
});

test('doctor rejects malformed, incomplete and unsupported manifests before reading payload', t => {
  const edits = [
    m => { m.format = 999; }, m => { m.tool = 'toString'; },
    m => { m.skills.push('unknown'); }, m => { m.skills.push('project-foundation'); },
    m => { m.skills = ['scoped-delivery']; }, m => { delete m.files['DEVMETHOD-LICENSE']; },
    m => { delete m.files['.agents/skills/project-foundation/SKILL.md']; },
    m => { m.files['PROJECT_PROFILE.md'] = 'not-a-hash'; }, m => { m.files = []; },
  ];
  for (const edit of edits) {
    const { destination } = fixture(t);
    editManifest(destination, edit);
    const report = diagnose(destination);
    assert.equal(report.status, 'error');
    assert.equal(report.checked, 0);
    assert.equal(report.findings[0].code, 'manifest-invalid');
  }
  const { root, destination } = fixture(t);
  fs.writeFileSync(path.join(destination, 'kit-manifest.json'), '{broken');
  assert.equal(diagnose(destination).status, 'error');
  fs.writeFileSync(path.join(destination, 'kit-manifest.json'), 'x'.repeat(1024 * 1024 + 1));
  assert.equal(diagnose(destination).status, 'error');
  const absent = path.join(root, 'absent');
  assert.equal(diagnose(absent).findings[0].code, 'manifest-missing');
  assert.equal(fs.existsSync(absent), false);
});

test('untrusted manifest cannot select traversal, absolute, foreign-host or arbitrary project paths', t => {
  for (const name of ['../outside.md', '/etc/passwd', 'C:/outside.md', '..\\outside.md', 'package.json',
    '.agents/skills/project-foundation/references/../../../../outside.md',
    '.claude/skills/project-foundation/SKILL.md', '.agents/skills/unselected/SKILL.md']) {
    const { destination } = fixture(t);
    editManifest(destination, m => { m.files[name] = '0'.repeat(64); });
    const report = diagnose(destination);
    assert.equal(report.status, 'error', name);
    assert.equal(report.checked, 0, name);
  }
});

test('doctor refuses symlink destinations, manifests, payloads and alternate host ancestors', t => {
  const { root, destination } = fixture(t);
  fs.symlinkSync(destination, path.join(root, 'linked'), 'dir');
  assert.equal(diagnose(path.join(root, 'linked')).status, 'error');
  // Use directory links (junctions on Windows) to avoid file-symlink privilege requirements.
  const skills = path.join(destination, '.agents/skills');
  const moved = path.join(root, 'skills');
  fs.renameSync(skills, moved);
  fs.symlinkSync(moved, skills, process.platform === 'win32' ? 'junction' : 'dir');
  assert.ok(diagnose(destination).findings.some(f => f.code === 'file-unreadable'));
  const alternate = path.join(destination, '.claude');
  fs.symlinkSync(root, alternate, process.platform === 'win32' ? 'junction' : 'dir');
  assert.ok(diagnose(destination).findings.some(f => f.code === 'host-unreadable'));
  const manifest = path.join(destination, 'kit-manifest.json');
  fs.unlinkSync(manifest);
  fs.symlinkSync(root, manifest, process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal(diagnose(destination).findings[0].code, 'manifest-invalid');
});

test('doctor CLI emits parseable JSON, stable exit codes and rejects irrelevant options', t => {
  const { destination } = fixture(t);
  const cli = args => spawnSync(process.execPath, ['dist/cli.js', ...args], { encoding: 'utf8' });
  const args = ['doctor', '--dest', destination, '--json'];
  let result = cli(args);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, 'ok');
  fs.appendFileSync(path.join(destination, 'PROJECT_PROFILE.md'), '\nLocal context');
  result = cli(args);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).status, 'warning');
  fs.unlinkSync(path.join(destination, 'DEVMETHOD-LICENSE'));
  result = cli(args);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).status, 'error');
  for (const invalid of [['doctor', '--tool', 'codex'], ['doctor', '--dry-run'], ['doctor', '--modules', 'scoped-delivery'], ['init', '--tool', 'codex', '--json']]) {
    assert.equal(cli(invalid).status, 2);
  }
});
