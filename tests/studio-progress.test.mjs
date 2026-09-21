import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { createJobProgress } from '../scripts/studio/progress.mjs';
import { queueRequest, cancelJob } from '../scripts/studio/domain.mjs';

function fixture(t, claim = true) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-progress-'));
  const store = createStudioStore(root);
  const jobs = createJobs(store);
  let job;
  store.commit(store.read().version, (state) => {
    job = queueRequest(state, { request: 'Inspecter et corriger' });
  });
  if (claim) job = jobs.claim('test-worker').job;
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { root, store, jobs, job, journal: path.join(root, `.devmethod/progress/${job.id}.json`) };
}

const planEvent = () => ({
  type: 'plan',
  title: 'Correction locale',
  steps: [
    { id: 'inspect', title: 'Lire la règle', status: 'running' },
    { id: 'verify', title: 'Vérifier le résultat', status: 'pending' },
  ],
});
const actionEvent = (id = 'read-contract', status = 'running') => ({
  type: 'action',
  id,
  kind: 'read',
  label: 'Lire le contrat',
  status,
  path: 'CONTRACT.md',
});
const input = (f, eventId, event = actionEvent()) => ({ jobId: f.job.id, eventId, event });
const brief = { outcome: 'Corriger la règle locale.', scope: [], excluded: [], criteria: [] };

test('old jobs expose no invented plan or actions and reads never create a journal', (t) => {
  const f = fixture(t, false);
  const before = f.store.read();
  assert.deepEqual(f.jobs.progress(f.job.id), {
    jobId: f.job.id,
    baseRevision: null,
    worker: null,
    status: 'queued',
    sequence: 0,
    updatedAt: null,
    plan: null,
    actions: [],
    truncated: false,
    source: null,
  });
  assert.equal(fs.existsSync(path.dirname(f.journal)), false);
  assert.throws(() => f.jobs.reportProgress(input(f, 'not-running')), { status: 409 });
  assert.throws(() => f.jobs.progress('missing'), { status: 404 });
  assert.deepEqual(f.store.read(), before);
});

test('progress persists real plan/actions independently of state version and finish context', (t) => {
  const f = fixture(t);
  const before = f.store.read();
  const stateFile = path.join(f.root, '.devmethod/studio.json');
  const stateBytes = fs.readFileSync(stateFile, 'utf8');
  const keyFile = path.join(f.root, `.devmethod/job-keys/${f.job.id}.txt`);
  const key = fs.readFileSync(keyFile, 'utf8');
  const first = f.jobs.reportProgress(input(f, 'plan-1', planEvent()));
  assert.deepEqual(
    first.plan.steps.map((step) => step.status),
    ['running', 'pending'],
  );
  f.jobs.reportProgress(input(f, 'read-start'), 'runner');
  const last = f.jobs.reportProgress(
    input(f, 'read-end', actionEvent('read-contract', 'completed')),
    'runner',
  );
  assert.equal(last.sequence, 3);
  assert.equal(last.source, 'runner');
  assert.equal(last.actions.length, 1);
  assert.equal(last.actions[0].status, 'completed');
  assert.ok(Number.isFinite(Date.parse(last.actions[0].at)));
  assert.deepEqual(createJobProgress(f.store).read(f.job.id), last);
  last.plan.steps[0].status = 'completed';
  assert.equal(f.jobs.progress(f.job.id).plan.steps[0].status, 'running');
  assert.deepEqual(f.store.read(), before);
  assert.equal(fs.readFileSync(stateFile, 'utf8'), stateBytes);
  assert.equal(fs.readFileSync(keyFile, 'utf8'), key);
  f.jobs.finish({ jobId: f.job.id, brief, summary: 'Analyse disponible.' });
  assert.equal(f.jobs.progress(f.job.id).status, 'ready');
  assert.equal(f.jobs.progress(f.job.id).plan.steps[0].status, 'running');
});

test('same normalized event replays without writes; collisions and late writes preserve journal', (t) => {
  const f = fixture(t);
  const report = input(f, 'event-1');
  const first = f.jobs.reportProgress(report);
  const before = fs.readFileSync(f.journal, 'utf8');
  assert.deepEqual(
    f.jobs.reportProgress({
      event: {
        status: 'running',
        path: 'CONTRACT.md',
        label: 'Lire le contrat',
        kind: 'read',
        id: 'read-contract',
        type: 'action',
      },
      eventId: 'event-1',
      jobId: f.job.id,
    }),
    first,
  );
  assert.throws(() => f.jobs.reportProgress(input(f, 'event-1', actionEvent('different'))), {
    status: 409,
  });
  assert.throws(() => f.jobs.reportProgress(report, 'runner'), { status: 409 });
  f.store.commit(f.store.read().version, (state) => cancelJob(state, { jobId: f.job.id }));
  assert.equal(f.jobs.reportProgress(report).status, 'cancelled');
  assert.throws(() => f.jobs.reportProgress(input(f, 'late')), { status: 409 });
  assert.equal(fs.readFileSync(f.journal, 'utf8'), before);
  assert.equal(f.jobs.progress(f.job.id).actions[0].status, 'running');
});

test('restart retains journal and interrupted status without retry or synthetic completion', (t) => {
  const f = fixture(t);
  const report = input(f, 'plan-1', planEvent());
  f.jobs.reportProgress(report);
  const bytes = fs.readFileSync(f.journal, 'utf8');
  f.store.close();
  const reopened = createStudioStore(f.root);
  t.after(() => reopened.close());
  const progress = createJobProgress(reopened);
  const read = progress.read(f.job.id);
  assert.equal(read.status, 'interrupted');
  assert.deepEqual(read.plan, { title: 'Correction locale', steps: planEvent().steps });
  assert.deepEqual(progress.report(report), read);
  assert.throws(() => progress.report(input(f, 'late')), { status: 409 });
  assert.equal(fs.readFileSync(f.journal, 'utf8'), bytes);
});

test('a changed active revision refuses new progress while retaining recorded replays', (t) => {
  const f = fixture(t);
  const report = input(f, 'event-1');
  f.jobs.reportProgress(report);
  f.jobs.finish({ jobId: f.job.id, brief });
  f.store.commit(f.store.read().version, (state) =>
    state.revisions.push({
      id: 'revision-1',
      jobId: f.job.id,
      title: 'Version',
      summary: '',
      createdAt: new Date().toISOString(),
      files: [{ path: 'index.html', bytes: 0, sha256: 'a'.repeat(64) }],
    }),
  );
  const second = f.store
    .commit(f.store.read().version, (state) => queueRequest(state, { request: 'Lire la suite' }))
    .jobs.at(-1);
  f.jobs.claim('test-worker');
  f.jobs.reportProgress({ ...report, jobId: second.id });
  f.store.commit(f.store.read().version, (state) => {
    state.activeRevision = 'revision-1';
  });
  assert.throws(() => f.jobs.reportProgress({ ...report, jobId: second.id, eventId: 'new' }), {
    status: 409,
  });
  assert.equal(f.jobs.reportProgress({ ...report, jobId: second.id }).sequence, 1);
});

test('strict schema, bounded text and app-relative paths reject arbitrary payload without mutation', (t) => {
  const f = fixture(t);
  const before = f.store.read();
  const invalid = [
    { ...input(f, 'bad'), stdout: 'arbitrary output' },
    { ...input(f, 'bad'), env: { SECRET: 'value' } },
    input(f, 'bad', { ...actionEvent(), output: 'raw output' }),
    input(f, 'bad', { ...actionEvent(), label: 'x'.repeat(401) }),
    input(f, 'bad', { ...actionEvent(), label: 'line\noutput' }),
    input(f, 'bad', { ...actionEvent(), kind: 'shell' }),
    input(f, 'bad', { ...actionEvent(), status: 'pending' }),
    input(f, 'bad', { ...planEvent(), extra: true }),
    input(f, 'bad', { ...planEvent(), steps: [planEvent().steps[0], planEvent().steps[0]] }),
    input(f, 'bad', {
      ...planEvent(),
      steps: Array.from({ length: 41 }, (_, i) => ({
        id: `s-${i}`,
        title: 'Étape',
        status: 'pending',
      })),
    }),
    ...['../outside', '/etc/hosts', 'src/../../outside', 'src\\outside', 'file://outside'].map(
      (relative) => input(f, 'bad', { ...actionEvent(), path: relative }),
    ),
  ];
  for (const report of invalid) assert.throws(() => f.jobs.reportProgress(report));
  assert.throws(
    () => f.jobs.reportProgress(input(f, 'bad', { ...actionEvent(), label: 'x'.repeat(32769) })),
    { status: 413 },
  );
  assert.throws(() => f.jobs.reportProgress(input(f, 'bad'), 'system'), { status: 400 });
  assert.equal(fs.existsSync(f.journal), false);
  assert.deepEqual(f.store.read(), before);
});

test('actions are bounded with visible truncation and event receipts stop before forgetting replay keys', (t) => {
  const f = fixture(t);
  const first = input(f, 'first', actionEvent('first', 'completed'));
  f.jobs.reportProgress(first);
  for (let i = 0; i < 200; i++)
    f.jobs.reportProgress(input(f, `event-${i}`, actionEvent(`action-${i}`, 'completed')));
  const read = f.jobs.progress(f.job.id);
  assert.equal(read.actions.length, 200);
  assert.equal(read.actions[0].id, 'action-0');
  assert.equal(read.truncated, true);
  assert.equal(f.jobs.reportProgress(first).sequence, 201);
  const journal = JSON.parse(fs.readFileSync(f.journal, 'utf8'));
  for (let i = journal.receipts.length; i < 2000; i++)
    journal.receipts.push({ id: `retained-${i}`, fingerprint: 'a'.repeat(64) });
  journal.sequence = 2000;
  fs.writeFileSync(f.journal, JSON.stringify(journal));
  const before = fs.readFileSync(f.journal, 'utf8');
  assert.throws(() => f.jobs.reportProgress(input(f, 'overflow')), { status: 429 });
  assert.equal(f.jobs.reportProgress(first).sequence, 2000);
  assert.equal(fs.readFileSync(f.journal, 'utf8'), before);
});

test('malformed and oversized persisted journals fail visibly without replacement', (t) => {
  const f = fixture(t);
  f.jobs.reportProgress(input(f, 'event-1'));
  for (const bytes of ['{broken', JSON.stringify({ format: 1 }), 'x'.repeat(1024 * 1024 + 1)]) {
    fs.writeFileSync(f.journal, bytes);
    assert.throws(() => f.jobs.progress(f.job.id), /aucun remplacement/);
    assert.throws(() => f.jobs.reportProgress(input(f, 'event-2')), /aucun remplacement/);
    assert.equal(fs.readFileSync(f.journal, 'utf8'), bytes);
  }
});

test('symlinked journals, directories and action paths are refused without reading targets', (t) => {
  const f = fixture(t);
  const target = path.join(f.root, 'target.json');
  fs.writeFileSync(target, 'preserved');
  fs.mkdirSync(path.dirname(f.journal));
  fs.symlinkSync(target, f.journal);
  assert.throws(() => f.jobs.progress(f.job.id), /symbolique/);
  assert.throws(() => f.jobs.reportProgress(input(f, 'event-1')), /symbolique/);
  fs.unlinkSync(f.journal);
  fs.rmdirSync(path.dirname(f.journal));
  fs.symlinkSync(f.root, path.dirname(f.journal), 'dir');
  assert.throws(() => f.jobs.reportProgress(input(f, 'event-1')), /symbolique/);
  fs.unlinkSync(path.dirname(f.journal));
  fs.symlinkSync(target, path.join(f.root, `work/${f.job.id}/app/link.json`));
  assert.throws(
    () => f.jobs.reportProgress(input(f, 'event-1', { ...actionEvent(), path: 'link.json' })),
    /symbolique/,
  );
  assert.equal(fs.readFileSync(target, 'utf8'), 'preserved');
});

test('atomic persistence failure preserves the previous journal and cleans the temporary file', (t) => {
  const f = fixture(t);
  f.jobs.reportProgress(input(f, 'event-1'));
  const before = fs.readFileSync(f.journal, 'utf8');
  const original = fs.renameSync;
  fs.renameSync = (from, to) => {
    if (to === f.journal) throw Object.assign(new Error('disk failure'), { code: 'EIO' });
    return original(from, to);
  };
  try {
    assert.throws(() => f.jobs.reportProgress(input(f, 'event-2')), /disk failure/);
  } finally {
    fs.renameSync = original;
  }
  assert.equal(fs.readFileSync(f.journal, 'utf8'), before);
  assert.deepEqual(fs.readdirSync(path.dirname(f.journal)), [`${f.job.id}.json`]);
  assert.equal(f.jobs.reportProgress(input(f, 'event-2')).sequence, 2);
});
