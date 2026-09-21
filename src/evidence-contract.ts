import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPath, hashFileSha256, parseJson } from './filesystem.js';
import { digest, id, object, safePath, secretPath, text } from './records.js';

export interface EvidenceCheck {
  id: string;
  runner: string;
  criteria: string[];
  healthy?: string;
  faults: { id: string; target: string }[];
}

export interface EvidenceContract {
  format: 1;
  id: string;
  intent: string;
  criteria: { id: string; description: string }[];
  candidateInputs: string[];
  evaluatorFiles: string[];
  checks: EvidenceCheck[];
  limits: {
    maxAttempts: number;
    maxNoProgress: number;
    childTimeoutMs: number;
    attemptTimeoutMs: number;
    maxOutputBytes: number;
  };
}

export interface EvidenceOptions {
  root: string;
  contractPath: string;
  evaluatorRoot: string;
}

export interface FrozenFile {
  path: string;
  sha256: string;
  bytes: string;
}

export const limitations =
  'Experimental local evidence, not semantic acceptance or a security sandbox. Evaluator code and session storage are trusted. Only declared bytes are bound; undeclared dependencies, external writers and TOCTOU are outside this boundary. Controls measure declared fault sensitivity, not test independence or requirement completeness.';

function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function keys(record: Record<string, unknown>, allowed: string[]) {
  requireValue(
    Object.keys(record).every((key) => allowed.includes(key)),
    'Unknown contract field.',
  );
}

function paths(value: unknown): string[] {
  requireValue(
    Array.isArray(value) && value.length > 0 && value.length <= 512,
    'Expected declared files.',
  );
  requireValue(
    value.every((file) => safePath(file) && !secretPath(file)),
    'Unsafe declared path.',
  );
  requireValue(new Set(value).size === value.length, 'Duplicate declared file.');
  return value;
}

function parseCheck(value: unknown, criteria: Set<string>, files: string[]): EvidenceCheck {
  requireValue(object(value), 'Expected check.');
  keys(value, ['id', 'runner', 'criteria', 'healthy', 'faults']);
  requireValue(
    id(value.id) && typeof value.runner === 'string' && files.includes(value.runner),
    'Invalid check runner or id.',
  );
  requireValue(Array.isArray(value.criteria) && value.criteria.length > 0, 'Check needs criteria.');
  requireValue(
    value.criteria.every((item) => typeof item === 'string' && criteria.has(item)),
    'Unknown check criterion.',
  );
  requireValue(
    new Set(value.criteria).size === value.criteria.length,
    'Duplicate check criterion.',
  );
  requireValue(
    value.healthy === undefined || (id(value.healthy) && value.healthy !== 'candidate'),
    'Invalid healthy mode.',
  );
  const faults = value.faults ?? [];
  requireValue(Array.isArray(faults), 'Expected fault controls.');
  const modes = new Set(['candidate', value.healthy]);
  for (const fault of faults) {
    requireValue(object(fault), 'Expected fault control.');
    keys(fault, ['id', 'target']);
    requireValue(id(fault.id) && !modes.has(fault.id), 'Duplicate or invalid control mode.');
    requireValue(
      typeof fault.target === 'string' && value.criteria.includes(fault.target),
      'Invalid fault target.',
    );
    modes.add(fault.id);
  }
  return {
    id: value.id,
    runner: value.runner,
    criteria: value.criteria,
    healthy: value.healthy as string | undefined,
    faults,
  };
}

function limits(value: unknown): EvidenceContract['limits'] {
  const defaults = {
    maxAttempts: 5,
    maxNoProgress: 3,
    childTimeoutMs: 10000,
    attemptTimeoutMs: 60000,
    maxOutputBytes: 65536,
  };
  const maximum = {
    maxAttempts: 10,
    maxNoProgress: 10,
    childTimeoutMs: 30000,
    attemptTimeoutMs: 120000,
    maxOutputBytes: 1048576,
  };
  if (value === undefined) return defaults;
  requireValue(object(value), 'Expected limits.');
  keys(value, Object.keys(defaults));
  for (const field of Object.keys(defaults) as (keyof typeof defaults)[]) {
    const number = value[field] ?? defaults[field];
    requireValue(
      Number.isSafeInteger(number) && Number(number) >= 1 && Number(number) <= maximum[field],
      `Invalid limit: ${field}.`,
    );
    defaults[field] = Number(number);
  }
  return defaults;
}

export function validateEvidenceContract(value: unknown): EvidenceContract {
  requireValue(object(value), 'Expected evidence contract.');
  keys(value, [
    'format',
    'id',
    'intent',
    'criteria',
    'candidateInputs',
    'evaluatorFiles',
    'checks',
    'limits',
  ]);
  requireValue(
    value.format === 1 && id(value.id) && text(value.intent),
    'Invalid contract identity.',
  );
  requireValue(
    Array.isArray(value.criteria) && value.criteria.length > 0 && value.criteria.length <= 64,
    'Expected 1–64 criteria.',
  );
  const criteria = value.criteria.map((criterion) => {
    requireValue(object(criterion), 'Expected criterion.');
    keys(criterion, ['id', 'description']);
    requireValue(id(criterion.id) && text(criterion.description), 'Invalid criterion.');
    return { id: criterion.id, description: criterion.description };
  });
  const ids = new Set(criteria.map((criterion) => criterion.id));
  requireValue(ids.size === criteria.length, 'Duplicate criterion.');
  const candidateInputs = paths(value.candidateInputs);
  const evaluatorFiles = paths(value.evaluatorFiles);
  requireValue(
    candidateInputs.length + evaluatorFiles.length <= 512,
    'Declared file count exceeds 512.',
  );
  requireValue(Array.isArray(value.checks) && value.checks.length > 0, 'Expected checks.');
  const checks = value.checks.map((check) => parseCheck(check, ids, evaluatorFiles));
  requireValue(
    new Set(checks.map((check) => check.id)).size === checks.length,
    'Duplicate check id.',
  );
  requireValue(
    checks.reduce((sum, check) => sum + 1 + Number(!!check.healthy) + check.faults.length, 0) <= 64,
    'More than 64 child invocations.',
  );
  return {
    format: 1,
    id: value.id,
    intent: value.intent,
    criteria,
    candidateInputs,
    evaluatorFiles,
    checks,
    limits: limits(value.limits),
  };
}

export function inside(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

export function canonicalOptions(options: EvidenceOptions): EvidenceOptions {
  const root = path.resolve(options.root);
  const evaluatorRoot = path.resolve(options.evaluatorRoot);
  const contractPath = path.resolve(options.contractPath);
  for (const target of [root, evaluatorRoot, contractPath]) checkPath(target);
  requireValue(
    fs.statSync(root).isDirectory() && fs.statSync(evaluatorRoot).isDirectory(),
    'Expected candidate and evaluator directories.',
  );
  requireValue(
    !inside(root, evaluatorRoot) && !inside(evaluatorRoot, root),
    'Evaluator must be separate from candidate.',
  );
  requireValue(!inside(root, contractPath), 'Contract must be outside candidate.');
  return { root, evaluatorRoot, contractPath };
}

export function boundedFile(file: string, maximum: number): Buffer {
  checkPath(file);
  const initial = fs.lstatSync(file);
  requireValue(initial.isFile() && initial.size <= maximum, 'File exceeds regular-file bounds.');
  const descriptor = fs.openSync(file, 'r');
  try {
    const stat = fs.fstatSync(descriptor);
    requireValue(stat.isFile() && stat.size <= maximum, 'File exceeds regular-file bounds.');
    const bytes = Buffer.alloc(stat.size + 1);
    const count = fs.readSync(descriptor, bytes, 0, bytes.length, 0);
    requireValue(count === stat.size, 'File changed while reading.');
    return bytes.subarray(0, count);
  } finally {
    fs.closeSync(descriptor);
  }
}

export function freezeFiles(root: string, files: string[]): FrozenFile[] {
  let remaining = 32 * 1024 * 1024;
  return files.map((file) => {
    const bytes = boundedFile(path.join(root, file), remaining);
    remaining -= bytes.length;
    requireValue(
      !/-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/.test(bytes.toString('utf8')),
      'Private key input refused.',
    );
    return { path: file, sha256: digest(bytes), bytes: bytes.toString('base64') };
  });
}

export function filesSignature(files: FrozenFile[]): string {
  return digest(JSON.stringify(files.map(({ path: file, sha256 }) => [file, sha256])));
}

export function inspectEvidence(raw: EvidenceOptions) {
  const options = canonicalOptions(raw);
  const bytes = boundedFile(options.contractPath, 1024 * 1024);
  const contract = validateEvidenceContract(parseJson(bytes.toString('utf8')));
  const evaluator = freezeFiles(options.evaluatorRoot, contract.evaluatorFiles);
  const engineFiles = [
    'evidence-contract.js',
    'evidence-process.js',
    'evidence-store.js',
    'evidence-runtime.js',
    'filesystem.js',
    'records.js',
  ];
  const engine = digest(
    JSON.stringify([
      process.version,
      hashFileSha256(process.execPath),
      ...engineFiles.map((file) => hashFileSha256(fileURLToPath(new URL(file, import.meta.url)))),
    ]),
  );
  const permit = digest(
    JSON.stringify([options, digest(bytes), filesSignature(evaluator), engine]),
  );
  const controls = contract.checks.flatMap((check) =>
    [...(check.healthy ? [check.healthy] : []), ...check.faults.map((fault) => fault.id)].map(
      (mode) => ({ check: check.id, runner: check.runner, mode }),
    ),
  );
  const invocations = [
    ...controls,
    ...contract.checks.map((check) => ({
      check: check.id,
      runner: check.runner,
      mode: 'candidate',
    })),
  ];
  return {
    format: 1 as const,
    permit,
    options,
    contract,
    contractSha256: digest(bytes),
    engine,
    evaluatorSignature: filesSignature(evaluator),
    invocations,
    executionSupported: process.platform !== 'win32',
    limitations,
  };
}
