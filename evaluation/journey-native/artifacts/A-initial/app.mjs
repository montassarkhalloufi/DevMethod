import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const ID_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;
const STATUSES = new Set(['open', 'done']);

class CliError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function fail(code) {
  throw new CliError(code);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactly(value, expected) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function normalizeTitle(value, errorCode) {
  if (typeof value !== 'string') fail(errorCode);
  const title = value.trim();
  const length = [...title].length;
  if (length < 1 || length > 80) fail(errorCode);
  return title;
}

function validateId(value, errorCode) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) fail(errorCode);
  return value;
}

function load(dataFile) {
  let bytes;
  try {
    bytes = fs.readFileSync(dataFile, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    fail('storage-error');
  }

  let stored;
  try {
    stored = JSON.parse(bytes);
  } catch {
    fail('invalid-data');
  }

  if (!hasExactly(stored, ['version', 'jobs']) || stored.version !== 1 || !Array.isArray(stored.jobs)) {
    fail('invalid-data');
  }

  const ids = new Set();
  return stored.jobs.map((candidate) => {
    if (!hasExactly(candidate, ['id', 'title', 'status'])) fail('invalid-data');
    const id = validateId(candidate.id, 'invalid-data');
    const title = normalizeTitle(candidate.title, 'invalid-data');
    if (!STATUSES.has(candidate.status) || ids.has(id)) fail('invalid-data');
    ids.add(id);
    return { id, title, status: candidate.status };
  });
}

function sorted(jobs) {
  return [...jobs].sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
}

function save(dataFile, jobs) {
  const directory = path.dirname(path.resolve(dataFile));
  const temporary = path.join(directory, `.${path.basename(dataFile)}.${process.pid}.${randomUUID()}.tmp`);
  const bytes = JSON.stringify({ version: 1, jobs: sorted(jobs) }) + '\n';
  try {
    fs.writeFileSync(temporary, bytes, { flag: 'wx' });
    fs.renameSync(temporary, dataFile);
  } catch {
    try { fs.unlinkSync(temporary); } catch { /* Nothing to clean up. */ }
    fail('storage-error');
  }
}

function parsePayload(raw, fields) {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    fail('invalid-input');
  }
  if (!hasExactly(payload, fields)) fail('invalid-input');
  return payload;
}

function execute(argv) {
  if (argv.length < 2) fail('invalid-input');
  const [dataFile, command, ...rest] = argv;
  if (typeof dataFile !== 'string' || dataFile.length === 0) fail('invalid-input');

  if (command === 'list') {
    if (rest.length !== 0) fail('invalid-input');
    return sorted(load(dataFile));
  }

  if (command === 'add') {
    if (rest.length !== 1) fail('invalid-input');
    const payload = parsePayload(rest[0], ['id', 'title']);
    const id = validateId(payload.id, 'invalid-input');
    const title = normalizeTitle(payload.title, 'invalid-input');
    const jobs = load(dataFile);
    const existing = jobs.find((job) => job.id === id);
    if (existing) {
      if (existing.title !== title) fail('conflict');
      return existing;
    }
    const job = { id, title, status: 'open' };
    jobs.push(job);
    save(dataFile, jobs);
    return job;
  }

  if (command === 'finish') {
    if (rest.length !== 1) fail('invalid-input');
    const payload = parsePayload(rest[0], ['id']);
    const id = validateId(payload.id, 'invalid-input');
    const jobs = load(dataFile);
    const job = jobs.find((candidate) => candidate.id === id);
    if (!job) fail('not-found');
    if (job.status === 'open') {
      job.status = 'done';
      save(dataFile, jobs);
    }
    return job;
  }

  fail('invalid-input');
}

try {
  const result = execute(process.argv.slice(2));
  process.stdout.write(JSON.stringify(result) + '\n');
} catch (error) {
  const code = error instanceof CliError ? error.code : 'storage-error';
  process.stderr.write(JSON.stringify({ error: code }) + '\n');
  process.exitCode = 1;
}
