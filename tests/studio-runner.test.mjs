import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  createMcpActionsStore,
  mcpActionFingerprint,
} from '../scripts/studio/mcp-actions-store.mjs';
import { setImmediate } from 'node:timers/promises';
import { createStudioStore } from '../scripts/studio/store.mjs';
import { createJobs } from '../scripts/studio/jobs.mjs';
import {
  queueRequest,
  queueCorrection,
  recordControl,
  cancelJob,
  updateProject,
  chooseDesign,
  activateRevision,
  discardControlledCandidate,
} from '../scripts/studio/domain.mjs';
import { createAgentRunner, codexCommand } from '../scripts/studio/runner.mjs';
import { digest } from '../scripts/studio/files.mjs';

// Injected executors test orchestration and real file receipts, never model ability.
function fixture(t, mode = 'delegated', mcpContext) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-runner-'));
  const store = createStudioStore(root);
  store.commit(store.read().version, (state) =>
    updateProject(state, { name: 'Fixture', idea: 'Application locale', mode, constraints: [] }),
  );
  const jobs = createJobs(store, { mcpContext });
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
    start(execute, options = {}, getLiveActions, createNativeTools) {
      runner = createAgentRunner({
        store,
        jobs,
        options: { maxJobs: 2, ...options },
        execute,
        getLiveActions,
        createNativeTools,
      });
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
  assert.equal(state.activeRevision, null, 'technical receipts do not prove business criteria');
  assert.equal(state.jobs[0].control.action, 'strengthen-verification');
  const bytes = fs.readFileSync(path.join(f.root, 'revisions', revision.id, 'app/index.html'));
  assert.equal(digest(bytes), revision.files[0].sha256);
  assert.equal(revision.files[0].bytes, bytes.length);
  assert.equal(
    state.checks.length,
    1,
    'Only the executed document receipt is admitted, not agent output',
  );
  assert.equal(state.checks[0].protocol, 'studio-document-syntax-v1');
  assert.equal(state.checks[0].executor, 'studio');
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(invocation.directory, 'context.json'))).request,
    job.request,
  );
  assert.match(invocation.prompt, /Read context.json/);
  assert.match(invocation.prompt, /deadline of 300 seconds/);
  const verification = JSON.parse(
    fs.readFileSync(path.join(invocation.directory, 'context.json')),
  ).verification;
  assert.equal(verification.command[2], '--source');
  assert.equal(verification.command[3], path.join(invocation.directory, 'app'));
  assert.ok(fs.existsSync(verification.command[1]));
  assert.equal(runner.status().knownTokens, 10);
  assert.equal(runner.status().costUSD, null);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(f.root, '.devmethod/agent.json'))).runs[0].status,
    'completed',
  );
});

for (const repaired of [true, false]) {
  test(`supervision preserves the failed candidate and ${repaired ? 'checks a distinct correction' : 'stops after one failed correction'}`, async (t) => {
    const f = fixture(t);
    let calls = 0;
    const runner = f.start(
      async ({ directory }) => {
        calls++;
        const script = path.join(directory, 'app/app.js');
        if (calls === 2) assert.equal(fs.readFileSync(script, 'utf8'), 'const value = ;');
        const result = completed(directory);
        fs.writeFileSync(script, calls === 2 && repaired ? 'const value = 1;' : 'const value = ;');
        return result;
      },
      { maxJobs: 3 },
    );
    f.queue();
    runner.wake();
    await settled(runner);
    const state = f.store.read();
    assert.equal(calls, 2);
    assert.equal(state.revisions.length, 2);
    assert.equal(state.activeRevision, null);
    assert.equal(state.jobs[1].correction.sourceRevision, state.revisions[0].id);
    assert.equal(state.jobs[0].control.operation, 'correct');
    assert.equal(state.jobs[1].control.action, repaired ? 'strengthen-verification' : 'stop');
    if (!repaired) assert.deepEqual(state.jobs[1].control.reasons, ['correction-limit']);
    assert.equal(runner.status().attempts, 2);
    assert.equal(runner.status().knownTokens, 20);
    runner.wake();
    await settled(runner);
    assert.equal(calls, 2);
    if (!repaired) {
      f.queue('Explicit new request after inspecting the stopped candidate');
      runner.wake();
      await settled(runner);
      assert.equal(calls, 2);
      f.store.commit(f.store.read().version, (draft) =>
        discardControlledCandidate(draft, {
          jobId: state.jobs[1].id,
          reason: 'Fixture resolution; not human intervention evidence',
        }),
      );
      runner.wake();
      await settled(runner);
      assert.equal(calls, 3);
      assert.equal(runner.status().attempts, 3, 'discard never resets admission ledger');
    }
  });
}

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
  assert.equal(calls, 1, 'unverified candidate suspends the next queued request');
  f.store.commit(f.store.read().version, (state) =>
    activateRevision(state, {
      id: state.revisions[0].id,
      reason: 'Controlled fixture adoption, not human evidence',
    }),
  );
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
    assert.equal(
      state.activeRevision,
      null,
      'delegation does not supply missing behavior evidence',
    );
    assert.equal(
      state.decisions.some((entry) => entry.topic === 'delivery-scope'),
      false,
    );
  }
});

test('runner communicates the explicit static stack to its controlled executor', async (t) => {
  const f = fixture(t);
  f.store.commit(f.store.read().version, (state) =>
    updateProject(state, { ...state.project, expectedProfile: 'static' }),
  );
  f.queue();
  let observed;
  const runner = f.start(async ({ directory, prompt }) => {
    observed = prompt;
    return completed(directory);
  });
  runner.wake();
  await settled(runner);
  assert.match(observed, /Required stack: static HTML\/CSS\/JavaScript/);
  assert.match(observed, /Do not change to React\/TypeScript/);
  assert.equal(f.store.read().jobs[0].status, 'ready');
});

test('unknown live tool outcomes prevent admission and survive runner restart without increasing usage', async (t) => {
  const f = fixture(t);
  f.queue();
  let calls = 0;
  const execute = async ({ directory }) => {
    calls++;
    return completed(directory);
  };
  const live = () => [{ requestId: 'controlled-unknown', status: 'unknown' }];
  const runner = f.start(execute, {}, live);
  runner.wake();
  await settled(runner);
  assert.equal(calls, 0);
  assert.equal(runner.status().attempts, 0);
  assert.equal(f.store.read().jobs[0].status, 'queued');
  await runner.close();
  const restarted = f.start(execute, {}, live);
  restarted.wake();
  assert.equal(calls, 0);
  assert.equal(restarted.status().attempts, 0);
});

test('new unknown tool outcome after execution stops control without discarding candidate or known usage', async (t) => {
  const f = fixture(t);
  f.queue();
  let actions = [];
  const runner = f.start(
    async ({ directory }) => {
      actions = [{ requestId: 'controlled-unknown', status: 'unknown' }];
      return completed(directory);
    },
    {},
    () => actions,
  );
  runner.wake();
  await settled(runner);
  const state = f.store.read();
  assert.equal(state.revisions.length, 1);
  assert.equal(state.activeRevision, null);
  assert.equal(state.jobs[0].control.action, 'stop');
  assert.ok(state.jobs[0].control.reasons.includes('external-outcome-unknown'));
  assert.equal(runner.status().attempts, 1);
  assert.equal(runner.status().knownTokens, 10);
});

test('unreadable tool ledger refuses dispatch without claiming or changing a queued job', async (t) => {
  const f = fixture(t);
  f.queue();
  const before = f.store.read();
  fs.writeFileSync(path.join(f.root, '.devmethod/mcp-actions.json'), '{PRIVATE_FIXTURE');
  let calls = 0;
  const runner = f.start(async ({ directory }) => {
    calls++;
    return completed(directory);
  });
  runner.wake();
  assert.equal(calls, 0);
  assert.deepEqual(f.store.read(), before);
  assert.equal(runner.status().attempts, 0);
  assert.doesNotMatch(runner.status().message, /PRIVATE_FIXTURE/);
});

test('queued correction rechecks its parent source evidence immediately before admission', async (t) => {
  const f = fixture(t);
  f.queue();
  const claim = f.jobs.claim('controlled fixture');
  fs.writeFileSync(path.join(claim.workDirectory, 'index.html'), '<script src="app.js"></script>');
  fs.writeFileSync(path.join(claim.workDirectory, 'app.js'), 'const invalid = ;');
  const candidate = await f.jobs.finish(
    { jobId: claim.job.id, title: 'Invalid fixture' },
    { deferActivation: true },
  );
  f.store.commit(f.store.read().version, (state) => {
    recordControl(state, {
      jobId: claim.job.id,
      revisionId: candidate.revision.id,
      autonomy: { action: 'continue', operation: 'correct', reasons: ['controlled-fixture'] },
    });
    queueCorrection(state, { revisionId: candidate.revision.id });
  });
  // Controlled tampering fixture: a stored receipt cannot certify changed bytes.
  fs.writeFileSync(
    path.join(f.root, 'revisions', candidate.revision.id, 'app/app.js'),
    'const changed = 1;',
  );
  let calls = 0;
  const runner = f.start(async ({ directory }) => {
    calls++;
    return completed(directory);
  });
  runner.wake();
  assert.equal(calls, 0);
  assert.equal(runner.status().attempts, 0);
  assert.equal(f.store.read().jobs.at(-1).status, 'queued');
  assert.match(runner.status().message, /contrôle favorable/);
});

for (const toolStatus of ['pending', 'denied', 'completed'])
  test(`queued correction cannot bypass a parent tool ${toolStatus} outcome`, async (t) => {
    const f = fixture(t);
    f.queue();
    const claim = f.jobs.claim('controlled fixture');
    fs.writeFileSync(
      path.join(claim.workDirectory, 'index.html'),
      '<script src="app.js"></script>',
    );
    fs.writeFileSync(path.join(claim.workDirectory, 'app.js'), 'const invalid = ;');
    const candidate = await f.jobs.finish(
      { jobId: claim.job.id, title: 'Invalid fixture' },
      { deferActivation: true },
    );
    f.store.commit(f.store.read().version, (state) => {
      recordControl(state, {
        jobId: claim.job.id,
        revisionId: candidate.revision.id,
        autonomy: { action: 'continue', operation: 'correct', reasons: ['controlled-fixture'] },
      });
      queueCorrection(state, { revisionId: candidate.revision.id });
    });
    // Persisted adverse-result fixture added AFTER the old correction decision.
    const entry = {
      requestId: randomUUID(),
      jobId: claim.job.id,
      baseRevision: null,
      connectionId: randomUUID(),
      connectionVersion: 1,
      toolName: 'fixture.check',
      inputSchemaFingerprint: 'a'.repeat(64),
      contractFingerprint: 'b'.repeat(64),
      arguments: {},
      status: toolStatus,
      isError: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 600000).toISOString(),
    };
    entry.fingerprint = mcpActionFingerprint(entry);
    createMcpActionsStore(f.root, Date.now).save(entry);
    let calls = 0;
    const runner = f.start(async ({ directory }) => {
      calls++;
      return completed(directory);
    });
    runner.wake();
    assert.equal(calls, 0);
    assert.equal(runner.status().attempts, 0);
    assert.equal(f.store.read().jobs.at(-1).status, 'queued');
  });

for (const fails of [false, true])
  test(`native tool capability is scoped, omitted from context and closed after ${fails ? 'failure' : 'success'}`, async (t) => {
    const f = fixture(t, 'delegated', () => ({
      supported: true,
      nativeRunner: false,
      connections: [{ id: 'selected' }],
    }));
    let openedFor,
      closed = 0;
    const secret = 'private-session-token';
    const runner = f.start(
      async ({ directory, nativeTools }) => {
        assert.equal(nativeTools.token, secret);
        const context = fs.readFileSync(path.join(directory, 'context.json'), 'utf8');
        assert.doesNotMatch(context, /private-session-token|127\.0\.0\.1:19999/);
        assert.equal(JSON.parse(context).mcp.nativeRunner, true);
        assert.match(JSON.parse(context).mcp.instructions, /studio_tools/);
        assert.equal(JSON.parse(context).mcp.commands, undefined);
        if (fails) throw new Error('controlled executor failure');
        return completed(directory);
      },
      {},
      undefined,
      async (jobId) => {
        openedFor = jobId;
        return {
          url: 'http://127.0.0.1:19999',
          token: secret,
          close: async () => {
            closed++;
          },
        };
      },
    );
    f.queue('Use selected tools');
    runner.wake();
    await settled(runner);
    assert.equal(openedFor, f.store.read().jobs[0].id);
    assert.equal(closed, 1);
  });

test('Codex MCP configuration forwards scoped credentials by environment name without opening shell network', () => {
  const args = codexCommand('/job', '/result', '/schema', true);
  assert.ok(args.includes('mcp_servers.devmethod.required=true'));
  assert.ok(args.includes('sandbox_workspace_write.network_access=false'));
  assert.ok(args.some((value) => value.includes('native-tools-stdio.mjs')));
  assert.ok(
    args.includes(
      'mcp_servers.devmethod.env_vars=["DEVMETHOD_NATIVE_TOOLS_URL","DEVMETHOD_NATIVE_TOOLS_TOKEN"]',
    ),
  );
  assert.ok(
    !codexCommand('/job', '/result', '/schema').some((value) => value.startsWith('mcp_servers.')),
  );
});

test('cancellation during native bridge preparation never dispatches the provider and closes the capability', async (t) => {
  const f = fixture(t, 'delegated', () => ({ supported: true, connections: [{ id: 'selected' }] }));
  let resolveSession,
    executions = 0,
    closed = 0;
  const preparing = new Promise((resolve) => {
    resolveSession = resolve;
  });
  const runner = f.start(
    async () => {
      executions++;
    },
    {},
    undefined,
    () => preparing,
  );
  const job = f.queue('Controlled cancellation');
  runner.wake();
  f.store.commit(f.store.read().version, (state) => cancelJob(state, { jobId: job.id }));
  runner.wake();
  resolveSession({
    url: 'http://127.0.0.1:19999',
    token: 'fixture',
    close: async () => {
      closed++;
    },
  });
  await settled(runner);
  assert.equal(executions, 0);
  assert.equal(closed, 1);
  assert.equal(runner.status().usageUnknown, false);
});
