import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startStudio } from '../scripts/studio/server.mjs';
import { createEditor } from '../scripts/studio/editor.mjs';
import * as domain from '../scripts/studio/domain.mjs';
import { exportProject } from '../scripts/studio/bundle.mjs';
import { sourceProfile } from '../scripts/studio/profile.mjs';
import { restoreArchive } from '../scripts/studio/archive.mjs';

const main =
  'import {createRoot} from "react-dom/client"; import "./styles.css"; const label:string="Projet typé"; const root=document.getElementById("root"); if(root)createRoot(root).render(<h1 className="text-2xl">{label}</h1>);';

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-ts-flow-'));
  let studio = await startStudio({ workspace: root, port: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  studio.store.commit(1, (s) =>
    domain.updateProject(s, {
      name: 'Typé',
      idea: 'Sources réelles',
      mode: 'delegated',
      constraints: [],
    }),
  );
  studio.store.commit(studio.store.read().version, (s) =>
    domain.queueRequest(s, { request: 'Construire' }),
  );
  const claim = studio.jobs.claim('test-host');
  fs.mkdirSync(path.join(claim.workDirectory, 'src'));
  for (const [file, value] of Object.entries({
    'package.json': JSON.stringify({ devmethod: { profile: 'react-ts' } }),
    'index.html':
      '<!doctype html><div id="root"></div><script type="module" src="/src/main.tsx"></script>',
    'src/main.tsx': main,
    'src/styles.css': '@import "tailwindcss";',
  }))
    fs.writeFileSync(path.join(claim.workDirectory, file), value);
  const created = await studio.jobs.finish({ jobId: claim.job.id, title: 'React strict' });
  return {
    root,
    studio,
    created,
    async restart() {
      await studio.close();
      studio = await startStudio({ workspace: root, port: 0 });
      return studio;
    },
  };
}

test('React job, edited type error, recovery, adoption, export and real server restart preserve source and data', async (t) => {
  const f = await fixture(t),
    id = f.created.revision.id;
  assert.equal(f.created.revision.compilation.profile, 'react-ts');
  const runtime = f.studio.runtime();
  const html = await (await fetch(runtime.previewOrigin + '/')).text();
  assert.match(html, /assets\/app\.js/);
  assert.doesNotMatch(html, /src\/main\.tsx/);
  assert.equal((await fetch(runtime.previewOrigin + '/src/main.tsx')).status, 404);
  fs.writeFileSync(
    path.join(f.root, '.devmethod/data.json'),
    JSON.stringify({ version: 7, data: { entries: ['conservé'] } }),
  );
  const originalData = fs.readFileSync(path.join(f.root, '.devmethod/data.json'));
  const editor = createEditor({ store: f.studio.store, jobs: f.studio.jobs });
  const initial = editor.read(id);
  const good = await editor.build(initial);
  assert.ok(good.buildId);
  const bad = editor.save({
    ...good,
    changes: [{ path: 'src/main.tsx', content: main.replace('label:string', 'label:number') }],
  });
  const rejected = await editor.build(bad);
  assert.equal(rejected.buildId, good.buildId);
  assert.ok(
    rejected.diagnostics.some(
      (d) => d.severity === 'error' && d.file === 'src/main.tsx' && d.line === 1,
    ),
  );
  assert.throws(() => editor.apply({ ...rejected, title: 'incorrect' }));
  const corrected = editor.save({
    ...rejected,
    changes: [{ path: 'src/main.tsx', content: main.replace('Projet typé', 'Source corrigée') }],
  });
  const verified = await editor.build(corrected);
  const adopted = await editor.apply({ ...verified, title: 'Correction typée' });
  assert.equal(adopted.activated, true);
  assert.equal(adopted.revision.compilation.profile, 'react-ts');
  assert.deepEqual(fs.readFileSync(path.join(f.root, '.devmethod/data.json')), originalData);
  const restarted = await f.restart();
  assert.equal(restarted.store.read().activeRevision, adopted.revision.id);
  const source = await (
    await fetch(
      restarted.runtime().url + `/api/source?revision=${adopted.revision.id}&path=src/main.tsx`,
    )
  ).json();
  assert.match(source.content, /Source corrigée/);
  const out = path.join(f.root, 'exported');
  restoreArchive(exportProject(f.root, restarted.store.read()), out);
  const exported = await startStudio({ workspace: out, port: 0 });
  try {
    assert.match(
      await (await fetch(exported.runtime().previewOrigin + '/')).text(),
      /assets\/app\.js/,
    );
    assert.deepEqual(await (await fetch(exported.runtime().previewOrigin + '/api/data')).json(), {
      version: 7,
      data: { entries: ['conservé'] },
    });
  } finally {
    await exported.close();
  }
});

// An unrecognized TypeScript extension must never fall back to unchecked static HTML.
test('unsupported typed extensions fail explicitly instead of passing the static checker', () => {
  for (const file of ['app.mts', 'app.cts', 'app.MTS', 'app.TS', 'App.TSx', 'App.tS', 'App.JSX'])
    assert.throws(() => sourceProfile('/unused', [{ path: file }]), /Extension non compilée/);
});

test('a cancelled asynchronous React build cannot adopt a late result', async (t) => {
  const f = await fixture(t);
  f.studio.store.commit(f.studio.store.read().version, (s) =>
    domain.queueRequest(s, { request: 'Change label' }),
  );
  const claim = f.studio.jobs.claim('slow-build');
  fs.writeFileSync(
    path.join(claim.workDirectory, 'src/main.tsx'),
    main.replace('Projet typé', 'Late result'),
  );
  const pending = f.studio.jobs.finish({ jobId: claim.job.id, title: 'Late' });
  f.studio.store.commit(f.studio.store.read().version, (s) =>
    domain.cancelJob(s, { jobId: claim.job.id }),
  );
  await assert.rejects(pending, /terminée|interrompue|obsolète/);
  assert.equal(f.studio.store.read().activeRevision, f.created.revision.id);
  assert.ok(fs.existsSync(path.join(claim.workDirectory, 'src/main.tsx')));
});

test('tampering compiled artifacts fails preview and export without changing source or data', async (t) => {
  const f = await fixture(t);
  const revision = f.created.revision;
  const target = path.join(f.root, 'revisions', revision.id, 'compiled', 'index.html');
  fs.appendFileSync(target, '<p>changed outside revision</p>');
  assert.equal((await fetch(f.studio.runtime().previewOrigin + '/')).status, 400);
  assert.throws(() => exportProject(f.root, f.studio.store.read()), /modifiée hors/);
  assert.equal(
    fs.readFileSync(path.join(f.root, 'revisions', revision.id, 'app', 'src/main.tsx'), 'utf8'),
    main,
  );
});
