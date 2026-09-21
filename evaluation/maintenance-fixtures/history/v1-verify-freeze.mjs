import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = path.dirname(fileURLToPath(import.meta.url));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const recordBytes = fs.readFileSync(path.join(root, 'FREEZE.json'));
if (hash(recordBytes) !== fs.readFileSync(path.join(root, 'FREEZE.sha256'), 'utf8').trim()) throw new Error('Freeze record changed');
const frozen = JSON.parse(recordBytes);
function files(directory, prefix = '') {
  return Object.fromEntries(fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap((entry) => {
    if (entry.name === '.git' || (!prefix && ['FREEZE.json', 'FREEZE.sha256'].includes(entry.name))) return [];
    const relative = prefix + entry.name; const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Symlink in frozen fixture');
    return entry.isDirectory() ? Object.entries(files(absolute, relative + '/')) : [[relative, hash(fs.readFileSync(absolute))]];
  }));
if (JSON.stringify(files(root)) !== JSON.stringify(frozen.files)) throw new Error('Frozen fixture bytes or file inventory changed');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
for (const item of manifest.cases) {
  const worker = path.join(root, item.directory); const expected = JSON.parse(fs.readFileSync(path.join(root, item.initialState)));
  const git = (...args) => execFileSync('git', args, { cwd: worker, encoding: 'utf8' }).trimEnd();
  if (git('rev-parse', 'HEAD^{tree}') !== expected.baseTree || git('diff') !== expected.diff.trimEnd() || git('status', '--short') !== expected.status.trimEnd()) throw new Error('Frozen initial Git state changed: ' + item.id);
}
console.log(JSON.stringify({ status: 'frozen-inputs-match', files: Object.keys(frozen.files).length, cases: manifest.cases.map(({ id }) => id) }));
