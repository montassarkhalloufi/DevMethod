import {
  readActivationReview,
  activateReviewedRevision,
} from '../scripts/studio/activation-review.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import * as domain from '../scripts/studio/domain.mjs';
import { createEditor } from '../scripts/studio/editor.mjs';
import { startStudio } from '../scripts/studio/server.mjs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { verifySyntax, checkJavaScript } from '../scripts/studio/verify.mjs';

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-editor-'));
  const store = createStudioStore(root),
    jobs = createJobs(store);
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  store.commit(1, (s) =>
    domain.updateProject(s, {
      name: 'Notes',
      idea: 'Notes locales',
      mode: 'delegated',
      constraints: [],
    }),
  );
  store.commit(store.read().version, (s) => domain.queueRequest(s, { request: 'Notes' }));
  const claim = jobs.claim('fixture');
  fs.writeFileSync(
    path.join(claim.workDirectory, 'index.html'),
    '<script src="app.js"></script><h1>Notes</h1>',
  );
  fs.writeFileSync(path.join(claim.workDirectory, 'app.js'), 'globalThis.example = 1;');
  const { revision } = await jobs.finish({ jobId: claim.job.id, title: 'Notes' });
  fs.writeFileSync(
    path.join(root, '.devmethod/data.json'),
    JSON.stringify({ version: 3, data: { notes: ['kept'] } }),
  );
  return {
    root,
    store,
    jobs,
    revision,
    editor: createEditor({ store, jobs, getPreviewOrigin: () => 'http://127.0.0.1:19999' }),
  };
}

test('editor saves exact text durably, rejects stale CAS and unsafe paths without losing changes', async (t) => {
  const f = await fixture(t),
    first = f.editor.read(f.revision.id);
  const saved = f.editor.save({
    ...first,
    changes: [{ path: 'app.js', content: 'globalThis.example = 2;' }],
  });
  assert.throws(() => f.editor.save({ ...first, changes: [{ path: 'app.js', content: 'lost' }] }), {
    status: 409,
  });
  assert.throws(() =>
    f.editor.save({ ...saved, changes: [{ path: '../escape', content: 'bad' }] }),
  );
  assert.equal(
    createEditor({ store: f.store, jobs: f.jobs })
      .read(f.revision.id)
      .files.find((x) => x.path === 'app.js').content,
    'globalThis.example = 2;',
  );
  assert.deepEqual(saved.changedPaths, ['app.js']);
});

test('build refuses concurrent saves and preserves last good preview after a syntax error', async (t) => {
  const f = await fixture(t),
    first = f.editor.read(f.revision.id);
  const saved = f.editor.save({
    ...first,
    changes: [{ path: 'app.js', content: 'globalThis.example = 2;' }],
  });
  const pending = f.editor.build(saved);
  assert.throws(() => f.editor.save({ ...saved, changes: [] }), { status: 409 });
  const good = await pending;
  assert.ok(good.buildId);
  assert.equal(good.builtVersion, good.version);
  const bad = f.editor.save({ ...good, changes: [{ path: 'app.js', content: 'const = broken' }] });
  const result = await f.editor.build(bad);
  assert.equal(result.buildId, good.buildId);
  assert.ok(result.diagnostics.some((x) => x.severity === 'error' && x.file === 'app.js'));
  assert.throws(() => f.editor.apply({ ...result, title: 'Bad' }));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.root, '.devmethod/data.json'))), {
    version: 3,
    data: { notes: ['kept'] },
  });
});

test('manual preparation retains the draft until reviewed adoption and respects visual reservation', async (t) => {
  const f = await fixture(t),
    first = f.editor.read(f.revision.id);
  const saved = f.editor.save({
    ...first,
    changes: [{ path: 'app.js', content: 'globalThis.example = 2;' }],
  });
  const built = await f.editor.build(saved);
  f.store.commit(f.store.read().version, (s) =>
    domain.setDraft(s, { text: 'Une intention non envoyée' }),
  );
  f.store.commit(f.store.read().version, (s) =>
    domain.updateProject(s, {
      ...s.project,
      delegation: { structure: 'agent', visual: 'user', adoption: 'user' },
    }),
  );
  assert.throws(() => f.editor.apply({ ...built, title: 'Edited' }), { status: 409 });
  f.store.commit(f.store.read().version, (s) =>
    domain.updateProject(s, {
      ...s.project,
      delegation: { structure: 'agent', visual: 'agent', adoption: 'user' },
    }),
  );
  const applied = await f.editor.apply({ ...built, title: 'Edited' });
  assert.equal(applied.state.activeRevision, f.revision.id);
  assert.equal(applied.draft.baseRevision, f.revision.id);
  assert.equal(applied.prepared, true);
  const reopened = createEditor({ store: f.store, jobs: f.jobs });
  const reused = await reopened.apply({ ...built, title: 'Same bytes' });
  assert.equal(reused.revision.id, applied.revision.id);
  assert.equal(reused.state.jobs.length, applied.state.jobs.length);
  assert.equal(
    applied.draft.files.find((x) => x.path === 'app.js').content,
    'globalThis.example = 2;',
  );
  const receipts = applied.state.checks.filter((x) => x.revisionId === applied.revision.id);
  assert.equal(receipts.length, 2);
  assert.ok(receipts.every((check) => check.status === 'passed'));
  assert.ok(receipts.some((check) => check.protocol === 'studio-javascript-syntax-v1'));
  assert.deepEqual(applied.draft.changedPaths, ['app.js']);
  const review = readActivationReview(f.store, { revisionId: applied.revision.id });
  activateReviewedRevision(f.store, {
    id: applied.revision.id,
    version: review.version,
    reviewKey: review.reviewKey,
    reason: 'Reviewed exact candidate',
  });
  const reconciled = f.editor.read(applied.revision.id);
  assert.equal(reconciled.baseRevision, applied.revision.id);
  assert.deepEqual(reconciled.changedPaths, []);
  assert.equal(applied.state.draft, 'Une intention non envoyée');
});

test('changed base and substituted source symlink are refused while the durable draft remains intact', async (t) => {
  const f = await fixture(t),
    first = f.editor.read(f.revision.id);
  const saved = f.editor.save({
    ...first,
    changes: [{ path: 'app.js', content: 'globalThis.example = 2;' }],
  });
  const before = fs.readFileSync(path.join(f.root, '.devmethod/editor.json'), 'utf8');
  const app = path.join(f.root, `revisions/${f.revision.id}/app/app.js`);
  fs.renameSync(app, app + '.backup');
  fs.symlinkSync(app + '.backup', app);
  assert.throws(() => f.editor.read(f.revision.id), /symbolique/);
  fs.unlinkSync(app);
  fs.renameSync(app + '.backup', app);
  f.store.commit(f.store.read().version, (s) =>
    domain.queueRequest(s, { request: 'Autre version' }),
  );
  const claim = f.jobs.claim('another');
  fs.writeFileSync(path.join(claim.workDirectory, 'app.js'), 'globalThis.example = 3;');
  await f.jobs.finish({ jobId: claim.job.id, title: 'Other' });
  assert.throws(() => f.editor.save({ ...saved, changes: [] }), { status: 409 });
  assert.equal(fs.readFileSync(path.join(f.root, '.devmethod/editor.json'), 'utf8'), before);
  assert.equal(f.editor.read().baseRevision, f.revision.id);
  assert.equal(
    f.editor.read().files.find((file) => file.path === 'app.js').content,
    'globalThis.example = 2;',
  );
});

test('editor runtime observer precedes scripts and keeps draft signals separate from revision previews', async (t) => {
  const f = await fixture(t);
  f.store.close();
  const studio = await startStudio({ workspace: f.root, port: 0, previewPort: 0 });
  t.after(() => studio.close());
  const runtime = studio.runtime();
  const post = async (route, input) =>
    (
      await fetch(runtime.url + route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: runtime.url },
        body: JSON.stringify(input),
      })
    ).json();
  const first = await (
    await fetch(runtime.url + `/api/editor?baseRevision=${f.revision.id}`)
  ).json();
  const saved = await post('/api/editor/save', {
    ...first,
    changes: [
      {
        path: 'index.html',
        content: '<!doctype html><script>throw new Error("early failure")</script>',
      },
    ],
  });
  const built = await post('/api/editor/build', saved);
  const html = await (await fetch(built.previewUrl)).text(),
    messages = [];
  const dom = new JSDOM(html, {
    url: built.previewUrl,
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(window) {
      window.postMessage = (message, target) => messages.push({ message, target });
    },
  });
  t.after(() => dom.window.close());
  assert.equal(dom.window.document.compatMode, 'CSS1Compat');
  assert.equal(messages[0].message.message, 'early failure');
  assert.equal(messages[0].message.file, 'index.html');
  const event = new dom.window.Event('unhandledrejection');
  event.reason = new Error('x'.repeat(4000));
  dom.window.dispatchEvent(event);
  assert.equal(messages.at(-1).message.message.length, 2000);
  dom.window.dispatchEvent(
    new dom.window.ErrorEvent('error', { message: 'No location', lineno: 0 }),
  );
  assert.equal(messages.at(-1).message.line, null);
  assert.ok(
    messages.every(
      (entry) =>
        entry.target === runtime.url &&
        entry.message.buildId === built.buildId &&
        entry.message.type === 'devmethod-runtime-error',
    ),
  );
  const committed = await (await fetch(runtime.previewOrigin)).text();
  assert.ok(committed.includes('devmethod-runtime-error'));
  assert.ok(committed.includes(`buildId=${JSON.stringify(f.revision.id)}`));
  assert.ok(!committed.includes(built.buildId));
  const comparison = await (
    await fetch(`${runtime.comparisonPreviewOrigin}/revisions/${f.revision.id}/index.html`)
  ).text();
  assert.ok(!comparison.includes('devmethod-runtime-error'));
});

test('editor HTTP preview has its own origin and data; syntax checking never executes application scripts', async (t) => {
  const f = await fixture(t);
  f.store.close();
  const studio = await startStudio({ workspace: f.root, port: 0, previewPort: 0 });
  t.after(() => studio.close());
  const runtime = studio.runtime();
  const post = async (origin, url, payload, source = origin) =>
    fetch(origin + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: source },
      body: JSON.stringify(payload),
    });
  const first = await (
    await fetch(runtime.url + `/api/editor?baseRevision=${f.revision.id}`)
  ).json();
  const marker = path.join(f.root, 'executed.txt');
  const saved = await (
    await post(runtime.url, '/api/editor/save', {
      ...first,
      changes: [
        {
          path: 'app.js',
          content: `import fs from 'node:fs';fs.writeFileSync(${JSON.stringify(marker)},'bad');`,
        },
      ],
    })
  ).json();
  const built = await (await post(runtime.url, '/api/editor/build', saved)).json();
  assert.ok(built.buildId);
  assert.equal(fs.existsSync(marker), false);
  assert.notEqual(runtime.editorPreviewOrigin, runtime.previewOrigin);
  assert.equal((await fetch(built.previewUrl)).status, 200);
  const editorData = await (await fetch(runtime.editorPreviewOrigin + '/api/data')).json();
  assert.deepEqual(editorData, { version: 3, data: { notes: ['kept'] } });
  assert.equal(
    (
      await post(runtime.editorPreviewOrigin, '/api/data', {
        version: 3,
        data: { notes: ['scratch'] },
      })
    ).status,
    200,
  );
  assert.deepEqual(await (await fetch(runtime.previewOrigin + '/api/data')).json(), {
    version: 3,
    data: { notes: ['kept'] },
  });
  assert.equal(
    (
      await post(
        runtime.previewOrigin,
        '/api/data',
        { version: 3, data: {} },
        runtime.editorPreviewOrigin,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await post(
        runtime.url,
        '/api/editor/reset',
        { version: saved.version, baseRevision: f.revision.id },
        runtime.editorPreviewOrigin,
      )
    ).status,
    403,
  );
  const rebuilt = await (await post(runtime.url, '/api/editor/build', built)).json();
  assert.ok(rebuilt.buildId);
  assert.deepEqual((await (await fetch(runtime.editorPreviewOrigin + '/api/data')).json()).data, {
    notes: ['scratch'],
  });
});

test('JSON errors block a build, missing local references are explicitly heuristic, and altered build bytes refuse adoption', async (t) => {
  const f = await fixture(t),
    first = f.editor.read(f.revision.id);
  const saved = f.editor.save({
    ...first,
    changes: [{ path: 'settings.json', content: '{broken' }],
  });
  const invalid = await f.editor.build(saved);
  assert.equal(invalid.buildId, null);
  assert.ok(invalid.diagnostics.some((d) => d.file === 'settings.json' && d.severity === 'error'));
  const corrected = f.editor.save({
    ...invalid,
    changes: [
      { path: 'settings.json', content: '{}' },
      { path: 'index.html', content: '<img src="missing.png"><h1>Edited</h1>' },
    ],
  });
  const built = await f.editor.build(corrected);
  assert.ok(
    built.diagnostics.some(
      (d) => d.severity === 'warning' && d.direction.startsWith('Heuristique'),
    ),
  );
  fs.writeFileSync(
    path.join(f.editor.previewWorkspace, `revisions/${built.buildId}/app/index.html`),
    'changed outside editor',
  );
  const before = f.store.read();
  assert.throws(() => f.editor.apply({ ...built, title: 'Changed' }), /build a changé/);
  assert.deepEqual(f.store.read(), before);
});

test('ES module import followed by a trailing syntax error fails both editor and revision verification', async (t) => {
  const f = await fixture(t),
    first = f.editor.read(f.revision.id);
  const content = "import fs from 'node:fs';\nconst erreurReproductible = (";
  const saved = f.editor.save({ ...first, changes: [{ path: 'app.js', content }] });
  const built = await f.editor.build(saved);
  assert.equal(built.buildId, null);
  assert.ok(built.diagnostics.some((d) => d.file === 'app.js' && d.severity === 'error'));
  assert.equal(
    built.diagnostics.find((d) => d.file === 'app.js' && d.severity === 'error').line,
    2,
  );
  f.store.commit(f.store.read().version, (s) =>
    domain.queueRequest(s, { request: 'Invalid source regression' }),
  );
  const claim = f.jobs.claim('fixture');
  fs.writeFileSync(path.join(claim.workDirectory, 'app.js'), content);
  const { revision } = await f.jobs.finish({
    jobId: claim.job.id,
    title: 'Invalid syntax fixture',
  });
  await verifySyntax(f.store, revision);
  const check = f.store.read().checks.at(-1);
  assert.equal(check.status, 'failed');
  assert.match(check.command, /--input-type=module --check/);
  assert.match(check.output, /SyntaxError/);
});

test('syntax stdin selects module for mjs and commonjs for cjs without running either', async (t) => {
  const f = await fixture(t);
  const common = path.join(f.root, 'return.cjs'),
    module = path.join(f.root, 'return.mjs');
  fs.writeFileSync(common, 'return;');
  fs.writeFileSync(module, 'return;');
  assert.equal((await checkJavaScript(common)).code, 0);
  assert.notEqual((await checkJavaScript(module)).code, 0);
});

test('persisted builds from the former checker require reverification without losing preview or source', async (t) => {
  const f = await fixture(t),
    first = f.editor.read(f.revision.id);
  const saved = f.editor.save({
    ...first,
    changes: [{ path: 'app.js', content: 'globalThis.example = 2;' }],
  });
  const built = await f.editor.build(saved);
  const file = path.join(f.root, '.devmethod/editor.json'),
    legacy = JSON.parse(fs.readFileSync(file, 'utf8'));
  delete legacy.verificationProtocol;
  fs.writeFileSync(file, JSON.stringify(legacy));
  const reopened = f.editor.read();
  assert.equal(reopened.buildId, built.buildId);
  assert.equal(reopened.builtVersion, null);
  assert.equal(reopened.files.find((f) => f.path === 'app.js').content, 'globalThis.example = 2;');
  assert.throws(() => f.editor.apply({ ...reopened, title: 'Old check' }), /vérificateur corrigé/);
  const checked = await f.editor.build(reopened);
  assert.equal(checked.builtVersion, checked.version);
});

test('deleting a plain relative HTML stylesheet warns, and a bare package import is explicitly unresolved', async (t) => {
  const f = await fixture(t),
    first = f.editor.read(f.revision.id);
  const saved = f.editor.save({
    ...first,
    changes: [
      { path: 'index.html', content: '<link rel="stylesheet" href="styles.css"><h1>Notes</h1>' },
      { path: 'styles.css', content: 'h1 { color: green }' },
    ],
  });
  const good = await f.editor.build(saved);
  assert.ok(!good.diagnostics.some((d) => d.message.includes('styles.css')));
  const changed = f.editor.save({
    ...good,
    changes: [
      { path: 'styles.css', content: null },
      { path: 'app.js', content: "import value from 'some-package';" },
    ],
  });
  const built = await f.editor.build(changed);
  assert.ok(
    built.diagnostics.some(
      (d) =>
        d.severity === 'warning' && d.file === 'index.html' && d.message.includes('styles.css'),
    ),
  );
  assert.ok(
    built.diagnostics.some(
      (d) => d.severity === 'warning' && d.file === 'app.js' && d.message.includes('some-package'),
    ),
  );
});

test('review cancellation and stale context preserve editor text; later adoption keeps concurrent saved edits', async (t) => {
  const f = await fixture(t);
  const saved = f.editor.save({
    ...f.editor.read(f.revision.id),
    changes: [{ path: 'app.js', content: 'globalThis.example = 2;' }],
  });
  const built = await f.editor.build(saved);
  const prepared = await f.editor.apply({ ...built, title: 'For review' });
  const before = fs.readFileSync(path.join(f.root, '.devmethod/editor.json'), 'utf8');
  const review = readActivationReview(f.store, { revisionId: prepared.revision.id });
  assert.equal(fs.readFileSync(path.join(f.root, '.devmethod/editor.json'), 'utf8'), before);
  f.store.commit(f.store.read().version, (state) => {
    state.brief.criteria.push({ id: 'new-criterion', text: 'A new requirement' });
  });
  assert.throws(
    () =>
      activateReviewedRevision(f.store, {
        version: review.version,
        id: prepared.revision.id,
        reviewKey: review.reviewKey,
        reason: 'Old review',
      }),
    { status: 409 },
  );
  assert.equal(f.store.read().activeRevision, f.revision.id);
  f.editor.save({
    ...prepared.draft,
    changes: [{ path: 'app.js', content: 'globalThis.example = 3;' }],
  });
  const latest = readActivationReview(f.store, { revisionId: prepared.revision.id });
  activateReviewedRevision(f.store, {
    version: latest.version,
    id: prepared.revision.id,
    reviewKey: latest.reviewKey,
    reason: 'Review renewed',
  });
  const reconciled = f.editor.read(f.revision.id);
  assert.equal(reconciled.baseRevision, prepared.revision.id);
  assert.equal(
    reconciled.files.find((entry) => entry.path === 'app.js').content,
    'globalThis.example = 3;',
  );
  assert.deepEqual(reconciled.changedPaths, ['app.js']);
  assert.equal(reconciled.builtVersion, null);
  assert.equal(
    fs.readFileSync(path.join(f.root, `revisions/${prepared.revision.id}/app/app.js`), 'utf8'),
    'globalThis.example = 2;',
  );
});

test('preparation preserves edits saved through another editor while candidate admission finishes', async (t) => {
  const f = await fixture(t);
  const saved = f.editor.save({
    ...f.editor.read(f.revision.id),
    changes: [{ path: 'app.js', content: 'globalThis.example = 2;' }],
  });
  const built = await f.editor.build(saved);
  let release;
  const barrier = new Promise((resolve) => {
    release = resolve;
  });
  const editor = createEditor({
    store: f.store,
    jobs: {
      ...f.jobs,
      async finish(input, options) {
        const result = await f.jobs.finish(input, options);
        await barrier;
        return result;
      },
    },
  });
  const preparing = editor.apply({ ...built, title: 'Concurrent review' });
  f.editor.save({ ...built, changes: [{ path: 'app.js', content: 'globalThis.example = 4;' }] });
  release();
  const prepared = await preparing;
  assert.equal(
    prepared.draft.files.find((entry) => entry.path === 'app.js').content,
    'globalThis.example = 4;',
  );
  assert.equal(f.store.read().activeRevision, f.revision.id);
  assert.equal(
    fs.readFileSync(path.join(f.root, `revisions/${prepared.revision.id}/app/app.js`), 'utf8'),
    'globalThis.example = 2;',
  );
});

test('an altered prepared candidate cannot be silently reused or adopted', async (t) => {
  const f = await fixture(t);
  const saved = f.editor.save({
    ...f.editor.read(f.revision.id),
    changes: [{ path: 'app.js', content: 'globalThis.example = 2;' }],
  });
  const built = await f.editor.build(saved);
  const prepared = await f.editor.apply({ ...built, title: 'Candidate' });
  fs.appendFileSync(
    path.join(f.root, `revisions/${prepared.revision.id}/app/app.js`),
    '// altered',
  );
  assert.throws(() => f.editor.apply({ ...built, title: 'Try again' }), /manifeste/);
  assert.equal(
    readActivationReview(f.store, { revisionId: prepared.revision.id }).canActivate,
    false,
  );
  assert.equal(f.store.read().activeRevision, f.revision.id);
  assert.equal(
    f.editor.read().files.find((entry) => entry.path === 'app.js').content,
    'globalThis.example = 2;',
  );
});
