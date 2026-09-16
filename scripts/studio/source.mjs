import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, safeFile } from './files.mjs';
import { validateProjectManifest } from './profile.mjs';

const maxTextBytes = 256 * 1024;
const invalid = (message, status = 400) => Object.assign(new Error(message), { status });
const runtimeRoot = path.dirname(fileURLToPath(import.meta.url));
const runtimePaths = ['preview.mjs', 'files.mjs', 'http.mjs', 'public/comparison-guard.js'];

function runtimeSnapshot() {
  const entries = runtimePaths.map((relative) => {
    const bytes = fs.readFileSync(safeFile(runtimeRoot, relative));
    return {
      path: relative,
      bytes: bytes.length,
      sha256: digest(bytes),
      content: bytes.toString('utf8'),
    };
  });
  const files = entries.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 }));
  return { id: 'runtime-' + digest(JSON.stringify(files)), entries, files };
}

export function runtimeSourceCatalog() {
  const { id, files } = runtimeSnapshot();
  return {
    scope: 'runtime',
    id,
    title: 'Backend local DevMethod',
    files,
    readOnly: true,
    provenance:
      'Sources du runtime installé, distinctes du code et des versions de votre application.',
  };
}

export function readRuntimeSource(relative) {
  if (!runtimePaths.includes(relative)) throw invalid('Fichier absent du runtime exposé.', 404);
  const { id, entries } = runtimeSnapshot();
  const entry = entries.find((file) => file.path === relative);
  return { scope: 'runtime', revisionId: id, ...entry, binary: false, truncated: false };
}

export function readProjectServices(workspace, state, revisionId) {
  const revision = state.revisions.find((entry) => entry.id === revisionId);
  if (!revision) return null;
  if (!revision.files.some((file) => file.path === 'devmethod.project.json')) return null;
  const source = readSource(workspace, state, revisionId, 'devmethod.project.json');
  if (source.binary || source.truncated || source.bytes > 32 * 1024)
    throw invalid('Le manifeste de services doit être du JSON textuel de 32 Kio au maximum.');
  const manifest = validateProjectManifest(JSON.parse(source.content));
  return {
    revisionId,
    topology: manifest.topology,
    manifest: { path: source.path, sha256: source.sha256 },
    services: manifest.services.map((service) => ({
      ...service,
      execution: 'not_connected',
      reason:
        'Déclaration de projet : aucun processus backend personnalisé n’est lancé par ce profil.',
      files: revision.files.filter(
        (file) => service.root === '.' || file.path.startsWith(service.root + '/'),
      ),
    })),
  };
}

function hasBinaryControl(value) {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 8 || (code >= 14 && code <= 31)) return true;
  }
  return false;
}

export function readSource(workspace, state, revisionId, relative) {
  const revision = state.revisions.find((entry) => entry.id === revisionId);
  const expected = revision?.files.find((entry) => entry.path === relative);
  if (!expected) throw invalid('Fichier absent de cette version.', 404);
  const file = safeFile(workspace, `revisions/${revision.id}/app/${expected.path}`);
  const info = fs.statSync(file);
  if (!info.isFile() || info.size !== expected.bytes || info.size > 32 * 1024 * 1024)
    throw invalid('Le fichier ne correspond plus à sa version.');
  const bytes = fs.readFileSync(file);
  if (digest(bytes) !== expected.sha256) throw invalid('Le fichier a changé hors de sa version.');
  let content = null;
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    if (!hasBinaryControl(decoded))
      content = new TextDecoder('utf-8', { ignoreBOM: true }).decode(
        bytes.subarray(0, maxTextBytes),
        { stream: true },
      );
  } catch {
    // Binary assets are listed with their real digest, never rendered as invented text.
  }
  return {
    revisionId,
    path: relative,
    content,
    binary: content === null,
    truncated: content !== null && bytes.length > maxTextBytes,
    bytes: bytes.length,
    sha256: expected.sha256,
  };
}
