import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const directory = mkdtempSync(join(tmpdir(), 'devmethod-queue-restart-'));
const moduleUrl = pathToFileURL(join(process.argv[2], 'queue.mjs')).href;
const worker = "const {createQueue}=await import(process.argv[1]);const q=createQueue(process.argv[2]);if(process.argv[3]==='write'){q.enqueue('waiting');q.enqueue('finished');q.complete('finished');}else{process.stdout.write(JSON.stringify({pending:q.pending(),retry:q.enqueue('finished'),after:q.pending()}));}";
try {
  const run = phase => spawnSync(process.execPath, ['--input-type=module', '-e', worker, moduleUrl, join(directory, 'jobs.json'), phase], { encoding: 'utf8', timeout: 3000, maxBuffer: 16384 });
  const written = run('write');
  if (written.error || written.status !== 0) throw new Error('Writer failed');
  const reopened = run('read');
  if (reopened.error || reopened.status !== 0) throw new Error('Reader failed');
  const observed = JSON.parse(reopened.stdout);
  const durability = JSON.stringify(observed.pending) === '["waiting"]';
  const finality = observed.retry === false && JSON.stringify(observed.after) === '["waiting"]';
  process.stdout.write(JSON.stringify({ format: 1, kind: 'independent-restart-adjudication', durability: durability ? 'passed' : 'failed', finality: finality ? 'passed' : 'failed', observed }));
  process.exitCode = durability && finality ? 0 : 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
