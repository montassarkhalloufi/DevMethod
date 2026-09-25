import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

function addPackage(modules, name, dependencies = {}, version = '1.0.0') {
  const root = path.join(modules, name);
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name, version, main: 'index.js', dependencies }),
  );
  fs.writeFileSync(path.join(root, 'index.js'), `module.exports = ${JSON.stringify(version)};`);
  return root;
}

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-resolution-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const modules = path.join(root, 'node_modules');
  const compiler = addPackage(modules, 'devmethod-fixture');
  fs.writeFileSync(path.join(compiler, 'package.json'), '{"type":"module"}');
  // Execute the actual source in an isolated package tree, without changing installed deps.
  for (const name of ['resolution', 'snapshot', 'types']) {
    const source = fs.readFileSync(
      new URL(`../src/studio-build/${name}.ts`, import.meta.url),
      'utf8',
    );
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    });
    fs.writeFileSync(path.join(compiler, `${name}.js`), outputText);
  }
  for (const name of [
    'react',
    'react-dom',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
    '@radix-ui/react-slot',
    '@types/react',
    '@types/react-dom',
    'typescript',
    'tailwindcss',
  ])
    addPackage(modules, name);
  const { createResolution } = await import(pathToFileURL(path.join(compiler, 'resolution.js')));
  return { modules, create: () => createResolution({ sourceRoot: root, files: [] }) };
}

test('trusted dependencies resolve from their owning package in a nested npm installation', async (t) => {
  const f = await fixture(t);
  const owner = addPackage(f.modules, 'react-dom', { scheduler: '^0.28.0' });
  const scheduler = addPackage(path.join(owner, 'node_modules'), 'scheduler', {}, '0.28.0');
  const context = f.create();
  const entry = context.external('scheduler', path.join(owner, 'index.js'));
  assert.equal(entry, path.join(scheduler, 'index.js'));
  assert.equal(context.read(entry), 'module.exports = "0.28.0";');
  const unrelated = addPackage(f.modules, 'unapproved');
  assert.throws(() => context.external('unapproved'), /non autorisée/);
  assert.equal(context.read(path.join(unrelated, 'index.js')), undefined);
});

test('separate installed versions retain their own transitive dependencies and roots', async (t) => {
  const f = await fixture(t);
  const first = addPackage(f.modules, 'react-dom', { shared: '1.0.0' });
  const second = addPackage(f.modules, 'clsx', { shared: '2.0.0' });
  const shared1 = addPackage(path.join(first, 'node_modules'), 'shared', { first: '1.0.0' });
  const shared2 = addPackage(
    path.join(second, 'node_modules'),
    'shared',
    { second: '1.0.0' },
    '2.0.0',
  );
  const leaf1 = addPackage(path.join(shared1, 'node_modules'), 'first');
  const leaf2 = addPackage(path.join(shared2, 'node_modules'), 'second');
  const context = f.create();
  for (const root of [shared1, shared2, leaf1, leaf2]) assert.ok(context.roots.includes(root));
  assert.equal(
    context.external('shared', path.join(first, 'index.js')),
    path.join(shared1, 'index.js'),
  );
  assert.equal(
    context.external('shared', path.join(second, 'index.js')),
    path.join(shared2, 'index.js'),
  );
});
