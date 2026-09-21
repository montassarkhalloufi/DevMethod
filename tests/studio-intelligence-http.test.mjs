import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import * as domain from '../scripts/studio/domain.mjs';
import { startStudio } from '../scripts/studio/server.mjs';

async function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'dm-intelligence-http-')));
  const store = createStudioStore(root),
    jobs = createJobs(store);
  store.commit(store.read().version, (state) =>
    domain.updateProject(state, {
      name: 'Fixture',
      idea: 'Notes locales',
      mode: 'delegated',
      constraints: [],
    }),
  );
  store.commit(store.read().version, (state) =>
    domain.queueRequest(state, { request: 'Create notes' }),
  );
  const claim = jobs.claim('fixture');
  fs.writeFileSync(
    path.join(claim.workDirectory, 'index.html'),
    '<h1>Notes</h1><script src="app.js"></script>',
  );
  fs.writeFileSync(
    path.join(claim.workDirectory, 'app.js'),
    "localStorage.setItem('draft','note');",
  );
  const { revision } = await jobs.finish({ jobId: claim.job.id, title: 'Notes' });
  store.close();
  const studio = await startStudio({ workspace: root, port: 0, previewPort: 0 });
  t.after(async () => {
    await studio.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const origin = studio.runtime().url;
  const get = (route) => fetch(origin + route);
  const post = (route, input, from = origin) =>
    fetch(origin + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: from },
      body: JSON.stringify(input),
    });
  return { root, revision, studio, get, post };
}

test('model endpoint observes exact project source and persisted editor changes without creating or applying drafts', async (t) => {
  const f = await fixture(t),
    route = `/api/project/model?revision=${f.revision.id}`;
  assert.equal(fs.existsSync(path.join(f.root, '.devmethod/editor.json')), false);
  const response = await f.get(route),
    { analysis } = await response.json();
  assert.equal(response.status, 200);
  assert.equal(analysis.revisionId, f.revision.id);
  assert.equal(analysis.files.length, 2);
  assert.equal(analysis.backendDetected, false);
  assert.equal((await f.get(route + '&draft=1')).status, 404);
  assert.equal(fs.existsSync(path.join(f.root, '.devmethod/editor.json')), false);
  const editor = await (await f.get(`/api/editor?baseRevision=${f.revision.id}`)).json();
  const content = "localStorage.getItem('draft');";
  const saved = await f.post('/api/editor/save', {
    ...editor,
    changes: [
      { path: 'app.js', content },
      { path: 'new.js', content: "fetch('/unknown');" },
    ],
  });
  assert.equal(saved.status, 200);
  const draft = await (await f.get(route + '&draft=1')).json();
  assert.equal(draft.analysis.baseRevisionId, f.revision.id);
  assert.equal(draft.analysis.localChanges, true);
  assert.match(draft.analysis.revisionId, /^draft:/);
  assert.ok(draft.analysis.relations.some((relation) => relation.kind === 'read'));
  assert.equal(
    draft.analysis.relations.some((relation) => relation.kind === 'write'),
    false,
  );
  assert.deepEqual(
    draft.impact.changes.map((change) => change.path),
    ['app.js', 'new.js'],
  );
  const current = await (await f.get(route)).json();
  assert.equal(current.analysis.fingerprint, analysis.fingerprint);
  assert.equal(current.analysis.files.length, 2);
  assert.equal(f.studio.store.read().activeRevision, f.revision.id);
});

test('quality routes preserve same-origin, exact evidence, and obsolete diagnostics after source divergence', async (t) => {
  const f = await fixture(t),
    input = { revisionId: f.revision.id, checkId: 'source-syntax' };
  assert.equal(
    (await f.post('/api/project/checks/run', input, 'https://external.invalid')).status,
    403,
  );
  const first = await (await f.get(`/api/project/checks?revision=${f.revision.id}`)).json();
  assert.equal(first.checks.find((check) => check.id === input.checkId).status, 'notrun');
  const result = await f.post('/api/project/checks/run', input);
  assert.equal(result.status, 200);
  assert.equal(
    (await result.json()).checks.find((check) => check.id === input.checkId).evidence.revisionId,
    f.revision.id,
  );
  fs.writeFileSync(path.join(f.root, 'revisions', f.revision.id, 'app/app.js'), 'const = broken;');
  assert.equal((await f.get(`/api/project/model?revision=${f.revision.id}`)).status, 409);
  const stale = await f.get(`/api/project/checks?revision=${f.revision.id}`);
  assert.equal(stale.status, 200);
  const quality = await stale.json();
  assert.equal(quality.checks.find((check) => check.id === input.checkId).freshness, 'reevaluate');
  assert.equal(quality.flowModel, null);
  assert.equal((await f.post('/api/project/checks/run', input)).status, 409);
});
