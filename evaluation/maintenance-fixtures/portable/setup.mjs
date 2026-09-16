import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const [suite, id, destination, ...extra] = process.argv.slice(2);
if (extra.length || !suite || !destination || !path.isAbsolute(suite) || !path.isAbsolute(destination) || fs.existsSync(destination)) {
  throw new Error('Usage: setup.mjs <absolute exported suite> <case id> <new absolute worker destination>');
}
const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const portable = JSON.parse(fs.readFileSync(path.join(here, 'portable-manifest.json')));
assert.equal(sha(path.join(suite, 'FREEZE.json')), portable.freezeSha256, 'Frozen manifest changed');
const frozen = JSON.parse(fs.readFileSync(path.join(suite, 'FREEZE.json')));
assert.equal(sha(path.join(suite, 'manifest.json')), frozen.files['manifest.json'], 'Suite manifest changed');
const manifest = JSON.parse(fs.readFileSync(path.join(suite, 'manifest.json')));
const entry = manifest.cases.find((item) => item.id === id);
const expected = portable.cases[id];
assert.ok(entry && expected, 'Unknown public case');
assert.equal(sha(path.join(suite, entry.initialState)), frozen.files[entry.initialState], 'Initial state changed');
const state = JSON.parse(fs.readFileSync(path.join(suite, entry.initialState)));
assert.equal(expected.head, state.head);
assert.equal(expected.baseTree, state.baseTree);
assert.equal(expected.indexTree, state.baseTree, 'This helper is limited to the frozen unstaged initial changes');
const bundle = path.join(here, expected.bundle);
assert.equal(sha(bundle), expected.bundleSha256, 'Bundle changed');
const source = path.join(suite, entry.directory);
const prefix = entry.directory + '/';
const wanted = Object.keys(frozen.files).filter((file) => file.startsWith(prefix)).map((file) => file.slice(prefix.length)).sort();
function files(root, relative = '') {
  return fs.readdirSync(path.join(root, relative), { withFileTypes: true }).flatMap((item) => {
    if (item.name === '.git') return [];
    const local = path.join(relative, item.name);
    assert.ok(item.isFile() || item.isDirectory(), 'Non-regular exported input: ' + local);
    return item.isDirectory() ? files(root, local) : [local];
  }).sort();
}
assert.deepEqual(files(source), wanted, 'Worker file inventory changed');
for (const file of wanted) assert.equal(sha(path.join(source, file)), frozen.files[prefix + file], 'Worker changed: ' + file);
fs.mkdirSync(destination, { recursive: false });
for (const file of wanted) {
  const target = path.join(destination, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(source, file), target);
}
const git = (...args) => execFileSync('git', ['-c', 'core.autocrlf=false', ...args], { cwd: destination, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trimEnd();
git('init', '-q');
git('fetch', '-q', bundle, 'HEAD');
git('update-ref', 'refs/heads/main', expected.head);
git('symbolic-ref', 'HEAD', 'refs/heads/main');
git('read-tree', expected.indexTree);
const observed = {
  head: git('rev-parse', 'HEAD'),
  baseTree: git('rev-parse', 'HEAD^{tree}'),
  indexTree: git('write-tree'),
  diff: git('diff'),
  stagedDiff: git('diff', '--cached'),
  status: git('status', '--short'),
};
for (const key of Object.keys(observed)) assert.equal(observed[key], expected[key], 'Initial Git state changed: ' + key);
console.log(JSON.stringify({ format: 1, case: id, destination, freezeSha256: portable.freezeSha256, portableManifestSha256: sha(path.join(here, 'portable-manifest.json')), observed, exactStartingStatePreserved: true }, null, 2));
