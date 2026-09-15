import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectEvidence, runEvidence, evidenceStatus } from '../dist/evidence-runtime.js';

const posixTest = (name, run) => test(name, { skip: process.platform === 'win32' }, run);

posixTest('semantic failure uses exit one with strict failed verdicts', async (t) => {
  const f = fixture(t);
  f.runner(
    `const [,mode,check]=process.argv.slice(2); const failed=mode==='overbook'; console.log(JSON.stringify({format:1,check,verdicts:{capacity:failed?'failed':'passed'}})); process.exitCode=failed?1:0;`,
  );
  const report = await f.run();
  assert.equal(report.status, 'supported');
  assert.equal(report.results.find(({ mode }) => mode === 'overbook').status, 'completed');
});

posixTest(
  'incoherent stored support fails closed instead of reporting fresh evidence',
  async (t) => {
    const f = fixture(t);
    await f.run();
    const original = f.state();
    for (const [name, corrupt] of [
      [
        'supported outcome with failed criterion',
        (state) => {
          state.attempts[0].criteria[0].status = 'failed';
        },
      ],
      [
        'null criterion',
        (state) => {
          state.attempts[0].criteria[0] = null;
        },
      ],
      [
        'unknown outcome',
        (state) => {
          state.attempts[0].outcome = 'accepted';
        },
      ],
      [
        'malformed revision',
        (state) => {
          state.revisions[0].permit = 'invalid';
        },
      ],
      [
        'oversized note',
        (state) => {
          state.attempts[0].diagnosis = 'x'.repeat(8193);
        },
      ],
      [
        'negative duration',
        (state) => {
          state.attempts[0].durationMs = -1;
        },
      ],
      [
        'invalid date',
        (state) => {
          state.attempts[0].startedAt = 'not-a-date';
        },
      ],
      [
        'inconsistent freshness',
        (state) => {
          state.attempts[0].after = '0'.repeat(64);
        },
      ],
      [
        'null result',
        (state) => {
          state.attempts[0].results[0] = null;
        },
      ],
      [
        'invalid verdict',
        (state) => {
          state.attempts[0].results[0].verdicts.capacity = 'maybe';
        },
      ],
      [
        'candidate failure hidden by support',
        (state) => {
          state.attempts[0].results.at(-1).verdicts.capacity = 'failed';
        },
      ],
      [
        'unfinished passing attempt',
        (state) => {
          state.attempts[0].results[2] = { check: 'booking', mode: 'candidate', status: 'not-run' };
        },
      ],
    ]) {
      await t.test(name, () => {
        const state = structuredClone(original);
        corrupt(state);
        const bytes = JSON.stringify(state);
        fs.writeFileSync(path.join(f.session, 'state.json'), bytes);
        assert.throws(f.status, /[Ii]nvalid|[Ii]nconsistent/);
        assert.equal(fs.readFileSync(path.join(f.session, 'state.json'), 'utf8'), bytes);
      });
    }
  },
);

posixTest('stored failure signature must match the recorded failing criteria', async (t) => {
  const f = fixture(t);
  f.candidate('failed');
  await f.run();
  const state = f.state();
  state.attempts[0].signature = '0'.repeat(64);
  fs.writeFileSync(path.join(f.session, 'state.json'), JSON.stringify(state));
  assert.throws(f.status, /[Ii]nvalid/);
  await assert.rejects(
    f.run({ diagnosis: 'Investigated.', adjustment: 'Adjusted.' }),
    /[Ii]nvalid/,
  );
});

posixTest('omitted stored controls cannot match a current execution plan', async (t) => {
  const f = fixture(t);
  await f.run();
  const state = f.state();
  state.attempts[0].results.splice(1, 1);
  fs.writeFileSync(path.join(f.session, 'state.json'), JSON.stringify(state));
  assert.equal(f.status().status, 'stale');
  assert.equal(f.status().fresh, false);
  await assert.rejects(f.run(), /[Ii]nvalid/);
});

for (const [label, code, verdict] of [
  ['zero with failed criteria', 0, 'failed'],
  ['one with passing criteria', 1, 'passed'],
  ['unrecognized exit code with failed criteria', 2, 'failed'],
  ['one with malformed output', 1, null],
]) {
  posixTest(`contradictory fault protocol: ${label}`, async (t) => {
    const f = fixture(t);
    f.runner(
      `const [,mode,check]=process.argv.slice(2); if(mode==='healthy'){console.log(JSON.stringify({format:1,check,verdicts:{capacity:'passed'}}));}else{const verdict=${JSON.stringify(verdict)};console.log(verdict===null?'not-json':JSON.stringify({format:1,check,verdicts:{capacity:verdict}}));process.exitCode=${code};}`,
    );
    const report = await f.run();
    assert.equal(report.status, 'halted');
    assert.equal(report.results[0].status, 'completed');
    assert.equal(report.results[1].status, 'interrupted');
    assert.equal(report.results[2].status, 'not-run');
  });
}

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'evidence-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const root = path.join(directory, 'candidate');
  const evaluatorRoot = path.join(directory, 'evaluator');
  fs.mkdirSync(root);
  fs.mkdirSync(evaluatorRoot);
  const options = {
    root,
    evaluatorRoot,
    contractPath: path.join(evaluatorRoot, 'contract.json'),
    session: path.join(directory, 'session'),
  };
  const contract = {
    format: 1,
    id: 'capacity',
    intent: 'Do not allow a full event to overbook.',
    criteria: [{ id: 'capacity', description: 'Reject when remaining capacity is zero.' }],
    candidateInputs: ['candidate.json'],
    evaluatorFiles: ['runner.mjs'],
    checks: [
      {
        id: 'booking',
        runner: 'runner.mjs',
        criteria: ['capacity'],
        healthy: 'healthy',
        faults: [{ id: 'overbook', target: 'capacity' }],
      },
    ],
  };
  const writeContract = () => fs.writeFileSync(options.contractPath, JSON.stringify(contract));
  const candidate = (verdict = 'passed') =>
    fs.writeFileSync(path.join(root, 'candidate.json'), JSON.stringify({ verdict }));
  const runner = (source) => fs.writeFileSync(path.join(evaluatorRoot, 'runner.mjs'), source);
  candidate();
  writeContract();
  runner(
    `import fs from 'node:fs'; import path from 'node:path'; const [root,mode,check]=process.argv.slice(2); const verdict=mode==='candidate'?JSON.parse(fs.readFileSync(path.join(root,'candidate.json'))).verdict:mode==='healthy'?'passed':'failed'; console.log(JSON.stringify({format:1,check,verdicts:{capacity:verdict}})); process.exitCode=verdict==='failed'?1:0;`,
  );
  const plan = () => inspectEvidence(options);
  const run = (extra = {}) => runEvidence({ ...options, permit: plan().permit, ...extra });
  const status = () => evidenceStatus(options);
  const state = () => JSON.parse(fs.readFileSync(path.join(options.session, 'state.json')));
  return { ...options, contract, plan, run, status, state, writeContract, candidate, runner };
}

posixTest(
  'plan is read-only; explicit permit executes calibrated checks and produces current support',
  async (t) => {
    const f = fixture(t);
    assert.equal(fs.existsSync(f.session), false);
    assert.equal(f.plan().invocations.length, 3);
    assert.equal(fs.existsSync(f.session), false);
    const report = await f.run();
    assert.equal(report.status, 'supported');
    assert.equal(report.criteria[0].status, 'supported');
    assert.equal(f.status().fresh, true);
    assert.equal(f.state().attempts.length, 1);
  },
);

posixTest('permit excludes candidate bytes but pins evaluator and contract', async (t) => {
  const f = fixture(t);
  const permit = f.plan().permit;
  f.candidate('failed');
  assert.equal(f.plan().permit, permit);
  f.contract.intent += ' Also make availability visible.';
  f.writeContract();
  assert.notEqual(f.plan().permit, permit);
  await assert.rejects(f.run({ permit }), /permit/i);
});

posixTest(
  'green candidate is unchallenged when healthy and fault controls are absent',
  async (t) => {
    const f = fixture(t);
    delete f.contract.checks[0].healthy;
    f.contract.checks[0].faults = [];
    f.writeContract();
    const report = await f.run();
    assert.equal(report.status, 'unchallenged');
    assert.equal(report.criteria[0].status, 'unchallenged');
  },
);

posixTest('insensitive test fails calibration even with a green candidate', async (t) => {
  const f = fixture(t);
  f.runner(
    `if(process.argv[3]==='candidate') process.exit(9); console.log(JSON.stringify({format:1,check:process.argv[4],verdicts:{capacity:'passed'}}));`,
  );
  const report = await f.run();
  assert.equal(report.status, 'failed');
  assert.equal(report.criteria[0].status, 'calibration-failed');
  assert.deepEqual(report.results.at(-1), {
    check: 'booking',
    mode: 'candidate',
    status: 'not-run',
    reason: 'calibration-failed',
  });
});

posixTest('two identical criterion failures halt persistently despite repairs', async (t) => {
  const f = fixture(t);
  f.candidate('failed');
  assert.equal((await f.run()).status, 'failed');
  await assert.rejects(f.run(), /diagnosis/i);
  const halted = await f.run({
    diagnosis: 'Capacity boundary omitted.',
    adjustment: 'Changed comparison.',
  });
  assert.equal(halted.status, 'halted');
  f.candidate('passed');
  assert.equal((await f.run()).status, 'halted');
  assert.equal(f.status().status, 'halted');
  assert.equal(f.state().attempts.length, 2);
});

posixTest('candidate repair preserves attempt history and refreshes a stale receipt', async (t) => {
  const f = fixture(t);
  await f.run();
  f.candidate('failed');
  assert.equal(f.status().status, 'stale');
  await f.run();
  f.candidate();
  assert.equal(
    (await f.run({ diagnosis: 'Boundary inversion.', adjustment: 'Restored capacity guard.' }))
      .status,
    'supported',
  );
  assert.equal(f.state().attempts.length, 3);
});

posixTest(
  'explicit current permit adopts changed need and evaluator while preserving revision history',
  async (t) => {
    const f = fixture(t);
    await f.run();
    f.contract.intent += ' Updated need.';
    f.writeContract();
    assert.equal(f.status().status, 'stale');
    assert.equal((await f.run()).status, 'supported');
    assert.equal(f.state().revisions.length, 2);
    assert.equal(f.state().attempts.length, 2);
  },
);

for (const [label, source] of [
  ['nonzero exit', 'process.exit(1)'],
  ['import crash', "await import('./missing.mjs')"],
  ['malformed JSON', "console.log('not-json')"],
  [
    'wrong check',
    "console.log(JSON.stringify({format:1,check:'other',verdicts:{capacity:'failed'}}))",
  ],
  [
    'missing criterion',
    'console.log(JSON.stringify({format:1,check:process.argv[4],verdicts:{}}))',
  ],
]) {
  posixTest(`fault ${label} is an interrupted attempt, never fault detection`, async (t) => {
    const f = fixture(t);
    f.runner(source);
    const report = await f.run();
    assert.equal(report.status, 'halted');
    assert.equal(report.criteria[0].status, 'interrupted');
    assert.equal(
      report.results.some((result) => result.status === 'not-run'),
      true,
    );
  });
}

posixTest(
  'output and timeout bounds halt without treating killed fault controls as proof',
  async (t) => {
    const f = fixture(t);
    f.contract.limits = { maxOutputBytes: 100, childTimeoutMs: 100 };
    f.writeContract();
    f.runner("setInterval(()=>process.stdout.write('x'.repeat(1000)),1)");
    const report = await f.run();
    assert.equal(report.status, 'halted');
    assert.equal(report.results[0].status, 'interrupted');
  },
);

posixTest('snapshot preserves the exact candidate bytes from before execution', async (t) => {
  const f = fixture(t);
  const before = fs.readFileSync(path.join(f.root, 'candidate.json'));
  await f.run();
  const snapshot = JSON.parse(fs.readFileSync(path.join(f.session, 'snapshot-1.json')));
  assert.deepEqual(Buffer.from(snapshot.candidate[0].bytes, 'base64'), before);
});

posixTest('candidate mutation during verification invalidates evidence and halts', async (t) => {
  const f = fixture(t);
  f.runner(
    `import fs from 'node:fs'; import path from 'node:path'; const [root,mode,check]=process.argv.slice(2); if(mode==='candidate')fs.appendFileSync(path.join(root,'candidate.json'),' '); console.log(JSON.stringify({format:1,check,verdicts:{capacity:mode==='overbook'?'failed':'passed'}})); process.exitCode=mode==='overbook'?1:0;`,
  );
  assert.equal((await f.run()).status, 'halted');
  assert.equal(f.status().fresh, false);
});

posixTest(
  'existing lock and pending intent require reconciliation and are preserved',
  async (t) => {
    const f = fixture(t);
    await f.run();
    const lock = path.join(f.session, 'lock');
    fs.writeFileSync(lock, 'unreconciled');
    await assert.rejects(f.run(), /lock|EEXIST/i);
    assert.equal(fs.readFileSync(lock, 'utf8'), 'unreconciled');
    fs.unlinkSync(lock);
    const state = f.state();
    state.pending = true;
    fs.writeFileSync(path.join(f.session, 'state.json'), JSON.stringify(state));
    assert.equal(f.status().status, 'halted');
    assert.equal((await f.run()).status, 'halted');
  },
);

posixTest('session scope cannot be replaced by a different root', async (t) => {
  const f = fixture(t);
  await f.run();
  const other = fixture(t);
  const before = fs.readFileSync(path.join(f.session, 'state.json'));
  await assert.rejects(
    runEvidence({
      root: other.root,
      evaluatorRoot: other.evaluatorRoot,
      contractPath: other.contractPath,
      session: f.session,
      permit: other.plan().permit,
    }),
    /scope/i,
  );
  assert.deepEqual(fs.readFileSync(path.join(f.session, 'state.json')), before);
});

posixTest(
  'session and evaluator must stay outside candidate; symlink inputs rejected',
  async (t) => {
    const f = fixture(t);
    await assert.rejects(f.run({ session: path.join(f.root, 'session') }), /outside/i);
    assert.throws(() => inspectEvidence({ ...f, evaluatorRoot: f.root }), /separate/i);
    fs.unlinkSync(path.join(f.root, 'candidate.json'));
    fs.symlinkSync(
      path.join(f.evaluatorRoot, 'contract.json'),
      path.join(f.root, 'candidate.json'),
    );
    await assert.rejects(f.run(), /[Ss]ymbolic/);
  },
);

test('hard contract bounds reject excessive calls and attempts before execution', (t) => {
  const f = fixture(t);
  f.contract.limits = { maxAttempts: 11 };
  f.writeContract();
  assert.throws(f.plan, /limit/i);
  delete f.contract.limits;
  f.contract.checks[0].faults = Array.from({ length: 64 }, (_, index) => ({
    id: `fault${index}`,
    target: 'capacity',
  }));
  f.writeContract();
  assert.throws(f.plan, /64/);
});

test('every control is scheduled before every candidate check', (t) => {
  const f = fixture(t);
  f.contract.checks.push({ ...f.contract.checks[0], id: 'second' });
  f.writeContract();
  assert.deepEqual(
    f.plan().invocations.map(({ mode }) => mode),
    ['healthy', 'overbook', 'healthy', 'overbook', 'candidate', 'candidate'],
  );
});

posixTest('a valid correlated fault may fail its target and additional criteria', async (t) => {
  const f = fixture(t);
  f.contract.criteria.push({ id: 'identity', description: 'Keep the booking identity.' });
  f.contract.checks[0].criteria.push('identity');
  f.contract.checks[0].faults.push({ id: 'identity-loss', target: 'identity' });
  f.writeContract();
  f.runner(
    `const [,mode,check]=process.argv.slice(2); const verdict=mode==='candidate'||mode==='healthy'?'passed':'failed'; console.log(JSON.stringify({format:1,check,verdicts:{capacity:verdict,identity:verdict}})); process.exitCode=verdict==='failed'?1:0;`,
  );
  const report = await f.run();
  assert.equal(report.status, 'supported');
  assert.deepEqual(
    report.criteria.map(({ status }) => status),
    ['supported', 'supported'],
  );
});

posixTest('a fault passing its target cannot calibrate by failing another criterion', async (t) => {
  const f = fixture(t);
  f.contract.criteria.push({ id: 'identity', description: 'Keep the booking identity.' });
  f.contract.checks[0].criteria.push('identity');
  f.contract.checks[0].faults.push({ id: 'identity-loss', target: 'identity' });
  f.writeContract();
  f.runner(
    `const [,mode,check]=process.argv.slice(2); const capacity=mode==='identity-loss'?'failed':'passed'; const identity=mode==='overbook'?'failed':'passed'; console.log(JSON.stringify({format:1,check,verdicts:{capacity,identity}})); process.exitCode=capacity==='failed'||identity==='failed'?1:0;`,
  );
  const report = await f.run();
  assert.equal(report.status, 'failed');
  assert.deepEqual(
    report.criteria.map(({ status }) => status),
    ['calibration-failed', 'calibration-failed'],
  );
  assert.equal(report.results.at(-1).status, 'not-run');
});

posixTest('a healthy control failure prevents support even when fault targets fail', async (t) => {
  const f = fixture(t);
  f.runner(
    `const [,mode,check]=process.argv.slice(2); const failed=mode!=='candidate'; console.log(JSON.stringify({format:1,check,verdicts:{capacity:failed?'failed':'passed'}})); process.exitCode=failed?1:0;`,
  );
  const report = await f.run();
  assert.equal(report.status, 'failed');
  assert.equal(report.criteria[0].status, 'calibration-failed');
  assert.equal(report.results.at(-1).status, 'not-run');
});

posixTest(
  'changing failure signatures without measurable progress still exhausts the session',
  async (t) => {
    const f = fixture(t);
    f.contract.criteria.push({ id: 'identity', description: 'Keep the booking identity.' });
    f.contract.checks[0].criteria.push('identity');
    f.contract.checks[0].faults.push({ id: 'identity-loss', target: 'identity' });
    f.contract.limits = { maxNoProgress: 1 };
    f.writeContract();
    f.runner(
      `import fs from 'node:fs'; import path from 'node:path'; const [root,mode,check]=process.argv.slice(2); const selected=JSON.parse(fs.readFileSync(path.join(root,'candidate.json'))).verdict; const failed=mode==='candidate'?selected:mode==='overbook'?'capacity':mode==='identity-loss'?'identity':null; console.log(JSON.stringify({format:1,check,verdicts:{capacity:failed==='capacity'?'failed':'passed',identity:failed==='identity'?'failed':'passed'}})); process.exitCode=failed?1:0;`,
    );
    f.candidate('capacity');
    assert.equal((await f.run()).status, 'failed');
    f.candidate('identity');
    const report = await f.run({
      diagnosis: 'Changed failing behavior.',
      adjustment: 'Attempted a different boundary correction.',
    });
    assert.equal(report.status, 'halted');
    assert.equal(report.reason, 'no-progress-limit');
    assert.notEqual(f.state().attempts[0].signature, f.state().attempts[1].signature);
  },
);

posixTest(
  'finite attempt budget remains exhausted after a contract revision increases its requested limit',
  async (t) => {
    const f = fixture(t);
    f.contract.limits = { maxAttempts: 1 };
    f.writeContract();
    f.candidate('failed');
    assert.equal((await f.run()).reason, 'attempt-limit');
    f.contract.limits.maxAttempts = 10;
    f.writeContract();
    f.candidate();
    assert.equal((await f.run()).status, 'halted');
    assert.equal(f.state().attempts.length, 1);
  },
);

posixTest('hanging evaluator times out and never qualifies as a fault control', async (t) => {
  const f = fixture(t);
  f.contract.limits = { childTimeoutMs: 100 };
  f.writeContract();
  f.runner('setInterval(()=>{},1000)');
  const report = await f.run();
  assert.equal(report.status, 'halted');
  assert.equal(report.results[0].reason, 'timeout');
});

posixTest(
  'evaluator receives a minimal environment without inherited credentials or NODE_OPTIONS',
  async (t) => {
    const f = fixture(t);
    const previous = process.env.EVIDENCE_TEST_SECRET;
    process.env.EVIDENCE_TEST_SECRET = 'must-not-reach-child';
    t.after(() => {
      if (previous === undefined) delete process.env.EVIDENCE_TEST_SECRET;
      else process.env.EVIDENCE_TEST_SECRET = previous;
    });
    f.runner(
      `const [,mode,check]=process.argv.slice(2); if(process.env.EVIDENCE_TEST_SECRET || process.env.NODE_OPTIONS || process.env.HOME) process.exit(12); console.log(JSON.stringify({format:1,check,verdicts:{capacity:mode==='overbook'?'failed':'passed'}})); process.exitCode=mode==='overbook'?1:0;`,
    );
    assert.equal((await f.run()).status, 'supported');
  },
);
