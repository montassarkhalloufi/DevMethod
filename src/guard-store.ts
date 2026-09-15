import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { checkPath, parseJson } from './filesystem.js';
import { readLocal } from './records.js';
import { validateGuardState, type GuardState } from './guard-state.js';
import type { GuardSnapshot } from './guard-context.js';

// 100 attempts × two 8192-character notes, including worst-case JSON escaping.
const MAX_STATE_BYTES = 12 * 1024 * 1024;

export interface GuardStore {
  state: GuardState | null;
  save(state: GuardState): void;
  freeze(snapshot: GuardSnapshot): void;
}

function inside(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

function sessionDirectory(root: string, session: string, create: boolean): string {
  const directory = path.resolve(session);
  checkPath(directory);
  if (inside(root, directory) || inside(directory, root))
    throw new Error('Guard session must be outside, and not an ancestor of, the workspace.');
  if (!fs.existsSync(directory) && create) fs.mkdirSync(directory, { mode: 0o700 });
  if (!fs.statSync(directory).isDirectory()) throw new Error('Expected a guard session directory.');
  return directory;
}

function writeAtomic(directory: string, file: string, data: unknown): void {
  const body = JSON.stringify(data, null, 2) + '\n';
  if (file === 'state.json' && Buffer.byteLength(body) > MAX_STATE_BYTES)
    throw new Error('Guard state exceeds its readable storage bound.');
  const destination = path.join(directory, file);
  checkPath(destination);
  const temporary = path.join(directory, `${file}.${randomUUID()}.tmp`);
  const descriptor = fs.openSync(temporary, 'wx', 0o600);
  try {
    fs.writeFileSync(descriptor, body);
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
  fs.renameSync(temporary, destination);
}

/** Exclusive local lock. A stale lock is never reclaimed automatically. */
export function withGuardStore<T>(
  root: string,
  session: string,
  create: boolean,
  action: (store: GuardStore) => T,
): T {
  const directory = sessionDirectory(root, session, create);
  const lock = path.join(directory, 'lock');
  const descriptor = fs.openSync(lock, 'wx', 0o600);
  try {
    const statePath = path.join(directory, 'state.json');
    if (!fs.existsSync(statePath) && fs.readdirSync(directory).some((file) => file !== 'lock'))
      throw new Error('Unowned session directory must be empty.');
    const state = fs.existsSync(statePath)
      ? validateGuardState(
          parseJson(readLocal(directory, 'state.json', MAX_STATE_BYTES).toString('utf8')),
        )
      : null;
    return action({
      state,
      save: (record) => writeAtomic(directory, 'state.json', validateGuardState(record)),
      freeze: (snapshot) => writeAtomic(directory, 'context.json', snapshot),
    });
  } finally {
    fs.closeSync(descriptor);
    fs.unlinkSync(lock);
  }
}
