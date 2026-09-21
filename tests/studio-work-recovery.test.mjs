import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { createWorkRecovery } from '../scripts/studio/work-recovery.mjs';
import { fileManifest } from '../scripts/studio/files.mjs';
import { queueRequest, updateProject, cancelJob } from '../scripts/studio/domain.mjs';

function fixture(
  t,
  files = { 'index.html': '<script src="app.js"></script>', 'app.js': 'const value = 1;' },
) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-recovery-'));
  const store = createStudioStore(root);
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  store.commit(store.read().version, (state) =>
    updateProject(state, {
      name: 'Recovery fixture',
      idea: 'Keep useful work',
      mode: 'delegated',
      constraints: [],
    }),
  );
  const jobs = createJobs(store);
  store.commit(store.read().version, (state) =>
    queueRequest(state, { request: 'Create application' }),
  );
  const claim = jobs.claim('interrupted agent');
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(claim.workDirectory, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  jobs.fail({ jobId: claim.job.id, error: 'Controlled timeout fixture' });
  const metadata = path.join(path.dirname(claim.workDirectory), 'decisions.json');
  fs.writeFileSync(
    metadata,
    JSON.stringify({
      decisions: [
        {
          id: 'local-choice',
          topic: 'Implementation',
          choice: 'Local page',
          reason: 'Retain scope',
          source: 'agent',
          status: 'active',
        },
      ],
    }),
  );
  const ledger = path.join(root, '.devmethod/agent.json');
  fs.writeFileSync(ledger, JSON.stringify({ attempts: 1, unknownUsage: true, knownTokens: 0 }));
  const recovery = createWorkRecovery({ store, jobs });
  return {
    root,
    store,
    jobs,
    claim,
    recovery,
    metadata,
    ledger,
    input: () => ({ jobId: claim.job.id, version: store.read().version }),
  };
}

test('explicit local recovery snapshots and verifies preserved work without activation, source mutation or ledger reset', async (t) => {
  const f = fixture(t);
  const files = fileManifest(f.claim.workDirectory),
    metadata = fs.readFileSync(f.metadata),
    ledger = fs.readFileSync(f.ledger);
  const parent = structuredClone(f.store.read().jobs[0]);
  f.store.commit(f.store.read().version, (state) => {
    state.draft = 'An unsent request';
  });
  const result = await f.recovery.recover(f.input());
  const state = f.store.read(),
    recovered = state.jobs.at(-1);
  assert.equal(state.activeRevision, null);
  assert.equal(recovered.status, 'ready');
  assert.equal(recovered.worker, 'Studio — reprise locale');
  assert.deepEqual(recovered.recovery, { sourceJobId: parent.id, kind: 'local-inspection' });
  assert.deepEqual(state.jobs[0], parent);
  assert.equal(state.draft, 'An unsent request');
  assert.deepEqual(result.revision.files, files);
  assert.ok(
    state.checks.some(
      (check) =>
        check.revisionId === result.revision.id &&
        check.status === 'passed' &&
        check.executor === 'studio',
    ),
  );
  assert.deepEqual(fileManifest(f.claim.workDirectory), files);
  assert.deepEqual(fs.readFileSync(f.metadata), metadata);
  assert.deepEqual(fs.readFileSync(f.ledger), ledger);
  assert.equal(state.decisions.find((decision) => decision.id === 'local-choice').source, 'agent');
});

test('failed syntax stays a separately identified candidate and never repairs source silently', async (t) => {
  const f = fixture(t, {
    'index.html': '<script src="app.js"></script>',
    'app.js': 'const value = ;',
  });
  const result = await f.recovery.recover(f.input());
  assert.equal(f.store.read().activeRevision, null);
  assert.ok(
    result.state.checks.some(
      (check) => check.revisionId === result.revision.id && check.status === 'failed',
    ),
  );
  assert.equal(
    fs.readFileSync(path.join(f.claim.workDirectory, 'app.js'), 'utf8'),
    'const value = ;',
  );
});

test('React recovery executes the strict compiler and preserves exact source manifest', async (t) => {
  const f = fixture(t, {
    'package.json': JSON.stringify({ devmethod: { profile: 'react-ts' } }),
    'index.html': '<div id="root"></div><script type="module" src="/src/main.tsx"></script>',
    'src/main.tsx':
      'import {createRoot} from "react-dom/client"; import "./styles.css"; const text:string="Recovered"; const root=document.getElementById("root"); if(root)createRoot(root).render(<h1>{text}</h1>);',
    'src/styles.css': '@import "tailwindcss";',
  });
  const result = await f.recovery.recover(f.input());
  assert.equal(result.revision.compilation.profile, 'react-ts');
  assert.deepEqual(result.revision.files, fileManifest(f.claim.workDirectory));
  assert.ok(
    result.state.checks.some(
      (check) => check.protocol === 'react-strict-v1' && check.status === 'passed',
    ),
  );
  assert.equal(result.state.activeRevision, null);
});

for (const [name, mutate, error] of [
  [
    'stale version',
    (f, input) => {
      input.version--;
    },
    /changé/,
  ],
  [
    'changed context',
    (f) =>
      f.store.commit(f.store.read().version, (state) => {
        state.project.idea = 'Different scope';
      }),
    /contexte/,
  ],
  [
    'another queued job',
    (f) =>
      f.store.commit(f.store.read().version, (state) =>
        queueRequest(state, { request: 'Other work' }),
      ),
    /cours/,
  ],
  [
    'forged user approval',
    (f) => fs.writeFileSync(f.metadata, JSON.stringify({ decisions: [{ source: 'user' }] })),
    /accord/,
  ],
  [
    'special source path',
    (f) => fs.symlinkSync(f.metadata, path.join(f.claim.workDirectory, 'unsafe.json')),
    /symbolique/,
  ],
])
  test(`recovery refuses ${name} before creating a new job`, async (t) => {
    const f = fixture(t),
      input = f.input();
    mutate(f, input);
    if (name !== 'stale version') input.version = f.store.read().version;
    const count = f.store.read().jobs.length;
    await assert.rejects(f.recovery.recover(input), error);
    assert.equal(f.store.read().jobs.length, count);
  });

test('late completion after cancellation is refused and useful copied work remains', async (t) => {
  const f = fixture(t);
  const jobs = {
    ...f.jobs,
    async finish(input, options) {
      f.store.commit(f.store.read().version, (state) => cancelJob(state, { jobId: input.jobId }));
      return f.jobs.finish(input, options);
    },
  };
  await assert.rejects(
    createWorkRecovery({ store: f.store, jobs }).recover(f.input()),
    /interrompue|terminée/,
  );
  const recovered = f.store.read().jobs.at(-1);
  assert.equal(recovered.status, 'cancelled');
  assert.deepEqual(
    fileManifest(path.join(f.root, 'work', recovered.id, 'app')),
    fileManifest(f.claim.workDirectory),
  );
  assert.equal(f.store.read().activeRevision, null);
});

test('changed active base refuses recovery before queueing', async (t) => {
  const f = fixture(t);
  f.store.commit(f.store.read().version, (state) =>
    queueRequest(state, { request: 'Independent update' }),
  );
  const claim = f.jobs.claim('independent local fixture');
  fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), '<h1>New active base</h1>');
  const result = await f.jobs.finish({ jobId: claim.job.id, title: 'Other version' });
  assert.equal(result.state.activeRevision, result.revision.id);
  const count = f.store.read().jobs.length;
  await assert.rejects(f.recovery.recover(f.input()), /version active/);
  assert.equal(f.store.read().jobs.length, count);
});

test('non-terminal original job cannot be recovered', async (t) => {
  const f = fixture(t);
  f.store.commit(f.store.read().version, (state) =>
    queueRequest(state, { request: 'Still running' }),
  );
  const claim = f.jobs.claim('live fixture');
  await assert.rejects(
    f.recovery.recover({ jobId: claim.job.id, version: f.store.read().version }),
    /arrêté/,
  );
});

test('React type errors remain an immutable failed candidate with source and diagnostic', async (t) => {
  const f = fixture(t, {
    'package.json': JSON.stringify({ devmethod: { profile: 'react-ts' } }),
    'index.html': '<div id="root"></div><script type="module" src="/src/main.tsx"></script>',
    'src/main.tsx':
      'import "./styles.css"; const value:number="invalid"; document.body.textContent=String(value);',
    'src/styles.css': 'body { color: black; }',
  });
  const manifest = fileManifest(f.claim.workDirectory);
  const result = await f.recovery.recover(f.input());
  assert.ok(result.revision);
  assert.equal(result.revision.compilation, undefined);
  assert.equal(result.state.activeRevision, null);
  assert.ok(
    result.state.checks.some(
      (check) =>
        check.revisionId === result.revision.id &&
        check.status === 'failed' &&
        check.output.includes('src/main.tsx'),
    ),
  );
  assert.deepEqual(fileManifest(f.claim.workDirectory), manifest);
  assert.deepEqual(result.revision.files, manifest);
});

test('cancellation during real asynchronous checks rejects the late result', async (t) => {
  const f = fixture(t);
  const jobs = {
    ...f.jobs,
    async finish(input, options) {
      const completion = f.jobs.finish(input, options);
      assert.ok(completion instanceof Promise);
      f.store.commit(f.store.read().version, (state) => cancelJob(state, { jobId: input.jobId }));
      return completion;
    },
  };
  await assert.rejects(
    createWorkRecovery({ store: f.store, jobs }).recover(f.input()),
    /interrompue|terminée/,
  );
  assert.equal(f.store.read().jobs.at(-1).status, 'cancelled');
  assert.equal(f.store.read().revisions.length, 0);
});
