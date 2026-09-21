import { useI18n } from '../../../i18n';

import { useRef, useState } from 'react';
import type { ProjectAnalysis, ProjectFile } from '../model/contracts';
import {
  fileAppearance,
  fileGroups,
  parentFolderPaths,
  type FileGrouping,
  type TreeItem,
} from '../model/explorer';
import { ProjectIcon } from './ProjectIcon';
import { ExplorerResizer } from './ExplorerResizer';

function FileItem({
  file,
  name,
  selected,
  onSelect,
}: {
  file: ProjectFile;
  name: string;
  selected: string | null;
  onSelect(path: string): void;
}) {
  const { locale } = useI18n();
  const appearance = fileAppearance(file, locale);
  return (
    <button
      type="button"
      className="project-file"
      aria-current={selected === file.path ? 'true' : undefined}
      aria-label={`${name} · ${appearance.description}`}
      title={file.path}
      onClick={() => onSelect(file.path)}
    >
      <span className={'file-glyph file-kind-' + appearance.kind} aria-hidden="true">
        {appearance.label || <ProjectIcon />}
      </span>
      <span className="project-tree-name">{name}</span>
    </button>
  );
}
interface TreeProps {
  items: TreeItem[];
  selected: string | null;
  closed: ReadonlySet<string>;
  onToggle(path: string, open: boolean): void;
  onSelect(path: string): void;
}
function Tree({ items, selected, onSelect, closed, onToggle }: TreeProps) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.path}>
          {item.file ? (
            <FileItem file={item.file} name={item.name} selected={selected} onSelect={onSelect} />
          ) : (
            <details
              open={!closed.has(item.path)}
              onToggle={(event) => onToggle(item.path, event.currentTarget.open)}
            >
              <summary title={item.sourcePath}>
                <ProjectIcon name="folder" />
                <span className="project-tree-name">{item.name}</span>
              </summary>
              <Tree
                items={item.children}
                selected={selected}
                onSelect={onSelect}
                closed={closed}
                onToggle={onToggle}
              />
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}
function toggleFolder(current: Set<string>, path: string, open: boolean): Set<string> {
  if (current.has(path) !== open) return current;
  const next = new Set(current);
  if (open) next.delete(path);
  else next.add(path);
  return next;
}
export function FileExplorer({
  analysis,
  selected,
  onSelect,
}: {
  analysis: ProjectAnalysis;
  selected: string | null;
  onSelect(path: string): void;
}) {
  const { t, locale } = useI18n();
  const explorer = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<FileGrouping>('files');
  const [closed, setClosed] = useState<Set<string>>(() => new Set());
  const [searchClosed, setSearchClosed] = useState<Set<string>>(() => new Set());
  const tree = fileGroups(analysis.files, group, query, locale);
  function selectFile(path: string) {
    const file = analysis.files.find((candidate) => candidate.path === path);
    if (file) {
      setClosed((current) => {
        const folders = parentFolderPaths(file, group, locale);
        if (!folders.some((folder) => current.has(folder))) return current;
        return new Set([...current].filter((folder) => !folders.includes(folder)));
      });
    }
    onSelect(path);
  }
  const changeFolder = query.trim() ? setSearchClosed : setClosed;
  return (
    <nav
      ref={explorer}
      className="project-explorer"
      aria-label={t('Explorateur du projet', 'Project explorer')}
    >
      <div className="explorer-tools">
        <span className="explorer-heading">{t('Explorateur', 'Explorer')}</span>
        <label className="project-search">
          <ProjectIcon name="search" />
          <input
            aria-label={t('Rechercher un fichier', 'Search for a file')}
            placeholder={t('Rechercher un fichier…', 'Search for a file…')}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchClosed(new Set());
            }}
          />
        </label>
        <select
          aria-label={t('Organisation des fichiers', 'File organization')}
          value={group}
          onChange={(event) => setGroup(event.target.value as FileGrouping)}
        >
          <option value="files">{t('Dossiers du projet', 'Project folders')}</option>
          <option value="layer">{t('Regrouper par couche', 'Group by layer')}</option>
          <option value="feature">{t('Regrouper par fonctionnalité', 'Group by feature')}</option>
        </select>
      </div>
      <div className="project-file-tree">
        <Tree
          items={tree}
          selected={selected}
          onSelect={selectFile}
          closed={query.trim() ? searchClosed : closed}
          onToggle={(path, open) => changeFolder((current) => toggleFolder(current, path, open))}
        />
        {!tree.length && <p>{t('Aucun fichier correspondant.', 'No matching files.')}</p>}
      </div>
      <p className="explorer-note">
        {analysis.files.length} {t('fichiers ·', 'files ·')}{' '}
        {group === 'files'
          ? t('dossiers du projet', 'project folders')
          : t('classement logique', 'logical grouping')}
        {!analysis.backendDetected && (
          <>
            <br />
            {t('Aucun backend détecté dans ces sources.', 'No backend detected in these sources.')}
          </>
        )}
      </p>
      <ExplorerResizer explorer={explorer} />
    </nav>
  );
}
