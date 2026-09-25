import ts from 'typescript';

export const riskChecks = {
  visual: ['visual-comparison'],
  interaction: ['end-to-end', 'keyboard'],
  network: ['network-recovery', 'end-to-end'],
  concurrency: ['concurrency'],
  permissions: ['authorization'],
  logic: ['unit-tests'],
};

const descriptions = {
  visual: 'Présentation modifiée : comparer le rendu de cette version.',
  interaction: 'Interaction ou visibilité modifiée : exercer le parcours et le clavier.',
  network: 'Échanges asynchrones modifiés : éprouver erreurs, délais et ordre des réponses.',
  concurrency: 'État partagé ou persistance asynchrone : éprouver doublons et accès concurrents.',
  permissions: 'Condition d’accès modifiée : vérifier les identités et le refus côté serveur.',
  logic: 'Logique modifiée : vérifier les invariants concernés.',
};
const printer = ts.createPrinter({ removeComments: true });

function statements(path, text) {
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  return {
    source,
    units: source.statements.map((node) => ({
      node,
      text: printer.printNode(ts.EmitHint.Unspecified, node, source),
    })),
  };
}

function unitCategories(node) {
  const identifiers = new Set(),
    calls = new Set();
  let asynchronous = false,
    assignment = false,
    storageWrite = false;

  function visit(child) {
    if (ts.isIdentifier(child)) identifiers.add(child.text.toLowerCase());
    if (ts.isCallExpression(child)) {
      const expression = child.expression;
      if (ts.isIdentifier(expression)) calls.add(expression.text.toLowerCase());
      if (ts.isPropertyAccessExpression(expression)) calls.add(expression.name.text.toLowerCase());
      storageWrite ||= persistentWrite(expression);
    }
    asynchronous ||=
      ts.isAwaitExpression(child) ||
      Boolean(child.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword));
    assignment ||=
      ts.isBinaryExpression(child) && child.operatorToken.kind === ts.SyntaxKind.EqualsToken;
    ts.forEachChild(child, visit);
  }

  visit(node);
  const has = (set, values) => values.some((value) => set.has(value));
  const categories = [];
  if (
    has(calls, ['fetch', 'request', 'get', 'post']) ||
    has(identifiers, ['axios', 'xmlhttprequest'])
  )
    categories.push('network');
  if (
    asynchronous &&
    (assignment ||
      storageWrite ||
      has(calls, [
        'insert',
        'update',
        'delete',
        'save',
        'write',
        'setitem',
        'transaction',
        'query',
        'execute',
        'create',
        'upsert',
      ]))
  )
    categories.push('concurrency');
  if (
    has(identifiers, [
      'role',
      'roles',
      'permission',
      'permissions',
      'authorize',
      'isadmin',
      'isauthorized',
      'requireauth',
    ])
  )
    categories.push('permissions');
  return categories.length ? categories : ['logic'];
}

function persistentWrite(expression) {
  if (!ts.isPropertyAccessExpression(expression)) return false;
  const method = expression.name.text;
  let root = expression.expression;
  while (ts.isPropertyAccessExpression(root)) root = root.expression;
  return (
    ts.isIdentifier(root) &&
    /^(db|database|prisma|pool|store|repository|storage)$/i.test(root.text) &&
    /^(insert|set|save|update|delete|write|create|upsert|increment|decrement|transaction|query|execute)/i.test(
      method,
    )
  );
}

function codeFindings(change, limits) {
  const before = statements(change.path, change.before ?? ''),
    after = statements(change.path, change.after ?? '');
  if (before.source.parseDiagnostics.length || after.source.parseDiagnostics.length)
    limits.push(`${change.path} : syntaxe partiellement comprise.`);
  const findings = [];
  for (const [side, current, other] of [
    ['before', before, after],
    ['after', after, before],
  ]) {
    const unchanged = other.units.map((unit) => unit.text);
    for (const unit of current.units) {
      const matching = unchanged.indexOf(unit.text);
      if (matching >= 0) {
        unchanged.splice(matching, 1);
        continue;
      }
      const line = current.source.getLineAndCharacterOfPosition(unit.node.getStart()).line + 1;
      for (const category of unitCategories(unit.node))
        findings.push({ category, path: change.path, side, line, reason: descriptions[category] });
    }
  }
  return findings;
}

function cssFindings(change, limits) {
  const text = `${change.before ?? ''}\n${change.after ?? ''}`.replace(/\/\*[\s\S]*?\*\//g, '');
  // A narrow presentation profile, never a complete CSS parser or accessibility proof.
  const declarations = [...text.matchAll(/([\w-]+)\s*:\s*([^;{}]+)/g)];
  const presentation =
    /^(color|background-color|margin(?:-.+)?|padding(?:-.+)?|border(?:-.+)?|font(?:-.+)?|line-height|letter-spacing|gap|row-gap|column-gap)$/;
  const narrow =
    declarations.length > 0 &&
    declarations.every((match) => presentation.test(match[1])) &&
    !/[@$]|var\s*\(|url\s*\(|[&]|:focus|:active|:hover|\b(?:button|input|select|textarea)\b/.test(
      text,
    );
  if (!narrow)
    limits.push(`${change.path} : effet CSS sur les interactions et consommateurs à confirmer.`);
  return (narrow ? ['visual'] : ['visual', 'interaction']).map((category) => ({
    category,
    path: change.path,
    side: change.after === null ? 'before' : 'after',
    line: 1,
    reason: descriptions[category],
  }));
}

export function profileChanges(changes) {
  const limits = [],
    findings = [];
  for (const change of changes) {
    if (change.before === change.after) continue;
    if (/\.[cm]?[jt]sx?$/i.test(change.path)) findings.push(...codeFindings(change, limits));
    else if (/\.css$/i.test(change.path)) findings.push(...cssFindings(change, limits));
    else if (/\.html$/i.test(change.path) && [change.before, change.after].every(staticMarkup))
      findings.push({
        category: 'visual',
        path: change.path,
        side: change.after === null ? 'before' : 'after',
        line: 1,
        reason: descriptions.visual,
      });
    else
      limits.push(
        `${change.path} : analyse comportementale non prise en charge ; examen contextuel requis.`,
      );
  }
  const unique = [...new Map(findings.map((item) => [JSON.stringify(item), item])).values()];
  const categories = [...new Set(unique.map((finding) => finding.category))].sort();
  return {
    categories,
    findings: unique.slice(0, 100),
    checks: [...new Set(categories.flatMap((category) => riskChecks[category]))].sort(),
    limits: [
      ...limits,
      ...(unique.length > 100 ? ['Constats limités à 100 ; couverture incomplète.'] : []),
    ],
  };
}

function staticMarkup(value) {
  if (value === null) return true;
  const text = value.replace(/<!doctype html>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  // Deliberately limited to inert, attribute-free markup. Forms, scripts and attributes require context.
  const remainder = text.replace(
    /<\/?(?:html|head|body|title|h[1-6]|p|div|span|ul|ol|li|strong|em|main|section|article|header|footer|br)\s*\/?>/gi,
    '',
  );
  return !/[<>]/.test(remainder);
}
