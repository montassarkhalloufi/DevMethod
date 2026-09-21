import { useI18n } from '../../../i18n';
import { useEffect, useRef, useState } from 'react';
import { ConnectorIcon } from '../../connectors';
import type { IdeaComposerController } from '../hooks/useIdeaComposer';
import { matchesTool } from '../model/composer';
import { McpConnectionsPanel } from '../../mcp';
import { ComposerGuide } from './ComposerGuide';

export function ComposerTools({ composer }: { composer: IdeaComposerController }) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const catalogHeading = useRef<HTMLHeadingElement>(null);
  const previousGuide = useRef<string | null>(null);
  const activeGuide = composer.guides.activeId;
  useEffect(() => {
    if (!activeGuide && previousGuide.current)
      (returnFocus.current ?? catalogHeading.current)?.focus();
    previousGuide.current = activeGuide;
  }, [activeGuide]);
  function configure(optionId: string) {
    if (document.activeElement instanceof HTMLButtonElement)
      returnFocus.current = document.activeElement;
    composer.guides.open(optionId);
  }
  const catalog = composer.catalog;
  const matching = (catalog?.options || []).filter((option) => matchesTool(option, search));
  const visible = matching.filter(
    (option) => category === 'all' || option.capabilities.includes(category),
  );
  return (
    <>
      {activeGuide ? <ComposerGuide key={activeGuide} composer={composer} /> : null}
      <div hidden={Boolean(activeGuide)}>
        <McpConnectionsPanel
          controller={composer.mcp}
          selectedIds={composer.draft.mcpConnectionIds}
          onToggle={composer.toggleMcp}
          disabled={composer.busy}
          onConfigureGuide={configure}
        />
        <section
          className="composer-application-services"
          aria-label={t('API et services du projet', 'Project APIs and services')}
        >
          <h3 ref={catalogHeading} tabIndex={-1}>
            {' '}
            {t('API et services du projet', 'Project APIs and services')}{' '}
          </h3>
          <p className="composer-option-intro">
            {' '}
            {t(
              'Proposez les services que vous souhaitez utiliser. L’agent vérifiera leur intérêt et leur accès avec vous.',
              'Suggest the services you want to use. The agent will review their relevance and access with you.',
            )}{' '}
          </p>
          {composer.guides.error ? (
            <div className="composer-catalog-error">
              <p role="alert">{composer.guides.error}</p>
              <button
                type="button"
                disabled={composer.busy || composer.guides.loading}
                onClick={composer.guides.refresh}
              >
                {' '}
                {t('Réessayer les guides', 'Retry guides')}{' '}
              </button>
            </div>
          ) : null}
          <div className="composer-tool-filters">
            <label>
              <span className="home-sr">
                {t('Rechercher un outil ou un service', 'Search for a tool or service')}
              </span>
              <input
                type="search"
                name="composer-tool-search"
                autoComplete="off"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t(
                  'Rechercher un outil ou un service…',
                  'Search for a tool or service…',
                )}
                disabled={composer.busy}
              />
            </label>
            <label>
              <span className="home-sr">{t('Catégorie des outils', 'Tool category')}</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                disabled={composer.busy}
                aria-label={t('Catégorie des outils', 'Tool category')}
              >
                <option value="all">
                  {t('Toutes les catégories (', 'All categories (')}
                  {matching.length})
                </option>
                {(catalog?.capabilities || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} (
                    {matching.filter((option) => option.capabilities.includes(item.id)).length})
                  </option>
                ))}
              </select>
            </label>
          </div>
          {composer.catalogLoading ? (
            <p className="composer-option-note" role="status">
              {' '}
              {t('Chargement du catalogue…', 'Loading catalog…')}{' '}
            </p>
          ) : null}
          {composer.catalogError ? (
            <div className="composer-catalog-error">
              <p role="alert">{composer.catalogError}</p>
              <button
                type="button"
                onClick={() => void composer.loadCatalog()}
                disabled={composer.catalogLoading || composer.busy}
              >
                {' '}
                {t('Réessayer le catalogue', 'Retry catalog')}{' '}
              </button>
            </div>
          ) : null}
          <div className="composer-tool-count" role="status">
            {t(
              composer.draft.connectors.length === 1
                ? '{count} sélectionné'
                : '{count} sélectionnés',
              '{count} selected',
              { count: composer.draft.connectors.length },
            )}{' '}
            {t('· 12 maximum', '· up to 12')}{' '}
          </div>
          <div className="composer-tool-grid">
            {visible.map((tool) => (
              <div className="composer-tool-card" key={tool.id}>
                <label className="composer-tool-option">
                  <input
                    type="checkbox"
                    name="preferred-connector"
                    value={tool.id}
                    checked={composer.draft.connectors.includes(tool.id)}
                    disabled={composer.busy}
                    onChange={() => composer.toggleConnector(tool.id)}
                  />
                  <ConnectorIcon optionId={tool.id} size={28} />
                  <span>
                    <strong>{tool.title}</strong>
                    <small>{tool.description}</small>
                  </span>
                </label>
                {composer.guides.guides.some((guide) => guide.optionId === tool.id) ? (
                  <button
                    type="button"
                    className="composer-tool-configure"
                    disabled={composer.busy}
                    onClick={() => configure(tool.id)}
                  >
                    {' '}
                    {t('Configurer', 'Configure')} {tool.title}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {catalog && !visible.length ? (
            <p className="composer-option-note">
              {t('Aucun outil ne correspond à ce filtre.', 'No tools match this filter.')}
            </p>
          ) : null}
          <p className="composer-option-note">
            {' '}
            {t(
              'Une préférence ne configure aucune connexion et n’accorde aucun accès à vos comptes.',
              'A preference does not configure a connection or grant access to your accounts.',
            )}{' '}
          </p>
        </section>
      </div>
    </>
  );
}
