import { useI18n } from '../../../i18n';
import { connectorText } from '../../connectors/model/i18n';
import { useState } from 'react';
import { McpCredentialForm } from './McpCredentialForm';
import { CustomConnection } from './CustomConnection';
import { ConnectionRow } from './McpConnectionCard';
import { ConnectorIcon } from '../../connectors';
import type { McpConnectionsController } from '../hooks/useMcpConnections';

export function McpConnectionsPanel({
  controller,
  selectedIds,
  onToggle,
  onConfigureGuide,
  disabled = false,
}: {
  controller: McpConnectionsController;
  selectedIds: string[];
  onToggle(id: string): void;
  onConfigureGuide?(optionId: string): void;
  disabled?: boolean;
}) {
  const { locale } = useI18n();
  const [search, setSearch] = useState('');
  const [githubForm, setGithubForm] = useState(false);
  const matching = controller.connections.filter((connection) =>
    `${connection.name} ${connection.url}`
      .toLocaleLowerCase(locale)
      .includes(search.trim().toLocaleLowerCase(locale)),
  );
  return (
    <section
      className="mcp-connections-panel"
      aria-label={connectorText('Serveurs MCP de l’espace', locale)}
    >
      <div className="mcp-panel-heading">
        <div>
          <h3>{connectorText('Serveurs MCP de l’espace', locale)}</h3>
          <p>
            {connectorText(
              'Connectez vos sources et outils une fois, puis choisissez ceux à utiliser dans chaque projet.',
              locale,
            )}
          </p>
        </div>
        <button
          type="button"
          disabled={controller.loading || Boolean(controller.active)}
          onClick={controller.refresh}
        >
          {connectorText('Actualiser les connexions', locale)}
        </button>
      </div>
      {controller.loading ? (
        <p role="status" className="mcp-note">
          {connectorText('Lecture des connexions…', locale)}
        </p>
      ) : null}
      {controller.error ? (
        <p role="alert" className="mcp-connection-error">
          {connectorText(controller.error, locale)}
        </p>
      ) : null}
      {controller.active ? (
        <p role="status" className="mcp-active-status">
          {controller.active.authorizing
            ? connectorText(
                'Autorisez l’accès dans la fenêtre ouverte. Cet écran se mettra à jour après confirmation.',
                locale,
              )
            : connectorText('Vérification de la connexion et découverte des outils…', locale)}
        </p>
      ) : null}
      {!controller.supported ? (
        <p className="mcp-note">
          {connectorText(
            'Ouvrez ce projet depuis l’accueil Studio pour accéder aux connexions de l’espace.',
            locale,
          )}
        </p>
      ) : null}
      <div className="mcp-connected-heading">
        <h4>
          {connectorText('Connexions de l’espace', locale)}
          <span>{controller.connections.length.toLocaleString(locale)}</span>
        </h4>
        {controller.connections.length > 3 ? (
          <label>
            <span className="mcp-sr">{connectorText('Rechercher un serveur MCP', locale)}</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={connectorText('Rechercher une connexion…', locale)}
            />
          </label>
        ) : null}
      </div>
      <ul className="mcp-connection-list">
        {matching.map((connection) => (
          <ConnectionRow
            key={connection.id}
            connection={connection}
            controller={controller}
            selected={selectedIds.includes(connection.id)}
            disabled={disabled}
            onToggle={() => onToggle(connection.id)}
          />
        ))}
      </ul>
      {!controller.loading && !matching.length ? (
        <p className="mcp-note">
          {controller.connections.length
            ? connectorText('Aucune connexion ne correspond à cette recherche.', locale)
            : connectorText('Aucun serveur MCP connecté pour le moment.', locale)}
        </p>
      ) : null}
      <h4>{connectorText('Ajouter un serveur', locale)}</h4>
      <div className="mcp-preset-grid">
        {controller.presets.map((preset) => (
          <button
            type="button"
            key={preset.id}
            disabled={disabled || !controller.supported || Boolean(controller.active)}
            onClick={() =>
              onConfigureGuide && ['notion', 'linear', 'github'].includes(preset.id)
                ? onConfigureGuide(preset.id === 'github' ? 'github-mcp' : preset.id)
                : preset.id === 'github'
                  ? setGithubForm(true)
                  : void controller.connect({ provider: preset.id })
            }
          >
            <ConnectorIcon optionId={preset.id} size={28} />
            <span>
              {preset.name}
              <small>
                {onConfigureGuide && ['notion', 'linear', 'github'].includes(preset.id)
                  ? connectorText('Choisir l’usage et connecter', locale)
                  : preset.id === 'github'
                    ? connectorText('Connecter avec un jeton ciblé', locale)
                    : connectorText('Connecter avec OAuth', locale)}
              </small>
            </span>
          </button>
        ))}
      </div>
      {githubForm ? (
        <McpCredentialForm
          input={{ provider: 'github', auth: 'bearer' }}
          controller={controller}
          disabled={disabled}
        />
      ) : null}
      <CustomConnection controller={controller} disabled={disabled || !controller.supported} />
      <p className="mcp-note">
        {connectorText(
          'Les permissions contrôlent les appels du pont MCP DevMethod. Elles ne contrôlent pas les outils utilisés directement par l’agent hôte. Ces connexions servent au contexte et aux outils de l’agent, pas aux API intégrées dans votre application.',
          locale,
        )}
      </p>
    </section>
  );
}
