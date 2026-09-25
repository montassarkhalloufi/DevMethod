import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createControl } from './controls.mjs';

const [candidateRoot, mode, check] = process.argv.slice(2);
if (!candidateRoot || check !== 'queue-partial' || !['candidate', 'healthy', 'duplicate', 'resurrect'].includes(mode)) throw new Error('Invalid runner invocation');
const open = mode === 'candidate' ? (await import(pathToFileURL(join(candidateRoot, 'queue.mjs')).href)).createQueue : file => createControl(file, mode);
const directory = mkdtempSync(join(tmpdir(), 'devmethod-queue-holdout-'));
try {
  const first = open(join(directory, 'idempotency.json'));
  const inserted = first.enqueue('job-41');
  const repeated = first.enqueue('job-41');
  const idempotency = inserted === true && repeated === false && JSON.stringify(first.pending()) === '["job-41"]';
  const second = open(join(directory, 'finality.json'));
  second.enqueue('job-42');
  const completed = second.complete('job-42');
  const resurrected = second.enqueue('job-42');
  const finality = completed === true && resurrected === false && second.pending().length === 0;
  // Deliberate weak oracle: same-handle checks do not establish restart behavior.
  const verdict = value => value ? 'passed' : 'failed';
  process.stdout.write(JSON.stringify({ format: 1, check, verdicts: { idempotency: verdict(idempotency), finality: verdict(finality) } }));
  process.exitCode = idempotency && finality ? 0 : 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
