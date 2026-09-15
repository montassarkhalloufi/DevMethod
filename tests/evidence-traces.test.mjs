import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const repository = fileURLToPath(new URL('../', import.meta.url));

function write(root, name, value) {
  const file = path.join(root, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
}

function fixture(t, script, outcome) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-trace-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(
    root,
    `scripts/${script}.mjs`,
    fs.readFileSync(path.join(repository, `scripts/${script}.mjs`)),
  );
  write(root, 'package.json', '{"type":"module"}');
  write(root, 'examples/evidence-lab/app/placeholder', 'isolated fixture');
  write(root, 'examples/evidence-lab/evaluator/contract.json', '{}');
  write(root, 'examples/evidence-lab/evaluator/weak-contract.json', '{}');
  // Use a real valid manifest for only this temporary harness, never the frozen population.
  write(
    root,
    'evaluation/evidence-holdout/SHA256SUMS-v2',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  empty\n',
  );
  write(root, 'evaluation/evidence-holdout/empty', '');
  for (const name of [
    'contract.json',
    'contract-v2.json',
    'runner.mjs',
    'runner-v2.mjs',
    'controls.mjs',
  ]) {
    write(root, `evaluation/evidence-holdout/${name}`, '{}');
  }
  for (const candidate of ['healthy', 'duplicate', 'resurrect', 'lost-restart']) {
    write(root, `evaluation/evidence-holdout/candidates/${candidate}/placeholder`, 'fixture');
  }
  write(
    root,
    'dist/evidence-runtime.js',
    'export const inspectEvidence=()=>({invocations:[],permit:"fixture"}); export const runEvidence=async()=>({status:"supported",results:[]});',
  );
  write(
    root,
    'inject.mjs',
    `import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
const outcome = ${JSON.stringify(outcome)};
childProcess.spawnSync = () => ({ ...outcome, error: outcome.error ? Object.assign(new Error(outcome.error.message), {code:outcome.error.code}) : undefined });
syncBuiltinESMExports();`,
  );
  const temporary = path.join(root, 'tmp');
  fs.mkdirSync(temporary);
  const result = spawnSync(
    process.execPath,
    ['--import', path.join(root, 'inject.mjs'), path.join(root, `scripts/${script}.mjs`)],
    {
      encoding: 'utf8',
      timeout: 5000,
      env: { ...process.env, TMPDIR: temporary, TMP: temporary, TEMP: temporary },
    },
  );
  const entries = fs.readdirSync(temporary);
  assert.equal(entries.length, 1, result.stderr);
  const workspace = path.join(temporary, entries[0]);
  const traceFile = path.join(
    workspace,
    script === 'evidence-demo' ? 'observation-1.json' : 'healthy.json',
  );
  assert.ok(
    fs.existsSync(traceFile),
    `The raw trace must exist before parsing or asserting: ${result.stderr}`,
  );
  return { result, trace: JSON.parse(fs.readFileSync(traceFile, 'utf8')) };
}

const outcomes = {
  malformed: { status: 1, signal: null, stdout: '{invalid', stderr: 'diagnostic malformed' },
  empty: { status: 1, signal: null, stdout: '', stderr: 'diagnostic empty' },
  timeout: {
    status: null,
    signal: 'SIGTERM',
    stdout: 'partial output',
    stderr: 'diagnostic timeout',
    error: { message: 'spawn timed out', code: 'ETIMEDOUT' },
  },
  valid: {
    status: 0,
    signal: null,
    stdout: '{"status":"supported","durability":"passed","finality":"passed"}',
    stderr: 'retained successful stderr',
  },
};

for (const script of ['evidence-demo', 'evidence-holdout']) {
  for (const [kind, outcome] of Object.entries(outcomes)) {
    test(`${script} preserves ${kind} invocation before decoding its report`, (t) => {
      const { result, trace } = fixture(t, script, outcome);
      const invocation =
        script === 'evidence-demo' ? trace.invocation : trace.adjudicatorInvocation;
      assert.ok(invocation, 'Raw invocation metadata is retained alongside existing observations.');
      assert.equal(invocation.argv[0], process.execPath);
      assert.ok(invocation.argv.length >= 3);
      assert.equal(invocation.status, outcome.status);
      assert.equal(invocation.signal, outcome.signal);
      assert.equal(invocation.stdout, outcome.stdout);
      assert.equal(invocation.stderr, outcome.stderr);
      assert.equal(invocation.error?.code ?? null, outcome.error?.code ?? null);
      if (kind === 'valid') {
        assert.deepEqual(
          script === 'evidence-demo' ? trace.report : trace.adjudication,
          JSON.parse(outcome.stdout),
        );
      } else if (kind !== 'timeout' || script === 'evidence-demo') {
        assert.notEqual(result.status, 0, 'Malformed output must not turn into a passing run.');
      }
    });
  }
}
