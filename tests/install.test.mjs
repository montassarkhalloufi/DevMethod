import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { commandSkills } from '../dist/commands.js';
import { initialize, tools, modules } from '../dist/init.js';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-'));
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
  assert.deepEqual(fs.readdirSync(path.join(destination, tools.claude)).sort(), ['project-foundation', 'scoped-delivery', ...commandSkills(['project-foundation', 'scoped-delivery'])].sort());
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

for (const tool of Object.keys(tools)) test(`workflow resources on ${tool}: complete references and mission preservation`, t => {
  const destination = fixture(t);
  const legacy = 'docs/missions/legacy.md';
  const ticket = 'docs/missions/current/tickets/T-1.md';
  for (const file of [legacy, ticket]) {
    fs.mkdirSync(path.dirname(path.join(destination, file)), { recursive: true });
    fs.writeFileSync(path.join(destination, file), `User-owned ${file}\nStatus: blocked; evidence: not run\n`);
  }
  const before = [legacy, ticket].map(f => fs.readFileSync(path.join(destination, f)));
  initialize({ destination, tool });
  const manifest = JSON.parse(fs.readFileSync(path.join(destination, 'kit-manifest.json')));
  const resources = {
    'project-foundation': ['references/exploration.md', 'references/delivery-planning.md', 'assets/EXISTANT.md', 'assets/OPPORTUNITES.md', 'assets/CADRAGE.md', 'assets/REGLES.md'],
    'scoped-delivery': ['assets/PLAN.md', 'assets/TICKET.md', 'assets/REPRISE.md', 'assets/MISSION.md', 'assets/REVIEW.md', 'references/review-workflow.md'],
  };
  for (const [skill, files] of Object.entries(resources)) for (const file of files) {
    assert.ok(manifest.files[`${tools[tool]}/${skill}/${file}`], file);
  }
  // Every installed resource link must resolve, including links below SKILL.md.
  for (const file of Object.keys(manifest.files).filter(f => f.endsWith('.md'))) {
    for (const [, target] of fs.readFileSync(path.join(destination, file), 'utf8').matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^[a-z]+:|^#/.test(target)) continue;
      assert.ok(fs.existsSync(path.resolve(destination, path.dirname(file), target.split('#')[0])), `${file}: ${target}`);
    }
  }
  assert.deepEqual([legacy, ticket].map(f => fs.readFileSync(path.join(destination, f))), before);
  assert.deepEqual(fs.readdirSync(path.join(destination, 'docs/missions')).sort(), ['current', 'legacy.md']);
  // Divergence in a new resource must preserve every existing byte and add nothing.
  const customized = path.join(destination, tools[tool], 'scoped-delivery/assets/TICKET.md');
  fs.appendFileSync(customized, '\nLocal ticket policy.\n');
  const bytes = fs.readFileSync(customized);
  const missing = path.join(destination, tools[tool], 'project-foundation/assets/EXISTANT.md');
  fs.unlinkSync(missing);
  assert.throws(() => initialize({ destination, tool }), /Conflict/);
  assert.ok(!fs.existsSync(missing));
  assert.deepEqual(fs.readFileSync(customized), bytes);
  assert.deepEqual([legacy, ticket].map(f => fs.readFileSync(path.join(destination, f))), before);
});
