import path from 'node:path';
import { digest } from '../files.mjs';
import { validateProjectManifest } from '../profile.mjs';
import { extractAST, astVersion } from './ast.mjs';
import { createImportResolver, isTSConfig } from './resolution.mjs';

export const protocol = 'project-ast-v1:typescript-' + astVersion;
const codePattern = /\.[cm]?[jt]sx?$/;
const testPattern = /(?:^|\/)(?:__tests__|tests?)\/|\.(?:test|spec)\.[cm]?[jt]sx?$/;
const fileId = (name) => 'file:' + name;
const ref = (name) => ({ path: name });
const proof = (kind, method, source, limitation) => ({
  kind,
  method,
  sources: [source],
  ...(limitation ? { limitation } : {}),
});
const unique = (values) => [...new Set(values)];

function node(context, value) {
  const existing = context.elements.get(value.id);
  if (existing) return existing;
  const result = { runtime: 'not_observed', details: {}, ...value };
  context.elements.set(result.id, result);
  return result;
}

function edge(context, source, target, kind, label, provenance) {
  const id =
    'edge:' +
    digest(JSON.stringify([source, target, kind, label, provenance.sources])).slice(0, 20);
  if (!context.relations.has(id))
    context.relations.set(id, { id, source, target, kind, label, provenance: [provenance] });
}

function featureOf(name) {
  const parts = name.split('/'),
    featureIndex = parts.findIndex((part) => ['features', 'modules', 'domains'].includes(part));
  if (featureIndex >= 0 && parts[featureIndex + 1]) return parts[featureIndex + 1];
  return parts.length > 1 ? parts.slice(0, -1).join('/') : 'racine';
}

function pathLayer(name) {
  if (
    /(?:^|\/)(?:Dockerfile|docker-compose[^/]*|compose[^/]*|package\.json|tsconfig[^/]*|devmethod\.project\.json)$|(?:^|\/)(?:infra|infrastructure|migrations|\.github)\/|(?:vite|next|eslint)\.config\./.test(
      name,
    )
  )
    return 'infrastructure';
  if (/(?:^|\/)(?:shared|contracts|schemas|types)\//.test(name)) return 'shared';
  if (/(?:^|\/)(?:api|server|backend)\//.test(name)) return 'backend';
  if (/\.(?:html|css|scss)$|(?:^|\/)(?:client|frontend|components|hooks|pages)\//.test(name))
    return 'frontend';
  return 'unclassified';
}

function classify(source, extracted) {
  const backend = extracted.facts.some((fact) => ['route', 'resource'].includes(fact.kind));
  const frontend =
    extracted.jsx || extracted.facts.some((fact) => ['interaction', 'storage'].includes(fact.kind));
  if (backend && frontend)
    return {
      layer: 'shared',
      role: 'Interface et serveur colocalisés',
      method: 'AST : JSX et route/ressource serveur dans le même fichier',
      kind: 'detected',
    };
  if (backend)
    return {
      layer: 'backend',
      role: 'Serveur',
      method: 'AST : route ou client de ressource serveur',
      kind: 'detected',
    };
  if (frontend)
    return {
      layer: 'frontend',
      role: 'Interface',
      method: 'AST : JSX ou stockage navigateur',
      kind: 'detected',
    };
  const layer = pathLayer(source.path);
  return {
    layer,
    role: layer === 'unclassified' ? 'Module à qualifier' : layer,
    method: 'Classification par convention de chemin ou extension',
    kind: 'inferred',
  };
}

function language(name) {
  const extension = path.posix.extname(name).slice(1);
  return (
    {
      ts: 'TypeScript',
      tsx: 'TSX',
      js: 'JavaScript',
      jsx: 'JSX',
      mjs: 'JavaScript',
      cjs: 'JavaScript',
      py: 'Python',
      prisma: 'Prisma',
      yml: 'YAML',
      yaml: 'YAML',
    }[extension] ||
    extension ||
    'texte'
  );
}

function sourceFacts(source, context) {
  if (source.binary || source.truncated) {
    if (source.truncated)
      context.issues.push({
        extractor: 'source',
        path: source.path,
        message: 'Fichier de plus de 256 Kio : inventorié mais non analysé.',
      });
    return { facts: [], jsx: false };
  }
  if (codePattern.test(source.path)) {
    const extracted = extractAST(source);
    context.issues.push(...extracted.issues);
    return extracted;
  }
  if (/\.(?:py|go|java|rb|rs|php|vue|svelte)$/.test(source.path))
    context.issues.push({
      extractor: 'coverage',
      path: source.path,
      message: 'Langage inventorié ; aucun extracteur sémantique disponible pour ce fichier.',
    });
  return { facts: [], jsx: false };
}

function addFile(source, context) {
  const extracted = sourceFacts(source, context),
    classification = classify(source, extracted),
    test = testPattern.test(source.path);
  context.facts.set(source.path, extracted.facts);
  context.files.push({
    path: source.path,
    sha256: source.sha256,
    bytes: source.bytes,
    layer: classification.layer,
    feature: featureOf(source.path),
    language: language(source.path),
    role: test ? 'Test' : classification.role,
    test,
  });
  node(context, {
    id: fileId(source.path),
    label: path.posix.basename(source.path),
    type: test ? 'test' : classification.layer === 'frontend' ? 'frontend' : 'module',
    layer: classification.layer,
    sources: [ref(source.path)],
    provenance: [
      proof(
        classification.kind,
        classification.method,
        ref(source.path),
        'Catégorie logique, indépendante des processus déployés.',
      ),
    ],
    description: source.path,
    details: {
      feature: featureOf(source.path),
      role: classification.role,
      language: language(source.path),
      sha256: source.sha256,
      ...fileDetails(extracted),
    },
  });
}

function fileDetails(extracted) {
  const functions = extracted.facts.filter((fact) => fact.kind === 'function');
  const interactions = extracted.facts.filter((fact) => fact.kind === 'interaction');
  return {
    ...(functions.length
      ? {
          symbols: functions
            .map((fact) => `${fact.name}(${fact.parameters}) · ligne ${fact.source.line}`)
            .join('\n'),
        }
      : {}),
    ...(interactions.length
      ? {
          interactions: interactions
            .map((fact) => `${fact.name} sur <${fact.element}> · ligne ${fact.source.line}`)
            .join('\n'),
        }
      : {}),
  };
}

function parseJSON(source, context) {
  if (source.binary || source.truncated) return null;
  try {
    return JSON.parse(source.content.replace(/^\uFEFF/, ''));
  } catch {
    context.issues.push({
      extractor: 'json',
      path: source.path,
      message: 'Configuration JSON invalide : non interprétée.',
    });
    return null;
  }
}

function packages(source, data, context) {
  for (const name of Object.keys({ ...data.dependencies, ...data.devDependencies }).sort())
    context.stack.add(name);
  const scripts =
    data.scripts && typeof data.scripts === 'object' ? Object.keys(data.scripts).join(', ') : '';
  context.elements.get(fileId(source.path)).details.scripts = scripts || 'Aucun script déclaré';
}

function serviceLayer(service) {
  if (/vite|react|next|frontend|client/i.test(service.runtime + ' ' + service.id))
    return 'frontend';
  if (/node|python|express|fastify|nest|koa|backend|api/i.test(service.runtime + ' ' + service.id))
    return 'backend';
  return 'unclassified';
}

function services(source, data, context) {
  let manifest;
  try {
    manifest = validateProjectManifest(data);
  } catch (error) {
    context.issues.push({
      extractor: 'project-manifest',
      path: source.path,
      message: error.message,
    });
    return;
  }
  context.elements.get(fileId(source.path)).details.topology = manifest.topology;
  for (const service of manifest.services) {
    const id = 'service:' + service.id,
      layer = serviceLayer(service),
      sourceRef = ref(source.path);
    node(context, {
      id,
      label: service.name,
      type: 'service',
      layer,
      sources: [sourceRef],
      provenance: [proof('declared', 'devmethod.project.json', sourceRef)],
      description: 'Service déclaré ; aucun processus observé.',
      details: {
        root: service.root,
        runtime: service.runtime,
        topology: manifest.topology,
        execution: 'not_observed',
      },
    });
    for (const file of context.files.filter(
      (item) => service.root === '.' || item.path.startsWith(service.root + '/'),
    )) {
      edge(
        context,
        id,
        fileId(file.path),
        'declares',
        'Contient selon le manifeste',
        proof('declared', 'Racine de service', sourceRef),
      );
    }
  }
}

function openAPI(source, data, context) {
  if (!data.openapi || !data.paths || typeof data.paths !== 'object') return;
  for (const [route, operations] of Object.entries(data.paths)) {
    for (const method of Object.keys(operations || {})) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) continue;
      addEndpoint(
        context,
        source.path,
        {
          route,
          method: method.toUpperCase(),
          source: ref(source.path),
          framework: 'OpenAPI',
          limitation: 'Contrat déclaré : implémentation serveur et routage non établis.',
        },
        'declared',
      );
    }
  }
  for (const name of Object.keys(data.components?.schemas || {})) {
    addContract(
      context,
      source.path,
      { name, source: ref(source.path), format: 'schéma OpenAPI', fields: [] },
      'declared',
    );
  }
}

function configs(sources, context) {
  for (const source of sources.filter(
    (entry) => entry.path.endsWith('.json') && !isTSConfig(entry.path),
  )) {
    const data = parseJSON(source, context);
    if (!data || typeof data !== 'object') continue;
    if (path.posix.basename(source.path) === 'package.json') packages(source, data, context);
    if (source.path === 'devmethod.project.json') services(source, data, context);
    openAPI(source, data, context);
  }
  for (const source of sources.filter(
    (entry) => /\.(?:prisma|sql)$/.test(entry.path) && !entry.binary && !entry.truncated,
  ))
    schemaDeclarations(source, context);
}

function schemaDeclarations(source, context) {
  const prisma = source.path.endsWith('.prisma');
  const pattern = prisma
    ? /^\s*model\s+([A-Za-z_]\w*)\s*\{/gm
    : /\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([A-Za-z_]\w*)["`]?\s*\(/gi;
  for (const match of source.content.matchAll(pattern)) {
    const line = source.content.slice(0, match.index).split('\n').length;
    addContract(
      context,
      source.path,
      {
        name: match[1],
        source: { path: source.path, line, symbol: match[1] },
        format: prisma ? 'modèle Prisma déclaré' : 'table SQL déclarée',
        fields: [],
      },
      'declared',
    );
  }
}

function addEndpoint(context, file, fact, kind = 'detected') {
  const id = 'endpoint:' + file + ':' + fact.method + ':' + fact.route;
  node(context, {
    id,
    label: fact.method + ' ' + fact.route,
    type: 'endpoint',
    layer: 'backend',
    sources: [fact.source],
    provenance: [proof(kind, fact.framework, fact.source, fact.limitation)],
    description: fact.limitation,
    details: { method: fact.method, path: fact.route, framework: fact.framework },
  });
  edge(
    context,
    fileId(file),
    id,
    'declares',
    'Déclare la route',
    proof(kind, fact.framework, fact.source, fact.limitation),
  );
}

function addContract(context, file, fact, kind = 'detected') {
  const id = 'contract:' + file + ':' + fact.name,
    source = { ...fact.source, symbol: fact.name };
  node(context, {
    id,
    label: fact.name,
    type: 'contract',
    layer: 'shared',
    sources: [source],
    provenance: [proof(kind, fact.format, source)],
    description: fact.format,
    details: {
      format: fact.format,
      fields: fact.fields.join(', ') || 'Champs non détaillés',
      validation: 'Déclaration uniquement ; aucune validation exécutée.',
    },
  });
  edge(
    context,
    fileId(file),
    id,
    'declares',
    'Déclare le contrat',
    proof(kind, fact.format, source),
  );
}

function resource(context, file, fact) {
  const id = 'resource:' + file + ':' + fact.name;
  node(context, {
    id,
    label: fact.name,
    type: fact.type,
    layer: 'backend',
    sources: [fact.source],
    provenance: [
      proof('detected', 'AST : construction du client ' + fact.packageName, fact.source),
    ],
    description: 'Client présent dans le code ; connexion, serveur et disponibilité non observés.',
    details: { library: fact.packageName },
  });
  return id;
}

function factsToNodes(context) {
  for (const [file, facts] of context.facts) {
    for (const fact of facts) {
      if (fact.kind === 'route') addEndpoint(context, file, fact);
      if (fact.kind === 'contract') addContract(context, file, fact);
      if (fact.kind === 'resource')
        edge(
          context,
          fileId(file),
          resource(context, file, fact),
          'declares',
          'Construit le client',
          proof('detected', 'AST', fact.source),
        );
      if (fact.kind === 'gap')
        context.issues.push({ extractor: 'typescript-ast', path: file, message: fact.message });
    }
  }
}

function packageName(specifier) {
  return specifier.startsWith('@')
    ? specifier.split('/').slice(0, 2).join('/')
    : specifier.split('/')[0];
}

function library(context, fact, unresolved) {
  const name = packageName(fact.specifier),
    target = unresolved ? 'module:unresolved:' + fact.specifier : 'module:package:' + name;
  node(context, {
    id: target,
    label: unresolved ? fact.specifier + ' · alias non résolu' : name + ' · bibliothèque',
    type: 'module',
    layer: 'unclassified',
    sources: [fact.source],
    provenance: [
      proof(
        'detected',
        'AST : import',
        fact.source,
        'Un import ne démontre ni service, ni processus, ni installation effective.',
      ),
    ],
    description: unresolved
      ? 'Alias déclaré ; aucune cible locale résolue dans ce snapshot.'
      : 'Bibliothèque Node/npm ou module non résolu. Ce n’est pas un service externe.',
    details: {
      specifier: fact.specifier,
      kind: unresolved ? 'alias non résolu' : 'bibliothèque/module importé',
      installation: 'non vérifiée',
    },
  });
  return target;
}

function imported(context, file, fact) {
  const resolved = context.resolveImport(file, fact.specifier);
  if (resolved && !resolved.path) {
    context.issues.push({
      extractor: 'imports',
      path: file,
      message:
        (resolved.ambiguous
          ? 'Plusieurs configurations donnent des cibles différentes : '
          : 'Import local non résolu : ') + fact.specifier,
    });
    if (!resolved.alias) return;
  }
  const target = resolved?.path ? fileId(resolved.path) : library(context, fact, resolved?.alias);
  const provenance = proof(
    'detected',
    resolved?.alias ? 'AST + alias déclaré tsconfig/jsconfig' : 'AST : import statique',
    fact.source,
    'Résolution relative ou paths/baseUrl du snapshot ; conditions du bundler et configuration de déploiement non exécutées.',
  );
  if (resolved?.config) provenance.sources.push(ref(resolved.config));
  edge(context, fileId(file), target, 'import', fact.specifier, provenance);
  if (testPattern.test(file))
    edge(
      context,
      fileId(file),
      target,
      'tests',
      'Importé par ce test',
      proof(
        'detected',
        'AST : import dans un fichier de test',
        fact.source,
        'Aucune assertion exécutée ; couverture non établie.',
      ),
    );
}

function publicURL(raw) {
  try {
    const value = new URL(raw, 'http://project.invalid');
    if (!['http:', 'https:'].includes(value.protocol)) return null;
    return value.origin === 'http://project.invalid'
      ? value.pathname
      : value.origin + value.pathname;
  } catch {
    return null;
  }
}

function http(context, file, fact) {
  const url = publicURL(fact.url);
  if (!url) return;
  const targets = [...context.elements.values()].filter(
    (entry) =>
      entry.type === 'endpoint' &&
      entry.details.method === fact.method &&
      entry.details.path === url,
  );
  let target;
  if (targets.length === 1) target = targets[0].id;
  else {
    const remote = /^https?:\/\//.test(url);
    target = (remote ? 'external:http:' : 'module:http:') + fact.method + ':' + url;
    node(context, {
      id: target,
      label: fact.method + ' ' + url,
      type: remote ? 'external' : 'module',
      layer: 'unclassified',
      sources: [fact.source],
      provenance: [proof('detected', 'AST : destination HTTP littérale', fact.source)],
      description:
        targets.length > 1
          ? 'Plusieurs routes candidates ; résolution non établie.'
          : 'Destination HTTP ; implémentation non résolue dans ce snapshot.',
      details: {
        url,
        method: fact.method,
        kind: remote ? 'destination réseau absolue' : 'destination HTTP locale non résolue',
      },
    });
  }
  edge(
    context,
    fileId(file),
    target,
    'http',
    fact.method + ' ' + url,
    proof(
      targets.length === 1 ? 'inferred' : 'detected',
      'AST fetch/axios + correspondance méthode/chemin',
      fact.source,
      'Routage réel, préfixes, rewrites, réseau et réponse non observés. Paramètres de requête, fragments et informations de connexion retirés des URL.',
    ),
  );
}

function storage(context, file, fact) {
  const id = 'storage:browser:' + fact.name;
  node(context, {
    id,
    label: fact.name,
    type: 'storage',
    layer: 'frontend',
    sources: [fact.source],
    provenance: [proof('detected', 'AST : stockage navigateur', fact.source)],
    description: 'API du navigateur appelée dans le code ; contenu et durée non observés.',
    details: {},
  });
  edge(
    context,
    fileId(file),
    id,
    fact.relation,
    fact.operation,
    proof('detected', 'AST : appel API navigateur', fact.source),
  );
}

function factsToEdges(context) {
  const handlers = { import: imported, http, storage };
  for (const [file, facts] of context.facts) {
    for (const fact of facts) {
      handlers[fact.kind]?.(context, file, fact);
      if (fact.kind === 'resource-use')
        edge(
          context,
          fileId(file),
          resource(context, file, fact),
          fact.relation,
          fact.operation,
          proof(
            'detected',
            'AST : appel sur le client construit',
            fact.source,
            'Opération potentielle ; exécution et transaction non observées.',
          ),
        );
    }
  }
}

function flowFor(context, entry) {
  const owner =
    entry.type === 'endpoint'
      ? context.relationsArray.find(
          (relation) => relation.target === entry.id && relation.kind === 'declares',
        )?.source
      : entry.id;
  const relationIds = [],
    elementIds = new Set([entry.id, owner].filter(Boolean));
  for (const relation of context.relationsArray) {
    if (relation.source !== owner && relation.target !== entry.id) continue;
    relationIds.push(relation.id);
    elementIds.add(relation.source);
    elementIds.add(relation.target);
  }
  const file = context.elements.get(owner)?.sources[0]?.path;
  const errors = (context.facts.get(file) || [])
    .filter((fact) => fact.kind === 'error')
    .map(({ label, source }) => ({ label, source }));
  return {
    id: 'flow:' + entry.id,
    title: entry.label,
    entryId: entry.id,
    elementIds: [...elementIds],
    relationIds,
    errors,
    kind: 'code',
    limits: [
      'Vue de dépendances du fichier, sans ordre d’exécution ni preuve que chaque branche participe à ce parcours.',
      'Imports transitifs, middleware, branches dynamiques, état et effets réseau non suivis. Aucune trace observée.',
    ],
  };
}

function flows(context) {
  context.relationsArray = [...context.relations.values()];
  const entries = [...context.elements.values()].filter(
    (entry) =>
      entry.type === 'endpoint' ||
      (entry.id.startsWith('file:') &&
        context.relationsArray.some(
          (relation) => relation.source === entry.id && relation.kind === 'http',
        )),
  );
  return entries.slice(0, 80).map((entry) => flowFor(context, entry));
}

/** @returns {import('../../../studio-ui/src/features/project/model/contracts').ProjectAnalysis} */
export function analyzeSnapshot(snapshot) {
  const context = {
    elements: new Map(),
    relations: new Map(),
    facts: new Map(),
    files: [],
    issues: [],
    stack: new Set(),
    paths: new Set(snapshot.sources.map((source) => source.path)),
  };
  context.resolveImport = createImportResolver(snapshot.sources, context.issues);
  for (const source of snapshot.sources) addFile(source, context);
  configs(snapshot.sources, context);
  factsToNodes(context);
  factsToEdges(context);
  const elements = [...context.elements.values()],
    projectFlows = flows(context);
  return {
    schemaVersion: 1,
    revisionId: snapshot.revisionId,
    ...(snapshot.draft ? { baseRevisionId: snapshot.baseRevisionId } : {}),
    fingerprint: snapshot.fingerprint,
    analyzedAt: new Date().toISOString(),
    environment: 'Sources locales du projet — analyse statique, aucun outil du projet exécuté',
    status: context.issues.length ? 'partial' : 'complete',
    scope: snapshot.draft
      ? 'Brouillon éditeur persisté sur ' + snapshot.baseRevisionId
      : 'Snapshot immuable du projet',
    localChanges: snapshot.localChanges,
    files: context.files,
    elements,
    relations: context.relationsArray,
    flows: projectFlows,
    issues: context.issues,
    stack: [...context.stack].sort(),
    backendDetected: elements.some(
      (element) =>
        ['endpoint', 'database', 'cache', 'queue'].includes(element.type) ||
        (element.type === 'service' && element.layer === 'backend'),
    ),
    limits: unique([
      'Projet uniquement ; runtime DevMethod exclu. Aucun processus, test, compilation ou requête réseau exécuté.',
      'Analyse syntaxique TypeScript/JavaScript, imports relatifs, routes Express/Fastify/Next/Nest, fetch/axios, types, Zod, clients connus, stockage navigateur, déclarations Prisma/SQL et configurations JSON.',
      'Les catégories de chemin sont inférées. Absence de détection ne prouve pas absence de serveur. Python et les autres langages sont inventoriés sans analyse sémantique.',
      'Alias paths/baseUrl résolus dans le snapshot (JSONC, héritage local simple) ; include/exclude, références de projets et configuration du bundler non interprétés. Aucune résolution sémantique globale des wrappers, de la réflexion ou du routage dynamique.',
      'Graphes et parcours décrivent des dépendances possibles, jamais une trace d’exécution. Pas de garantie d’exhaustivité.',
      ...(projectFlows.length === 80 ? ['Affichage borné à 80 parcours.'] : []),
    ]),
  };
}
