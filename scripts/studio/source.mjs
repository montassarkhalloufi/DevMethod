import fs from 'node:fs';
import { digest, safeFile } from './files.mjs';

const maxTextBytes = 256 * 1024;
const invalid = (message, status = 400) => Object.assign(new Error(message), { status });

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
