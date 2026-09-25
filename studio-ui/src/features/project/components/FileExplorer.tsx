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
  const appearance = fileAppearance(file);
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
  const explorer = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<FileGrouping>('files');
  const [closed, setClosed] = useState<Set<string>>(() => new Set());
  const [searchClosed, setSearchClosed] = useState<Set<string>>(() => new Set());
  const tree = fileGroups(analysis.files, group, query);
  function selectFile(path: string) {
    const file = analysis.files.find((candidate) => candidate.path === path);
    if (file) {
      setClosed((current) => {
        const folders = parentFolderPaths(file, group);
        if (!folders.some((folder) => current.has(folder))) return current;
        return new Set([...current].filter((folder) => !folders.includes(folder)));
      });
    }
    onSelect(path);
  }
  const changeFolder = query.trim() ? setSearchClosed : setClosed;
  return (
    <nav ref={explorer} className="project-explorer" aria-label="Explorateur du projet">
      <div className="explorer-tools">
        <span className="explorer-heading">Explorateur</span>
        <label className="project-search">
          <ProjectIcon name="search" />
          <input
            aria-label="Rechercher un fichier"
            placeholder="Rechercher un fichier…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchClosed(new Set());
            }}
          />
        </label>
        <select
          aria-label="Organisation des fichiers"
          value={group}
          onChange={(event) => setGroup(event.target.value as FileGrouping)}
        >
          <option value="files">Dossiers du projet</option>
          <option value="layer">Regrouper par couche</option>
          <option value="feature">Regrouper par fonctionnalité</option>
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
        {!tree.length && <p>Aucun fichier correspondant.</p>}
      </div>
      <p className="explorer-note">
        {analysis.files.length} fichiers ·{' '}
        {group === 'files' ? 'dossiers du projet' : 'classement logique'}
        {!analysis.backendDetected && (
          <>
            <br />
            Aucun backend détecté dans ces sources.
          </>
        )}
      </p>
      <ExplorerResizer explorer={explorer} />
    </nav>
  );
}
