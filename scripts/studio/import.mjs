import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertRealDirectory, safeFile, copyFiles, digest, atomicJSON } from './files.mjs';
import { importLimits, manifestFingerprint, validateImportRecord } from './import-contract.mjs';
import { reconstructImportContext } from './import-context.mjs';
import { createStudioStore } from './store.mjs';
import { portableArchivePath } from './archive.mjs';

const excludedDirectories = new Set([
  '.git',
  '.hg',
  '.svn',
  '.devmethod',
  'node_modules',
  'vendor',
  '.venv',
  'venv',
  '__pycache__',
  '.next',
  '.nuxt',
  '.cache',
  'dist',
  'build',
  'coverage',
  '.ssh',
  '.aws',
  'secrets',
  'credentials',
]);

function exclusion(name, directory) {
  if (directory && excludedDirectories.has(name.toLowerCase()))
    return 'Dossier de métadonnées, dépendances, artefacts ou secrets exclu';
  if (
    /^\.env(?:\.|$)|^\.(?:npmrc|pypirc|netrc|git-credentials)$|\.(?:pem|key|p12|pfx|keystore)$/i.test(
      name,
    )
  )
    return 'Fichier de configuration sensible ou clé exclu';
  if (/\.(?:sqlite3?|db|log|dump)$/i.test(name)) return 'Données locales ou journaux exclus';
  if (name === '.git' || name === '.DS_Store') return 'Métadonnées locales exclues';
  return null;
}

function roots(source, workspace) {
  if (!path.isAbsolute(source ?? '') || !path.isAbsolute(workspace ?? ''))
    throw new Error('--source et --workspace doivent être des dossiers absolus.');
  const from = assertRealDirectory(source),
    to = assertRealDirectory(workspace);
  if (!fs.statSync(from).isDirectory()) throw new Error('Le dossier source est absent.');
  if (from === to || from.startsWith(to + path.sep) || to.startsWith(from + path.sep))
    throw new Error('Source et workspace doivent être distincts et non imbriqués.');
  if (fs.existsSync(to) && fs.readdirSync(to).length)
    throw new Error('Le workspace d’import doit être vide.');
  return { from, to };
}

function inspectFile(root, name, currentBytes, count) {
  const file = safeFile(root, name),
    info = fs.lstatSync(file);
  if (!info.isFile()) throw new Error(`Fichier spécial refusé : ${name}. Aucun fichier importé.`);
  if (count >= importLimits.files || currentBytes + info.size > importLimits.bytes)
    throw new Error('Import supérieur à 256 fichiers ou 32 Mio ; aucun fichier importé.');
  const data = fs.readFileSync(file);
  if (data.length !== info.size) throw new Error('Les sources ont changé pendant l’inspection.');
  if (
    /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----|\b(?:AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|sk_live_[A-Za-z0-9]{20,})\b/.test(
      data.toString('utf8'),
    )
  )
    throw new Error(
      `Marqueur de secret détecté dans ${name} ; import refusé, contenu non affiché.`,
    );
  return { data, manifest: { path: name, bytes: data.length, sha256: digest(data) } };
}

function inventory(root) {
  const files = [],
    excluded = [],
    contents = new Map();
  let bytes = 0,
    entries = 0;

  function visit(relative = '', depth = 0) {
    if (depth > importLimits.depth)
      throw new Error('Import supérieur à 40 niveaux ; aucun fichier importé.');
    const directory = relative ? safeFile(root, relative) : root;
    for (const entry of fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (++entries > importLimits.entries)
        throw new Error('Inspection supérieure à 2500 entrées ; aucun fichier importé.');
      const name = relative ? relative + '/' + entry.name : entry.name;
      const reason = exclusion(entry.name, entry.isDirectory());
      if (reason) {
        excluded.push({ path: name + (entry.isDirectory() ? '/' : ''), reason });
        continue;
      }
      if (entry.isDirectory()) {
        visit(name, depth + 1);
        continue;
      }
      const { data, manifest } = inspectFile(root, name, bytes, files.length);
      bytes += data.length;
      files.push(manifest);
      contents.set(name, data);
    }
  }

  visit();
  if (!files.length) throw new Error('Aucun fichier source admissible à importer.');
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { files, excluded, contents, bytes };
}

function detectedProfile(files) {
  const paths = files.map((file) => file.path);
  // Only a directly runnable static folder is previewable without interpretation.
  return paths.includes('index.html') &&
    !paths.some((name) =>
      /(?:^|\/)(?:package|devmethod\.project)\.json$|\.(?:tsx?|jsx|mts|cts|py|go|rs|java|php|rb)$|(?:^|\/)(?:server|backend|api)(?:\/|\.[mc]?js$)/i.test(
        name,
      ),
    )
    ? 'static'
    : 'source-only';
}

function install(staging, destination) {
  assertRealDirectory(destination);
  const existed = fs.existsSync(destination);
  if (existed && fs.readdirSync(destination).length)
    throw new Error('Le workspace a changé pendant l’import.');
  if (existed) fs.rmdirSync(destination);
  try {
    fs.renameSync(staging, destination);
  } catch (error) {
    if (existed) fs.mkdirSync(destination);
    throw error;
  }
}

export async function importProject({ source, workspace, dryRun = false }) {
  const { from, to } = roots(source, workspace);
  const inspected = inventory(from),
    fingerprint = manifestFingerprint(inspected.files);
  const profile = detectedProfile(inspected.files);
  const record = {
    format: 1,
    baselineRevision: randomUUID(),
    source: { name: path.basename(from), importedAt: new Date().toISOString(), fingerprint },
    inventory: {
      included: inspected.files.length,
      bytes: inspected.bytes,
      excluded: inspected.excluded,
    },
    context: await reconstructImportContext(inspected.files, inspected.contents, fingerprint),
  };
  const revision = {
    id: record.baselineRevision,
    origin: { kind: 'import' },
    profile,
    title: 'Sources importées',
    summary:
      'Référence initiale copiée depuis un projet existant ; aucun contrôle ni accord déduit.',
    createdAt: record.source.importedAt,
    files: inspected.files,
  };
  for (const file of inspected.files)
    portableArchivePath(`revisions/${revision.id}/app/${file.path}`);
  validateImportRecord(record, [revision]);
  const result = { dryRun, profile, import: record, files: inspected.files, limits: importLimits };
  if (dryRun) return result;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const staging = fs.mkdtempSync(path.join(path.dirname(to), '.devmethod-import-'));
  try {
    const store = createStudioStore(staging);
    try {
      copyFiles(from, safeFile(staging, `revisions/${revision.id}/app`), inspected.files);
      const latest = inventory(from);
      if (
        manifestFingerprint(latest.files) !== fingerprint ||
        JSON.stringify(latest.excluded) !== JSON.stringify(inspected.excluded)
      )
        throw new Error('Les sources ont changé pendant l’import ; aucun workspace installé.');
      store.commit(store.read().version, (state) => {
        state.project.name = record.source.name;
        state.import = record;
        state.revisions.push(revision);
        state.activeRevision = revision.id;
      });
      atomicJSON(safeFile(staging, '.devmethod/data.json'), { version: 1, data: {} });
    } finally {
      store.close();
    }
    install(staging, to);
    return result;
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}
