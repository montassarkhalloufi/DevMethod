import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { startStudioHome } from '../scripts/studio/home-server.mjs';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { queueRequest, updateProject } from '../scripts/studio/domain.mjs';

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'home-preview-'));
  const home = await startStudioHome({ directory: path.join(root, 'home'), port: 0 });
  t.after(async () => {
    await home.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const url = home.runtime().url;
  return {
    root,
    home,
    url,
    async create(input) {
      const response = await fetch(url + '/api/home/projects', {
        method: 'POST',
        headers: { Origin: url, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: randomUUID(), ...input }),
      });
      assert.equal(response.status, 200);
      return (await response.json()).project;
    },
    async projects() {
      return (await (await fetch(url + '/api/home')).json()).projects;
    },
  };
}

async function generated(
  workspace,
  react = false,
  label = 'Real static project',
  rootAssets = false,
) {
  const store = createStudioStore(workspace),
    jobs = createJobs(store);
  try {
    store.commit(store.read().version, (state) => {
      updateProject(state, {
        name: 'Real output',
        idea: 'Preview real files',
        mode: 'delegated',
        constraints: [],
      });
      queueRequest(state, { request: 'Generate fixture output' });
    });
    const claim = jobs.claim('fixture');
    const files = react
      ? {
          'package.json': JSON.stringify({ devmethod: { profile: 'react-ts' } }),
          'index.html': '<div id="root"></div><script type="module" src="/src/main.tsx"></script>',
          'src/main.tsx':
            'import {createRoot} from "react-dom/client"; import "./styles.css"; const root=document.getElementById("root"); if(root)createRoot(root).render(<h1>Real compiled project</h1>);',
          'src/styles.css': 'h1 { color: blue; }',
        }
      : {
          'index.html': `<!doctype html><h1>${label}</h1><link rel="stylesheet" href="assets/theme.css"><script src="assets/main.js"></script>`,
          'assets/theme.css': 'h1 { color: green; }',
          'assets/main.js': 'document.body.dataset.ready="true";',
          '.env': 'private-sentinel',
          '.hidden.js': 'private-sentinel',
        };
    if (rootAssets)
      Object.assign(files, {
        'index.html':
          '<!doctype html><h1>Root assets</h1><link href="/assets/theme.css?v=2#theme" rel="stylesheet"><script src="/assets/main.js"></script><img title="A > B" src="/assets/pixel.svg" srcset="/assets/pixel.svg 1x, /assets/pixel.svg 2x"><div style="background:url(\'/assets/pixel.svg\')"></div><style>.inline{background:url(/assets/pixel.svg)}</style><script>window.text = \'<img src="/assets/pixel.svg">\';</script><!-- <img src="/assets/pixel.svg"> --><img src="https://external.example/a.png"><img src="/unlisted.png">',
        'assets/theme.css':
          '@import "/assets/base.css"; .hero{background-image:url(\'/assets/pixel.svg\')} .literal:before{content:"url(/assets/pixel.svg)"} /* url(/assets/pixel.svg) */',
        'assets/base.css': 'h1{color:green}',
        'assets/main.js': 'window.scriptText = \'<img src="/assets/pixel.svg">\';',
        'assets/pixel.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>',
      });
    for (const [relative, content] of Object.entries(files)) {
      const file = path.join(claim.workDirectory, relative);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    }
    return (await jobs.finish({ jobId: claim.job.id, title: 'Real output' })).revision;
  } finally {
    store.close();
  }
}

test('home exposes actual static output on an isolated read-only origin without opening Studio or reading runtime', async (t) => {
  const f = await fixture(t),
    workspace = path.join(f.root, 'static');
  const revision = await generated(workspace);
  const stateFile = path.join(workspace, '.devmethod/studio.json');
  const before = fs.readFileSync(stateFile);
  fs.writeFileSync(path.join(workspace, '.devmethod/runtime.json'), '{private-untrusted-runtime');
  fs.writeFileSync(path.join(workspace, '.devmethod/data.json'), 'private-business-data');
  const read = fs.readFileSync;
  t.mock.method(fs, 'readFileSync', (file, ...args) => {
    assert.doesNotMatch(String(file), /runtime\.json$/);
    return read(file, ...args);
  });
  const project = await f.create({ kind: 'existing', workspace });
  const [listed] = await f.projects(),
    preview = listed.preview;
  assert.equal(preview.status, 'ready');
  assert.equal(preview.selection, 'active');
  assert.equal(preview.revisionId, revision.id);
  assert.notEqual(new URL(preview.url).origin, f.url);
  assert.match(
    new URL(preview.url).pathname,
    new RegExp(`/projects/${project.id}/revisions/${revision.id}/index.html$`),
  );
  const html = await fetch(preview.url);
  assert.equal(html.status, 200);
  assert.match(await html.text(), /Real static project/);
  assert.match(html.headers.get('content-security-policy'), /connect-src 'none'/);
  assert.match(html.headers.get('content-security-policy'), /form-action 'none'/);
  assert.match(html.headers.get('content-security-policy'), /sandbox allow-scripts;/);
  assert.ok(html.headers.get('content-security-policy').includes(`frame-ancestors ${f.url}`));
  assert.doesNotMatch(
    html.headers.get('content-security-policy'),
    /allow-same-origin|allow-top-navigation/,
  );
  assert.match(await (await fetch(new URL('assets/theme.css', preview.url))).text(), /green/);
  assert.match(await (await fetch(new URL('assets/main.js', preview.url))).text(), /dataset.ready/);
  assert.equal(fs.existsSync(path.join(workspace, '.devmethod/studio.lock')), false);
  assert.deepEqual(fs.readFileSync(stateFile), before);
  const homePage = await fetch(f.url);
  assert.ok(
    homePage.headers
      .get('content-security-policy')
      .includes(`frame-src ${new URL(preview.url).origin}`),
  );
  await f.home.close();
  await assert.rejects(fetch(preview.url));
});

test('empty, unsupported imports, unavailable files and latest candidates have truthful metadata', async (t) => {
  const f = await fixture(t);
  const empty = await f.create({ kind: 'new' });
  const source = path.join(f.root, 'sources');
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'main.py'), 'print("source only")');
  const imported = await f.create({ kind: 'imported', source });
  const workspace = path.join(f.root, 'candidate');
  const revision = await generated(workspace);
  const store = createStudioStore(workspace);
  store.commit(store.read().version, (state) => {
    state.activeRevision = null;
  });
  store.close();
  const candidate = await f.create({ kind: 'existing', workspace });
  let projects = await f.projects();
  assert.deepEqual(projects.find((p) => p.id === empty.id).preview, {
    status: 'empty',
    reason: 'no-revision',
  });
  assert.equal(projects.find((p) => p.id === imported.id).preview.reason, 'source-only');
  assert.equal(projects.find((p) => p.id === imported.id).preview.url, undefined);
  assert.equal(projects.find((p) => p.id === candidate.id).preview.selection, 'candidate');
  fs.unlinkSync(path.join(workspace, 'revisions', revision.id, 'app/index.html'));
  projects = await f.projects();
  assert.deepEqual(projects.find((p) => p.id === candidate.id).preview, {
    status: 'unavailable',
    reason: 'artifacts-unavailable',
    revisionId: revision.id,
  });
  fs.writeFileSync(path.join(workspace, '.devmethod/studio.json'), '{private-broken-state');
  assert.deepEqual((await f.projects()).find((p) => p.id === candidate.id).preview, {
    status: 'unavailable',
    reason: 'state-unavailable',
  });
});

test('preview serves the saved React compilation, with relative module assets and opaque-origin CORS, never raw TSX', async (t) => {
  const f = await fixture(t),
    workspace = path.join(f.root, 'react');
  const revision = await generated(workspace, true);
  await f.create({ kind: 'existing', workspace });
  const [{ preview }] = await f.projects();
  const html = await (await fetch(preview.url)).text();
  assert.match(html, /assets\/app\.js/);
  assert.doesNotMatch(html, /src\/main\.tsx/);
  const script = /src="([^"]+\.js)"/.exec(html)?.[1];
  assert.ok(script && !script.startsWith('/'));
  const response = await fetch(new URL(script, preview.url), { headers: { Origin: 'null' } });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Real compiled project/);
  assert.equal(response.headers.get('access-control-allow-origin'), 'null');
  assert.equal((await fetch(new URL('src/main.tsx', preview.url))).status, 404);
  fs.appendFileSync(
    path.join(workspace, 'revisions', revision.id, 'compiled/index.html'),
    'tampered',
  );
  assert.equal((await f.projects())[0].preview.reason, 'artifacts-unavailable');
});

test('an active version remains the thumbnail source while a newer saved candidate exists', async (t) => {
  const f = await fixture(t),
    workspace = path.join(f.root, 'versions');
  const first = await generated(workspace, false, 'First active content');
  const second = await generated(workspace, false, 'Newer candidate content');
  const store = createStudioStore(workspace);
  t.after(() => store.close());
  store.commit(store.read().version, (state) => {
    state.activeRevision = first.id;
  });
  await f.create({ kind: 'existing', workspace });
  let [{ preview }] = await f.projects();
  assert.equal(preview.revisionId, first.id);
  assert.equal(preview.selection, 'active');
  assert.match(await (await fetch(preview.url)).text(), /First active content/);
  store.commit(store.read().version, (state) => {
    state.activeRevision = null;
  });
  [{ preview }] = await f.projects();
  assert.equal(preview.revisionId, second.id);
  assert.equal(preview.selection, 'candidate');
  assert.match(await (await fetch(preview.url)).text(), /Newer candidate content/);
});

test('preview rejects tampering, symbolic links, hidden files, traversal, foreign hosts, unknown revisions and writes', async (t) => {
  const f = await fixture(t),
    workspace = path.join(f.root, 'guarded');
  const revision = await generated(workspace);
  await f.create({ kind: 'existing', workspace });
  const [{ preview }] = await f.projects();
  const app = path.join(workspace, 'revisions', revision.id, 'app');
  const asset = new URL('assets/main.js', preview.url);
  fs.writeFileSync(path.join(app, 'assets/main.js'), 'document.body.dataset.ready="evil";');
  const changed = await fetch(asset);
  assert.equal(changed.status, 404);
  assert.doesNotMatch(await changed.text(), /private-sentinel|guarded/);
  fs.unlinkSync(path.join(app, 'assets/main.js'));
  fs.symlinkSync(path.join(app, 'assets/theme.css'), path.join(app, 'assets/main.js'));
  assert.equal((await fetch(asset)).status, 404);
  for (const suffix of [
    '.env',
    '.hidden.js',
    '.devmethod/data.json',
    'unknown.js',
    '%2e%2e%2f%2e%2e%2f.env',
    '%2fetc/passwd',
  ])
    assert.equal((await fetch(new URL(suffix, preview.url))).status, 404);
  const origin = new URL(preview.url).origin;
  assert.equal((await fetch(origin + '/api/data')).status, 404);
  assert.equal((await fetch(preview.url.replace(revision.id, randomUUID()))).status, 404);
  assert.equal(
    (await fetch(preview.url.replace((await f.projects())[0].id, randomUUID()))).status,
    404,
  );
  assert.equal((await fetch(preview.url, { method: 'POST', body: '{}' })).status, 405);
  const status = await new Promise((resolve, reject) => {
    http
      .get(preview.url, { headers: { Host: 'foreign.invalid' } }, (response) => {
        response.resume();
        resolve(response.statusCode);
      })
      .on('error', reject);
  });
  assert.equal(status, 403);
});

test('root-relative HTML and CSS assets stay within the displayed revision without rewriting JavaScript or external references', async (t) => {
  const f = await fixture(t),
    workspace = path.join(f.root, 'root-assets');
  const revision = await generated(workspace, false, 'Root assets', true);
  const project = await f.create({ kind: 'existing', workspace });
  const listed = (await f.projects()).find((entry) => entry.id === project.id);
  assert.equal(listed.preview.status, 'ready');
  const prefix = `/projects/${project.id}/revisions/${revision.id}/`;
  const html = await (await fetch(listed.preview.url)).text();
  assert.ok(html.includes(`href="${prefix}assets/theme.css?v=2#theme"`));
  assert.ok(html.includes(`src="${prefix}assets/main.js"`));
  assert.ok(html.includes(`title="A > B" src="${prefix}assets/pixel.svg"`));
  assert.ok(html.includes(`srcset="${prefix}assets/pixel.svg 1x, ${prefix}assets/pixel.svg 2x"`));
  assert.ok(html.includes(`style="background:url('${prefix}assets/pixel.svg')"`));
  assert.ok(html.includes(`<style>.inline{background:url(${prefix}assets/pixel.svg)}</style>`));
  assert.ok(html.includes('<script>window.text = \'<img src="/assets/pixel.svg">\';</script>'));
  assert.ok(html.includes('<!-- <img src="/assets/pixel.svg"> -->'));
  assert.ok(html.includes('src="https://external.example/a.png"'));
  assert.ok(html.includes('src="/unlisted.png"'));
  const stylesheet = await fetch(new URL(prefix + 'assets/theme.css', listed.preview.url));
  assert.equal(stylesheet.status, 200);
  const css = await stylesheet.text();
  assert.ok(css.includes(`@import "${prefix}assets/base.css"`));
  assert.ok(css.includes(`url('${prefix}assets/pixel.svg')`));
  assert.ok(css.includes('content:"url(/assets/pixel.svg)"'));
  assert.ok(css.includes('/* url(/assets/pixel.svg) */'));
  for (const asset of ['assets/base.css', 'assets/pixel.svg', 'assets/main.js']) {
    const response = await fetch(new URL(prefix + asset, listed.preview.url));
    assert.equal(response.status, 200);
    if (asset.endsWith('.js'))
      assert.equal(await response.text(), 'window.scriptText = \'<img src="/assets/pixel.svg">\';');
  }
});
