import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkPath } from '../dist/filesystem.js';

const root = fileURLToPath(new URL('../', import.meta.url));
export const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'evaluation/fixtures.json'))).cases;
const hash = data => createHash('sha256').update(data).digest('hex');
export function snapshot(directory) {
  checkPath(path.resolve(directory));
  const files = {};
  function walk(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      if (entry.name === '.git') continue;
      const relative = prefix + entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Symbolic evidence path: ${relative}`);
      if (entry.isDirectory()) walk(path.join(dir, entry.name), relative + '/');
      else if (entry.isFile()) files[relative] = hash(fs.readFileSync(path.join(dir, entry.name)));
      else throw new Error(`Non-regular evidence path: ${relative}`);
    }
  }
  walk(directory);
  return files;
}
export function prepare(caseId, destination) {
  const fixture = fixtures.find(item => item.id === caseId);
  if (!fixture) throw new Error('Unknown case');
  destination = path.resolve(destination);
  checkPath(destination);
  if (fs.existsSync(destination)) throw new Error('Use a fresh destination');
  const source = path.join(root, fixture.directory);
  if (JSON.stringify(Object.entries(snapshot(source)).sort()) !== JSON.stringify(Object.entries(fixture.files).sort())) throw new Error('Fixture differs from pinned manifest');
  fs.cpSync(source, destination, { recursive: true, errorOnExist: true, force: false });
  return { format: 1, caseId, destination, baseline: snapshot(destination), prompt: fixture.prompt };
}
/** Objective local checks only. This function never invokes or certifies a model. */
export function collect(caseId, destination, baseline) {
  const fixture = fixtures.find(item => item.id === caseId);
  if (!fixture) throw new Error('Unknown case');
  const current = snapshot(destination);
  for (const [name, digest] of Object.entries(fixture.files)) {
    if (baseline[name] !== digest) throw new Error('Baseline does not contain the pinned fixture');
  }
  const changed = [...new Set([...Object.keys(baseline), ...Object.keys(current)])].filter(name => baseline[name] !== current[name]);
  const unauthorizedChanges = changed.filter(name => !fixture.allowedChanges.includes(name));
  const testsIntact = current['acceptance.test.mjs'] === fixture.files['acceptance.test.mjs'];
  // Do not run replaced tests. A native evaluation must separately review model claims.
  const environment = { ...process.env };
  delete environment.NODE_TEST_CONTEXT;
  const check = testsIntact ? spawnSync(process.execPath, fixture.check.slice(1), { cwd: destination, env: environment, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 }) : undefined;
  return { format: 1, caseId, current, changed, unauthorizedChanges, testsIntact,
    check: check ? { exit: check.status, signal: check.signal, stdout: check.stdout, stderr: check.stderr, error: check.error?.message } : { skipped: 'Acceptance tests changed' },
    behavioralReview: 'pending', nativeHostEvidence: 'not established by this collector' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, caseId, destination, baselineFile] = process.argv.slice(2);
    if (!caseId || !destination || !['prepare', 'collect'].includes(command) || (command === 'collect' && !baselineFile)) throw new Error('Usage: node scripts/evaluation.mjs prepare CASE FRESH_DIR | collect CASE DIR BASELINE_JSON');
    const result = command === 'prepare' ? prepare(caseId, destination) : collect(caseId, destination, JSON.parse(fs.readFileSync(baselineFile)).baseline);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 2; }
}
