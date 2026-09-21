import fs from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { safeFile } from './files.mjs';
import { documentProtocol } from './admission.mjs';
import { checkJavaScriptSource } from './verify.mjs';

const require = createRequire(import.meta.url);
const javascriptTypes = new Set([
  '',
  'text/javascript',
  'application/javascript',
  'text/ecmascript',
  'application/ecmascript',
  'application/x-javascript',
  'application/x-ecmascript',
  'text/x-javascript',
  'text/x-ecmascript',
  'text/javascript1.0',
  'text/javascript1.1',
  'text/javascript1.2',
  'text/javascript1.3',
  'text/javascript1.4',
  'text/javascript1.5',
  'text/jscript',
  'text/livescript',
]);

function inspectScript(node, file, results, modules) {
  const attrs = Object.fromEntries(node.attrs.map(({ name, value }) => [name, value]));
  if ('src' in attrs) return;
  const type = (attrs.type ?? (attrs.language ? `text/${attrs.language}` : ''))
    .trim()
    .toLowerCase();
  const content = node.childNodes.map((child) => child.value ?? '').join('');
  const location = `${file}:script:${node.sourceCodeLocation?.startLine ?? '?'}`;
  if (type === 'module') {
    modules.push({ file: location, content });
    return;
  }
  if (
    !javascriptTypes.has(type) &&
    !['application/json', 'application/ld+json', 'importmap'].includes(type)
  )
    return;
  try {
    if (javascriptTypes.has(type)) new Script(content, { filename: location });
    else JSON.parse(content);
    results.push({ file: location, status: 'passed' });
  } catch (error) {
    results.push({ file: location, status: 'failed', output: error.message });
  }
}

function inspectDocument(root, file, results, modules) {
  try {
    const content = fs.readFileSync(safeFile(root, file.path), 'utf8');
    if (/\.json$/i.test(file.path)) {
      JSON.parse(content);
      results.push({ file: file.path, status: 'passed' });
      return;
    }
    const { parse } = require('parse5');
    const document = parse(content, { sourceCodeLocationInfo: true });
    const pending = [document];
    while (pending.length) {
      const node = pending.pop();
      if (node.tagName === 'script') inspectScript(node, file.path, results, modules);
      pending.push(...(node.childNodes ?? []));
      if (node.content) pending.push(node.content);
    }
    results.push({
      file: file.path,
      status: 'passed',
      output: 'HTML analysé ; scripts identifiés. Validité HTML et comportement non évalués.',
    });
  } catch (error) {
    results.push({
      file: file.path,
      status: error.code ? 'error' : 'failed',
      output: error.message,
    });
  }
}

function receipt(results) {
  return [
    {
      label: 'JSON et syntaxe des scripts HTML intégrés — comportement non évalué',
      kind: 'command',
      protocol: documentProtocol,
      status: results.every((result) => result.status === 'passed') ? 'passed' : 'failed',
      command:
        'JSON.parse ; parse5 HTML ; vm.Script sans exécution ; node --input-type=module --check pour scripts module ; borne modules 10s',
      output: JSON.stringify({
        results,
        limits:
          'Pas de validation HTML, gestionnaires on*, URLs javascript:, résolution imports ou comportement. Scripts de données inconnus ignorés.',
      }).slice(0, 16000),
    },
  ];
}

async function inspectModules(modules, results) {
  const deadline = Date.now() + 10000;
  for (const item of modules) {
    if (Date.now() >= deadline) {
      results.push({
        file: item.file,
        status: 'not-run',
        output: 'Borne globale atteinte ; modules restants non vérifiés.',
      });
      break;
    }
    const result = await checkJavaScriptSource(item.content, 'module', deadline - Date.now());
    results.push({
      file: item.file,
      status: result.error ? 'error' : result.code === 0 ? 'passed' : 'failed',
      output: result.output,
    });
  }
  return receipt(results);
}

export function candidateDocumentChecks(root, files) {
  const documents = files.filter((file) => /\.(?:html?|json)$/i.test(file.path));
  if (!documents.length) return [];
  const results = [],
    modules = [];
  for (const file of documents) inspectDocument(root, file, results, modules);
  return modules.length ? inspectModules(modules, results) : receipt(results);
}
