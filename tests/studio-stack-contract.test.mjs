import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import * as domain from '../scripts/studio/domain.mjs';

function fixture(t, expectedProfile) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-stack-'));
  const store = createStudioStore(root);
  t.after(() => {
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  store.commit(store.read().version, (state) =>
    domain.updateProject(state, {
      name: 'Stack fixture',
      idea: 'Local application',
      mode: 'delegated',
      constraints: [],
      ...(expectedProfile ? { expectedProfile } : {}),
    }),
  );
  const jobs = createJobs(store);
  return { root, store, jobs };
}

function claim(f, profile) {
  f.store.commit(f.store.read().version, (state) =>
    domain.queueRequest(state, { request: 'Create fixture' }),
  );
  const result = f.jobs.claim('controlled fixture');
  fs.writeFileSync(path.join(result.workDirectory, 'index.html'), '<div id="root"></div>');
  if (profile === 'react-ts') {
    fs.writeFileSync(
      path.join(result.workDirectory, 'index.html'),
      '<div id="root"></div><script type="module" src="/src/main.tsx"></script>',
    );
    fs.writeFileSync(
      path.join(result.workDirectory, 'package.json'),
      JSON.stringify({ devmethod: { profile } }),
    );
    fs.mkdirSync(path.join(result.workDirectory, 'src'));
    fs.writeFileSync(
      path.join(result.workDirectory, 'src/main.tsx'),
      'import {createRoot} from "react-dom/client"; createRoot(document.getElementById("root")!).render(<h1>Fixture</h1>);',
    );
  }
  return result;
}

test('stack persists through old-client omissions and changing it invalidates structure approval', (t) => {
  const f = fixture(t, 'react-ts');
  f.store.commit(f.store.read().version, (state) => {
    state.project.mode = 'guided';
    state.brief.outcome = 'A page';
    state.brief.criteria = [{ id: 'page', text: 'Page opens' }];
    domain.approvePlan(state, { reason: 'Fixture approval' });
  });
  const approved = f.store.read();
  f.store.commit(approved.version, (state) => {
    const legacy = { ...state.project };
    delete legacy.expectedProfile;
    domain.updateProject(state, legacy);
  });
  assert.equal(f.store.read().project.expectedProfile, 'react-ts');
  assert.equal(domain.planApprovalKey(f.store.read()), domain.planApprovalKey(approved));
  assert.equal(domain.hasApprovedPlan(f.store.read()), true);
  f.store.commit(f.store.read().version, (state) =>
    domain.updateProject(state, { ...state.project, expectedProfile: 'static' }),
  );
  assert.equal(domain.hasApprovedPlan(f.store.read()), false);
  assert.equal(f.store.read().project.expectedProfile, 'static');
  assert.throws(
    () =>
      f.store.commit(f.store.read().version, (state) =>
        domain.updateProject(state, { ...state.project, expectedProfile: 'other' }),
      ),
    /Stack/,
  );
});

for (const [expected, actual] of [
  ['react-ts', 'static'],
  ['static', 'react-ts'],
]) {
  test(`${expected} contract refuses ${actual} delivery and preserves work`, async (t) => {
    const f = fixture(t, expected);
    const job = claim(f, actual);
    assert.equal(job.context.project.expectedProfile, expected);
    const before = f.store.read();
    await assert.rejects(
      async () => f.jobs.finish({ jobId: job.job.id, title: 'Wrong stack' }),
      /Stack attendue/,
    );
    assert.deepEqual(f.store.read(), before);
    assert.equal(fs.existsSync(path.join(job.workDirectory, 'index.html')), true);
  });
}

test('expected React delivery uses the real strict compiler', async (t) => {
  const f = fixture(t, 'react-ts');
  const job = claim(f, 'react-ts');
  const result = await f.jobs.finish({ jobId: job.job.id, title: 'React fixture' });
  assert.equal(result.revision.compilation.profile, 'react-ts');
  assert.equal(f.store.read().activeRevision, result.revision.id);
  assert.equal(f.store.read().checks.at(-1).status, 'passed');
});

test('an unspecified stack retains static creation compatibility', async (t) => {
  const f = fixture(t);
  const job = claim(f, 'static');
  const result = await f.jobs.finish({ jobId: job.job.id, title: 'Static fixture' });
  assert.equal(f.store.read().activeRevision, result.revision.id);
  assert.equal(f.store.read().project.expectedProfile, undefined);
});

test('failed React candidate is immutable and correction starts from its sources', async (t) => {
  const f = fixture(t, 'react-ts');
  const first = claim(f, 'react-ts');
  const file = path.join(first.workDirectory, 'src/main.tsx');
  const invalid = 'const value: number = "wrong"; export {value};';
  fs.writeFileSync(file, invalid);
  const result = await f.jobs.finish(
    { jobId: first.job.id, title: 'Invalid React' },
    { deferActivation: true },
  );
  assert.equal(result.revision.profile, 'react-ts');
  assert.equal(result.revision.compilation, undefined);
  assert.equal(f.store.read().activeRevision, null);
  assert.equal(
    fs.readFileSync(path.join(f.root, 'revisions', result.revision.id, 'app/src/main.tsx'), 'utf8'),
    invalid,
  );
  assert.throws(
    () =>
      f.store.commit(f.store.read().version, (state) =>
        domain.activateRevision(state, { id: result.revision.id, reason: 'Cannot bypass' }),
      ),
    /compilation/,
  );
  f.store.commit(f.store.read().version, (state) =>
    domain.queueCorrection(state, { revisionId: result.revision.id }),
  );
  const repair = f.jobs.claim('local fixture');
  assert.equal(fs.readFileSync(path.join(repair.workDirectory, 'src/main.tsx'), 'utf8'), invalid);
  fs.writeFileSync(
    path.join(repair.workDirectory, 'src/main.tsx'),
    'export const value: number = 1;',
  );
  const fixed = await f.jobs.finish(
    { jobId: repair.job.id, title: 'Corrected React' },
    { deferActivation: true },
  );
  assert.equal(fixed.revision.compilation.profile, 'react-ts');
  assert.equal(f.store.read().activeRevision, null, 'supervision runs before activation');
  assert.ok(
    f.store
      .read()
      .checks.some((check) => check.revisionId === result.revision.id && check.status === 'failed'),
  );
});
