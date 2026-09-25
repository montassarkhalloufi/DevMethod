import path from 'node:path';
import ts from 'typescript';

const configPattern = /(?:^|\/)(?:tsconfig(?:\.[\w-]+)?|jsconfig)\.json$/;
const within = (file, directory) => directory === '.' || file.startsWith(directory + '/');
const extensions = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
  '.json',
  '/index.ts',
  '/index.tsx',
  '/index.js',
];

function resolveFile(candidate, paths) {
  const normalized = path.posix.normalize(candidate);
  if (normalized.startsWith('../') || path.posix.isAbsolute(normalized)) return null;
  const withoutJS = normalized.replace(/\.[cm]?jsx?$/, '');
  return (
    [
      normalized,
      ...extensions.flatMap((extension) => [normalized + extension, withoutJS + extension]),
    ].find((name) => paths.has(name)) || null
  );
}

function parseConfig(source, issues) {
  const parsed = ts.parseConfigFileTextToJson(source.path, source.content);
  if (parsed.error) {
    issues.push({
      extractor: 'tsconfig',
      path: source.path,
      message: ts.flattenDiagnosticMessageText(parsed.error.messageText, ' '),
    });
    return null;
  }
  return parsed.config && typeof parsed.config === 'object' ? parsed.config : null;
}

function inheritedConfig(name, configs, visited, issues) {
  if (visited.has(name)) {
    issues.push({
      extractor: 'tsconfig',
      path: name,
      message: 'Héritage de configuration cyclique : aliases non hérités.',
    });
    return {};
  }
  const data = configs.get(name);
  if (!data) return {};
  visited.add(name);
  let inherited = {};
  if (typeof data.extends === 'string' && data.extends.startsWith('.')) {
    const candidate = path.posix.normalize(path.posix.join(path.posix.dirname(name), data.extends));
    const parent = configs.has(candidate) ? candidate : candidate + '.json';
    if (configs.has(parent)) inherited = inheritedConfig(parent, configs, visited, issues);
    else
      issues.push({
        extractor: 'tsconfig',
        path: name,
        message: 'Configuration parente absente du snapshot : ' + data.extends,
      });
  } else if (data.extends)
    issues.push({
      extractor: 'tsconfig',
      path: name,
      message: 'Héritage de package ou multiple non résolu ; aucun fichier installé consulté.',
    });
  const options = data.compilerOptions || {},
    directory = path.posix.dirname(name);
  return {
    ...inherited,
    name,
    directory,
    ...(typeof options.baseUrl === 'string'
      ? { baseDirectory: path.posix.normalize(path.posix.join(directory, options.baseUrl)) }
      : {}),
    ...(options.paths && typeof options.paths === 'object'
      ? { mappings: options.paths, pathsDirectory: directory, pathsSource: name }
      : {}),
  };
}

function substitution(pattern, specifier) {
  const index = pattern.indexOf('*');
  if (index === -1) return pattern === specifier ? '' : null;
  if (pattern.indexOf('*', index + 1) !== -1) return null;
  const prefix = pattern.slice(0, index),
    suffix = pattern.slice(index + 1);
  return specifier.startsWith(prefix) && specifier.endsWith(suffix)
    ? specifier.slice(prefix.length, specifier.length - suffix.length)
    : null;
}

function fromConfig(config, specifier, paths) {
  const entries = Object.entries(config.mappings || {}).sort(
    ([left], [right]) => right.replace('*', '').length - left.replace('*', '').length,
  );
  for (const [pattern, targets] of entries) {
    const match = substitution(pattern, specifier);
    if (match === null || !Array.isArray(targets)) continue;
    for (const target of targets.filter((value) => typeof value === 'string')) {
      const file = resolveFile(
        path.posix.join(config.baseDirectory || config.pathsDirectory, target.replace('*', match)),
        paths,
      );
      if (file) return { path: file, config: config.pathsSource, alias: true };
    }
    return { path: null, config: config.pathsSource, alias: true };
  }
  if (!config.baseDirectory) return null;
  const file = resolveFile(path.posix.join(config.baseDirectory, specifier), paths);
  return file ? { path: file, config: config.name, alias: true } : null;
}

/** Resolve only files contained in the selected project snapshot. No module loading. */
export function createImportResolver(sources, issues) {
  const paths = new Set(sources.map((source) => source.path)),
    configs = new Map();
  for (const source of sources.filter(
    (source) => configPattern.test(source.path) && !source.binary && !source.truncated,
  )) {
    const data = parseConfig(source, issues);
    if (data) configs.set(source.path, data);
  }
  const options = [...configs.keys()].map((name) =>
    inheritedConfig(name, configs, new Set(), issues),
  );
  return (file, specifier) => {
    if (specifier.startsWith('.'))
      return {
        path: resolveFile(path.posix.join(path.posix.dirname(file), specifier), paths),
        alias: false,
      };
    const applicable = options
      .filter(
        (config) => within(file, config.directory) && (config.mappings || config.baseDirectory),
      )
      .sort((left, right) => right.directory.length - left.directory.length);
    if (!applicable.length) return null;
    let nearest = applicable.filter(
      (config) => config.directory.length === applicable[0].directory.length,
    );
    const canonical = nearest.filter((config) =>
      ['tsconfig.json', 'jsconfig.json'].includes(path.posix.basename(config.name)),
    );
    if (canonical.length) nearest = canonical;
    const matches = nearest.map((config) => fromConfig(config, specifier, paths)).filter(Boolean);
    const found = [...new Set(matches.map((match) => match.path).filter(Boolean))];
    if (found.length > 1) return { path: null, alias: true, ambiguous: true };
    return matches.find((match) => match.path) || matches[0] || null;
  };
}

export const isTSConfig = (name) => configPattern.test(name);
