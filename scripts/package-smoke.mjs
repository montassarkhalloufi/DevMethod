import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const archive = process.argv[2];
if (!archive) throw new Error('Usage: node scripts/package-smoke.mjs PACKAGE_TGZ');
const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-package-'));
const run = (command, args, cwd = root, expected = 0, input) => {
  const r = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 30000, input });
  assert.equal(r.status, expected, `${command} ${args.join(' ')}\n${r.stdout}\n${r.stderr}`); return r.stdout;
};
try {
  // stdin avoids GNU tar treating a Windows drive letter as a remote host.
  run('tar', ['-xzf', '-'], root, 0, fs.readFileSync(path.resolve(archive)));
  const pkg = path.join(root, 'package'); const cli = path.join(pkg, 'dist/cli.js');
  const call = (args, expected = 0) => run(process.execPath, [cli, ...args], root, expected);
  assert.equal(JSON.parse(fs.readFileSync(path.join(pkg, 'package.json'))).version, '0.2.0');
  run(process.execPath, ['scripts/check-docs.mjs'], pkg);
  for (const testFile of [...fs.readdirSync(path.join(pkg, 'examples/pocket-tasks/tests')).filter(f => f.endsWith('.test.mjs')).map(f => `examples/pocket-tasks/tests/${f}`), 'evaluation/greenfield/acceptance.test.mjs', 'evaluation/greenfield/security.test.mjs']) {
    run(process.execPath, ['--test', testFile], pkg);
  }
  for (const host of ['codex', 'claude', 'cursor']) {
    const project = path.join(root, host);
    call(['init', '--tool', host, '--dest', project]);
    assert.equal(JSON.parse(call(['doctor', '--dest', project, '--json'])).status, 'ok');
    const profile = path.join(project, 'PROJECT_PROFILE.md'); fs.appendFileSync(profile, '\nFictional local customization.\n');
    const before = fs.readFileSync(profile);
    const preview = JSON.parse(call(['update-preview', '--dest', project, '--json']));
    assert.equal(preview.entries.find(e => e.path === 'PROJECT_PROFILE.md').classification, 'customized');
    call(['init', '--tool', host, '--dest', project], 2); assert.deepEqual(fs.readFileSync(profile), before);
  }
  call(['init', '--tool', 'claude', '--modules', 'scoped-delivery', '--dest', path.join(root, 'subset')]);
  const project = path.join(root, 'mission'); fs.mkdirSync(path.join(project, 'examples'), { recursive: true });
  fs.cpSync(path.join(pkg, 'examples/mission'), path.join(project, 'examples/mission'), { recursive: true });
  fs.writeFileSync(path.join(project, '.gitignore'), 'evidence/\n');
  run('git', ['init'], project); run('git', ['add', '.'], project);
  run('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture'], project);
  const args = ['--dest', project, '--json'];
  assert.equal(JSON.parse(call(['mission', '--mission', 'examples/mission/mission.json', ...args])).status, 'ready');
  const context = call(['context', '--mission', 'examples/mission/mission.json', ...args]);
  fs.mkdirSync(path.join(project, 'evidence')); fs.writeFileSync(path.join(project, 'evidence/context.json'), context);
  assert.equal(JSON.parse(call(['context-check', '--context', 'evidence/context.json', ...args])).status, 'ready');
  fs.appendFileSync(path.join(project, 'examples/mission/CONTRACT.md'), '\nChanged contract.\n');
  assert.equal(JSON.parse(call(['context-check', '--context', 'evidence/context.json', ...args], 1)).status, 'reverify');
  assert.deepEqual(JSON.parse(call(['plan', '--plan', 'examples/mission/plan.json', ...args])).candidates, ['api']);
  if (process.argv[3]) {
    const legacy = path.join(root, 'legacy-package'); fs.mkdirSync(legacy);
    run('tar', ['-xzf', '-', '--strip-components=1'], legacy, 0, fs.readFileSync(path.resolve(process.argv[3])));
    const adopted = path.join(root, 'legacy-adopted');
    run(process.execPath, [path.join(legacy, 'dist/cli.js'), 'init', '--tool', 'codex', '--dest', adopted]);
    const customized = path.join(adopted, '.agents/skills/project-foundation/SKILL.md');
    const profile = path.join(adopted, 'PROJECT_PROFILE.md');
    fs.appendFileSync(customized, '\nLocal workflow policy.\n'); fs.appendFileSync(profile, '\nFilled project context.\n');
    const before = [fs.readFileSync(customized), fs.readFileSync(profile)];
    const preview = JSON.parse(call(['update-preview', '--dest', adopted, '--json']));
    assert.equal(preview.entries.find(e => e.path === '.agents/skills/project-foundation/SKILL.md').classification, 'conflict');
    assert.equal(preview.provenance, 'unknown');
    call(['init', '--tool', 'codex', '--dest', adopted], 2);
    assert.deepEqual([fs.readFileSync(customized), fs.readFileSync(profile)], before);
    console.log('Actual legacy tarball: local/upstream conflict detected and filled profile/custom skill preserved.');
  }
  console.log('Packed 0.2.0: three host installs, subset, customization preservation, mission/context/staleness/planning and documentation links passed. No native host execution.');
} finally { fs.rmSync(root, { recursive: true, force: true }); }
