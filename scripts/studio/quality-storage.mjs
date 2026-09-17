import fs from 'node:fs';
import path from 'node:path';
import { assertRealDirectory, atomicJSON, digest, safeFile } from './files.mjs';

const textual = /\.(?:[mc]?js|jsx|tsx?|json|css|html|md|txt|ya?ml|py|toml|sql|env)$/;
const maxBytes = 32 * 1024 * 1024;

function inspectManifest(root, prefix, manifest) {
  let total = 0;
  return manifest.map((entry) => {
    const absolute = safeFile(root, `${prefix}/${entry.path}`),
      stat = fs.lstatSync(absolute);
    total += stat.size;
    if (!stat.isFile() || stat.size > maxBytes || total > maxBytes)
      throw new Error('Périmètre supérieur à 32 Mio ou fichier spécial.');
    const bytes = fs.readFileSync(absolute);
    if (digest(bytes) !== entry.sha256 || bytes.length !== entry.bytes)
      throw new Error('Les fichiers locaux diffèrent de la version enregistrée.');
    return {
      ...entry,
      absolute,
      contents: bytes,
      content: textual.test(entry.path) ? bytes.toString('utf8') : null,
    };
  });
}

export function qualitySnapshot(store, revision) {
  const fingerprint = digest(
    JSON.stringify({ files: revision.files, compiled: revision.compilation?.files ?? [] }),
  );
  try {
    const files = inspectManifest(store.root, `revisions/${revision.id}/app`, revision.files);
    const compiled = inspectManifest(
      store.root,
      `revisions/${revision.id}/compiled`,
      revision.compilation?.files ?? [],
    );
    const sources = files.filter((file) => file.content !== null);
    if (
      sources.some((file) => file.bytes > 1024 * 1024) ||
      sources.reduce((sum, file) => sum + file.bytes, 0) > 8 * 1024 * 1024
    )
      throw new Error('Analyse textuelle bornée à 1 Mio par fichier et 8 Mio au total.');
    return { revision, fingerprint, files, sources, compiled, issue: null };
  } catch (error) {
    return {
      revision,
      fingerprint,
      sources: [],
      compiled: [],
      issue: error.message.startsWith('Les fichiers')
        ? error.message
        : 'Sources indisponibles, périmètre dépassé ou chemin non sûr ; aucun résultat positif déduit.',
    };
  }
}

function qualityDirectory(store) {
  return assertRealDirectory(path.join(store.root, '.devmethod', 'quality'));
}

export function readQualityRuns(store) {
  const directory = qualityDirectory(store);
  if (!fs.existsSync(directory)) return [];
  const names = fs.readdirSync(directory).filter((name) => /^[a-f0-9-]{36}\.json$/.test(name));
  if (names.length > 500)
    throw new Error(
      'Journal qualité supérieur à 500 exécutions ; archiver explicitement avant de continuer.',
    );
  const runs = [];
  let total = 0;
  for (const name of names) {
    const file = safeFile(directory, name),
      stat = fs.lstatSync(file);
    total += stat.size;
    if (!stat.isFile() || stat.size > 128 * 1024 || total > 16 * 1024 * 1024)
      throw new Error('Journal qualité illisible ou trop volumineux.');
    const run = JSON.parse(fs.readFileSync(file, 'utf8'));
    validateRun(run);
    runs.push(run);
  }
  return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

function validateRun(run) {
  const status = ['running', 'passed', 'failed', 'blocked'];
  const texts = [
    'id',
    'revisionId',
    'checkId',
    'title',
    'fingerprint',
    'tool',
    'environment',
    'startedAt',
    'expected',
    'observed',
  ];
  if (
    run.schemaVersion !== 1 ||
    !status.includes(run.status) ||
    texts.some((key) => typeof run[key] !== 'string')
  )
    throw new Error('Format du journal qualité inconnu.');
  if (!Array.isArray(run.findings) || !Array.isArray(run.events) || !Array.isArray(run.limits))
    throw new Error('Collections du journal qualité invalides.');
  if (
    run.findings.some(
      (item) =>
        typeof item.message !== 'string' ||
        (typeof item.source?.path !== 'string' && typeof item.target !== 'string'),
    )
  )
    throw new Error('Diagnostic qualité invalide.');
  if (
    run.events.some(
      (item) => typeof item.label !== 'string' || !Number.isFinite(Date.parse(item.at)),
    )
  )
    throw new Error('Événement qualité invalide.');
  if (!Number.isFinite(Date.parse(run.startedAt))) throw new Error('Date du contrôle invalide.');
}

export function writeQualityRun(store, run) {
  const directory = qualityDirectory(store);
  fs.mkdirSync(directory, { recursive: true });
  atomicJSON(safeFile(directory, `${run.id}.json`), run);
}
