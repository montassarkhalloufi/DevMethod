import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { updateProject, queueRequest, cancelJob } from '../scripts/studio/domain.mjs';

function fixture(t, invalid = false) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-progress-compile-'));
  const store = createStudioStore(root);
  const jobs = createJobs(store);
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  store.commit(store.read().version, (state) =>
    updateProject(state, {
      name: 'Compilation',
      idea: 'Vérifier la source',
      mode: 'delegated',
      constraints: [],
    }),
  );
  store.commit(store.read().version, (state) =>
    queueRequest(state, { request: 'Construire le produit' }),
  );
  const claim = jobs.claim('host');
  fs.mkdirSync(path.join(claim.workDirectory, 'src'));
  const files = {
    'package.json': JSON.stringify({ devmethod: { profile: 'react-ts' } }),
    'index.html':
      '<!doctype html><div id="root"></div><script type="module" src="/src/main.tsx"></script>',
    'src/main.tsx': `import {createRoot} from 'react-dom/client'; import './styles.css'; const label: ${invalid ? 'number' : 'string'} = 'Application'; const root = document.getElementById('root'); if (root) createRoot(root).render(<h1>{label}</h1>);`,
    'src/styles.css': 'h1 { color: navy; }',
  };
  for (const [file, value] of Object.entries(files))
    fs.writeFileSync(path.join(claim.workDirectory, file), value);
  return {
    root,
    store,
    jobs,
    job: claim.job,
    journal: path.join(root, `.devmethod/progress/${claim.job.id}.json`),
    finish: () => jobs.finish({ jobId: claim.job.id, title: 'Version compilée' }),
  };
}

test('React compilation records running then completed before the job becomes ready, without inventing a plan', async (t) => {
  const f = fixture(t);
  const pending = f.finish();
  const running = f.jobs.progress(f.job.id);
  const completed = await pending;
  const progress = f.jobs.progress(f.job.id);
  assert.equal(running.status, 'running');
  assert.equal(running.actions[0]?.status, 'running');
  assert.equal(progress.status, 'ready');
  assert.equal(progress.sequence, 2);
  assert.equal(progress.plan, null);
  assert.equal(progress.actions.length, 1);
  assert.equal(progress.actions[0].kind, 'check');
  assert.equal(progress.actions[0].status, 'completed');
  assert.match(progress.actions[0].label, /comportement non évalué/);
  assert.equal(completed.revision.compilation.profile, 'react-ts');
  assert.equal(completed.state.checks.at(-1).status, 'passed');
});

test('React compilation failure is retained with its immutable candidate', async (t) => {
  const f = fixture(t, true);
  const result = await f.finish();
  assert.equal(result.revision.compilation, undefined);
  assert.match(result.state.checks.at(-1).output, /not assignable/);
  const failed = f.jobs.progress(f.job.id);
  assert.equal(failed.status, 'ready');
  assert.equal(failed.sequence, 2);
  assert.equal(failed.actions[0].status, 'failed');
  assert.equal(failed.plan, null);
  assert.equal(f.store.read().checks.at(-1).status, 'failed');
  assert.equal(f.store.read().activeRevision, null);
  assert.equal(f.jobs.progress(f.job.id).status, 'ready');
  assert.equal(f.jobs.progress(f.job.id).sequence, 2);
});

test('cancelled compilation cannot write completion after the terminal transition', async (t) => {
  const f = fixture(t);
  const pending = f.finish();
  f.store.commit(f.store.read().version, (state) => cancelJob(state, { jobId: f.job.id }));
  const atCancel = fs.existsSync(f.journal) ? fs.readFileSync(f.journal, 'utf8') : null;
  await assert.rejects(pending, /terminée|interrompue|obsolète/);
  const progress = f.jobs.progress(f.job.id);
  assert.equal(progress.status, 'cancelled');
  assert.equal(progress.sequence, 1);
  assert.equal(progress.actions[0].status, 'running');
  assert.equal(fs.readFileSync(f.journal, 'utf8'), atCancel);
  assert.equal(f.store.read().activeRevision, null);
});

test('an unavailable or exhausted progress journal cannot mask the compiler error or prevent delivery', async (t) => {
  for (const invalid of [true, false]) {
    const f = fixture(t, invalid);
    if (invalid) {
      fs.mkdirSync(path.dirname(f.journal));
      fs.writeFileSync(f.journal, '{broken');
    } else {
      f.jobs.reportProgress({
        jobId: f.job.id,
        eventId: 'host-observation',
        event: {
          type: 'action',
          id: 'host-observation',
          kind: 'message',
          label: 'Source prête à compiler',
          status: 'completed',
        },
      });
      const journal = JSON.parse(fs.readFileSync(f.journal, 'utf8'));
      for (let i = 1; i < 2000; i++)
        journal.receipts.push({ id: `retained-${i}`, fingerprint: 'a'.repeat(64) });
      journal.sequence = 2000;
      fs.writeFileSync(f.journal, JSON.stringify(journal));
    }
    const before = fs.readFileSync(f.journal, 'utf8');
    if (invalid) assert.match((await f.finish()).state.checks.at(-1).output, /not assignable/);
    else assert.equal((await f.finish()).state.jobs[0].status, 'ready');
    assert.equal(fs.readFileSync(f.journal, 'utf8'), before);
  }
});
