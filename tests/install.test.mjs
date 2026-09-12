import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { initialize, tools, modules } from '../dist/init.js';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'devmethod-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

for (const tool of Object.keys(tools)) test(`install ${tool}: complete payload, links, hashes and license`, t => {
  const destination = path.join(fixture(t), 'project');
  const result = initialize({ destination, tool });
  assert.equal(result.skills.length, 6);
  const manifest = JSON.parse(fs.readFileSync(path.join(destination, 'kit-manifest.json')));
  for (const [file, hash] of Object.entries(manifest.files)) {
    const data = fs.readFileSync(path.join(destination, file));
    assert.equal(createHash('sha256').update(data).digest('hex'), hash);
  }
  for (const name of modules) {
    const directory = path.join(destination, tools[tool], name);
    const content = fs.readFileSync(path.join(directory, 'SKILL.md'), 'utf8');
    assert.match(content, new RegExp(`^name: ${name}$`, 'm'));
    for (const [, link] of content.matchAll(/\]\(([^)]+)\)/g)) {
      if (!link.includes('://') && !link.startsWith('#')) assert.ok(fs.existsSync(path.join(directory, link.split('#')[0])), link);
    }
  }
  assert.equal(fs.readFileSync(path.join(destination, 'DEVMETHOD-LICENSE'), 'utf8'), fs.readFileSync('LICENSE', 'utf8'));
  assert.equal(initialize({ destination, tool }).new, 0);
});

test('dry-run does not write and subsets retain foundation', t => {
  const destination = path.join(fixture(t), 'project');
  const result = initialize({ destination, tool: 'claude', selected: ['scoped-delivery'], dryRun: true });
  assert.deepEqual(result.skills, ['project-foundation', 'scoped-delivery']);
  assert.ok(!fs.existsSync(destination));
  initialize({ destination, tool: 'claude', selected: ['scoped-delivery'] });
  assert.deepEqual(fs.readdirSync(path.join(destination, tools.claude)).sort(), ['project-foundation', 'scoped-delivery']);
});

test('conflicts fail before writing and project instructions stay intact', t => {
  const destination = fixture(t);
  for (const name of ['PROJECT_PROFILE.md', 'AGENTS.md', 'CLAUDE.md', 'LICENSE', 'package.json']) fs.writeFileSync(path.join(destination, name), 'existing');
  assert.throws(() => initialize({ destination, tool: 'codex' }), /Conflict/);
  assert.equal(fs.readdirSync(destination).length, 5);
  fs.unlinkSync(path.join(destination, 'PROJECT_PROFILE.md'));
  initialize({ destination, tool: 'codex' });
  for (const name of ['AGENTS.md', 'CLAUDE.md', 'LICENSE', 'package.json']) assert.equal(fs.readFileSync(path.join(destination, name), 'utf8'), 'existing');
});

test('reject invalid arguments, duplicate hosts, symbolic and blocked paths', t => {
  const root = fixture(t);
  const destination = path.join(root, 'project');
  assert.throws(() => initialize({ destination, tool: 'invalid' }), /Unknown tool/);
  assert.throws(() => initialize({ destination, tool: 'codex', selected: ['../../bad'] }), /Unknown module/);
  initialize({ destination, tool: 'codex' });
  assert.throws(() => initialize({ destination, tool: 'cursor' }), /Duplicate/);
  fs.symlinkSync(destination, path.join(root, 'link'), 'dir');
  assert.throws(() => initialize({ destination: path.join(root, 'link'), tool: 'codex' }), /Symbolic/);
  fs.writeFileSync(path.join(root, 'file'), 'keep');
  assert.throws(() => initialize({ destination: path.join(root, 'file', 'child'), tool: 'codex' }), /directory/);
});

test('CLI validates noninteractive input and executes a real installation', t => {
  const destination = path.join(fixture(t), 'project');
  const cli = args => spawnSync(process.execPath, ['dist/cli.js', ...args], { encoding: 'utf8' });
  assert.equal(cli(['--help']).status, 0);
  for (const args of [['init'], ['other'], ['init', '--tool', 'bad'], ['init', '--oops']]) assert.equal(cli(args).status, 2);
  const result = cli(['init', '--tool', 'cursor', '--dest', destination]);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(destination, '.cursor/skills/project-foundation/SKILL.md')));
});
