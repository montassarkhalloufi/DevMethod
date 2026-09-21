import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { buildReactApp } from './react-build.mjs';

// Reuse the isolated, allowlisted compiler. Never run package scripts or project plugins.
export async function runControlledReactCheck(snapshot, { timeoutMs = 15000 } = {}) {
  const directory = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'devmethod-quality-react-'),
  );
  const sourceRoot = path.join(directory, 'source');
  const limits = [
    'Profil react-ts du Studio, options strictes et bibliothèques autorisées uniquement ; ce contrôle ne remplace pas un tsc avec une configuration arbitraire.',
    'Aucun script package, plugin ou programme du projet exécuté. Copie temporaire supprimée, version et artefacts enregistrés inchangés.',
    'Compilation sans test métier ni mesure du rendu. Délai maximal de 15 secondes ; tas V8 plafonné à 512 Mio (hors mémoire native).',
  ];
  try {
    for (const file of snapshot.files) {
      const target = path.resolve(sourceRoot, file.path);
      if (!target.startsWith(sourceRoot + path.sep))
        throw new Error('Chemin de compilation invalide.');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, file.contents, { flag: 'wx', mode: 0o600 });
    }
    const result = await buildReactApp({
      sourceRoot,
      outputRoot: path.join(directory, 'output'),
      timeoutMs: Math.min(timeoutMs, 15000),
    });
    const errors = result.diagnostics.filter((item) => item.severity === 'error');
    if (
      errors.some((item) =>
        /Délai|annulée|s’est arrêté|ENOENT|EACCES|spawn|compilateur invalide/.test(item.message),
      )
    )
      return {
        status: 'blocked',
        findings: [],
        observed:
          'Compilation interrompue ou outil indisponible ; aucun résultat positif enregistré.',
        limits,
      };
    const paths = new Set(snapshot.revision.files.map((file) => file.path));
    const findings = errors.map((item) => ({
      source: {
        path: paths.has(item.file) ? item.file : 'package.json',
        ...(item.line ? { line: item.line } : {}),
      },
      message:
        'Le compilateur strict signale une erreur de type, de résolution ou de build. Examiner les types et imports du fichier ; les valeurs du diagnostic brut sont masquées.',
    }));
    return {
      status: result.ok ? 'passed' : 'failed',
      findings,
      limits,
      observed: result.ok
        ? `TypeScript strict et compilation React réussis ; ${result.files.length} artefact(s) construits temporairement avec React ${result.versions.react}, TypeScript ${result.versions.typescript}.`
        : `Compilation React stricte refusée : ${errors.length} diagnostic(s) d’erreur. Aucune version appliquée.`,
    };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
