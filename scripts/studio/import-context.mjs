const maximumText = 256 * 1024;

function sourceView(file, bytes) {
  const prefix = bytes.subarray(0, maximumText);
  let content = null;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(prefix, {
      stream: bytes.length > maximumText,
    });
    if (
      ![...text].some((character) => {
        const code = character.charCodeAt(0);
        return code <= 8 || (code >= 14 && code <= 31);
      })
    )
      content = text;
  } catch {
    /* Binary files are inventoried, never invented as text. */
  }
  return {
    ...file,
    content,
    binary: content === null,
    truncated: content !== null && bytes.length > maximumText,
  };
}

function addFact(facts, source, kind, label, value, provenance = 'declared') {
  facts.push({
    kind,
    label,
    value: String(value).slice(0, 2000),
    provenance: { kind: provenance, path: source.path, sha256: source.sha256 },
  });
}

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function packageFacts(source, facts, unknowns) {
  let value;
  try {
    value = JSON.parse(source.content);
    if (!isRecord(value)) throw new Error('Objet requis');
  } catch {
    unknowns.push(
      `${source.path} non interprétable comme manifeste JSON : déclarations non reconstituées.`,
    );
    return;
  }
  addFact(
    facts,
    source,
    'manifest',
    'Manifeste du projet',
    typeof value.name === 'string' ? value.name : source.path,
  );
  for (const [name, version] of Object.entries({
    ...(isRecord(value.dependencies) ? value.dependencies : {}),
    ...(isRecord(value.devDependencies) ? value.devDependencies : {}),
  }))
    if (typeof version === 'string')
      addFact(facts, source, 'stack', 'Dépendance déclarée', `${name}@${version}`);
  for (const [name, script] of Object.entries(isRecord(value.scripts) ? value.scripts : {}))
    if (typeof script === 'string')
      addFact(facts, source, 'command', 'Commande déclarée, non exécutée', `npm run ${name}`);
}

function fileFacts(source, facts, unknowns) {
  if (source.binary || source.truncated) return;
  if (/(?:^|\/)package\.json$/.test(source.path)) packageFacts(source, facts, unknowns);
  if (/(?:^|\/)README(?:\.[\w-]+)?$/i.test(source.path)) {
    const heading = source.content.split(/\r?\n/).find((line) => /^#\s/.test(line));
    addFact(
      facts,
      source,
      'readme',
      'Documentation existante',
      heading?.replace(/^#\s+/, '') || source.path,
    );
  }
  if (
    /(?:^|\/)(?:AGENTS|CLAUDE|CONTRIBUTING|ENGINEERING_POLICY)\.md$|(?:^|\/)\.cursorrules$/.test(
      source.path,
    )
  )
    addFact(
      facts,
      source,
      'instruction',
      'Instructions existantes à lire dans leur portée',
      source.path,
      'detected',
    );
  if (/(?:^|\/)(?:tests?|__tests__)\/|\.(?:test|spec)\.[\w]+$/.test(source.path))
    addFact(facts, source, 'test', 'Fichier de test détecté, non exécuté', source.path, 'detected');
  if (
    /(?:^|\/)(?:pyproject\.toml|requirements[^/]*\.txt|Cargo\.toml|go\.mod|pom\.xml|composer\.json|Gemfile)$/.test(
      source.path,
    )
  )
    addFact(
      facts,
      source,
      'manifest',
      'Manifeste détecté, contraintes à confirmer',
      source.path,
      'detected',
    );
  if (
    /(?:^|\/)(?:Dockerfile[^/]*|docker-compose[^/]*|compose\.ya?ml|devmethod\.project\.json)$/.test(
      source.path,
    )
  )
    addFact(
      facts,
      source,
      'service',
      'Déclaration de services, exécution non observée',
      source.path,
      'detected',
    );
}

export async function reconstructImportContext(files, contents, fingerprint) {
  const sources = files.map((file) => sourceView(file, contents.get(file.path)));
  const facts = [],
    unknowns = [
      'Commandes non exécutées ; comportement, installation et déploiement non vérifiés.',
      'Objectif produit, critères de réussite et décisions acceptées restent à confirmer ; aucun accord n’est déduit des sources.',
      'Historique Git non importé ; commit, branche et modifications locales non déterminés.',
      'Règles .gitignore non interprétées ; les exclusions explicites sont listées dans l’inventaire.',
    ];
  for (const source of sources) fileFacts(source, facts, unknowns);
  let analysis;
  try {
    const { analyzeSnapshot, protocol } = await import('./intelligence/model.mjs');
    const result = analyzeSnapshot({
      revisionId: 'import-inspection',
      sources,
      fingerprint,
      localChanges: false,
    });
    analysis = { status: result.status, protocol, stack: result.stack, issues: result.issues };
  } catch {
    analysis = {
      status: 'failed',
      protocol: 'unavailable',
      stack: [],
      issues: [
        {
          extractor: 'import',
          message: 'Analyse AST indisponible ; inventaire et déclarations seulement.',
        },
      ],
    };
  }
  if (facts.length > 500)
    unknowns.push(
      `Contexte borné à 500 faits sur ${facts.length} ; inventaire de fichiers conservé intégralement.`,
    );
  if (sources.some((source) => source.truncated))
    unknowns.push(
      'Fichiers de plus de 256 Kio copiés intégralement mais non interprétés comme contexte textuel.',
    );
  return { facts: facts.slice(0, 500), unknowns, analysis };
}
