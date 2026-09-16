import { useState } from 'react';
import type { ProjectAnalysis } from '../model/contracts';
import { fileGroups, type TreeItem } from '../model/explorer';
import { ProjectIcon } from './ProjectIcon';
function Tree({
  items,
  selected,
  onSelect,
}: {
  items: TreeItem[];
  selected: string | null;
  onSelect(path: string): void;
}) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.path}>
          {item.file ? (
            <button
              type="button"
              className="project-file"
              aria-current={selected === item.file.path ? 'true' : undefined}
              title={item.file.path}
              onClick={() => onSelect(item.file!.path)}
            >
              <span
                className={'file-glyph language-' + item.file.language.toLowerCase()}
                aria-hidden="true"
              >
                {['typescript', 'TS'].includes(item.file.language) ? (
                  'TS'
                ) : ['typescriptreact', 'TSX'].includes(item.file.language) ? (
                  'TSX'
                ) : (
                  <ProjectIcon />
                )}
              </span>
              <span>{item.name}</span>
            </button>
          ) : (
            <details open>
              <summary>
                <ProjectIcon name="folder" />
                {item.name}
              </summary>
              <Tree items={item.children} selected={selected} onSelect={onSelect} />
            </details>
          )}
        </li>
      ))}
    </ul>
  );
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
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<'layer' | 'feature'>('layer');
  const tree = fileGroups(analysis.files, group, query);
  return (
    <nav className="project-explorer" aria-label="Explorateur du projet">
      <div className="explorer-tools">
        <label className="project-search">
          <ProjectIcon name="search" />
          <input
            aria-label="Rechercher un fichier"
            placeholder="Rechercher un fichier…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          aria-label="Organisation des fichiers"
          value={group}
          onChange={(event) => setGroup(event.target.value as 'layer' | 'feature')}
        >
          <option value="layer">Par couche</option>
          <option value="feature">Par fonctionnalité</option>
        </select>
      </div>
      <div className="project-file-tree">
        <Tree items={tree} selected={selected} onSelect={onSelect} />
        {!tree.length && <p>Aucun fichier correspondant.</p>}
      </div>
      <p className="explorer-note">
        {analysis.files.length} fichiers · classement logique
        {!analysis.backendDetected && (
          <>
            <br />
            Aucun backend détecté dans ces sources.
          </>
        )}
      </p>
    </nav>
  );
}
