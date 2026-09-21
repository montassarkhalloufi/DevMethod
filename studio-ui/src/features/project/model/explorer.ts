import { translate } from '../../../i18n';
import type { ProjectFile } from './contracts';

export type FileGrouping = 'files' | 'layer' | 'feature';
export interface TreeItem {
  name: string;
  path: string;
  sourcePath: string;
  file?: ProjectFile;
  children: TreeItem[];
}
export const layerNames = (locale: 'en' | 'fr' = 'en') => ({
  frontend: translate('Frontend', 'Frontend', undefined, locale),
  backend: translate('Backend', 'Backend', undefined, locale),
  shared: translate('Partagé', 'Shared', undefined, locale),
  infrastructure: translate('Infrastructure', 'Infrastructure', undefined, locale),
  unclassified: translate('Autres fichiers', 'Other files', undefined, locale),
});
function groupName(file: ProjectFile, mode: FileGrouping, locale: 'en' | 'fr' = 'en') {
  if (mode === 'files') return '';
  return mode === 'layer'
    ? layerNames(locale)[file.layer]
    : file.feature ||
        translate('Sans fonctionnalité identifiée', 'No identified feature', undefined, locale);
}
function appendFile(items: TreeItem[], file: ProjectFile, group: string) {
  const segments = file.path.split('/');
  for (const [index, name] of segments.entries()) {
    const sourcePath = segments.slice(0, index + 1).join('/');
    let node = items.find((item) => item.name === name);
    if (!node) {
      node = { name, path: group + sourcePath, sourcePath, children: [] };
      items.push(node);
    }
    if (index === segments.length - 1) node.file = file;
    items = node.children;
  }
}
function sortTree(items: TreeItem[], locale: 'en' | 'fr'): TreeItem[] {
  items.sort(
    (a, b) =>
      Number(Boolean(a.file)) - Number(Boolean(b.file)) ||
      a.name.localeCompare(b.name, locale, { numeric: true, sensitivity: 'base' }),
  );
  for (const item of items) sortTree(item.children, locale);
  return items;
}
export function fileGroups(
  files: ProjectFile[],
  mode: FileGrouping,
  query: string,
  locale: 'en' | 'fr' = 'en',
): TreeItem[] {
  const items: TreeItem[] = [];
  const groups = new Map<string, TreeItem>();
  const search = query.trim().toLocaleLowerCase();
  for (const file of files) {
    if (!file.path.toLocaleLowerCase().includes(search)) continue;
    const name = groupName(file, mode, locale);
    if (!name) {
      appendFile(items, file, '');
      continue;
    }
    let root = groups.get(name);
    if (!root) {
      root = { name, path: name + ':', sourcePath: name, children: [] };
      groups.set(name, root);
    }
    appendFile(root.children, file, name + ':');
  }
  if (mode === 'files') return sortTree(items, locale);
  const grouped = sortTree([...groups.values()], locale);
  if (mode !== 'layer') return grouped;
  const rank = Object.values(layerNames(locale));
  return grouped.sort((a, b) => rank.indexOf(a.name) - rank.indexOf(b.name));
}
export function parentFolderPaths(
  file: ProjectFile,
  mode: FileGrouping,
  locale: 'en' | 'fr' = 'en',
): string[] {
  const name = groupName(file, mode, locale);
  const prefix = name ? name + ':' : '';
  const segments = file.path.split('/');
  const folders = segments
    .slice(0, -1)
    .map((_, index) => prefix + segments.slice(0, index + 1).join('/'));
  return name ? [prefix, ...folders] : folders;
}
export interface FileAppearance {
  kind: string;
  label: string;
  description: string;
}
const fallbackAppearance = { kind: 'file', label: '', description: 'Fichier' };
const configurationAppearance = { kind: 'config', label: '⚙', description: 'Configuration' };
const appearances: Record<string, FileAppearance> = {
  ts: { kind: 'typescript', label: 'TS', description: 'TypeScript' },
  tsx: { kind: 'react', label: 'TSX', description: 'React / TypeScript' },
  js: { kind: 'javascript', label: 'JS', description: 'JavaScript' },
  jsx: { kind: 'react', label: 'JSX', description: 'React / JavaScript' },
  json: { kind: 'json', label: '{}', description: 'JSON' },
  css: { kind: 'css', label: '#', description: 'CSS' },
  scss: { kind: 'css', label: '#', description: 'SCSS' },
  md: { kind: 'markdown', label: 'MD', description: 'Markdown' },
  html: { kind: 'html', label: '<>', description: 'HTML' },
  yaml: { kind: 'yaml', label: 'YML', description: 'YAML' },
  config: configurationAppearance,
  file: fallbackAppearance,
};
const aliases: Record<string, string> = {
  mts: 'ts',
  cts: 'ts',
  mjs: 'js',
  cjs: 'js',
  jsonc: 'json',
  yml: 'yaml',
  mdx: 'md',
  htm: 'html',
};
export function fileAppearance(file: ProjectFile, locale: 'en' | 'fr' = 'en'): FileAppearance {
  const name = file.path.split('/').at(-1)?.toLowerCase() || '';
  const extension = name.split('.').at(-1) || '';
  if (/^(dockerfile|makefile|\.env(?:\..*)?|\.gitignore|\.npmrc|\.editorconfig)$/.test(name)) {
    return configurationAppearance;
  }
  const appearance = appearances[aliases[extension] || extension] || fallbackAppearance;
  return appearance === fallbackAppearance
    ? { ...appearance, description: translate('Fichier', 'File', undefined, locale) }
    : appearance;
}
