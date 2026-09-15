import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../evaluation/behavioral/', import.meta.url));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function safeRelative(value) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value) || value.includes('\\') || value.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Unsafe relative path');
  return value;
}
function noLinks(absolute, allowMissing = false) {
  const parsed = path.parse(absolute); let current = parsed.root;
  for (const part of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    let stat;
    try { stat = fs.lstatSync(current); } catch (error) { if (error.code === 'ENOENT' && allowMissing) return; throw error; }
    if (stat.isSymbolicLink()) throw new Error('Symbolic path is not allowed');
  }
}
/** Prepare only pinned fixture inputs; never dispatch a host or copy an oracle. */
export function prepareBehaviorCase(caseId, destination, { fixtureDirectory = path.join(root, 'fixtures'), caseFile = path.join(root, 'cases.json') } = {}) {
  if (typeof destination !== 'string' || !path.isAbsolute(destination) || destination.includes('\\') || destination.split(path.sep).includes('..')) throw new Error('Destination must be a safe absolute fresh path');
  destination = path.resolve(destination);
  noLinks(destination, true);
  if (fs.existsSync(destination)) throw new Error('Destination already exists; use a fresh directory');
  fixtureDirectory = path.resolve(fixtureDirectory);
  noLinks(fixtureDirectory); noLinks(caseFile);
  if (destination.startsWith(fixtureDirectory + path.sep)) throw new Error('Destination cannot alter fixture sources');
  const manifestPath = path.join(fixtureDirectory, 'manifest.json'); noLinks(manifestPath);
  const manifestBytes = fs.readFileSync(manifestPath);
  const casesBytes = fs.readFileSync(caseFile);
  const manifest = JSON.parse(manifestBytes); const suite = JSON.parse(casesBytes);
  if (manifest.format !== 1 || suite.format !== 1 || !Array.isArray(manifest.cases) || !Array.isArray(suite.cases)) throw new Error('Invalid fixture manifest');
  const selected = manifest.cases.filter(c => c.id === caseId); const specs = suite.cases.filter(c => c.id === caseId);
  if (selected.length !== 1 || specs.length !== 1) throw new Error('Unknown or duplicate case');
  const fixture = selected[0]; const spec = specs[0];
  if (!fixture.files || typeof fixture.files !== 'object' || Array.isArray(fixture.files) || !Object.keys(fixture.files).length) throw new Error('Missing fixture files');
  const prepared = [];
  for (const [name, source] of Object.entries(fixture.files)) {
    safeRelative(name); safeRelative(source.source);
    if (/(^|\/)(oracle[^/]*|expected[^/]*|manifest\.json)$/i.test(name)) throw new Error('Evaluator-only artifact must not enter handoff');
    if (!/^[a-f0-9]{64}$/.test(source.sha256)) throw new Error('Invalid pinned digest');
    const sourcePath = path.join(fixtureDirectory, source.source); noLinks(sourcePath);
    const stat = fs.statSync(sourcePath);
    if (!stat.isFile() || stat.size > 1024 * 1024) throw new Error('Fixture source must be a regular file <= 1 MiB');
    const bytes = fs.readFileSync(sourcePath);
    if (digest(bytes) !== source.sha256) throw new Error(`Fixture hash mismatch: ${name}`);
    prepared.push({ name, bytes, sha256: source.sha256 });
  }
  // Parent directories must already exist so preparation cannot accidentally build an unexpected hierarchy.
  if (!fs.statSync(path.dirname(destination)).isDirectory()) throw new Error('Destination parent must exist');
  fs.mkdirSync(destination, { recursive: false });
  try {
    for (const file of prepared) {
      const target = path.join(destination, file.name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, file.bytes, { flag: 'wx' });
    }
  } catch (error) { fs.rmSync(destination, { recursive: true, force: true }); throw error; }
  return { format: 1, caseId, destination, prompt: spec.prompt, promptSha256: digest(spec.prompt),
    suiteSha256: digest(casesBytes), fixtureManifestSha256: digest(manifestBytes),
    files: Object.fromEntries(prepared.map(f => [f.name, f.sha256])),
    prerequisites: fixture.prerequisites, operatorSteps: fixture.operatorSteps,
    status: 'prepared-not-run', limitation: 'Preparation establishes pinned input bytes only. Operator setup, actual host execution and independent adjudication remain required. Do not give this complete evaluator record to the agent; send prompt and fixture workspace only.' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [caseId, destination, ...extra] = process.argv.slice(2);
    if (!caseId || !destination || extra.length) throw new Error('Usage: node scripts/prepare-behavior-case.mjs CASE_ID /absolute/fresh/destination');
    console.log(JSON.stringify(prepareBehaviorCase(caseId, destination), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 2; }
}
