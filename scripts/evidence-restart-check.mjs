import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

// Copied alongside the unchanged V2 checker, controls and restart adjudicator.
const directory = path.dirname(fileURLToPath(import.meta.url));
const [candidateRoot, mode, check] = process.argv.slice(2);
const modes = ['candidate', 'healthy', 'duplicate', 'resurrect'];
if (!candidateRoot || !modes.includes(mode) || check !== 'queue-partial') {
  throw new Error('Invalid restart checker invocation');
}

function execute(file, args) {
  const argv = [path.join(directory, file), ...args];
  const child = spawnSync(process.execPath, argv, {
    encoding: 'utf8',
    timeout: 7000,
    maxBuffer: 16384,
  });
  const observation = {
    argv: [process.execPath, ...argv],
    status: child.status,
    signal: child.signal,
    error: child.error?.message ?? null,
    stdout: child.stdout,
    stderr: child.stderr,
  };
  process.stderr.write(JSON.stringify(observation) + '\n');
  if (child.error || child.signal || ![0, 1].includes(child.status)) {
    throw new Error(`Restart probe execution failed: ${file}`);
  }
  return { status: child.status, report: JSON.parse(child.stdout) };
}

function validate(result, keys, checkIdentity) {
  const report = result.report;
  if (!report || report.format !== 1 || !checkIdentity(report)) {
    throw new Error('Invalid nested probe identity');
  }
  const values = keys.map((key) => report.verdicts?.[key] ?? report[key]);
  if (values.some((value) => !['passed', 'failed'].includes(value))) {
    throw new Error('Invalid nested probe verdict');
  }
  if (result.status !== (values.includes('failed') ? 1 : 0)) {
    throw new Error('Nested probe exit contradicts its verdict');
  }
  return values;
}

const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'queue-restart-check-'));
try {
  let restartRoot = candidateRoot;
  if (mode !== 'candidate') {
    restartRoot = temporary;
    const controls = pathToFileURL(path.join(directory, 'controls.mjs')).href;
    fs.writeFileSync(
      path.join(temporary, 'queue.mjs'),
      `import {createControl} from ${JSON.stringify(controls)};\nexport const createQueue = file => createControl(file, ${JSON.stringify(mode)});\n`,
    );
  }
  const partial = execute('runner-v2.mjs', [candidateRoot, mode, check]);
  const ordinary = validate(
    partial,
    ['idempotency', 'finality'],
    (report) => report.check === check,
  );
  const restart = execute('adjudicate.mjs', [restartRoot]);
  const reopened = validate(
    restart,
    ['durability', 'finality'],
    (report) => report.kind === 'independent-restart-adjudication',
  );
  const verdicts = Object.fromEntries(
    ['idempotency', 'finality'].map((id, index) => [
      id,
      ordinary[index] === 'passed' && reopened[index] === 'passed' ? 'passed' : 'failed',
    ]),
  );
  process.stdout.write(JSON.stringify({ format: 1, check, verdicts }) + '\n');
  process.exitCode = Object.values(verdicts).includes('failed') ? 1 : 0;
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
