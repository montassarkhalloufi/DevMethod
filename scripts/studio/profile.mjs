import fs from 'node:fs';
import path from 'node:path';
import { safeFile, fileManifest } from './files.mjs';

const projectManifestPath = 'devmethod.project.json';

export function validateProjectManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Le manifeste de services doit être un objet.');
  if (Object.keys(value).some((key) => !['topology', 'services'].includes(key)))
    throw new Error('Champ inconnu dans le manifeste de services.');
  if (!['monolith', 'services'].includes(value.topology))
    throw new Error('Topologie requise : monolith ou services.');
  if (!Array.isArray(value.services) || !value.services.length || value.services.length > 16)
    throw new Error('Le manifeste doit décrire entre 1 et 16 services.');
  const ids = new Set();
  for (const service of value.services) {
    if (
      !service ||
      typeof service !== 'object' ||
      Array.isArray(service) ||
      Object.keys(service).some((key) => !['id', 'name', 'root', 'runtime'].includes(key)) ||
      typeof service.id !== 'string' ||
      !/^[a-z][a-z0-9-]{0,47}$/.test(service.id) ||
      ids.has(service.id)
    )
      throw new Error('Chaque service doit avoir un identifiant unique et des champs connus.');
    ids.add(service.id);
    for (const key of ['name', 'runtime']) {
      if (
        typeof service[key] !== 'string' ||
        !service[key].trim() ||
        service[key].length > 100 ||
        [...service[key]].some(
          (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
        )
      )
        throw new Error(`Le champ ${key} du service est invalide.`);
    }
    if (
      typeof service.root !== 'string' ||
      service.root.length > 240 ||
      (service.root !== '.' &&
        (!service.root ||
          service.root
            .split('/')
            .some((part) => !part || part === '.' || part === '..' || !/^[\w. -]+$/.test(part))))
    )
      throw new Error('La racine d’un service doit être un chemin relatif sûr.');
  }
  return structuredClone(value);
}

export function readProjectManifest(root, files) {
  if (!files.some((file) => file.path === projectManifestPath)) return null;
  const file = safeFile(root, projectManifestPath);
  if (fs.statSync(file).size > 32 * 1024)
    throw new Error('Le manifeste de services dépasse 32 Kio.');
  return validateProjectManifest(JSON.parse(fs.readFileSync(file, 'utf8')));
}

export function sourceProfile(root, files) {
  readProjectManifest(root, files);
  const manifest = files.find((file) => file.path === 'package.json');
  const declared = manifest
    ? JSON.parse(fs.readFileSync(safeFile(root, manifest.path), 'utf8')).devmethod?.profile
    : undefined;
  const unsupported = files.find(
    (file) =>
      /\.(?:mts|cts|jsx)$/i.test(file.path) ||
      (/\.tsx?$/i.test(file.path) && !/\.tsx?$/.test(file.path)),
  );
  if (unsupported)
    throw new Error(
      `Extension non compilée : ${unsupported.path}. Utilisez .ts ou .tsx pour le profil React typé.`,
    );
  if (declared === 'react-ts') return declared;
  if (declared !== undefined) throw new Error(`Profil non pris en charge : ${declared}`);
  if (files.some((file) => /\.(tsx?|jsx)$/i.test(file.path)))
    throw new Error(
      'Déclarez devmethod.profile: "react-ts" dans package.json pour compiler TypeScript/React.',
    );
  return 'static';
}

export async function compileSource(sourceRoot, files) {
  if (sourceProfile(sourceRoot, files) !== 'react-ts') return null;
  const { buildReactApp } = await import('./react-build.mjs');
  const outputRoot = path.join(path.dirname(sourceRoot), 'compiled');
  const result = await buildReactApp({ sourceRoot, outputRoot });
  return { ...result, files: result.ok ? fileManifest(outputRoot) : [], outputRoot };
}
