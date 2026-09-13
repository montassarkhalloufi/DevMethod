import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initialize, tools } from '../dist/init.js';
import { diagnose, validateManifest } from '../dist/doctor.js';
import { previewUpdate } from '../dist/update.js';

const stages = ['explore', 'frame', 'design', 'architecture', 'plan', 'ready', 'implement', 'review', 'verify', 'integrate', 'correct-course', 'next', 'status', 'handoff'];
function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-commands-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
for (const tool of Object.keys(tools)) test(`native commands: ${tool} installs all documented entry points and their references`, t => {
  const destination = fixture(t);
  initialize({ destination, tool });
  const manifest = JSON.parse(fs.readFileSync(path.join(destination, 'kit-manifest.json')));
  const documented = [...fs.readFileSync(path.join(destination, tools[tool], 'project-foundation/references/operating-commands.md'), 'utf8').matchAll(/^\| `devmethod-([a-z-]+)/gm)].map(m => m[1]);
  assert.deepEqual(documented, stages);
  for (const stage of stages) {
    const file = `${tools[tool]}/devmethod-${stage}/SKILL.md`;
    assert.ok(manifest.files[file], file);
    const content = fs.readFileSync(path.join(destination, file), 'utf8');
    assert.match(content, new RegExp(`^name: devmethod-${stage}$`, 'm'));
    for (const [, target] of content.matchAll(/\]\(([^)]+)\)/g)) {
      assert.ok(fs.statSync(path.resolve(destination, path.dirname(file), target)).isFile(), target);
    }
  }
  assert.equal(diagnose(destination).status, 'ok');
  const command = path.join(destination, tools[tool], 'devmethod-review/SKILL.md');
  fs.appendFileSync(command, '\nLocal review policy.\n');
  const before = fs.readFileSync(command);
  const missing = path.join(destination, tools[tool], 'devmethod-verify/SKILL.md');
  fs.unlinkSync(missing);
  assert.throws(() => initialize({ destination, tool }), /Conflict/);
  assert.deepEqual(fs.readFileSync(command), before);
  assert.ok(!fs.existsSync(missing), 'no partial installation on command conflict');
});

test('legacy manifests without commands remain valid and preview additions without writes', t => {
  const destination = fixture(t);
  initialize({ destination, tool: 'codex' });
  const file = path.join(destination, 'kit-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file));
  for (const stage of stages) {
    const name = `.agents/skills/devmethod-${stage}/SKILL.md`;
    delete manifest.files[name];
    fs.rmSync(path.dirname(path.join(destination, name)), { recursive: true });
  }
  delete manifest.provenance;
  fs.writeFileSync(file, JSON.stringify(manifest));
  const before = fs.readFileSync(file);
  assert.equal(diagnose(destination).status, 'ok');
  const preview = previewUpdate(destination);
  assert.equal(preview.entries.filter(e => e.classification === 'added').length, 14);
  assert.deepEqual(fs.readFileSync(file), before);
  assert.ok(!fs.existsSync(path.join(destination, '.agents/skills/devmethod-review')));
});

test('subsets expose only supported procedures and reject arbitrary manifest command paths', t => {
  const destination = fixture(t);
  initialize({ destination, tool: 'codex', selected: [] });
  assert.deepEqual(fs.readdirSync(path.join(destination, '.agents/skills')).sort(), ['devmethod-correct-course', 'devmethod-explore', 'devmethod-frame', 'devmethod-status', 'project-foundation']);
  const manifest = JSON.parse(fs.readFileSync(path.join(destination, 'kit-manifest.json')));
  for (const name of ['devmethod-review', 'devmethod-unknown']) {
    const altered = structuredClone(manifest);
    altered.files[`.agents/skills/${name}/SKILL.md`] = 'a'.repeat(64);
    assert.throws(() => validateManifest(altered), /unsupported path/);
  }
});

test('a command in another host blocks installation before writes', t => {
  const destination = fixture(t);
  fs.mkdirSync(path.join(destination, '.claude/skills/devmethod-review'), { recursive: true });
  assert.throws(() => initialize({ destination, tool: 'codex' }), /Duplicate/);
  assert.ok(!fs.existsSync(path.join(destination, 'PROJECT_PROFILE.md')));
});
