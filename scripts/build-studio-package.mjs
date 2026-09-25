import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = path.join(root, 'packages/studio/build');
const excluded = new Set(['node_modules', 'dist', '.DS_Store']);

function tree(relative, exclude = new Set()) {
  const source = path.join(root, relative);
  if (fs.lstatSync(source).isSymbolicLink())
    throw new Error(`Symbolic package source: ${relative}`);
  if (!fs.statSync(source).isDirectory()) return [relative];
  return fs
    .readdirSync(source)
    .sort()
    .flatMap((name) => (exclude.has(name) ? [] : tree(`${relative}/${name}`, exclude)));
}

function packageFiles() {
  const files = [
    'scripts/studio.mjs',
    'scripts/hosts/codex.mjs',
    ...tree('scripts/studio'),
    ...tree('dist/control-plane'),
    ...tree('dist/studio-build'),
    ...tree('dist/studio-ui'),
    ...tree('.agents/skills'),
    ...tree('templates/studio-react', excluded),
    ...tree('examples/studio-ateliers/state'),
    ...tree('examples/studio-ateliers/revisions', excluded),
    ...tree('examples/studio-ateliers-react', excluded),
  ];
  const state = JSON.parse(
    fs.readFileSync(path.join(root, 'examples/studio-ateliers/state/studio.json')),
  );
  for (const reference of state.references) {
    if (path.basename(reference.name) !== reference.name)
      throw new Error('Unsafe example reference');
    files.push(`docs/missions/creation-experience/design/${reference.name}`);
  }
  return [...new Set(files)].sort();
}

function digest(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function verify(files) {
  const expected = [...files, 'package-files.json'].sort();
  const actual = tree('packages/studio/build').map((file) =>
    file.slice('packages/studio/build/'.length),
  );
  if (JSON.stringify(actual.sort()) !== JSON.stringify(expected))
    throw new Error('Studio package file set is stale. Run npm run build.');
  for (const file of files) {
    if (digest(path.join(root, file)) !== digest(path.join(destination, file)))
      throw new Error(`Studio package is stale: ${file}. Run npm run build.`);
  }
  const receipt = JSON.parse(fs.readFileSync(path.join(destination, 'package-files.json')));
  if (
    receipt.version !== studio.version ||
    JSON.stringify(receipt.files) !==
      JSON.stringify(Object.fromEntries(files.map((file) => [file, digest(path.join(root, file))])))
  )
    throw new Error('Studio package receipt is stale. Run npm run build.');
}

const method = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
const studio = JSON.parse(fs.readFileSync(path.join(root, 'packages/studio/package.json')));
if (studio.version !== method.version)
  throw new Error('Align candidate package versions before building.');
for (const [name, version] of Object.entries(studio.dependencies)) {
  if (method.devDependencies[name] !== version)
    throw new Error(`Development/runtime dependency mismatch: ${name}`);
}
if (digest(path.join(root, 'LICENSE')) !== digest(path.join(root, 'packages/studio/LICENSE')))
  throw new Error('Studio must preserve the MIT notice.');

const files = packageFiles();
if (process.argv.includes('--check')) {
  verify(files);
  // npm pack --json must keep stdout machine-readable for release/CI consumers.
  console.error(`Studio package matches ${files.length} canonical files.`);
} else {
  fs.rmSync(destination, { recursive: true, force: true });
  for (const file of files) {
    const target = path.join(destination, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, file), target);
  }
  fs.chmodSync(path.join(destination, 'scripts/studio.mjs'), 0o755);
  fs.writeFileSync(
    path.join(destination, 'package-files.json'),
    JSON.stringify(
      {
        version: studio.version,
        files: Object.fromEntries(files.map((file) => [file, digest(path.join(root, file))])),
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`Prepared devmethod-studio with ${files.length} files in packages/studio/build.`);
}
