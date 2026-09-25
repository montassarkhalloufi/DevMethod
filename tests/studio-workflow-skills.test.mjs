import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { initialize, tools } from '../dist/init.js';
import { localMarkdownFileExists } from '../scripts/markdown-links.mjs';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const skillPath = 'react-feature-engineering';
const vendorPath = 'references/vercel';

function temporary(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio skills '));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function verifyVendor(root) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'MANIFEST.json')));
  assert.equal(manifest.schema, 1);
  assert.equal(manifest.sources['agent-skills'].commit, '063bee94c3f4df8453406c830b0a7df0f2860278');
  assert.equal(
    manifest.sources['web-interface-guidelines'].commit,
    'e3d624baaf29dc1fc645aff3e38f03e564d2d6b1',
  );
  for (const [relative, receipt] of Object.entries(manifest.files)) {
    assert.ok(manifest.sources[receipt.source], relative);
    const bytes = fs.readFileSync(path.join(root, relative));
    assert.equal(bytes.length, receipt.bytes, relative);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), receipt.sha256, relative);
  }
  for (const filename of ['LICENSE-agent-skills.txt', 'web-design-guidelines/LICENSE.txt']) {
    const notice = fs.readFileSync(path.join(root, filename), 'utf8');
    assert.ok(notice.includes('Permission is hereby granted'));
    assert.ok(notice.includes('THE SOFTWARE IS PROVIDED "AS IS"'));
  }
  return manifest;
}

test('versioned third-party sources survive every supported installation byte for byte', (t) => {
  const canonical = verifyVendor(path.join(packageRoot, '.agents/skills', skillPath, vendorPath));
  const directory = temporary(t);
  for (const tool of Object.keys(tools)) {
    const destination = path.join(directory, tool);
    initialize({ destination, tool, selected: [skillPath] });
    const installed = verifyVendor(path.join(destination, tools[tool], skillPath, vendorPath));
    assert.deepEqual(installed, canonical);
  }
});

test('relocated Studio workflow exposes actual shipped skill and readable pinned references', async (t) => {
  const root = temporary(t);
  const scripts = path.join(root, 'scripts/studio');
  fs.mkdirSync(scripts, { recursive: true });
  fs.copyFileSync(
    path.join(packageRoot, 'scripts/studio/workflow.mjs'),
    path.join(scripts, 'workflow.mjs'),
  );
  fs.cpSync(path.join(packageRoot, '.agents/skills'), path.join(root, '.agents/skills'), {
    recursive: true,
  });
  const { workflowContext } = await import(pathToFileURL(path.join(scripts, 'workflow.mjs')).href);
  const skillRoot = path.join(root, '.agents/skills', skillPath);
  const entry = fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8');
  for (const planning of [true, false]) {
    const prompt = workflowContext(planning);
    assert.ok(prompt.includes(entry), 'Context must include the actual shipped policy');
    assert.ok(prompt.includes(path.join(skillRoot, 'SKILL.md')));
    assert.ok(prompt.includes(path.join(skillRoot, 'references')));
    for (const reference of [
      'react-best-practices/AGENTS.md',
      'composition-patterns/AGENTS.md',
      'web-design-guidelines/command.md',
    ]) {
      assert.ok(fs.statSync(path.join(skillRoot, vendorPath, reference)).isFile());
    }
  }
});

test('upstream link fallback resolves only the documented guide and existing rules', (t) => {
  const root = path.join(temporary(t), skillPath, vendorPath, 'react-best-practices');
  fs.mkdirSync(path.join(root, 'rules'), { recursive: true });
  fs.writeFileSync(path.join(root, 'rules/async-defer-await.md'), 'Upstream rule');
  assert.equal(
    localMarkdownFileExists(path.join(root, 'AGENTS.md'), './async-defer-await.md'),
    true,
  );
  assert.equal(
    localMarkdownFileExists(
      path.join(root, 'AGENTS.md'),
      './async-cheap-condition-before-await.md',
    ),
    false,
  );
  assert.equal(
    localMarkdownFileExists(path.join(root, 'OTHER.md'), './async-defer-await.md'),
    false,
  );
  fs.writeFileSync(path.join(root, 'rules/new-rule.md'), 'Unrecognized rule');
  assert.equal(localMarkdownFileExists(path.join(root, 'AGENTS.md'), './new-rule.md'), false);
});
