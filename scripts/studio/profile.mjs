import fs from 'node:fs';
import path from 'node:path';
import { safeFile, fileManifest } from './files.mjs';

export function sourceProfile(root, files) {
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
