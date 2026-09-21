import { useI18n } from '../../../i18n';
import { connectorText, connectorMessage } from '../model/i18n';
import { useState } from 'react';
import type { ConnectorReport } from '../model/contracts';
import { compactConnectionLabel, searchable } from '../model/catalog';
import { ConnectorIcon } from './ConnectorIcon';

export function ConnectorCatalog({
  report,
  contextual,
  selectedId,
  onOpen,
}: {
  report: ConnectorReport | null;
  contextual: boolean;
  selectedId: string | null;
  onOpen(id: string, trigger: HTMLButtonElement): void;
}) {
  const { locale } = useI18n();
  const [purpose, setPurpose] = useState<'diagnostics' | 'application'>(
    contextual ? 'diagnostics' : 'application',
  );
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [configuredOnly, setConfiguredOnly] = useState(false);
  if (!report) return null;
  const connections = new Map(report.connections.map((entry) => [entry.optionId, entry]));
  const capabilities = report.catalog.capabilities.filter((item) => item.purpose === purpose);
  const search = searchable(query.trim(), locale);
  const matching = report.catalog.options.filter(
    (item) =>
      item.purpose === purpose &&
      searchable(
        `${item.title} ${item.description} ${item.capabilities.join(' ')}`,
        locale,
      ).includes(search),
  );
  const configuredCount = matching.filter((item) => connections.has(item.id)).length;
  const filtered = matching.filter((item) => !configuredOnly || connections.has(item.id));
  const categories = [
    { id: 'all', title: connectorText('Toutes les catégories', locale), count: filtered.length },
    ...capabilities.map((item) => ({
      id: item.id,
      title: item.title,
      count: filtered.filter((option) => option.capabilities.includes(item.id)).length,
    })),
  ];
  const choices = filtered.filter(
    (item) => category === 'all' || item.capabilities.includes(category),
  );
  return (
    <div className="connector-catalog">
      <div className="connector-browse-toolbar">
        <nav
          className="connector-purpose"
          aria-label={connectorText('Usage des connecteurs', locale)}
        >
          {(['application', 'diagnostics'] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={purpose === value}
              onClick={() => {
                setPurpose(value);
                setCategory('all');
              }}
            >
              {value === 'application'
                ? connectorText('Services de l’application', locale)
                : connectorText('Diagnostic et vérifications', locale)}
            </button>
          ))}
        </nav>
        <label className="connector-search">
          <span className="connector-sr">
            {connectorText('Rechercher un outil ou un service', locale)}
          </span>
          <input
            type="search"
            name="connector-search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={connectorText('Rechercher un outil ou un service…', locale)}
          />
        </label>
      </div>
      <div className="connector-catalog-layout">
        <nav
          className="connector-categories"
          aria-label={connectorText('Catégories des connecteurs', locale)}
        >
          <span className="connector-section-label">{connectorText('Catégories', locale)}</span>
          {categories.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              <span>{item.title}</span>
              <span className="connector-count">{item.count.toLocaleString(locale)}</span>
            </button>
          ))}
        </nav>
        <div className="connector-catalog-main">
          <label className="connector-mobile-category">
            {connectorText('Catégorie', locale)}
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.count.toLocaleString(locale)})
                </option>
              ))}
            </select>
          </label>
          <div className="connector-results-toolbar">
            <nav
              className="connector-filter-tabs"
              aria-label={connectorText('État de configuration', locale)}
            >
              <button
                type="button"
                aria-pressed={!configuredOnly}
                onClick={() => setConfiguredOnly(false)}
              >
                {connectorText('Tous', locale)}
                <span>{matching.length.toLocaleString(locale)}</span>
              </button>
              <button
                type="button"
                aria-pressed={configuredOnly}
                onClick={() => setConfiguredOnly(true)}
              >
                {connectorText('Configurés', locale)}
                <span>{configuredCount.toLocaleString(locale)}</span>
              </button>
            </nav>
            <span className="connector-result-count" role="status">
              {connectorMessage(
                choices.length === 1 ? '{count} solution' : '{count} solutions',
                choices.length === 1 ? '{count} option' : '{count} options',
                locale,
                {
                  count: choices.length.toLocaleString(locale),
                },
              )}
            </span>
          </div>
          <div
            className="connector-card-grid"
            aria-label={connectorText('Solutions proposées', locale)}
          >
            {choices.map((item) => {
              const connection = connections.get(item.id);
              return (
                <button
                  className="connector-card"
                  type="button"
                  key={item.id}
                  aria-label={connectorMessage('Voir {name}', 'View {name}', locale, {
                    name: item.title,
                  })}
                  aria-current={selectedId === item.id ? 'true' : undefined}
                  onClick={(event) => onOpen(item.id, event.currentTarget)}
                >
                  <span className="connector-card-heading">
                    <ConnectorIcon optionId={item.id} />
                    <span className="connector-card-title">{item.title}</span>
                    <span className="connector-card-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </span>
                  <span className="connector-card-description">{item.description}</span>
                  <span className="connector-card-footer">
                    <span className={`connector-state state-${connection?.status || 'proposed'}`}>
                      {connectorText(compactConnectionLabel(connection), locale)}
                    </span>
                    <span className="connector-transport">
                      {item.transport === 'local'
                        ? connectorText('Local', locale)
                        : item.transport.toUpperCase()}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {!choices.length ? (
            <div className="connector-empty">
              <strong>{connectorText('Aucune solution dans ce filtre', locale)}</strong>
              <p>
                {configuredOnly
                  ? connectorText(
                      'Aucun connecteur configuré ne correspond. Consultez Tous pour parcourir les options.',
                      locale,
                    )
                  : connectorText('Essayez une autre recherche ou une autre catégorie.', locale)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
