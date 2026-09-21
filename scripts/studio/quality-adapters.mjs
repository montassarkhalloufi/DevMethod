import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import ts from 'typescript';
import { checkJavaScript } from './verify.mjs';
import { runControlledReactCheck } from './quality-react.mjs';
import { runBrowserScenarios } from './browser-verifier.mjs';

const sourcePattern = /\.(?:[mc]?js|jsx|tsx?)$/;
const finding = (file, line, message) => ({ source: { path: file, line }, message });
const parsed = (file) => ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true);
const lineAt = (tree, node) => tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1;

async function syntaxSnapshot(file, milliseconds) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'devmethod-quality-'));
  const source = path.join(directory, `snapshot${path.extname(file.path)}`);
  try {
    fs.writeFileSync(source, file.content, { flag: 'wx', mode: 0o600 });
    return await checkJavaScript(source, milliseconds);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

async function syntax(snapshot) {
  const findings = [],
    files = snapshot.sources.filter((file) => sourcePattern.test(file.path));
  const deadline = Date.now() + 10000;
  for (const file of files) {
    if (Date.now() >= deadline)
      return {
        status: 'blocked',
        findings,
        observed: 'Borne globale de 10 secondes atteinte ; analyse incomplète.',
      };
    if (/\.(?:[mc]?js)$/.test(file.path)) {
      const result = await syntaxSnapshot(file, deadline - Date.now());
      if (/Délai de contrôle dépassé|ENOENT|EACCES|spawn/.test(result.output))
        return {
          status: 'blocked',
          findings,
          observed: 'Analyseur Node indisponible ou délai de contrôle dépassé.',
        };
      if (result.code !== 0)
        findings.push(
          finding(
            file.path,
            result.line,
            'Le parseur Node signale une erreur. Le contenu source est consultable, mais les valeurs du diagnostic brut sont masquées.',
          ),
        );
    } else {
      const tree = parsed(file);
      for (const error of tree.parseDiagnostics)
        findings.push(
          finding(
            file.path,
            tree.getLineAndCharacterOfPosition(error.start ?? 0).line + 1,
            `Erreur de syntaxe TypeScript TS${error.code}.`,
          ),
        );
    }
  }
  return {
    findings,
    observed: `${files.length} fichier(s) analysé(s), ${findings.length} erreur(s) de syntaxe.`,
    limits: [
      'Analyse syntaxique uniquement : ni typage sémantique complet, ni exécution, ni test du comportement.',
    ],
  };
}

function resolveRelative(from, specifier, files) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));
  if (base.startsWith('../') || path.posix.isAbsolute(base)) return false;
  const stem = base.replace(/\.(?:js|jsx|mjs|cjs)$/, '');
  return [
    base,
    ...[
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
      '.cjs',
      '.json',
      '/index.ts',
      '/index.tsx',
      '/index.js',
    ].flatMap((suffix) => [base + suffix, stem + suffix]),
  ].some((file) => files.has(file));
}

function imports(snapshot) {
  const files = new Set(snapshot.revision.files.map((file) => file.path)),
    findings = [];
  let checked = 0,
    external = 0;
  for (const file of snapshot.sources.filter((item) => sourcePattern.test(item.path))) {
    const tree = parsed(file);
    const inspect = (node) => {
      const specifier =
        ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
          ? node.moduleSpecifier
          : undefined;
      if (specifier && ts.isStringLiteral(specifier)) {
        if (specifier.text.startsWith('.')) {
          checked++;
          if (!resolveRelative(file.path, specifier.text, files))
            findings.push(
              finding(
                file.path,
                lineAt(tree, node),
                'Import relatif non résolu dans les fichiers de cette version.',
              ),
            );
        } else external++;
      }
      ts.forEachChild(node, inspect);
    };
    inspect(tree);
  }
  return {
    findings,
    observed: `${checked} import(s) relatif(s) contrôlé(s), ${findings.length} non résolu(s). ${external} import(s) de package ou alias hors périmètre.`,
    limits: [
      'Les alias, imports dynamiques, require() et résolution des paquets ne sont pas évalués. Une cible existante ne prouve pas la compatibilité de ses exports.',
    ],
  };
}

function json(snapshot) {
  const findings = [],
    files = snapshot.sources.filter((file) => file.path.endsWith('.json'));
  for (const file of files) {
    try {
      JSON.parse(file.content);
    } catch {
      findings.push(
        finding(file.path, undefined, 'Document JSON invalide ; valeur et extrait masqués.'),
      );
    }
  }
  return {
    findings,
    observed: `${files.length} document(s) JSON lus, ${findings.length} format(s) invalide(s).`,
    limits: ['La validité JSON ne vérifie pas les schémas ou les valeurs métier.'],
  };
}

function secrets(snapshot) {
  const findings = [];
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bAKIA[A-Z0-9]{16}\b/,
    /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  ];
  for (const file of snapshot.sources)
    file.content.split('\n').forEach((line, index) => {
      if (patterns.some((pattern) => pattern.test(line)))
        findings.push(
          finding(
            file.path,
            index + 1,
            'Marqueur sensible détecté ; valeur intégralement masquée. Réexaminer le fichier avant partage.',
          ),
        );
    });
  return {
    findings,
    observed: `${findings.length} marqueur(s) correspondant aux formats recherchés.`,
    limits: [
      'Détection bornée à clés privées PEM, identifiants AWS AKIA et préfixes GitHub. Faux positifs possibles. Aucune garantie d’absence d’autres secrets.',
    ],
  };
}

function bundle(snapshot) {
  const files = snapshot.compiled;
  const bytes = files.reduce((sum, file) => sum + file.bytes, 0);
  return {
    findings: [],
    observed: `${files.length} artefact(s), ${bytes} octets non compressés. Inventaire mesuré sans seuil de performance.`,
    limits: [
      'Mesure de taille uniquement : aucun temps de chargement, cache, compression ou profil utilisateur observé.',
    ],
    metrics: { files: files.length, bytes },
  };
}

export const qualityAdapters = {
  syntax,
  imports,
  json,
  secrets,
  bundle,
  reactBuild: runControlledReactCheck,
  browser: runBrowserScenarios,
};
