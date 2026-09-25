import ts from 'typescript';

export const astVersion = ts.version;

const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);
const serverPackages = new Set(['express', 'fastify', '@koa/router', 'koa-router']);
const databasePackages = new Set([
  '@prisma/client',
  'pg',
  'mysql2',
  'better-sqlite3',
  'mongodb',
  'redis',
  'ioredis',
  'bullmq',
]);
const literal = (node) => node && (ts.isStringLiteralLike(node) ? node.text : null);
const nameOf = (node) =>
  node && (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) ? node.text : null;

function member(node) {
  if (ts.isPropertyAccessExpression(node))
    return { owner: node.expression.getText(), name: node.name.text };
  if (ts.isIdentifier(node)) return { owner: '', name: node.text };
  return { owner: '', name: '' };
}

function property(node, name) {
  if (!node || !ts.isObjectLiteralExpression(node)) return null;
  return node.properties.find(
    (entry) => ts.isPropertyAssignment(entry) && nameOf(entry.name) === name,
  )?.initializer;
}

function bindings(node, packageName, context) {
  const clause = node.importClause;
  if (clause?.name) context.bindings.set(clause.name.text, { packageName, imported: 'default' });
  const named = clause?.namedBindings;
  if (named && ts.isNamespaceImport(named))
    context.bindings.set(named.name.text, { packageName, imported: '*' });
  if (named && ts.isNamedImports(named)) {
    for (const spec of named.elements)
      context.bindings.set(spec.name.text, {
        packageName,
        imported: spec.propertyName?.text || spec.name.text,
      });
  }
}

function importedPackage(expression, context) {
  if (!expression) return null;
  const root = expression.getText().split('.')[0];
  return context.bindings.get(root)?.packageName || null;
}

function add(context, kind, node, values) {
  if (context.facts.length >= 120) {
    context.capped = true;
    return;
  }
  context.facts.push({
    kind,
    source: {
      path: context.path,
      line: context.file.getLineAndCharacterOfPosition(node.getStart()).line + 1,
    },
    ...values,
  });
}

function importFact(node, context) {
  if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
    const specifier = literal(node.moduleSpecifier);
    if (!specifier) return;
    add(context, 'import', node, { specifier });
    if (ts.isImportDeclaration(node)) bindings(node, specifier, context);
  }
}

function variableBindings(node, context) {
  if (!ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name) || !node.initializer) return;
  const init = node.initializer;
  if (!ts.isCallExpression(init) && !ts.isNewExpression(init)) return;
  const { owner, name } = member(init.expression);
  if (!owner && name === 'require') {
    const packageName = literal(init.arguments?.[0]);
    if (packageName) context.bindings.set(node.name.text, { packageName, imported: 'default' });
    return;
  }
  const packageName = importedPackage(init.expression, context);
  if (serverPackages.has(packageName)) context.routers.add(node.name.text);
  if (databasePackages.has(packageName)) {
    const type = ['redis', 'ioredis'].includes(packageName)
      ? 'cache'
      : packageName === 'bullmq'
        ? 'queue'
        : 'database';
    context.clients.set(node.name.text, { packageName, type });
    add(context, 'resource', node, { name: node.name.text, type, packageName });
  }
}

function callImport(node, context) {
  const { owner, name } = member(node.expression);
  const dynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
  if (!dynamicImport && (owner || name !== 'require')) return;
  const specifier = literal(node.arguments[0]);
  if (specifier) add(context, 'import', node, { specifier });
  else add(context, 'gap', node, { message: 'Import calculé : cible non résolue statiquement.' });
}

function httpCall(node, context) {
  const { owner, name } = member(node.expression);
  const fetch = (!owner || owner === 'globalThis' || owner === 'window') && name === 'fetch';
  const axios = importedPackage(node.expression, context) === 'axios' && methods.has(name);
  if (!fetch && !axios) return;
  const url = literal(node.arguments[0]);
  if (url === null)
    return add(context, 'gap', node, {
      message: 'URL calculée : appel HTTP détecté, destination inconnue.',
    });
  const optionMethod = property(node.arguments[1], 'method');
  const method = axios
    ? name.toUpperCase()
    : literal(optionMethod) || (optionMethod ? 'UNKNOWN' : 'GET');
  add(context, 'http', node, { url, method: method.toUpperCase() });
}

function routeCall(node, context) {
  const { owner, name } = member(node.expression);
  if (!context.routers.has(owner)) return;
  if (name === 'route') {
    const options = node.arguments[0],
      route = literal(property(options, 'url')),
      method = literal(property(options, 'method'));
    if (route && method && methods.has(method.toLowerCase()))
      add(context, 'route', node, {
        route,
        method: method.toUpperCase(),
        framework: 'configuration Fastify',
        limitation: 'Hooks et préfixes de plugin non résolus.',
      });
    return;
  }
  if (!methods.has(name)) return;
  const route = literal(node.arguments[0]);
  if (route === null)
    return add(context, 'gap', node, {
      message: 'Route calculée : chemin non résolu statiquement.',
    });
  add(context, 'route', node, {
    route,
    method: name.toUpperCase(),
    framework: 'routeur importé',
    limitation: 'Préfixes de montage et middlewares non résolus.',
  });
}

function browserStorage(node, context) {
  const { owner, name } = member(node.expression);
  const storage = owner.replace(/^(window|globalThis)\./, '');
  if (!['localStorage', 'sessionStorage'].includes(storage)) return;
  const kind = { getItem: 'read', setItem: 'write', removeItem: 'write', clear: 'write' }[name];
  if (kind) add(context, 'storage', node, { name: storage, operation: name, relation: kind });
}

function resourceCall(node, context) {
  const { owner, name } = member(node.expression),
    root = owner.split('.')[0];
  const resource = context.clients.get(root);
  if (!resource) return;
  const reads = [
    'findMany',
    'findUnique',
    'findFirst',
    'find',
    'findOne',
    'count',
    'get',
    'select',
  ];
  const writes = [
    'create',
    'createMany',
    'update',
    'updateMany',
    'delete',
    'deleteMany',
    'upsert',
    'insert',
    'set',
  ];
  let relation = reads.includes(name) ? 'read' : writes.includes(name) ? 'write' : null;
  if (resource.type === 'queue' && name === 'add') relation = 'publish';
  if (name === 'query') relation = sqlRelation(literal(node.arguments[0]));
  if (!relation) return;
  add(context, 'resource-use', node, { name: root, operation: name, relation, ...resource });
}

function sqlRelation(sql) {
  if (!sql) return null;
  if (/^\s*(?:SELECT|SHOW|EXPLAIN)\b/i.test(sql)) return 'read';
  if (/^\s*(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(sql)) return 'write';
  return null;
}

function schemaCall(node, context) {
  const { name } = member(node.expression);
  if (name !== 'object' || importedPackage(node.expression, context) !== 'zod') return;
  const parent = node.parent;
  const symbol = ts.isVariableDeclaration(parent) ? nameOf(parent.name) : null;
  if (symbol)
    add(context, 'contract', node, {
      name: symbol,
      format: 'schéma Zod',
      fields: fieldNames(node.arguments[0]),
    });
}

function fieldNames(node) {
  if (!node || !ts.isObjectLiteralExpression(node)) return [];
  return node.properties
    .map((entry) => nameOf(entry.name))
    .filter(Boolean)
    .slice(0, 40);
}

function visitCall(node, context) {
  callImport(node, context);
  httpCall(node, context);
  routeCall(node, context);
  browserStorage(node, context);
  resourceCall(node, context);
  schemaCall(node, context);
}

function nextRoute(node, context) {
  if (!/(?:^|\/)app\/(?:.*\/)?route\.[cm]?[jt]s$/.test(context.path)) return;
  if (!ts.isFunctionDeclaration(node) && !ts.isVariableStatement(node)) return;
  if (!node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)) return;
  const names = ts.isFunctionDeclaration(node)
    ? [nameOf(node.name)]
    : node.declarationList.declarations.map((entry) => nameOf(entry.name));
  const route =
    '/' +
    context.path
      .split('/app/')
      .pop()
      .replace(/^app\//, '')
      .replace(/\/?route\.[cm]?[jt]s$/, '');
  for (const name of names) {
    if (name && methods.has(name.toLowerCase()) && name === name.toUpperCase())
      add(context, 'route', node, {
        route,
        method: name,
        framework: 'Next route handler',
        limitation: 'Groupes de routes, rewrites et segments dynamiques non normalisés.',
      });
  }
}

function declaration(node, context) {
  functionFact(node, context);
  if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
    const fields = ts.isInterfaceDeclaration(node)
      ? node.members
          .map((entry) => nameOf(entry.name))
          .filter(Boolean)
          .slice(0, 40)
      : [];
    add(context, 'contract', node, {
      name: node.name.text,
      format: ts.isInterfaceDeclaration(node) ? 'interface TypeScript' : 'type TypeScript',
      fields,
    });
  }
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    context.jsx = true;
    for (const attr of node.attributes.properties) {
      if (ts.isJsxAttribute(attr) && /^on[A-Z]/.test(attr.name.getText()))
        add(context, 'interaction', attr, {
          name: attr.name.getText(),
          element: node.tagName.getText(),
        });
    }
  }
  if (ts.isThrowStatement(node))
    add(context, 'error', node, { label: 'Exception levée dans le code' });
  if (ts.isCatchClause(node))
    add(context, 'error', node, { label: 'Branche de récupération catch' });
  nextRoute(node, context);
  nestRoute(node, context);
}

function functionFact(node, context) {
  const named = ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node);
  const arrow =
    ts.isVariableDeclaration(node) && node.initializer && ts.isArrowFunction(node.initializer);
  if (!named && !arrow) return;
  const name = nameOf(node.name);
  if (!name) return;
  const fn = arrow ? node.initializer : node;
  add(context, 'function', node, {
    name,
    parameters: fn.parameters
      .map((parameter) => nameOf(parameter.name) || 'déstructuration')
      .join(', '),
  });
}

function nestDecorator(node, context, expected) {
  if (!ts.canHaveDecorators(node)) return null;
  for (const decorator of ts.getDecorators(node) || []) {
    const call = decorator.expression;
    if (!ts.isCallExpression(call)) continue;
    const binding = context.bindings.get(call.expression.getText());
    if (binding?.packageName === '@nestjs/common' && expected.has(binding.imported))
      return { call, name: binding.imported };
  }
  return null;
}

function nestRoute(node, context) {
  if (!ts.isMethodDeclaration(node) || !ts.isClassDeclaration(node.parent)) return;
  const route = nestDecorator(
    node,
    context,
    new Set(['Get', 'Post', 'Put', 'Patch', 'Delete', 'Head', 'Options']),
  );
  const controller = nestDecorator(node.parent, context, new Set(['Controller']));
  if (!route || !controller) return;
  const prefix = controller.call.arguments.length ? literal(controller.call.arguments[0]) : '';
  const suffix = route.call.arguments.length ? literal(route.call.arguments[0]) : '';
  if (prefix === null || suffix === null)
    return add(context, 'gap', node, { message: 'Décorateur Nest calculé : route non résolue.' });
  add(context, 'route', node, {
    route: '/' + [prefix, suffix].join('/').split('/').filter(Boolean).join('/'),
    method: route.name.toUpperCase(),
    framework: 'décorateurs NestJS',
    limitation: 'Préfixe global, guards, interceptors et pipes non résolus.',
  });
}

function walk(node, context, visitor) {
  visitor(node, context);
  ts.forEachChild(node, (child) => walk(child, context, visitor));
}

/** Syntax only. Never resolves installed modules or executes project code. */
export function extractAST(source) {
  const file = ts.createSourceFile(source.path, source.content, ts.ScriptTarget.Latest, true);
  const context = {
    file,
    path: source.path,
    bindings: new Map(),
    routers: new Set(),
    clients: new Map(),
    facts: [],
    jsx: false,
    capped: false,
  };
  walk(file, context, importFact);
  walk(file, context, variableBindings);
  walk(file, context, (node, ctx) => {
    declaration(node, ctx);
    if (ts.isCallExpression(node)) visitCall(node, ctx);
  });
  const issues = file.parseDiagnostics.map((entry) => ({
    extractor: 'typescript-ast',
    path: source.path,
    message: ts.flattenDiagnosticMessageText(entry.messageText, ' '),
  }));
  if (context.capped)
    issues.push({
      extractor: 'typescript-ast',
      path: source.path,
      message: 'Limite de 120 faits atteinte pour ce fichier ; graphe partiel.',
    });
  return { facts: context.facts, jsx: context.jsx, issues };
}
