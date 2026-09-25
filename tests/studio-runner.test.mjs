import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setImmediate } from 'node:timers/promises';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import { queueRequest, cancelJob, updateProject, chooseDesign } from '../scripts/studio/domain.mjs';
import { createAgentRunner, codexCommand } from '../scripts/studio/runner.mjs';
import { digest } from '../scripts/studio/files.mjs';

// Injected executors test orchestration and real file receipts, never model ability.
function fixture(t, mode = 'delegated') {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-runner-'));
  const store = createStudioStore(root);
  store.commit(store.read().version, (state) =>
    updateProject(state, { name: 'Fixture', idea: 'Application locale', mode, constraints: [] }),
  );
  const jobs = createJobs(store);
  let runner;
  t.after(async () => {
    await runner?.close();
    store.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  return {
    root,
    store,
    jobs,
    start(execute, options = {}) {
      runner = createAgentRunner({ store, jobs, options: { maxJobs: 2, ...options }, execute });
      return runner;
    },
    queue(request = 'Construire une vraie page') {
      let job;
      store.commit(store.read().version, (state) => {
        job = queueRequest(state, { request });
      });
      return job;
    },
  };
}

async function settled(runner) {
  const until = Date.now() + 3000;
  while (runner.status().running) {
    assert.ok(Date.now() < until, 'Injected execution should settle within three seconds');
    await setImmediate();
  }
}

function completed(directory, usage = { inputTokens: 7, outputTokens: 3 }) {
  fs.writeFileSync(
    path.join(directory, 'app/index.html'),
    '<!doctype html><h1>Fixture réelle</h1>',
  );
  return {
    ok: true,
    result: { title: 'Fixture', summary: 'Fichier écrit par exécuteur injecté.' },
    usage,
  };
}

test('runner snapshots actual files and context without manufacturing verification', async (t) => {
  const f = fixture(t);
  let invocation;
  const runner = f.start(async (input) => {
    invocation = input;
    input.onEvent({ type: 'item.completed', item: { type: 'command_execution', exit_code: 0 } });
    return completed(input.directory);
  });
  const job = f.queue();
  runner.wake();
  await settled(runner);
  const state = f.store.read(),
    revision = state.revisions[0];
  assert.equal(state.jobs[0].status, 'ready');
  assert.equal(state.activeRevision, revision.id);
  const bytes = fs.readFileSync(path.join(f.root, 'revisions', revision.id, 'app/index.html'));
  assert.equal(digest(bytes), revision.files[0].sha256);
  assert.equal(revision.files[0].bytes, bytes.length);
  assert.deepEqual(state.checks, [], 'Agent output is not an independently executed check');
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(invocation.directory, 'context.json'))).request,
    job.request,
  );
  assert.match(invocation.prompt, /Read context.json/);
  assert.equal(runner.status().knownTokens, 10);
  assert.equal(runner.status().costUSD, null);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(f.root, '.devmethod/agent.json'))).runs[0].status,
    'completed',
  );
});

test('maximum admitted jobs persists across runner restart and leaves later work queued', async (t) => {
  const f = fixture(t);
  let calls = 0;
  const execute = async ({ directory }) => {
    calls++;
    return completed(directory);
  };
  const runner = f.start(execute, { maxJobs: 1 });
  f.queue();
  runner.wake();
  await settled(runner);
  f.queue('Modification suivante');
  runner.wake();
  await settled(runner);
  assert.equal(calls, 1);
  assert.equal(f.store.read().jobs[1].status, 'queued');
  assert.equal(runner.status().automatic, false);
  await runner.close();
  const restarted = f.start(execute, { maxJobs: 1 });
  restarted.wake();
  await settled(restarted);
  assert.equal(calls, 1);
  assert.equal(restarted.status().attempts, 1);
});

test('token threshold is an admission bound and may be crossed by the last allowed call', async (t) => {
  const f = fixture(t);
  let calls = 0;
  const runner = f.start(
    async ({ directory, timeoutMs }) => {
      calls++;
      assert.equal(timeoutMs, 1234);
      return completed(directory, { inputTokens: 11, outputTokens: 4 });
    },
    { maxJobs: 3, maxTokens: 10, timeoutMs: 1234 },
  );
  f.queue();
  runner.wake();
  await settled(runner);
  f.queue('Après seuil');
  runner.wake();
  await settled(runner);
  assert.equal(calls, 1);
  assert.equal(runner.status().knownTokens, 15);
  assert.equal(runner.status().automatic, false);
});

test('unknown usage after failure suspends subsequent automatic admission', async (t) => {
  const f = fixture(t);
  let calls = 0;
  const runner = f.start(async () => {
    calls++;
    return { ok: false, usage: null, error: 'timeout' };
  });
  f.queue();
  runner.wake();
  await settled(runner);
  f.queue('Ne pas réessayer automatiquement');
  runner.wake();
  await settled(runner);
  assert.equal(calls, 1);
  assert.equal(f.store.read().jobs[0].status, 'failed');
  assert.equal(runner.status().usageUnknown, true);
  assert.equal(runner.status().knownTokens, 0, 'Known zero is not total zero');
  assert.equal(runner.status().automatic, false);
  assert.match(runner.status().message, /inconnue/);
});

test('cancel aborts the executor and rejects even a late success with real files', async (t) => {
  const f = fixture(t);
  let observedAbort = false;
  const runner = f.start(
    ({ directory, signal }) =>
      new Promise((resolve) => {
        signal.addEventListener(
          'abort',
          () => {
            observedAbort = true;
            resolve(completed(directory));
          },
          { once: true },
        );
      }),
  );
  const job = f.queue();
  runner.wake();
  f.store.commit(f.store.read().version, (state) => cancelJob(state, { jobId: job.id }));
  runner.wake();
  await settled(runner);
  assert.equal(observedAbort, true);
  assert.equal(f.store.read().jobs[0].status, 'cancelled');
  assert.deepEqual(f.store.read().revisions, []);
  assert.equal(f.store.read().activeRevision, null);
});

test('crash receipt with running attempt makes prior consumption unknown', async (t) => {
  const f = fixture(t);
  fs.writeFileSync(
    path.join(f.root, '.devmethod/agent.json'),
    JSON.stringify({
      attempts: 2,
      knownTokens: 9,
      unknownUsage: false,
      runs: [
        { jobId: 'completed', status: 'completed', usage: { inputTokens: 8, outputTokens: 1 } },
        { jobId: 'crashed', status: 'running' },
      ],
    }),
  );
  let calls = 0;
  const runner = f.start(async () => {
    calls++;
  });
  f.queue();
  runner.wake();
  await settled(runner);
  assert.equal(calls, 0);
  assert.equal(runner.status().usageUnknown, true);
  assert.equal(f.store.read().jobs[0].status, 'queued');
});

test('invalid bounds or corrupt persisted budget fail before execution', (t) => {
  const f = fixture(t);
  for (const options of [{ maxJobs: 0 }, { maxJobs: 11 }, { timeoutMs: 999 }, { maxTokens: 0 }])
    assert.throws(() => f.start(async () => {}, options), /Limites/);
  for (const ledger of [
    { attempts: -1, knownTokens: 0, unknownUsage: false, runs: [] },
    { attempts: 0, knownTokens: -1, unknownUsage: false, runs: [] },
    { attempts: 0, knownTokens: 0, unknownUsage: 'no', runs: [] },
  ]) {
    fs.writeFileSync(path.join(f.root, '.devmethod/agent.json'), JSON.stringify(ledger));
    assert.throws(() => f.start(async () => {}), /Budget/);
  }
});

test('unapproved DevAuto planning cannot activate files an executor wrongly generated', async (t) => {
  const f = fixture(t, 'devauto');
  const runner = f.start(async ({ directory, prompt }) => {
    assert.match(prompt, /planning-only/);
    return completed(directory);
  });
  f.queue();
  runner.wake();
  await settled(runner);
  assert.equal(f.store.read().activeRevision, null);
  assert.deepEqual(f.store.read().revisions, []);
  assert.equal(f.store.read().jobs[0].status, 'failed');
});

test('Codex command disables subagents and network and retains workspace sandbox', () => {
  const args = codexCommand('/fixture/job', '/fixture/result.json', '/fixture/schema.json');
  assert.ok(args.includes('features.multi_agent=false'));
  assert.ok(args.includes('sandbox_workspace_write.network_access=false'));
  assert.equal(args[args.indexOf('--sandbox') + 1], 'workspace-write');
  assert.equal(args.at(-1), '-');
});

test('obsolete queued work settles without repeated admission or starving the event loop', async (t) => {
  const f = fixture(t);
  let calls = 0;
  const runner = f.start(async ({ directory }) => {
    calls++;
    return completed(directory);
  });
  f.queue('Première version');
  f.queue('Demande encore basée sur la version vide');
  runner.wake();
  await settled(runner);
  runner.wake();
  await settled(runner);
  assert.equal(calls, 1);
  assert.equal(runner.status().attempts, 1);
  assert.equal(f.store.read().jobs[1].status, 'queued');
  assert.match(runner.status().message, /ancienne révision/);
});

test('valid queued work continues after planning and stops at its persisted admission bound', async (t) => {
  const f = fixture(t, 'guided');
  let calls = 0,
    release;
  const runner = f.start(async ({ directory }) => {
    calls++;
    if (calls === 1)
      await new Promise((resolve) => {
        release = resolve;
      });
    fs.writeFileSync(
      path.join(directory, 'decisions.json'),
      JSON.stringify({
        brief: {
          outcome: 'Suivre les inscriptions',
          scope: ['Inscription'],
          excluded: [],
          criteria: [{ id: 'c1', text: 'Conserver une inscription' }],
        },
      }),
    );
    return {
      ok: true,
      result: { title: 'Cadrage', summary: 'Choix à examiner' },
      usage: { inputTokens: 1, outputTokens: 1 },
    };
  });
  f.queue('Explorer une première direction');
  runner.wake();
  f.queue('Préciser le cadrage ensuite');
  f.queue('Cette demande dépasse la limite autorisée');
  runner.wake();
  release();
  await settled(runner);
  assert.equal(calls, 2);
  assert.deepEqual(
    f.store.read().jobs.map((job) => job.status),
    ['ready', 'ready', 'queued'],
  );
  assert.equal(runner.status().attempts, 2);
  assert.equal(runner.status().automatic, false);
  assert.equal(f.store.read().activeRevision, null);
});

test('runner follows explicit visual reservation and adoption instead of the mode label', async (t) => {
  for (const mode of ['guided', 'delegated']) {
    const f = fixture(t, mode);
    fs.mkdirSync(path.join(f.root, 'references'));
    fs.writeFileSync(
      path.join(f.root, 'references/fixture.png'),
      'Local fixture bytes, not generated media',
    );
    f.store.commit(f.store.read().version, (state) => {
      updateProject(state, {
        ...state.project,
        delegation: {
          structure: 'agent',
          visual: 'user',
          adoption: mode === 'guided' ? 'agent' : 'user',
        },
      });
      state.references.push({
        id: 'ref',
        name: 'Fixture.png',
        mime: 'image/png',
        file: 'references/fixture.png',
      });
      state.designs.push({
        id: 'design',
        title: 'Visual proposal',
        description: 'Fixture',
        file: 'ref',
      });
    });
    let calls = 0;
    const runner = f.start(async ({ directory, prompt }) => {
      calls++;
      const context = JSON.parse(fs.readFileSync(path.join(directory, 'context.json')));
      assert.equal(context.delegation.structure, 'agent');
      assert.match(prompt, /reversible technical choices are delegated/);
      if (calls === 1) {
        assert.match(prompt, /planning-only/);
        assert.deepEqual(context.approval.missing, ['visual']);
      } else {
        assert.doesNotMatch(prompt, /planning-only/);
        assert.equal(context.approval.planApproved, true);
        assert.equal(fs.existsSync(path.join(directory, 'selected-design.png')), true);
      }
      return completed(directory);
    });
    f.queue('Prepare the product, await my visual choice');
    runner.wake();
    await settled(runner);
    assert.equal(
      f.store.read().jobs[0].status,
      'failed',
      'An executor that ignores visual reservation cannot deliver code',
    );
    assert.equal(f.store.read().revisions.length, 0);
    f.store.commit(f.store.read().version, (state) =>
      chooseDesign(state, { id: 'design', reason: 'Explicit visual choice' }),
    );
    f.queue('Implement the selected visual with delegated technical choices');
    runner.wake();
    await settled(runner);
    const state = f.store.read();
    assert.equal(calls, 2);
    assert.equal(state.jobs[1].status, 'ready');
    assert.equal(state.activeRevision, mode === 'guided' ? state.revisions[0].id : null);
    assert.equal(
      state.decisions.some((entry) => entry.topic === 'delivery-scope'),
      false,
    );
  }
});
