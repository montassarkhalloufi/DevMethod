import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildReactApp } from '../scripts/studio/react-build.mjs';
import { packageRoot } from '../dist/studio-build/resolution.js';
import { createInitialStudioState } from '../scripts/studio/store.mjs';
import { updateProject, queueRequest, claimJob, finishJob } from '../scripts/studio/domain.mjs';
import { exportProject } from '../scripts/studio/bundle.mjs';
import { restoreArchive } from '../scripts/studio/archive.mjs';

function fixture(t, main) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-notices-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const workspace = path.join(root, 'project');
  const sourceRoot = path.join(workspace, 'revisions', 'typed', 'app');
  const outputRoot = path.join(workspace, 'revisions', 'typed', 'compiled');
  const projectNotice = 'Project component attribution retained with the compiled application.';
  const files = {
    'index.html':
      '<!doctype html><div id="root"></div><script type="module" src="/src/main.tsx"></script>',
    'package.json': '{"devmethod":{"profile":"react-ts"}}',
    'src/main.tsx': main,
    'src/styles.css': '@import "tailwindcss";',
    'THIRD_PARTY_NOTICES.md': projectNotice,
  };
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(sourceRoot, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return { root, workspace, sourceRoot, outputRoot, projectNotice };
}

function localLicense(name, filename = 'LICENSE') {
  return fs
    .readFileSync(path.join(packageRoot(name), filename), 'utf8')
    .replaceAll('\r\n', '\n')
    .trim();
}

test('compiled application carries complete local licenses for bundled packages through project export', async (t) => {
  const f = fixture(
    t,
    `import {createRoot} from 'react-dom/client'; import {Slot} from '@radix-ui/react-slot'; import {cva} from 'class-variance-authority'; import {clsx} from 'clsx'; import {twMerge} from 'tailwind-merge'; import './styles.css'; const style=cva('p-4'); const root=document.getElementById('root'); if(root)createRoot(root).render(<Slot className={twMerge(clsx(style()))}><button>Local</button></Slot>);`,
  );
  const result = await buildReactApp(f);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.ok(result.files.some((file) => file.path === 'THIRD_PARTY_NOTICES.txt'));
  const bytes = fs.readFileSync(path.join(f.outputRoot, 'THIRD_PARTY_NOTICES.txt'));
  const notices = bytes.toString();
  for (const [name, filename] of [
    ['react'],
    ['react-dom'],
    ['scheduler'],
    ['@radix-ui/react-slot'],
    ['@radix-ui/react-compose-refs'],
    ['class-variance-authority'],
    ['clsx', 'license'],
    ['tailwind-merge', 'LICENSE.md'],
    ['tailwindcss'],
  ]) {
    assert.ok(notices.includes(`${name} `), `package attribution: ${name}`);
    assert.ok(notices.includes(localLicense(name, filename)), `complete license: ${name}`);
  }
  assert.ok(notices.includes(f.projectNotice));
  assert.ok(!notices.includes(packageRoot('react')), 'machine-specific package paths are absent');
  const state = createInitialStudioState();
  updateProject(state, {
    name: 'Notices',
    idea: 'Export runnable code',
    mode: 'delegated',
    constraints: [],
  });
  const job = queueRequest(state, { request: 'Compile this recorded source' });
  claimJob(state, { worker: 'test' });
  finishJob(state, {
    jobId: job.id,
    revision: {
      id: 'typed',
      jobId: job.id,
      title: 'Typed application',
      summary: 'Recorded fixture',
      createdAt: new Date().toISOString(),
      files: result.sourceManifest,
      compilation: { profile: 'react-ts', protocol: result.protocol, files: result.files },
    },
  });
  fs.mkdirSync(path.join(f.workspace, '.devmethod'));
  fs.writeFileSync(path.join(f.workspace, '.devmethod/data.json'), '{"version":1,"data":{}}');
  const restored = path.join(f.root, 'restored');
  restoreArchive(exportProject(f.workspace, state), restored);
  assert.deepEqual(
    fs.readFileSync(path.join(restored, 'revisions/typed/compiled/THIRD_PARTY_NOTICES.txt')),
    bytes,
  );
  assert.equal(
    fs.readFileSync(path.join(restored, 'revisions/typed/app/THIRD_PARTY_NOTICES.md'), 'utf8'),
    f.projectNotice,
  );
});

test('notices exclude whitelisted runtime packages that contributed no application code', async (t) => {
  const f = fixture(
    t,
    `import {createRoot} from 'react-dom/client'; import './styles.css'; const root=document.getElementById('root'); if(root)createRoot(root).render(<h1>Minimal</h1>);`,
  );
  const result = await buildReactApp(f);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  const notices = fs.readFileSync(path.join(f.outputRoot, 'THIRD_PARTY_NOTICES.txt'), 'utf8');
  assert.match(notices, /react 19\./);
  assert.doesNotMatch(notices, /@radix-ui\/|class-variance-authority|tailwind-merge|clsx /);
});
