import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import {
  updateProject,
  queueRequest,
  activateRevision,
  recordCheck,
} from '../scripts/studio/domain.mjs';
import { documentProtocol, revisionAdmission } from '../scripts/studio/admission.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-documents-'));
  const store = createStudioStore(root);
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  store.commit(store.read().version, (state) =>
    updateProject(state, {
      name: 'Controlled fixture',
      idea: 'Local page',
      mode: 'delegated',
      constraints: [],
    }),
  );
  const jobs = createJobs(store);
  return {
    store,
    async deliver(html, extra = {}) {
      store.commit(store.read().version, (state) =>
        queueRequest(state, { request: 'Change fixture' }),
      );
      const claim = jobs.claim('controlled local fixture');
      for (const [file, text] of Object.entries({ 'index.html': html, ...extra }))
        fs.writeFileSync(path.join(claim.workDirectory, file), text);
      return jobs.finish({ jobId: claim.job.id, title: 'Documents' });
    },
  };
}

for (const [name, html, extra] of [
  ['invalid JSON file', '<h1>JSON</h1>', { 'data.json': '{invalid' }],
  ['invalid classic inline script', '<script>const broken = ;</script>', {}],
  [
    'invalid module inline script',
    '<script type="module">import x from "./missing.js"; const broken = ;</script>',
    {},
  ],
  [
    'classic script rejects module-only syntax',
    '<script>import x from "./missing.js";</script>',
    {},
  ],
  ['invalid JSON data script', '<script type="application/json">{invalid</script>', {}],
])
  test(`${name} retains candidate, blocks both adoption paths and preserves previous active version`, async (t) => {
    const f = fixture(t);
    const baseline = await f.deliver('<h1>Stable</h1>');
    const invalid = await f.deliver(html, extra);
    const state = f.store.read();
    assert.equal(state.activeRevision, baseline.revision.id);
    assert.ok(state.revisions.some((revision) => revision.id === invalid.revision.id));
    assert.ok(
      state.checks.some(
        (check) =>
          check.revisionId === invalid.revision.id &&
          check.protocol === documentProtocol &&
          check.executor === 'studio' &&
          check.status === 'failed',
      ),
    );
    assert.throws(
      () => activateRevision(state, { id: invalid.revision.id, reason: 'Try adopting fixture' }),
      /vérification/,
    );
  });

test('HTML without scripts and valid classic/module scripts get executed syntax receipts, never execute code', async (t) => {
  const f = fixture(t);
  for (const html of [
    '<h1>No scripts</h1>',
    '<!-- <script>broken(</script> --><script>throw new Error("Must not execute")</script>',
    '<script type="module">import x from "./unresolved.js"; throw new Error("Must not execute");</script>',
    '<script type="text/plain">not javascript (</script>',
  ]) {
    const result = await f.deliver(html);
    assert.equal(f.store.read().activeRevision, result.revision.id);
    const receipt = f.store.read().checks.find((check) => check.revisionId === result.revision.id);
    assert.equal(receipt.status, 'passed');
    assert.equal(receipt.protocol, documentProtocol);
    assert.match(receipt.label, /comportement non évalué/);
  }
});

test('a bridge declaration cannot replace the required Studio document receipt', async (t) => {
  const f = fixture(t);
  const { revision } = await f.deliver('<h1>Fixture</h1>');
  const state = f.store.read();
  state.checks = [];
  recordCheck(state, {
    revisionId: revision.id,
    label: 'Claimed syntax',
    kind: 'command',
    command: 'claimed',
    protocol: documentProtocol,
    status: 'passed',
  });
  assert.equal(revisionAdmission(state, revision).allowed, false);
  assert.throws(
    () => activateRevision(state, { id: revision.id, reason: 'Try claimed check' }),
    /vérification/,
  );
});
