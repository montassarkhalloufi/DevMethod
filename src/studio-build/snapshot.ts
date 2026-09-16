import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { MAX_BYTES, type InputFile, type ManifestFile } from './types.js';

export function inside(root: string, file: string): boolean {
  const relative = path.relative(root, file);
  return (
    relative === '' ||
    (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))
  );
}

export function realDirectory(directory: string): string {
  if (!path.isAbsolute(directory)) throw new Error('Un dossier absolu est requis.');
  let current = path.parse(directory).root;
  for (const part of path.resolve(directory).slice(current.length).split(path.sep)) {
    if (!part) continue;
    current = path.join(current, part);
    if (!fs.existsSync(current)) continue;
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory())
      throw new Error('Dossier symbolique ou invalide refusé.');
  }
  return path.resolve(directory);
}

export function safeRelative(relative: string): boolean {
  return (
    !!relative &&
    !relative.includes('\\') &&
    !relative.startsWith('/') &&
    relative
      .split('/')
      .every((part) => !!part && part !== '.' && part !== '..' && /^[\w. -]+$/.test(part))
  );
}

export function snapshot(root: string): InputFile[] {
  realDirectory(root);
  const files: InputFile[] = [];
  let total = 0;
  let entries = 0;

  function visit(directory: string, prefix: string): void {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      entries++;
      if (entries > 1024 || relative.split('/').length > 32)
        throw new Error('Arborescence de compilation trop grande.');
      if (!safeRelative(relative) || entry.isSymbolicLink())
        throw new Error('Chemin ou lien symbolique refusé.');
      if (entry.isDirectory()) {
        visit(path.join(directory, entry.name), relative + '/');
        continue;
      }
      if (!entry.isFile()) throw new Error('Type de fichier refusé.');
      const file = path.join(directory, entry.name);
      if (total + fs.statSync(file).size > MAX_BYTES || files.length >= 256)
        throw new Error('Limite de compilation : 256 fichiers, 32 Mio.');
      const bytes = fs.readFileSync(file);
      total += bytes.length;
      if (total > MAX_BYTES) throw new Error('Limite de compilation : 32 Mio.');
      files.push({ path: relative, content: bytes.toString('base64') });
    }
  }

  visit(root, '');
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export function manifest(files: InputFile[]): ManifestFile[] {
  return files.map((file) => {
    const bytes = Buffer.from(file.content, 'base64');
    return {
      path: file.path,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    };
  });
}

export function publish(root: string, outputs: InputFile[]): ManifestFile[] {
  realDirectory(path.dirname(root));
  if (fs.existsSync(root)) throw new Error('Le dossier de sortie doit être nouveau.');
  const temp = root + '.' + randomUUID() + '.tmp';
  const files = manifest(outputs);
  if (files.length > 256 || files.reduce((sum, file) => sum + file.bytes, 0) > MAX_BYTES)
    throw new Error('Sortie compilée trop volumineuse.');
  fs.mkdirSync(temp, { recursive: true });
  try {
    for (const output of outputs) {
      if (!safeRelative(output.path)) throw new Error('Chemin compilé invalide.');
      const target = path.join(temp, output.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, Buffer.from(output.content, 'base64'), { flag: 'wx' });
    }
    fs.renameSync(temp, root);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  return files;
}
