import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const record = path.join(root, 'EXPORT.json');
assert.equal(hash(record), fs.readFileSync(path.join(root, 'EXPORT.sha256'), 'utf8').trim());
const files = JSON.parse(fs.readFileSync(record)).files;
for (const [name, expected] of Object.entries(files)) assert.equal(hash(path.join(root, name)), expected, name);
function walk(dir, prefix = '') { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => { const name = prefix + entry.name; assert.ok(!entry.isSymbolicLink()); return entry.isDirectory() ? walk(path.join(dir, entry.name), name + '/') : [name]; }); }
assert.deepEqual(walk(root).filter((name) => !['EXPORT.json', 'EXPORT.sha256'].includes(name)).sort(), Object.keys(files).sort());
console.log(JSON.stringify({ status: 'public-export-matches', files: Object.keys(files).length, note: 'Original complete private population is not distributed or reconstructed' }));
const [suite] = process.argv.slice(2);
if (suite) {
  assert.ok(path.isAbsolute(suite));
  const publicFreeze = JSON.parse(fs.readFileSync(path.join(suite, 'FREEZE.json')));
  assert.equal(hash(path.join(suite, 'FREEZE.json')), JSON.parse(fs.readFileSync(record)).publicFreezeSha256);
  assert.equal(fs.readFileSync(path.join(suite, 'FREEZE.sha256'), 'utf8').trim(), hash(path.join(suite, 'FREEZE.json')));
  const actual = walk(suite).filter((name) => !['FREEZE.json', 'FREEZE.sha256'].includes(name)).sort();
  assert.deepEqual(actual, Object.keys(publicFreeze.files).sort());
  for (const [name, expected] of Object.entries(publicFreeze.files)) assert.equal(hash(path.join(suite, name)), expected, name);
  assert.ok(!actual.some((name) => name.startsWith('reserved-transfer/') || name.split('/').includes('.git')));
  console.log(JSON.stringify({ status: 'public-derived-suite-matches', files: actual.length + 2, originalFullFreezeClaimed: false }));
}
