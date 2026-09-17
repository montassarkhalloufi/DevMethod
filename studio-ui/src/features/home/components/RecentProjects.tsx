import { useState } from 'react';
import type { RefObject } from 'react';
import type { HomeProject } from '../model/contracts';
import { kindLabels, projectDate, projectSearch } from '../model/home';
import { HomeIcon } from './HomeIcon';

export function RecentProjects({
  projects,
  loading,
  error,
  busy,
  searchRef,
  onRefresh,
  onOpen,
  onOther,
}: {
  projects: HomeProject[];
  loading: boolean;
  error: string;
  busy: boolean;
  searchRef: RefObject<HTMLInputElement | null>;
  onRefresh(): void;
  onOpen(project: HomeProject): void;
  onOther(trigger: HTMLButtonElement): void;
}) {
  const [query, setQuery] = useState('');
  const visible = projects.filter((project) => projectSearch(project, query));
  return (
    <section className="home-recents" aria-labelledby="home-recents-title">
      <div className="home-section-heading">
        <div>
          <h2 id="home-recents-title">Vos projets récents</h2>
          <p>Retrouvez votre contexte, vos décisions et vos versions.</p>
        </div>
        <button
          type="button"
          className="home-refresh"
          disabled={loading || busy}
          onClick={onRefresh}
        >
          {loading ? 'Actualisation…' : 'Actualiser'}
        </button>
      </div>
      {projects.length ? (
        <label className="home-search">
          <span className="home-sr">Rechercher un projet</span>
          <input
            ref={searchRef}
            type="search"
            name="project-search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un projet…"
          />
        </label>
      ) : null}
      {error ? (
        <p role="alert" className="home-error">
          {error} {projects.length ? 'Vos projets déjà chargés restent visibles. ' : ''}
          Actualisez pour réessayer.
        </p>
      ) : null}
      {loading && !projects.length ? (
        <p className="home-empty" role="status">
          Lecture de vos projets…
        </p>
      ) : null}
      {!loading && !error && !projects.length ? (
        <div className="home-empty">
          <HomeIcon kind="folder" />
          <h3>Votre prochain projet commence ici</h3>
          <p>
            Créez un projet ou importez vos sources. Ils apparaîtront ici pour les retrouver
            facilement.
          </p>
        </div>
      ) : null}
      {projects.length && !visible.length ? (
        <p className="home-empty" role="status">
          Aucun projet ne correspond à cette recherche.
        </p>
      ) : null}
      <ul className="home-project-list">
        {visible.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              className="home-project"
              disabled={busy}
              onClick={() => onOpen(project)}
              aria-label={`Ouvrir ${project.name}`}
            >
              <span className="home-project-icon">
                <HomeIcon kind="folder" />
              </span>
              <span className="home-project-copy">
                <strong>{project.name}</strong>
                <span className="home-project-path" title={project.workspace}>
                  {project.workspace}
                </span>
              </span>
              <span className="home-project-meta">
                <span>{kindLabels[project.kind]}</span>
                <time dateTime={project.lastOpenedAt || project.createdAt}>
                  {projectDate(project)}
                </time>
              </span>
              <span className="home-project-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="home-other"
        disabled={busy}
        onClick={(event) => onOther(event.currentTarget)}
      >
        Ouvrir un autre dossier Studio <span aria-hidden="true">↗</span>
      </button>
    </section>
  );
}
