import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { importProject } from '../scripts/studio/import.mjs';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { createEditor } from '../scripts/studio/editor.mjs';
import { createProjectIntelligence } from '../scripts/studio/intelligence.mjs';
import { createPreview } from '../scripts/studio/preview.mjs';
import { readSource } from '../scripts/studio/source.mjs';
import { exportProject } from '../scripts/studio/bundle.mjs';
import { restoreArchive } from '../scripts/studio/archive.mjs';
import { safeFile, digest } from '../scripts/studio/files.mjs';
import * as domain from '../scripts/studio/domain.mjs';

const route = 'app/(public)/items/[id]/page.tsx';
const sources = {
  'package.json': JSON.stringify({
    name: 'existing-project',
    dependencies: { next: '15.2.0', react: '19.0.0' },
    scripts: { test: 'node should-never-run.mjs' },
  }),
  'README.md': '# Projet existant\nDocumentation conservée.\n',
  'AGENTS.md': 'Respecter les conventions locales.\n',
  [route]: 'export default function Page() { return <h1>Existant</h1>; }\n',
  'tests/contract.test.ts': 'export const expected = 3;\n',
  'logo.bin': Buffer.from([137, 80, 0, 255]),
  '.env.local': 'FICTIONAL_DO_NOT_COPY=value',
  'node_modules/ignored/index.js': 'ignored',
  '.git/HEAD': 'ref: refs/heads/main\n',
};

function fixture(t, files = sources) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-import-'));
  const source = path.join(root, 'original'),
    workspace = path.join(root, 'workspace');
  fs.mkdirSync(source);
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(source, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, source, workspace };
}

async function imported(t, files) {
  const f = fixture(t, files);
  f.result = await importProject(f);
  f.store = createStudioStore(f.workspace);
  f.jobs = createJobs(f.store);
  t.after(() => f.store.close());
  return f;
}

test('dry-run inventories a real folder with sourced declarations, explicit exclusions and no writes', async (t) => {
  const f = fixture(t);
  const workspace = path.join(f.root, 'absent-parent', 'workspace');
  const result = await importProject({ ...f, workspace, dryRun: true });
  assert.equal(result.profile, 'source-only');
  assert.equal(fs.existsSync(path.dirname(workspace)), false);
  assert.equal(result.import.inventory.included, 6);
  assert.deepEqual(result.import.inventory.excluded.map((entry) => entry.path).sort(), [
    '.env.local',
    '.git/',
    'node_modules/',
  ]);
  for (const [name, content] of Object.entries(sources))
    assert.deepEqual(fs.readFileSync(path.join(f.source, name)), Buffer.from(content));
  const facts = result.import.context.facts;
  assert.ok(facts.some((fact) => fact.kind === 'command' && fact.value === 'npm run test'));
  assert.ok(facts.some((fact) => fact.kind === 'stack' && fact.value === 'next@15.2.0'));
  assert.ok(
    facts.some((fact) => fact.kind === 'instruction' && fact.provenance.path === 'AGENTS.md'),
  );
  assert.ok(facts.some((fact) => fact.kind === 'test'));
  for (const fact of facts)
    assert.equal(
      fact.provenance.sha256,
      result.files.find((file) => file.path === fact.provenance.path).sha256,
    );
  assert.ok(result.import.context.unknowns.some((value) => /non exécutées/.test(value)));
  assert.equal(JSON.stringify(result).includes(f.source), false);
  assert.equal(JSON.stringify(result).includes('FICTIONAL_DO_NOT_COPY=value'), false);
});

test('import creates a real baseline without a generated job, checks, approvals or modified source bytes', async (t) => {
  const f = await imported(t);
  const state = f.store.read(),
    baseline = state.revisions[0];
  assert.equal(state.activeRevision, baseline.id);
  assert.deepEqual(baseline.origin, { kind: 'import' });
  assert.equal(baseline.jobId, undefined);
  assert.equal(baseline.profile, 'source-only');
  assert.deepEqual([state.jobs, state.checks, state.decisions], [[], [], []]);
  assert.equal(state.project.mode, 'guided');
  assert.equal(state.project.idea, '');
  for (const file of baseline.files) {
    const original = fs.readFileSync(path.join(f.source, file.path));
    assert.deepEqual(
      fs.readFileSync(safeFile(f.workspace, `revisions/${baseline.id}/app/${file.path}`)),
      original,
    );
    assert.equal(file.sha256, digest(original));
  }
  const source = readSource(f.workspace, state, baseline.id, route);
  assert.equal(source.content, sources[route]);
  const model = createProjectIntelligence({ store: f.store }).read();
  assert.ok(model.analysis.files.some((file) => file.path === route));
  assert.equal(
    model.analysis.elements.some((element) => element.runtime === 'observed'),
    false,
  );
  assert.throws(
    () =>
      f.store.commit(state.version, (next) => {
        next.import.source.name = 'rewritten';
      }),
    /réécrit/,
  );
});

test('source-only editing creates a candidate snapshot, preserves baseline until approval and records no fake check', async (t) => {
  const f = await imported(t);
  const baseline = f.store.read().activeRevision;
  const editor = createEditor({
    store: f.store,
    jobs: f.jobs,
    getPreviewOrigin: () => 'http://127.0.0.1:1',
  });
  const draft = editor.read(baseline);
  assert.equal(draft.sourceOnly, true);
  const changed = editor.save({
    ...draft,
    changes: [
      { path: route, content: 'export default function Page() { return <h1>Modifié</h1>; }' },
    ],
  });
  const built = await editor.build(changed);
  assert.ok(built.buildId);
  assert.equal(built.verificationProtocol, 'source-snapshot-v1');
  assert.equal(built.previewUrl, null);
  assert.match(built.diagnostics[0].message, /aucun test, compilation/);
  const result = await editor.apply({ ...built, title: 'Première évolution' });
  assert.equal(result.activated, false);
  assert.match(result.adoptionError, /Approuvez le cadrage/);
  assert.equal(f.store.read().activeRevision, baseline);
  assert.equal(result.revision.profile, 'source-only');
  assert.deepEqual(f.store.read().checks, []);
  assert.match(
    readSource(f.workspace, f.store.read(), result.revision.id, route).content,
    /Modifié/,
  );
  assert.equal(fs.readFileSync(path.join(f.source, route), 'utf8'), sources[route]);
  f.store.commit(f.store.read().version, (state) => {
    state.project.idea = 'Faire évoluer le projet existant.';
    state.brief = {
      outcome: 'Changer le titre.',
      scope: ['Titre'],
      excluded: [],
      criteria: [{ id: 'title', text: 'Le titre vaut Modifié.' }],
    };
    domain.approvePlan(state, { reason: 'Périmètre examiné.' });
    domain.activateRevision(state, {
      id: result.revision.id,
      reason: 'Snapshot examiné, comportement restant à vérifier.',
    });
  });
  assert.equal(f.store.read().activeRevision, result.revision.id);
  assert.deepEqual(f.store.read().checks, []);
});

test('host evolution of an imported source-only project keeps stack and never auto-adopts the candidate', async (t) => {
  const f = await imported(t);
  const baseline = f.store.read().activeRevision;
  f.store.commit(f.store.read().version, (state) => {
    domain.updateProject(state, { ...state.project, mode: 'delegated' });
    domain.queueRequest(state, { request: 'Modifier le titre uniquement.' });
  });
  const claim = f.jobs.claim('host');
  assert.equal(claim.context.import.baselineRevision, baseline);
  assert.match(claim.context.applicationProfile, /Do not convert/);
  assert.doesNotMatch(claim.context.instructions, /Set package.json/);
  fs.writeFileSync(
    path.join(claim.workDirectory, route),
    sources[route].replace('Existant', 'Évolution'),
  );
  const result = await f.jobs.finish({ jobId: claim.job.id, title: 'Évolution proposée' });
  assert.equal(result.revision.profile, 'source-only');
  assert.equal(result.state.activeRevision, baseline);
  assert.deepEqual(result.state.checks, []);
  assert.equal(
    readSource(f.workspace, result.state, result.revision.id, 'package.json').content,
    sources['package.json'],
  );
});

test('source-only preview is honestly unavailable and export/restoration retains provenance and editable source', async (t) => {
  const f = await imported(t);
  const server = createPreview({ workspace: f.workspace, getState: f.store.read });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  const response = await fetch('http://127.0.0.1:' + server.address().port + '/');
  assert.equal(response.status, 501);
  assert.match(await response.text(), /Aucun aperçu/);
  const exported = path.join(f.root, 'restored');
  restoreArchive(exportProject(f.workspace, f.store.read()), exported);
  const restored = createStudioStore(exported);
  t.after(() => restored.close());
  assert.deepEqual(restored.read().import, f.store.read().import);
  assert.equal(
    readSource(exported, restored.read(), restored.read().activeRevision, route).content,
    sources[route],
  );
  assert.ok(fs.existsSync(path.join(exported, 'runtime/import-paths.mjs')));
  const readme = fs.readFileSync(path.join(exported, 'README.md'), 'utf8');
  assert.match(readme, /Les sources sont exportées/);
  assert.match(readme, /Les scripts du projet n’ont pas été exécutés/);
  assert.doesNotMatch(readme, /Lancez `node launch/);
});

test('plain static import is previewable without fabricating successful checks', async (t) => {
  const f = await imported(t, {
    'index.html': '<h1>Déjà existant</h1>',
    'styles.css': 'h1 { color: navy; }',
    'images/logo [1].svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  });
  assert.equal(f.result.profile, 'static');
  assert.deepEqual(f.store.read().checks, []);
  const server = createPreview({ workspace: f.workspace, getState: f.store.read });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  const response = await fetch('http://127.0.0.1:' + server.address().port + '/');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '<h1>Déjà existant</h1>');
  const asset = await fetch(
    'http://127.0.0.1:' + server.address().port + '/images/logo%20%5B1%5D.svg',
  );
  assert.equal(asset.status, 200);
  assert.match(await asset.text(), /<svg/);
});

test('malformed or scalar manifests preserve source inventory with explicit unknowns', async (t) => {
  const f = fixture(t, { 'package.json': 'null', 'main.py': 'print("example")\n' });
  for (const manifest of ['null', '42', '[]', '{broken']) {
    fs.writeFileSync(path.join(f.source, 'package.json'), manifest);
    const result = await importProject({ ...f, dryRun: true });
    assert.equal(result.files.length, 2);
    assert.ok(result.import.context.unknowns.some((value) => value.includes('package.json')));
  }
  assert.equal(fs.existsSync(f.workspace), false);
});

test('import refuses overlapping roots, occupied destination, symlinks and secret markers without partial installation', async (t) => {
  const f = fixture(t, { 'main.py': 'print("safe")' });
  await assert.rejects(importProject({ source: f.source, workspace: f.source }), /distincts/);
  await assert.rejects(
    importProject({ source: f.source, workspace: path.join(f.source, 'nested') }),
    /imbriqués/,
  );
  fs.mkdirSync(f.workspace);
  fs.writeFileSync(path.join(f.workspace, 'existing'), 'preserved');
  await assert.rejects(importProject(f), /vide/);
  assert.equal(fs.readFileSync(path.join(f.workspace, 'existing'), 'utf8'), 'preserved');
  fs.rmSync(f.workspace, { recursive: true });
  fs.symlinkSync(path.join(f.source, 'main.py'), path.join(f.source, 'link.py'));
  await assert.rejects(importProject(f), /symbolique/);
  fs.unlinkSync(path.join(f.source, 'link.py'));
  fs.writeFileSync(path.join(f.source, 'key.txt'), '-----BEGIN PRIVATE KEY-----\nfictional\n');
  await assert.rejects(importProject(f), /Marqueur de secret/);
  assert.equal(fs.existsSync(f.workspace), false);
});

test('overflow fails the whole import rather than silently truncating its source files', async (t) => {
  const f = fixture(t, {});
  for (let i = 0; i < 257; i++) fs.writeFileSync(path.join(f.source, `file-${i}.txt`), String(i));
  await assert.rejects(importProject(f), /256 fichiers/);
  assert.equal(fs.existsSync(f.workspace), false);
  assert.equal(fs.readdirSync(f.source).length, 257);
});

test('failed publication cleans staging and preserves the initially empty destination', async (t) => {
  const f = fixture(t, { 'main.py': 'print("safe")' });
  fs.mkdirSync(f.workspace);
  const original = fs.renameSync;
  fs.renameSync = (from, to) => {
    if (to === f.workspace) throw new Error('rename denied');
    return original(from, to);
  };
  try {
    await assert.rejects(importProject(f), /rename denied/);
  } finally {
    fs.renameSync = original;
  }
  assert.deepEqual(fs.readdirSync(f.workspace), []);
  assert.deepEqual(fs.readdirSync(f.root).sort(), ['original', 'workspace']);
});

test('oversized files and unexportable paths are refused before installing a workspace', async (t) => {
  const f = fixture(t, { 'large.bin': '' });
  fs.truncateSync(path.join(f.source, 'large.bin'), 32 * 1024 * 1024 + 1);
  await assert.rejects(importProject(f), /32 Mio/);
  fs.rmSync(path.join(f.source, 'large.bin'));
  fs.writeFileSync(path.join(f.source, 'x'.repeat(110) + '.txt'), 'content');
  await assert.rejects(importProject(f), /Chemin trop long/);
  assert.equal(fs.existsSync(f.workspace), false);
});

test('a source change during copying refuses installation instead of publishing a mixed baseline', async (t) => {
  const f = fixture(t, { 'main.py': 'original' });
  const original = fs.writeFileSync;
  fs.writeFileSync = (file, ...args) => {
    const result = original(file, ...args);
    if (
      typeof file === 'string' &&
      file.includes('.devmethod-import-') &&
      file.endsWith(path.join('app', 'main.py'))
    )
      original(path.join(f.source, 'main.py'), 'concurrent change');
    return result;
  };
  try {
    await assert.rejects(importProject(f), /sources ont changé/);
  } finally {
    fs.writeFileSync = original;
  }
  assert.equal(fs.existsSync(f.workspace), false);
  assert.deepEqual(fs.readdirSync(f.root), ['original']);
});
