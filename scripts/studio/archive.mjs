// A bounded, plain USTAR bundle: inspectable with ordinary tar tools, no executable extractor.
import fs from 'node:fs';
import path from 'node:path';
import { safeFile, assertRealDirectory } from './files.mjs';

export function portableArchivePath(name) {
  if (Buffer.byteLength(name) <= 100) return { name, prefix: '' };
  for (let split = name.lastIndexOf('/'); split > 0; split = name.lastIndexOf('/', split - 1)) {
    const prefix = name.slice(0, split),
      leaf = name.slice(split + 1);
    if (Buffer.byteLength(prefix) <= 155 && Buffer.byteLength(leaf) <= 100)
      return { name: leaf, prefix };
  }
  throw new Error('Chemin trop long pour cette archive portable.');
}

function header(relative, size) {
  const { name, prefix } = portableArchivePath(relative);
  const block = Buffer.alloc(512);
  block.write(name, 0, 100);
  block.write('0000644\0', 100);
  block.write('0000000\0', 108);
  block.write('0000000\0', 116);
  block.write(size.toString(8).padStart(11, '0') + '\0', 124);
  block.write('00000000000\0', 136);
  block.fill(32, 148, 156);
  block.write('0', 156);
  block.write('ustar\0', 257);
  block.write('00', 263);
  block.write(prefix, 345, 155);
  const sum = block.reduce((a, n) => a + n, 0);
  block.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);
  return block;
}

export function archiveFiles(entries) {
  const parts = [];
  let total = 0;
  for (const { name, bytes } of entries) {
    total += bytes.length;
    if (total > 64 * 1024 * 1024 || entries.length > 1500)
      throw new Error('Archive trop volumineuse.');
    parts.push(header(name, bytes.length), bytes, Buffer.alloc((512 - (bytes.length % 512)) % 512));
  }
  parts.push(Buffer.alloc(1024));
  return Buffer.concat(parts);
}

function validatePaths(seen) {
  for (const name of seen) {
    const parts = name.split('/');
    for (let i = 1; i < parts.length; i++)
      if (seen.has(parts.slice(0, i).join('/'))) throw new Error('Chemins d’archive en conflit.');
  }
}

function parseArchive(bytes, directory) {
  if (!Buffer.isBuffer(bytes) || bytes.length > 70 * 1024 * 1024 || bytes.length % 512)
    throw new Error('Archive invalide.');
  const entries = [],
    seen = new Set();
  let offset = 0;
  while (offset + 512 <= bytes.length) {
    const block = bytes.subarray(offset, offset + 512);
    offset += 512;
    if (block.every((n) => n === 0)) break;
    const field = (start, length) =>
      block
        .subarray(start, start + length)
        .toString('utf8')
        .replace(/\0.*$/s, '');
    const prefix = field(345, 155),
      name = prefix ? prefix + '/' + field(0, 100) : field(0, 100),
      sizeText = field(124, 12).trim(),
      checksum = Number.parseInt(field(148, 8).trim(), 8);
    const checkBlock = Buffer.from(block);
    checkBlock.fill(32, 148, 156);
    if (
      field(257, 6) !== 'ustar' ||
      field(156, 1) !== '0' ||
      checkBlock.reduce((a, n) => a + n, 0) !== checksum ||
      !/^[0-7]+$/.test(sizeText)
    )
      throw new Error('Archive USTAR non prise en charge ou corrompue.');
    const size = Number.parseInt(sizeText, 8);
    if (seen.has(name) || offset + size > bytes.length || entries.length >= 1500)
      throw new Error('Entrée d’archive invalide.');
    seen.add(name);
    safeFile(directory, name);
    entries.push({ name, bytes: bytes.subarray(offset, offset + size) });
    offset += Math.ceil(size / 512) * 512;
  }
  if (!seen.has('.devmethod/studio.json') || !seen.has('launch.mjs'))
    throw new Error('Ce fichier n’est pas un export Studio.');
  validatePaths(seen);
  if (offset + 512 > bytes.length || !bytes.subarray(offset).every((n) => n === 0))
    throw new Error('Fin d’archive invalide.');
  return entries;
}

function assertEmptyDestination(directory) {
  assertRealDirectory(directory);
  if (fs.existsSync(directory) && fs.readdirSync(directory).length)
    throw new Error('Choisissez un dossier vide pour la reprise.');
}

function installDirectory(staging, directory) {
  assertEmptyDestination(directory);
  try {
    fs.renameSync(staging, directory);
  } catch (error) {
    // Windows may refuse replacing an existing empty directory. Preserve it on failure.
    if (!['EEXIST', 'EPERM', 'ENOTEMPTY'].includes(error.code) || !fs.existsSync(directory))
      throw error;
    assertEmptyDestination(directory);
    fs.rmdirSync(directory);
    try {
      fs.renameSync(staging, directory);
    } catch (renameError) {
      assertRealDirectory(directory);
      fs.mkdirSync(directory, { recursive: true });
      throw renameError;
    }
  }
}

export function restoreArchive(bytes, directory) {
  const destination = assertRealDirectory(directory);
  assertEmptyDestination(destination);
  const entries = parseArchive(bytes, destination);
  const parent = path.dirname(destination);
  assertRealDirectory(parent);
  fs.mkdirSync(parent, { recursive: true });
  const staging = fs.mkdtempSync(path.join(parent, '.devmethod-restore-'));
  try {
    for (const entry of entries) {
      const file = safeFile(staging, entry.name);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, entry.bytes, { flag: 'wx', mode: 0o600 });
    }
    installDirectory(staging, destination);
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
  return entries.length;
}
