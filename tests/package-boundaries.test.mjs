import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

test('the method archive has no Studio payload or production dependencies', () => {
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
  assert.deepEqual(metadata.dependencies ?? {}, {}, 'Method installation must be dependency-free.');
  assert.deepEqual(metadata.optionalDependencies ?? {}, {});
  assert.deepEqual(metadata.peerDependencies ?? {}, {});
  const npm = process.env.npm_execpath;
  assert.ok(npm, 'Run through npm test or npm run test:packages.');
  const result = spawnSync(
    process.execPath,
    [npm, 'pack', '--dry-run', '--ignore-scripts', '--json', '--offline'],
    { cwd: root, encoding: 'utf8', timeout: 60000 },
  );
  assert.equal(result.status, 0, result.stderr);
  const [archive] = JSON.parse(result.stdout);
  const files = archive.files.map((file) => file.path);
  assert.ok(files.includes('dist/cli.js'));
  assert.ok(files.includes('.agents/skills/project-foundation/SKILL.md'));
  assert.ok(files.includes('examples/review/review.json'));
  for (const file of files) {
    assert.doesNotMatch(file, /(^|\/)(studio[^/]*|control-plane|node_modules|packages)(\/|$)/);
    assert.doesNotMatch(file, /^(docs|tests|templates)\//);
  }
});

test('the Studio archive includes its independent executable, engines and runtime resources', () => {
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'packages/studio/package.json')));
  assert.equal(metadata.dependencies['devmethod-ai'], undefined);
  assert.ok(metadata.dependencies.react);
  assert.ok(metadata.dependencies.typescript);
  const result = spawnSync(
    process.execPath,
    [process.env.npm_execpath, 'pack', './packages/studio', '--dry-run', '--json', '--offline'],
    { cwd: root, encoding: 'utf8', timeout: 60000 },
  );
  assert.equal(result.status, 0, result.stderr);
  const [archive] = JSON.parse(result.stdout);
  const files = new Set(archive.files.map((file) => file.path));
  for (const file of [
    'LICENSE',
    metadata.bin['devmethod-studio'],
    'build/scripts/studio/server.mjs',
    'build/dist/control-plane/engine.js',
    'build/dist/control-plane/hybrid-validation.js',
    'build/dist/studio-build/worker.js',
    'build/dist/studio-ui/code-widget.js',
    'build/.agents/skills/project-foundation/SKILL.md',
    'build/templates/studio-react/package.json',
    'build/examples/studio-ateliers/state/studio.json',
  ])
    assert.ok(files.has(file), `Missing standalone Studio resource: ${file}`);
});

test('packing Studio rejects a modified generated payload until it is rebuilt', () => {
  const generated = path.join(root, 'packages/studio/build/scripts/studio.mjs');
  const original = fs.readFileSync(generated);
  try {
    fs.appendFileSync(generated, '\n// stale package fixture\n');
    const result = spawnSync(process.execPath, ['scripts/build-studio-package.mjs', '--check'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Studio package is stale: scripts\/studio.mjs/);
  } finally {
    fs.writeFileSync(generated, original);
  }
});
