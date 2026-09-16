import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

function optionalStat(file) {
  try {
    return fs.lstatSync(file);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

// This check is read-only, including when the destination does not exist yet.
export function assertRealDirectory(directory) {
  if (typeof directory !== 'string' || !path.isAbsolute(directory))
    throw new Error('Un dossier absolu est requis.');
  const resolved = path.resolve(directory),
    parsed = path.parse(resolved);
  let current = parsed.root;
  for (const part of resolved.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const info = optionalStat(current);
    if (info?.isSymbolicLink()) throw new Error('Dossier symbolique refusé.');
    if (info && !info.isDirectory())
      throw new Error('Un composant du chemin n’est pas un dossier.');
  }
  return resolved;
}

export function safeFile(root, relative) {
  if (
    typeof relative !== 'string' ||
    !relative ||
    relative.includes('\\') ||
    relative.startsWith('/') ||
    relative.split('/').some((p) => !p || p === '.' || p === '..' || !/^[\w. -]+$/.test(p))
  )
    throw new Error('Chemin de fichier invalide.');
  let current = assertRealDirectory(root);
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Fichier symbolique refusé.');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return current;
}
export function atomicJSON(file, value) {
  assertRealDirectory(path.dirname(file));
  if (optionalStat(file)?.isSymbolicLink()) throw new Error('Fichier symbolique refusé.');
  const temp = file + '.' + randomUUID() + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  try {
    fs.renameSync(temp, file);
  } finally {
    fs.rmSync(temp, { force: true });
  }
}
export function listFiles(root, prefix = '') {
  assertRealDirectory(root);
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isSymbolicLink()) throw new Error('Les liens symboliques ne sont pas exportables.');
    if (entry.isDirectory()) files.push(...listFiles(path.join(root, entry.name), relative + '/'));
    else if (entry.isFile()) files.push(relative);
    else throw new Error('Type de fichier non pris en charge.');
    if (files.length > 256) throw new Error('Cette tranche dépasse 256 fichiers.');
  }
  return files.sort();
}
export function fileManifest(root) {
  let total = 0;
  return listFiles(root).map((relative) => {
    const file = safeFile(root, relative),
      bytes = fs.readFileSync(file);
    total += bytes.length;
    if (total > 32 * 1024 * 1024) throw new Error('Cette tranche dépasse 32 Mio.');
    return { path: relative, bytes: bytes.length, sha256: digest(bytes) };
  });
}
export function copyFiles(source, target, files) {
  assertRealDirectory(source);
  assertRealDirectory(target);
  fs.mkdirSync(target, { recursive: true });
  for (const entry of files) {
    const from = safeFile(source, entry.path),
      to = safeFile(target, entry.path);
    const bytes = fs.readFileSync(from);
    if (digest(bytes) !== entry.sha256) throw new Error('Un fichier a changé pendant la copie.');
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, bytes, { flag: 'wx' });
  }
}
export const mimeType = (file) =>
  ({
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/plain; charset=utf-8',
  })[path.extname(file)] ?? 'application/octet-stream';
