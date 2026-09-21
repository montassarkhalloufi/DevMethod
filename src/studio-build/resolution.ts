import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { inside } from './snapshot.js';
import { ALLOWED_PACKAGES, type CompilerInput } from './types.js';

export const trustedRequire = createRequire(import.meta.url);
export const normalize = (file: string): string => path.resolve(file).replaceAll('\\', '/');

export function packageName(id: string): string {
  return id.startsWith('@') ? id.split('/').slice(0, 2).join('/') : (id.split('/')[0] ?? id);
}

export function packageRoot(name: string, importer?: string): string {
  const resolver = importer ? createRequire(importer) : trustedRequire;
  let directory: string;
  try {
    directory = path.dirname(resolver.resolve(name + '/package.json'));
  } catch {
    directory = path.dirname(resolver.resolve(name));
  }
  while (!fs.existsSync(path.join(directory, 'package.json'))) {
    const parent = path.dirname(directory);
    if (parent === directory) throw new Error(`Bibliothèque absente : ${name}`);
    directory = parent;
  }
  return fs.realpathSync(directory);
}

function dependencyRoots(): string[] {
  const visited = new Set<string>();

  function add(name: string, importer?: string): void {
    const root = packageRoot(name, importer);
    if (visited.has(root)) return;
    visited.add(root);
    roots.push(root);
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    for (const dependency of Object.keys(pkg.dependencies ?? {}))
      add(dependency, path.join(root, 'package.json'));
  }

  const roots: string[] = [];
  for (const name of [
    ...ALLOWED_PACKAGES,
    '@types/react',
    '@types/react-dom',
    'typescript',
    'tailwindcss',
  ])
    add(name);
  return roots;
}

export function createResolution(input: CompilerInput) {
  const files = new Map(
    input.files.map((file) => [
      normalize(path.join(input.sourceRoot, file.path)),
      Buffer.from(file.content, 'base64'),
    ]),
  );
  const roots = dependencyRoots();
  const sourceRoot = normalize(input.sourceRoot);
  const isTrusted = (file: string): boolean => roots.some((root) => inside(root, file));

  function read(file: string): string | undefined {
    const source = files.get(normalize(file));
    if (source) return source.toString('utf8');
    if (!isTrusted(file)) return undefined;
    try {
      if (!isTrusted(fs.realpathSync(file))) return undefined;
      return fs.readFileSync(file, 'utf8');
    } catch {
      return undefined;
    }
  }

  function local(id: string, importer: string): string {
    let candidate: string;
    if (id.startsWith('@/')) candidate = path.join(sourceRoot, 'src', id.slice(2));
    else if (id.startsWith('/')) candidate = path.join(sourceRoot, id.slice(1));
    else candidate = path.resolve(path.dirname(importer), id);
    if (!inside(sourceRoot, candidate)) throw new Error(`Import hors du projet refusé : ${id}`);
    for (const suffix of ['', '.ts', '.tsx', '.js', '.jsx', '.json', '/index.ts', '/index.tsx']) {
      const file = normalize(candidate + suffix);
      if (files.has(file)) return file;
    }
    throw new Error(`Fichier importé absent : ${id}`);
  }

  function external(id: string, importer?: string): string {
    const resolver = importer ? createRequire(importer) : trustedRequire;
    const resolved = resolver.resolve(id);
    if (!isTrusted(resolved) || !isTrusted(fs.realpathSync(resolved)))
      throw new Error(`Bibliothèque non autorisée : ${id}`);
    return resolved;
  }

  return { files, sourceRoot, roots, isTrusted, read, local, external };
}
export type Resolution = ReturnType<typeof createResolution>;
