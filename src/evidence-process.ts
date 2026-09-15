import { spawn } from 'node:child_process';
import path from 'node:path';
import { object } from './records.js';
import { parseJson } from './filesystem.js';
import type { EvidenceCheck } from './evidence-contract.js';

export interface EvidenceResult {
  check: string;
  mode: string;
  status: 'completed' | 'interrupted' | 'not-run';
  verdicts?: Record<string, 'passed' | 'failed'>;
  reason?: string;
}

function verdicts(bytes: Buffer, check: EvidenceCheck): Record<string, 'passed' | 'failed'> {
  const record = parseJson(bytes.toString('utf8'));
  if (!object(record) || Object.keys(record).sort().join(',') !== 'check,format,verdicts')
    throw new Error('Invalid verdict envelope.');
  if (record.format !== 1 || record.check !== check.id || !object(record.verdicts))
    throw new Error('Verdict check identity mismatch.');
  if (Object.keys(record.verdicts).sort().join('\0') !== [...check.criteria].sort().join('\0'))
    throw new Error('Verdict criteria mismatch.');
  if (Object.values(record.verdicts).some((value) => value !== 'passed' && value !== 'failed'))
    throw new Error('Invalid criterion verdict.');
  return record.verdicts as Record<string, 'passed' | 'failed'>;
}

export function executeCheck(options: {
  root: string;
  evaluatorRoot: string;
  check: EvidenceCheck;
  mode: string;
  timeoutMs: number;
  maxOutputBytes: number;
}): Promise<EvidenceResult> {
  const { check, mode } = options;
  if (process.platform === 'win32')
    throw new Error('Execution requires the POSIX process-group profile.');
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [path.join(options.evaluatorRoot, check.runner), options.root, mode, check.id],
      {
        cwd: options.evaluatorRoot,
        env: { PATH: path.dirname(process.execPath), LANG: 'C', TZ: 'UTC' },
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      },
    );
    const chunks: Buffer[] = [];
    let bytes = 0;
    let reason: string | undefined;
    let settled = false;
    const killGroup = () => {
      if (!child.pid) return;
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        /* Already exited. */
      }
    };
    const finish = (result: EvidenceResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      killGroup();
      child.stdout.destroy();
      child.stderr.destroy();
      child.unref();
      resolve(result);
    };
    const stop = (failure: string) => {
      if (settled || reason) return;
      reason = failure;
      killGroup();
      child.stdout.destroy();
      child.stderr.destroy();
    };
    const timer = setTimeout(() => stop('timeout'), options.timeoutMs);
    const output = (chunk: Buffer, stdout: boolean) => {
      bytes += chunk.length;
      if (bytes > options.maxOutputBytes) return stop('output-limit');
      if (stdout) chunks.push(chunk);
    };
    child.stdout.on('data', (chunk: Buffer) => output(chunk, true));
    child.stderr.on('data', (chunk: Buffer) => output(chunk, false));
    child.on('error', () =>
      finish({ check: check.id, mode, status: 'interrupted', reason: 'spawn-error' }),
    );
    child.on('exit', killGroup);
    child.on('close', (code, signal) => {
      if (settled) return;
      if (reason || signal || code !== 0)
        return finish({
          check: check.id,
          mode,
          status: 'interrupted',
          reason: reason ?? 'nonzero-exit-or-signal',
        });
      try {
        finish({
          check: check.id,
          mode,
          status: 'completed',
          verdicts: verdicts(Buffer.concat(chunks), check),
        });
      } catch {
        finish({
          check: check.id,
          mode,
          status: 'interrupted',
          reason: 'invalid-verdict-protocol',
        });
      }
    });
  });
}
