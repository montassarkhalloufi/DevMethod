import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const jsonFile = (root, file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

async function request(origin, route, input, expected = 200) {
  const response = await fetch(origin + route, {
    signal: AbortSignal.timeout(10000),
    ...(input === undefined
      ? {}
      : {
          method: 'POST',
          headers: { Origin: origin, 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }),
  });
  const result = await response.json();
  assert.equal(response.status, expected, `${route}: ${JSON.stringify(result)}`);
  return result;
}

async function asset(origin, route) {
  const response = await fetch(origin + route, { signal: AbortSignal.timeout(10000) });
  assert.equal(response.status, 200, route);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.ok(bytes.length > 0, route);
  return bytes;
}

async function withStudio(startStudio, workspace, inspect) {
  const studio = await startStudio({ workspace, port: 0, previewPort: 0 });
  try {
    const runtime = studio.runtime();
    assert.equal(runtime.agent.kind, 'host-bridge');
    assert.equal(runtime.agent.automatic, false);
    assert.equal(
      new Set([runtime.url, runtime.previewOrigin, runtime.editorPreviewOrigin]).size,
      3,
    );
    return await inspect(runtime);
  } finally {
    await studio.close();
  }
}

function checkHelp(pkg) {
  for (const args of [
    [path.join(pkg, 'scripts/studio.mjs'), '--help'],
    [path.join(pkg, 'dist/cli.js'), 'studio', '--help'],
  ]) {
    const result = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    for (const command of ['home', 'serve', 'import', 'example', 'status'])
      assert.ok(result.stdout.includes(command), `Missing Studio command: ${command}`);
  }
}

async function checkSourceAndAssets(pkg, workspace, runtime, state) {
  const revision = state.revisions.find((entry) => entry.id === state.activeRevision);
  assert.ok(revision);
  const entry = revision.files.find((file) => file.path.endsWith('.mjs'));
  assert.ok(entry, 'The recorded example must include a real ESM module.');
  const query = new URLSearchParams({ revision: revision.id, path: entry.path });
  const source = await request(runtime.url, '/api/source?' + query);
  assert.equal(source.binary, false);
  assert.equal(source.truncated, false);
  assert.equal(hash(source.content), entry.sha256);
  assert.equal(
    source.content,
    fs.readFileSync(path.join(workspace, 'revisions', revision.id, 'app', entry.path), 'utf8'),
  );
  for (const file of ['/', '/app.js', '/source-editor.js', '/editor.css']) {
    const bytes = await asset(runtime.url, file);
    const packedFile = file === '/' ? 'index.html' : file.slice(1);
    assert.equal(
      hash(bytes),
      hash(fs.readFileSync(path.join(pkg, 'scripts/studio/public', packedFile))),
    );
  }
  for (const reference of state.references) {
    const bytes = await asset(runtime.url, '/references/' + reference.id);
    assert.equal(hash(bytes), hash(fs.readFileSync(path.join(workspace, reference.file))));
  }
  const design = state.designs.find((item) => item.id === state.selectedDesignId);
  assert.ok(design && state.references.some((reference) => reference.id === design.file));
  await asset(runtime.previewOrigin, '/');
  return { revision, source };
}

async function checkEditing(runtime, revision, source, originalData) {
  const editor = (action, input, expected) =>
    request(runtime.url, '/api/editor' + action, input, expected);
  let draft = await editor('?' + new URLSearchParams({ baseRevision: revision.id }));
  const pair = () => ({ version: draft.version, baseRevision: draft.baseRevision });
  const content = source.content + '\nexport const __devmethodPackedSmoke = true;\n';
  draft = await editor('/save', {
    ...pair(),
    changes: [
      {
        path: source.path,
        content: source.content + '\nexport const __devmethodPackedSmoke = ;\n',
      },
    ],
  });
  const rejected = await editor('/build', pair());
  assert.ok(
    rejected.diagnostics.some((entry) => entry.severity === 'error' && entry.file === source.path),
  );
  assert.equal(rejected.buildId, null);
  await editor('/apply', { ...pair(), title: 'Invalid package smoke' }, 409);
  draft = await editor('/save', { ...pair(), changes: [{ path: source.path, content }] });
  draft = await editor('/build', pair());
  assert.ok(draft.buildId);
  assert.equal(draft.builtVersion, draft.version);
  assert.equal(
    draft.diagnostics.some((entry) => entry.severity === 'error'),
    false,
  );
  assert.equal(new URL(draft.previewUrl).origin, runtime.editorPreviewOrigin);
  const moduleBytes = await asset(runtime.editorPreviewOrigin, draft.previewPath + source.path);
  assert.equal(hash(moduleBytes), hash(content));
  assert.deepEqual(await request(runtime.editorPreviewOrigin, '/api/data'), originalData);
  const isolated = await request(runtime.editorPreviewOrigin, '/api/data', {
    version: originalData.version,
    data: { ...originalData.data, packedSmokeOnly: true },
  });
  assert.deepEqual(await request(runtime.previewOrigin, '/api/data'), originalData);
  const applied = await editor('/apply', { ...pair(), title: 'Packed ESM edit' });
  assert.equal(applied.activated, true);
  assert.equal(applied.adoptionError, null);
  assert.notEqual(applied.revision.id, revision.id);
  assert.equal(applied.state.activeRevision, applied.revision.id);
  const checks = applied.state.checks.filter((entry) => entry.revisionId === applied.revision.id);
  assert.equal(checks.length, 1);
  assert.match(checks[0].label, /syntaxe JavaScript et JSON/);
  assert.equal(checks[0].status, 'passed');
  assert.deepEqual(await request(runtime.previewOrigin, '/api/data'), originalData);
  draft = applied.draft;
  draft = await editor('/save', {
    ...pair(),
    changes: [{ path: source.path, content: content + '// Unadopted restart draft.\n' }],
  });
  return { state: applied.state, draft, isolated };
}

function durableDraft(draft) {
  const { version, baseRevision, files, changedPaths, buildId, builtVersion, diagnostics } = draft;
  return { version, baseRevision, files, changedPaths, buildId, builtVersion, diagnostics };
}

export async function checkPackedStudio(pkg, workspace) {
  const [{ startStudio }, { initializeExample }, { restoreArchive }] = await Promise.all([
    import(pathToFileURL(path.join(pkg, 'scripts/studio/server.mjs')).href),
    import(pathToFileURL(path.join(pkg, 'scripts/studio/example.mjs')).href),
    import(pathToFileURL(path.join(pkg, 'scripts/studio/archive.mjs')).href),
  ]);
  checkHelp(pkg);
  assert.ok(initializeExample(workspace) > 0);
  const initial = jsonFile(workspace, '.devmethod/studio.json');
  const budget = jsonFile(workspace, '.devmethod/agent.json');
  const receipt = await withStudio(startStudio, workspace, async (runtime) => {
    const state = await request(runtime.url, '/api/state');
    assert.deepEqual(state, initial);
    const originalData = await request(runtime.previewOrigin, '/api/data');
    const { revision, source } = await checkSourceAndAssets(pkg, workspace, runtime, state);
    const result = await checkEditing(runtime, revision, source, originalData);
    const archive = await asset(runtime.url, '/api/export');
    return { ...result, originalData, archive };
  });
  await withStudio(startStudio, workspace, async (runtime) => {
    assert.deepEqual(await request(runtime.url, '/api/state'), receipt.state);
    assert.deepEqual(
      durableDraft(await request(runtime.url, '/api/editor')),
      durableDraft(receipt.draft),
    );
    assert.deepEqual(await request(runtime.previewOrigin, '/api/data'), receipt.originalData);
    assert.deepEqual(await request(runtime.editorPreviewOrigin, '/api/data'), receipt.isolated);
    assert.deepEqual(jsonFile(workspace, '.devmethod/agent.json'), budget);
  });
  const restored = workspace + '-restored';
  assert.ok(restoreArchive(receipt.archive, restored) > 0);
  assert.equal(fs.existsSync(path.join(restored, '.devmethod/editor.json')), false);
  assert.equal(fs.existsSync(path.join(restored, '.devmethod/runtime.json')), false);
  assert.equal(jsonFile(restored, '.devmethod/agent.json').knownTokens, budget.knownTokens);
  await withStudio(startStudio, restored, async (runtime) => {
    assert.deepEqual(await request(runtime.url, '/api/state'), receipt.state);
    assert.deepEqual(await request(runtime.previewOrigin, '/api/data'), receipt.originalData);
    await request(runtime.url, '/api/editor', undefined, 404);
    await checkSourceAndAssets(pkg, restored, runtime, receipt.state);
  });
  console.log(
    'Packed Studio: example, exact assets/source, isolated ESM edit, syntax rejection, adoption, durable draft, restart and export/restore passed. No provider calls or human validation.',
  );
}
