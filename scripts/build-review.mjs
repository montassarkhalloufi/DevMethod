// Bundle only the reviewed, dependency-free browser modules in dependency order.
import fs from 'node:fs';
import ts from 'typescript';

const modules = [
  'review-model',
  'review-dom',
  'review-panels',
  'review-summary',
  'review-detail',
  'review-app',
];

function browserModule(name, available) {
  const source = fs.readFileSync(`dist/${name}.js`, 'utf8').replace(/\r\n/g, '\n');
  const file = ts.createSourceFile(
    `${name}.js`,
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS,
  );
  const edits = [];

  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement)) {
      const dependency = statement.moduleSpecifier;
      if (!ts.isStringLiteral(dependency) || !available.has(dependency.text)) {
        throw new Error(`Review browser dependency changed in ${name}; inspect bundling.`);
      }
      edits.push({ start: statement.getStart(file), end: statement.end });
      continue;
    }

    for (const modifier of statement.modifiers || []) {
      if (modifier.kind === ts.SyntaxKind.ExportKeyword) {
        edits.push({ start: modifier.getStart(file), end: modifier.end });
      }
    }
  }

  return edits
    .reverse()
    .reduce((code, edit) => code.slice(0, edit.start) + code.slice(edit.end), source);
}

const available = new Set();
const sources = modules.map((name) => {
  const source = browserModule(name, available);
  available.add(`./${name}.js`);
  return source;
});

fs.writeFileSync(
  'dist/review-browser.js',
  `(function () {\n'use strict';\n${sources.join('\n')}\n})();\n`,
);
fs.copyFileSync('src/review-ui.css', 'dist/review-ui.css');
