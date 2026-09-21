import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const here = path.dirname(fileURLToPath(import.meta.url));
const [suite, output] = process.argv.slice(2);
assert.ok(suite && output && path.isAbsolute(suite) && path.isAbsolute(output));
assert.ok(!fs.existsSync(output), 'Refuse replacing evidence');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'devmethod-portable-adoption-'));
const exported = path.join(temp, 'exported');
fs.mkdirSync(exported);
const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const freezeBefore = sha(path.join(suite, 'FREEZE.json'));
const manifest = JSON.parse(fs.readFileSync(path.join(suite, 'manifest.json')));
for (const name of ['manifest.json', 'FREEZE.json']) fs.copyFileSync(path.join(suite, name), path.join(exported, name));
for (const entry of manifest.cases) {
  fs.mkdirSync(path.dirname(path.join(exported, entry.initialState)), { recursive: true });
  fs.copyFileSync(path.join(suite, entry.initialState), path.join(exported, entry.initialState));
  fs.cpSync(path.join(suite, entry.directory), path.join(exported, entry.directory), { recursive: true, filter: (file) => path.basename(file) !== '.git' });
}
function containsGit(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).some((item) => item.name === '.git' || (item.isDirectory() && containsGit(path.join(directory, item.name))));
}
assert.equal(containsGit(exported), false);
const records = [];
const run = (id, destination) => {
  const before = performance.now();
  const result = spawnSync(process.execPath, [path.join(here, 'setup.mjs'), exported, id, destination], { encoding: 'utf8', timeout: 10000 });
  const record = { case: id, destination, exit: result.status, stdout: result.stdout, stderr: result.stderr, error: result.error?.message ?? null, elapsedMs: performance.now() - before };
  records.push(record);
  return record;
};
for (const entry of manifest.cases) {
  const destination = path.join(temp, entry.id);
  const record = run(entry.id, destination);
  assert.equal(record.exit, 0, record.stderr);
  assert.equal(JSON.parse(record.stdout).exactStartingStatePreserved, true);
}
const exists = run(manifest.cases[0].id, path.join(temp, manifest.cases[0].id));
assert.notEqual(exists.exit, 0);
assert.match(exists.stderr, /new absolute worker destination/);
const modified = path.join(exported, manifest.cases[0].directory, 'public/styles.css');
fs.appendFileSync(modified, '\n/* tampered export */\n');
const tamperedDestination = path.join(temp, 'tampered');
const tampered = run(manifest.cases[0].id, tamperedDestination);
assert.notEqual(tampered.exit, 0);
assert.match(tampered.stderr, /Worker changed: public\/styles.css/);
assert.equal(fs.existsSync(tamperedDestination), false);
assert.equal(sha(path.join(suite, 'FREEZE.json')), freezeBefore);
const result = { format: 1, kind: 'Local deterministic adoption check; no model or native run', scope: 'Three public cases exported without .git; reserved transfer never read or copied', runtime: { version: process.version, execPath: process.execPath }, exported, freezeSha256: freezeBefore, originalFreezeUnchanged: true, exportedHasNoGitDirectories: false === containsGit(exported), checksPassed: 5, records };
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ output, checksPassed: result.checksPassed, originalFreezeUnchanged: true }));
