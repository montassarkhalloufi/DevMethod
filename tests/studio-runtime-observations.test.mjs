import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { updateProject, queueRequest, recordCheck } from '../scripts/studio/domain.mjs';
import { recordRuntimeObservation } from '../scripts/studio/runtime-observations.mjs';
import { readProjectControl } from '../scripts/studio/control.mjs';
import { exportProject } from '../scripts/studio/bundle.mjs';
import { restoreArchive } from '../scripts/studio/archive.mjs';
import { readProjectQuality } from '../scripts/studio/quality.mjs';
import { startStudio } from '../scripts/studio/server.mjs';

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-runtime-signal-'));
  const store = createStudioStore(path.join(root, 'project'));
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  store.commit(store.read().version, (state) => {
    updateProject(state, {
      name: 'Controlled browser signal',
      idea: 'Fixture only',
      mode: 'delegated',
      constraints: [],
    });
    queueRequest(state, { request: 'Create fixture' });
  });
  const jobs = createJobs(store),
    claim = jobs.claim('fixture');
  fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), '<h1>Controlled fixture</h1>');
  const result = await jobs.finish(
    { jobId: claim.job.id, title: 'Fixture' },
    { deferActivation: true },
  );
  const input = {
    revisionId: result.revision.id,
    message: 'Controlled exception',
    file: 'index.html',
    line: 1,
  };
  return { root, store, input };
}

test('reported runtime errors persist and influence control without becoming trusted executions', async (t) => {
  const f = await fixture(t);
  const before = f.store.read().version;
  const first = recordRuntimeObservation(f.store, f.input);
  const again = recordRuntimeObservation(f.store, f.input);
  assert.equal(first.observation.id, again.observation.id);
  assert.equal(f.store.read().version, before + 1);
  assert.equal(first.observation.executor, undefined);
  const quality = readProjectQuality(f.store, f.input.revisionId);
  const signal = quality.checks.find((check) => check.id === `recorded-${first.observation.id}`);
  assert.equal(signal.category, 'operations');
  assert.match(signal.tool, /navigateur/);
  assert.match(signal.evidence.observed, /Controlled exception/);
  const control = readProjectControl(f.store, { automatic: true });
  assert.equal(control.autonomy.action, 'strengthen-verification');
  assert.deepEqual(control.autonomy.reasons, ['runtime-observation-failed']);
  const evidence = control.graph.nodes.find((node) => node.kind === 'runtime');
  assert.equal(evidence.trusted, false);
  assert.equal(evidence.provenance, 'preview-signal');
  fs.writeFileSync(
    path.join(f.store.root, '.devmethod/data.json'),
    JSON.stringify({ version: 1, data: {} }),
  );
  const restored = path.join(f.root, 'restored');
  restoreArchive(exportProject(f.store.root, f.store.read()), restored);
  const reopened = createStudioStore(restored);
  t.after(() => reopened.close());
  assert.deepEqual(
    reopened.read().checks.find((check) => check.id === first.observation.id),
    first.observation,
  );
});

test('the signal endpoint cannot supply success, executor, foreign revision or unbounded diagnostics', async (t) => {
  const f = await fixture(t);
  for (const change of [
    { status: 'passed' },
    { executor: 'studio' },
    { revisionId: 'absent' },
    { message: 'x'.repeat(2001) },
    { line: -1 },
  ])
    assert.throws(() => recordRuntimeObservation(f.store, { ...f.input, ...change }));
  assert.throws(
    () =>
      recordCheck(f.store.read(), { revisionId: f.input.revisionId, kind: 'runtime-observation' }),
    /réservée/,
  );
  for (let index = 0; index < 20; index++)
    recordRuntimeObservation(f.store, { ...f.input, message: `Controlled ${index}` });
  assert.throws(() => recordRuntimeObservation(f.store, f.input), { status: 429 });
});

test('HTTP collection rejects worker and foreign origin; committed previews emit revision-bound signals', async (t) => {
  const f = await fixture(t);
  f.store.close();
  const studio = await startStudio({ workspace: f.store.root, port: 0 });
  t.after(() => studio.close());
  const runtime = studio.runtime();
  const post = (headers) =>
    fetch(runtime.url + '/api/runtime/observations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(f.input),
    });
  assert.equal((await post({ Authorization: `Bearer ${runtime.token}` })).status, 403);
  assert.equal((await post({ Origin: 'https://foreign.invalid' })).status, 403);
  assert.equal((await post({ Origin: runtime.url })).status, 200);
  const html = await (
    await fetch(`${runtime.previewOrigin}/revisions/${f.input.revisionId}/index.html`)
  ).text();
  assert.ok(html.includes(f.input.revisionId));
  assert.match(html, /devmethod-runtime-error/);
  assert.match(html, /prefix="revisions"/);
});
