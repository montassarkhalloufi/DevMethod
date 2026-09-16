import type { ProjectFile } from './contracts';
export interface TreeItem {
  name: string;
  path: string;
  file?: ProjectFile;
  children: TreeItem[];
}
export const layerNames = {
  frontend: 'Frontend',
  backend: 'Backend',
  shared: 'Partagé',
  infrastructure: 'Infrastructure',
  unclassified: 'Non classé',
};
export function fileGroups(
  files: ProjectFile[],
  mode: 'layer' | 'feature',
  query: string,
): TreeItem[] {
  const groups = new Map<string, TreeItem>();
  for (const file of files) {
    if (!file.path.toLocaleLowerCase().includes(query.toLocaleLowerCase())) continue;
    const group =
      mode === 'layer' ? layerNames[file.layer] : file.feature || 'Sans fonctionnalité identifiée';
    let root = groups.get(group);
    if (!root) {
      root = { name: group, path: group, children: [] };
      groups.set(group, root);
    }
    let items = root.children;
    const segments = file.path.split('/');
    segments.forEach((name, index) => {
      const path = segments.slice(0, index + 1).join('/');
      let node = items.find((item) => item.name === name);
      if (!node) {
        node = { name, path: group + ':' + path, children: [] };
        items.push(node);
      }
      if (index === segments.length - 1) node.file = file;
      items = node.children;
    });
  }
  const rank = Object.values(layerNames);
  return [...groups.values()].sort((a, b) =>
    mode === 'layer' ? rank.indexOf(a.name) - rank.indexOf(b.name) : a.name.localeCompare(b.name),
  );
}
