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
  const [search, setSearch] = useState('');
  const [githubForm, setGithubForm] = useState(false);
  const matching = controller.connections.filter((connection) =>
    `${connection.name} ${connection.url}`
      .toLocaleLowerCase('fr')
      .includes(search.trim().toLocaleLowerCase('fr')),
  );
  return (
    <section className="mcp-connections-panel" aria-label="Serveurs MCP de l’espace">
      <div className="mcp-panel-heading">
        <div>
          <h3>Serveurs MCP de l’espace</h3>
          <p>
            Connectez vos sources et outils une fois, puis choisissez ceux à utiliser dans chaque
            projet.
          </p>
        </div>
        <button
          type="button"
          disabled={controller.loading || Boolean(controller.active)}
          onClick={controller.refresh}
        >
          Actualiser les connexions
        </button>
      </div>
      {controller.loading ? (
        <p role="status" className="mcp-note">
          Lecture des connexions…
        </p>
      ) : null}
      {controller.error ? (
        <p role="alert" className="mcp-connection-error">
          {controller.error}
        </p>
      ) : null}
      {controller.active ? (
        <p role="status" className="mcp-active-status">
          {controller.active.authorizing
            ? 'Autorisez l’accès dans la fenêtre ouverte. Cet écran se mettra à jour après confirmation.'
            : 'Vérification de la connexion et découverte des outils…'}
        </p>
      ) : null}
      {!controller.supported ? (
        <p className="mcp-note">
          Ouvrez ce projet depuis l’accueil Studio pour accéder aux connexions de l’espace.
        </p>
      ) : null}
      <div className="mcp-connected-heading">
        <h4>
          Connexions de l’espace <span>{controller.connections.length}</span>
        </h4>
        {controller.connections.length > 3 ? (
          <label>
            <span className="mcp-sr">Rechercher un serveur MCP</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une connexion…"
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
            ? 'Aucune connexion ne correspond à cette recherche.'
            : 'Aucun serveur MCP connecté pour le moment.'}
        </p>
      ) : null}
      <h4>Ajouter un serveur</h4>
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
                  ? 'Choisir l’usage et connecter'
                  : preset.id === 'github'
                    ? 'Connecter avec un jeton ciblé'
                    : 'Connecter avec OAuth'}
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
        Les permissions contrôlent les appels du pont MCP DevMethod. Elles ne contrôlent pas les
        outils utilisés directement par l’agent hôte. Ces connexions servent au contexte et aux
        outils de l’agent, pas aux API intégrées dans votre application.
      </p>
    </section>
  );
}
