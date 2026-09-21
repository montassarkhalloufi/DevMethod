import path from 'node:path';
import ts from 'typescript';
import { ALLOWED_PACKAGES, problem, type Diagnostic } from './types.js';
import { normalize, packageName, trustedRequire, type Resolution } from './resolution.js';

const options: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  noUncheckedIndexedAccess: true,
  noImplicitOverride: true,
  noEmit: true,
  esModuleInterop: true,
  forceConsistentCasingInFileNames: true,
  isolatedModules: true,
  resolveJsonModule: true,
  allowArbitraryExtensions: true,
  types: [],
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
};

function moduleFile(
  id: string,
  containing: string,
  context: Resolution,
  host: ts.CompilerHost,
): ts.ResolvedModule | undefined {
  if (context.files.has(normalize(containing))) {
    if (id.startsWith('.') || id.startsWith('@/') || id.startsWith('/')) {
      if (id.endsWith('.css')) return undefined;
      try {
        return { resolvedFileName: context.local(id, containing) };
      } catch {
        return undefined;
      }
    }
    if (!ALLOWED_PACKAGES.includes(packageName(id))) return undefined;
    containing = trustedRequire.resolve('typescript');
  }
  return ts.resolveModuleName(id, containing, options, host).resolvedModule;
}

function compilerHost(context: Resolution): ts.CompilerHost {
  const host = ts.createCompilerHost(options, true);
  const assetFile = normalize(path.join(context.sourceRoot, '__studio_assets.d.ts'));
  const assetSource =
    'declare module "*.css"; declare module "*.svg" { const value: string; export default value; }';
  host.readFile = (file) => (normalize(file) === assetFile ? assetSource : context.read(file));
  host.fileExists = (file) => host.readFile(file) !== undefined;
  host.directoryExists = (directory) => {
    const dir = normalize(directory) + '/';
    return [...context.files.keys(), ...context.roots.map((root) => normalize(root) + '/')].some(
      (file) => file.startsWith(dir) || dir.startsWith(file),
    );
  };
  host.getSourceFile = (file, languageVersion) => {
    const source = host.readFile(file);
    return source === undefined
      ? undefined
      : ts.createSourceFile(file, source, languageVersion, true);
  };
  host.getCurrentDirectory = () => context.sourceRoot;
  host.realpath = (file) => file;
  host.resolveModuleNames = (names, containing) =>
    names.map((id) => moduleFile(id, containing, context, host));
  return host;
}

function sourceRestrictions(source: ts.SourceFile, context: Resolution): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const file = path.relative(context.sourceRoot, source.fileName).replaceAll('\\', '/');

  function visit(node: ts.Node): void {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      diagnostics.push({
        ...problem(
          'Un type any explicite contourne le profil strict ; utiliser unknown puis affiner le type.',
          file,
        ),
        line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
      });
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      !ts.isStringLiteralLike(node.arguments[0] ?? node)
    ) {
      diagnostics.push(
        problem('Les imports dynamiques doivent utiliser un chemin littéral connu.', file),
      );
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  diagnostics.push(...suppressionComments(source, file));
  return diagnostics;
}

function suppressionComments(source: ts.SourceFile, file: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.JSX,
    source.text,
  );
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (
      token !== ts.SyntaxKind.SingleLineCommentTrivia &&
      token !== ts.SyntaxKind.MultiLineCommentTrivia
    )
      continue;
    if (!/@ts-(?:ignore|nocheck|expect-error)\b/.test(scanner.getTokenText())) continue;
    diagnostics.push({
      ...problem(
        'Les directives qui suppriment le contrôle TypeScript sont refusées dans les sources applicatives.',
        file,
      ),
      line: source.getLineAndCharacterOfPosition(scanner.getTokenPos()).line + 1,
    });
  }
  return diagnostics;
}

export function typecheck(context: Resolution): Diagnostic[] {
  const sourceDirectory = normalize(path.join(context.sourceRoot, 'src')) + '/';
  const rootNames = [...context.files.keys()].filter(
    (file) => file.startsWith(sourceDirectory) && /\.(ts|tsx)$/.test(file),
  );
  rootNames.push(path.join(context.sourceRoot, '__studio_assets.d.ts'));
  const program = ts.createProgram(rootNames, options, compilerHost(context));
  const diagnostics: Diagnostic[] = ts
    .getPreEmitDiagnostics(program)
    .slice(0, 100)
    .map((item) => {
      const file =
        item.file && context.files.has(normalize(item.file.fileName))
          ? path.relative(context.sourceRoot, item.file.fileName).replaceAll('\\', '/')
          : 'types';
      const result = problem(ts.flattenDiagnosticMessageText(item.messageText, '\n'), file);
      if (item.file && item.start !== undefined)
        result.line = item.file.getLineAndCharacterOfPosition(item.start).line + 1;
      return result;
    });
  for (const source of program.getSourceFiles()) {
    if (context.files.has(normalize(source.fileName)))
      diagnostics.push(...sourceRestrictions(source, context));
  }
  return diagnostics;
}
