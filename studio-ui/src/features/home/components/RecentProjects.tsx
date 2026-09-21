import { useI18n } from '../../../i18n';
import { useState } from 'react';
import type { RefObject } from 'react';
import type { HomeProject } from '../model/contracts';
import { kindLabels, projectDate, projectSearch } from '../model/home';
import { HomeIcon } from './HomeIcon';
import { RecentProjectPreview } from './RecentProjectPreview';

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
  const { locale, t } = useI18n();
  const [query, setQuery] = useState('');
  const visible = projects.filter((project) => projectSearch(project, query));
  return (
    <section className="home-recents" aria-labelledby="home-recents-title">
      <div className="home-section-heading">
        <div>
          <h2 id="home-recents-title">{t('Vos projets récents', 'Your recent projects')}</h2>
          <p>
            {t(
              'Retrouvez votre contexte, vos décisions et vos versions.',
              'Return to your context, decisions, and versions.',
            )}
          </p>
        </div>
        <button
          type="button"
          className="home-refresh"
          disabled={loading || busy}
          onClick={onRefresh}
        >
          {loading ? t('Actualisation…', 'Refreshing…') : t('Actualiser', 'Refresh')}
        </button>
      </div>
      {projects.length ? (
        <label className="home-search">
          <span className="home-sr">{t('Rechercher un projet', 'Search projects')}</span>
          <input
            ref={searchRef}
            type="search"
            name="project-search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('Rechercher un projet…', 'Search projects…')}
          />
        </label>
      ) : null}
      {error ? (
        <p role="alert" className="home-error">
          {error}{' '}
          {projects.length
            ? t(
                'Vos projets déjà chargés restent visibles. ',
                'Your loaded projects remain visible. ',
              )
            : ''}{' '}
          {t('Actualisez pour réessayer.', 'Refresh to try again.')}{' '}
        </p>
      ) : null}
      {loading && !projects.length ? (
        <p className="home-empty" role="status">
          {' '}
          {t('Lecture de vos projets…', 'Loading your projects…')}{' '}
        </p>
      ) : null}
      {!loading && !error && !projects.length ? (
        <div className="home-empty">
          <HomeIcon kind="folder" />
          <h3>{t('Votre prochain projet commence ici', 'Your next project starts here')}</h3>
          <p>
            {' '}
            {t(
              'Créez un projet ou importez vos sources. Ils apparaîtront ici pour les retrouver facilement.',
              'Create a project or import your sources. They will appear here for easy access.',
            )}{' '}
          </p>
        </div>
      ) : null}
      {projects.length && !visible.length ? (
        <p className="home-empty" role="status">
          {' '}
          {t(
            'Aucun projet ne correspond à cette recherche.',
            'No projects match this search.',
          )}{' '}
        </p>
      ) : null}
      <ul className="home-project-list">
        {visible.map((project) => (
          <li key={project.id} className="home-project-card">
            <RecentProjectPreview project={project} />
            <button
              type="button"
              className="home-project"
              disabled={busy}
              onClick={() => onOpen(project)}
              aria-label={t('Ouvrir {name}', 'Open {name}', { name: project.name })}
            >
              <span className="home-project-copy">
                <strong>{project.name}</strong>
                <span className="home-project-path" title={project.workspace}>
                  {project.workspace}
                </span>
              </span>
              <span className="home-project-arrow" aria-hidden="true">
                ↗
              </span>
              <span className="home-project-meta">
                <span>{kindLabels(locale)[project.kind]}</span>
                <time dateTime={project.lastOpenedAt || project.createdAt}>
                  {projectDate(project, locale)}
                </time>
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
        {' '}
        {t('Ouvrir un autre dossier Studio', 'Open another Studio folder')}{' '}
        <span aria-hidden="true">↗</span>
      </button>
    </section>
  );
}
