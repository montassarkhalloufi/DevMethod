import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export async function checkPackedReact(workspace, archive) {
  const consumer = workspace + '-consumer';
  fs.mkdirSync(consumer);
  const candidates = [
    process.env.npm_execpath,
    path.resolve(path.dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js'),
    path.resolve(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'),
  ];
  const npm = candidates.find((file) => file && fs.existsSync(file));
  assert.ok(npm, 'Run this check with npm run test:package so the npm executable is known.');
  const installed = spawnSync(
    process.execPath,
    [
      npm,
      'install',
      '--ignore-scripts',
      '--prefer-offline',
      '--no-audit',
      '--no-fund',
      path.resolve(archive),
    ],
    { cwd: consumer, encoding: 'utf8', timeout: 120000 },
  );
  assert.equal(installed.status, 0, installed.stderr || installed.error?.message);
  const pkg = path.join(consumer, 'node_modules/devmethod-ai');
  const { initializeReactExample } = await import(
    pathToFileURL(path.join(pkg, 'scripts/studio/react-example.mjs')).href
  );
  const { startStudio } = await import(
    pathToFileURL(path.join(pkg, 'scripts/studio/server.mjs')).href
  );
  assert.ok((await initializeReactExample(workspace, { delegateTechnical: true })) > 0);
  const studio = await startStudio({ workspace, port: 0 });
  try {
    const revision = studio.store
      .read()
      .revisions.find((r) => r.id === studio.store.read().activeRevision);
    assert.equal(revision.compilation.profile, 'react-ts');
    assert.match(
      studio.store
        .read()
        .decisions.find(
          (decision) => decision.topic === 'architecture' && decision.status === 'active',
        ).choice,
      /React 19/,
    );
    assert.ok(revision.files.some((f) => f.path.endsWith('useWorkshopData.ts')));
    const { url, previewOrigin } = studio.runtime();
    for (const file of ['/studio-ui/code-widget.js', '/studio-ui/code-widget.css'])
      assert.equal((await fetch(url + file)).status, 200, file);
    assert.match(await (await fetch(previewOrigin + '/')).text(), /assets\/app\.js/);
    const data = await (await fetch(previewOrigin + '/api/data')).json();
    assert.equal(data.data.registrations.length, 3);
    assert.equal(data.data.waitlist[0].name, 'Sami');
  } finally {
    await studio.close();
  }
  console.log(
    'Packed React: installed actual archive and runtime dependencies, real strict build, local Monaco assets and preserved data passed. No provider call.',
  );
  return pkg;
}
