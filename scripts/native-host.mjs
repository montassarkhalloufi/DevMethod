import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { checkPath } from '../dist/filesystem.js';

/** Bounded process supervision. Success means process exit, not task acceptance. */
export async function supervise({ command, args, cwd, prompt, timeoutMs, signal, env, maxBytes = 2 * 1024 * 1024 }) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw new Error('Timeout must be 1–120000 ms.');
  if (signal?.aborted) return { status: 'cancelled', exit: null, stdout: '', stderr: '', elapsedSeconds: 0 };
  const start = Date.now();
  return await new Promise(resolve => {
    const child = spawn(command, args, { cwd, env, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', bytes = 0, stopped, killTimer, settled = false;
    const kill = name => { try { if (process.platform !== 'win32') process.kill(-child.pid, name); else child.kill(name); } catch {} };
    const stop = reason => { if (stopped) return; stopped = reason; kill('SIGTERM'); killTimer = setTimeout(() => kill('SIGKILL'), 1500); };
    const timer = setTimeout(() => stop('timeout'), timeoutMs);
    const cancel = () => stop('cancelled'); signal?.addEventListener('abort', cancel, { once: true });
    const finish = (exit, error) => {
      if (settled) return; settled = true; clearTimeout(timer); clearTimeout(killTimer); signal?.removeEventListener('abort', cancel);
      // Terminate remaining descendants even if the direct child already exited.
      if (process.platform !== 'win32') kill('SIGKILL');
      resolve({ status: stopped ?? (error ? 'unavailable' : exit === 0 ? 'exited' : 'failed'), exit, error: error?.message,
        stdout, stderr, elapsedSeconds: (Date.now()-start)/1000 });
    };
    const read = (chunk, kind) => { bytes += Buffer.byteLength(chunk); if (bytes > maxBytes) { stop('output-limit'); return; }
      if (kind === 'out') stdout += chunk.toString(); else stderr += chunk.toString(); };
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', c => read(c,'out')); child.stderr.on('data', c => read(c,'err'));
    child.once('error', e => finish(null,e)); child.once('close', code => finish(code));
    child.stdin.on('error', () => {}); child.stdin.end(prompt);
  });
}
/** Immutable per-run slots avoid blind retries. Ledger lives outside worker writable roots. */
export function reserveRun(ledgerRoot, id, { maxRuns = 12, observedTokenStop = 500000 } = {}) {
  if (!Number.isInteger(maxRuns) || maxRuns < 1 || maxRuns > 12 || !Number.isSafeInteger(observedTokenStop) || observedTokenStop < 1 || observedTokenStop > 500000) throw new Error('Invalid bounded pilot limits.');
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(id)) throw new Error('Invalid run ID.');
  checkPath(path.resolve(ledgerRoot)); fs.mkdirSync(ledgerRoot, { recursive: true });
  const lock = path.join(ledgerRoot, '.lock'); const fd = fs.openSync(lock, 'wx');
  try {
    const records = fs.readdirSync(ledgerRoot).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(ledgerRoot,n),'utf8')));
    if (records.length >= maxRuns) throw new Error('Run limit reached.');
    if (records.some(r=>!['exited','failed'].includes(r.status) || r.usage === null)) throw new Error('Interrupted, cancelled, unavailable or unmetered run requires reconciliation; no automatic retry.');
    const used = records.reduce((n,r)=>n+r.usage.inputTokens+r.usage.outputTokens,0);
    if (used >= observedTokenStop) throw new Error('Observed token stop reached. This is an inter-run stop, not a per-request cap.');
    const file = path.join(ledgerRoot, `${id}.json`);
    fs.writeFileSync(file, JSON.stringify({ id, status: 'running', usage: null }), { flag: 'wx' }); return file;
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
export function recordRun(file, result) {
  checkPath(path.resolve(file));
  const previous = JSON.parse(fs.readFileSync(file));
  if (previous.status !== 'running') throw new Error('Run already finalized.');
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify({ ...result, id: previous.id }, null, 2), { flag: 'wx' }); fs.renameSync(temporary,file);
}
