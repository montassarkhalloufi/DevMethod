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
  const [purpose, setPurpose] = useState<'diagnostics' | 'application'>(
    contextual ? 'diagnostics' : 'application',
  );
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [configuredOnly, setConfiguredOnly] = useState(false);
  if (!report) return null;
  const connections = new Map(report.connections.map((entry) => [entry.optionId, entry]));
  const capabilities = report.catalog.capabilities.filter((item) => item.purpose === purpose);
  const search = searchable(query.trim());
  const matching = report.catalog.options.filter(
    (item) =>
      item.purpose === purpose &&
      searchable(`${item.title} ${item.description} ${item.capabilities.join(' ')}`).includes(
        search,
      ),
  );
  const configuredCount = matching.filter((item) => connections.has(item.id)).length;
  const filtered = matching.filter((item) => !configuredOnly || connections.has(item.id));
  const categories = [
    { id: 'all', title: 'Toutes les catégories', count: filtered.length },
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
        <nav className="connector-purpose" aria-label="Usage des connecteurs">
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
                ? 'Services de l’application'
                : 'Diagnostic et vérifications'}
            </button>
          ))}
        </nav>
        <label className="connector-search">
          <span className="connector-sr">Rechercher un outil ou un service</span>
          <input
            type="search"
            name="connector-search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un outil ou un service…"
          />
        </label>
      </div>
      <div className="connector-catalog-layout">
        <nav className="connector-categories" aria-label="Catégories des connecteurs">
          <span className="connector-section-label">Catégories</span>
          {categories.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              <span>{item.title}</span>
              <span className="connector-count">{item.count}</span>
            </button>
          ))}
        </nav>
        <div className="connector-catalog-main">
          <label className="connector-mobile-category">
            Catégorie
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.count})
                </option>
              ))}
            </select>
          </label>
          <div className="connector-results-toolbar">
            <nav className="connector-filter-tabs" aria-label="État de configuration">
              <button
                type="button"
                aria-pressed={!configuredOnly}
                onClick={() => setConfiguredOnly(false)}
              >
                Tous <span>{matching.length}</span>
              </button>
              <button
                type="button"
                aria-pressed={configuredOnly}
                onClick={() => setConfiguredOnly(true)}
              >
                Configurés <span>{configuredCount}</span>
              </button>
            </nav>
            <span className="connector-result-count" role="status">
              {choices.length} solution{choices.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="connector-card-grid" aria-label="Solutions proposées">
            {choices.map((item) => {
              const connection = connections.get(item.id);
              return (
                <button
                  className="connector-card"
                  type="button"
                  key={item.id}
                  aria-label={`Voir ${item.title}`}
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
                      {compactConnectionLabel(connection)}
                    </span>
                    <span className="connector-transport">
                      {item.transport === 'local' ? 'Local' : item.transport.toUpperCase()}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {!choices.length ? (
            <div className="connector-empty">
              <strong>Aucune solution dans ce filtre</strong>
              <p>
                {configuredOnly
                  ? 'Aucun connecteur configuré ne correspond. Consultez Tous pour parcourir les options.'
                  : 'Essayez une autre recherche ou une autre catégorie.'}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
