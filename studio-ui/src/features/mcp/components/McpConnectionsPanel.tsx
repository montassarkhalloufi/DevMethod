import { useRef, useState } from 'react';
import { ConnectorIcon } from '../../connectors';
import type { McpConnectionsController } from '../hooks/useMcpConnections';
import { mcpConnectionInput, mcpStatusLabels, reconnectMcpInput } from '../model/mcp';
import type { McpAuth, McpConnection } from '../model/mcp';

function ConnectionRow({
  connection,
  controller,
  selected,
  disabled,
  onToggle,
}: {
  connection: McpConnection;
  controller: McpConnectionsController;
  selected: boolean;
  disabled: boolean;
  onToggle(): void;
}) {
  const active = controller.active;
  const [credentialForm, setCredentialForm] = useState(false);
  const available = connection.status === 'connected';
  return (
    <li className="mcp-connection-row">
      <div className="mcp-connection-heading">
        <ConnectorIcon
          optionId={connection.provider === 'custom' ? 'application-mcp' : connection.provider}
          size={32}
        />
        <div>
          <strong>{connection.name}</strong>
          <span className={`mcp-status mcp-status-${connection.status}`}>
            {mcpStatusLabels[connection.status]}
            {available
              ? ` · ${connection.tools.length} outil${connection.tools.length > 1 ? 's' : ''}`
              : ''}
          </span>
        </div>
      </div>
      <p className="mcp-server-url" title={connection.url}>
        {connection.url}
      </p>
      {connection.error ? <p className="mcp-connection-error">{connection.error.message}</p> : null}
      {available && connection.tools.length ? (
        <details className="mcp-discovered-tools">
          <summary>Voir les outils disponibles</summary>
          <ul>
            {connection.tools.map((tool) => (
              <li key={tool.name}>
                <strong>{tool.title || tool.name}</strong>
                {tool.description ? <span>{tool.description}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <div className="mcp-connection-actions">
        <label className="mcp-use-connection">
          <input
            type="checkbox"
            name="mcp-connection"
            value={connection.id}
            checked={selected}
            disabled={disabled || (!available && !selected)}
            onChange={onToggle}
          />
          Utiliser pour ce projet
        </label>
        <div>
          {available ? (
            <button
              type="button"
              disabled={disabled || Boolean(active)}
              onClick={() => void controller.change(connection.id, 'refresh')}
            >
              Actualiser les outils
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled || Boolean(active)}
              onClick={() =>
                connection.auth === 'bearer'
                  ? setCredentialForm(true)
                  : void controller.connect(reconnectMcpInput(connection))
              }
            >
              Reconnecter
            </button>
          )}
          {connection.status !== 'disconnected' ? (
            <button
              type="button"
              disabled={disabled || Boolean(active && active.id !== connection.id)}
              onClick={() => void controller.change(connection.id, 'disconnect')}
            >
              {active?.id === connection.id ? 'Annuler la connexion' : 'Déconnecter'}
            </button>
          ) : null}
        </div>
      </div>
      {credentialForm ? (
        <CustomConnection
          controller={controller}
          disabled={disabled}
          connection={connection}
          onDismiss={() => setCredentialForm(false)}
        />
      ) : null}
    </li>
  );
}

function CustomConnection({
  controller,
  disabled,
  connection,
  onDismiss,
}: {
  controller: McpConnectionsController;
  disabled: boolean;
  connection?: McpConnection;
  onDismiss?(): void;
}) {
  const [open, setOpen] = useState(Boolean(connection));
  const [auth, setAuth] = useState<McpAuth>(connection?.auth || 'oauth');
  const [error, setError] = useState('');
  const form = useRef<HTMLFormElement>(null);
  return (
    <div className="mcp-custom-connection">
      {!connection ? (
        <button
          type="button"
          className="mcp-add-custom"
          disabled={disabled}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          + Ajouter un serveur personnalisé
        </button>
      ) : null}
      {open ? (
        <form
          ref={form}
          onSubmit={(event) => {
            event.preventDefault();
            if (disabled || controller.active) return;
            try {
              const input = mcpConnectionInput(event.currentTarget);
              setError('');
              void controller.connect({ ...input, ...(connection ? { id: connection.id } : {}) });
              const token = event.currentTarget.elements.namedItem('mcp-token');
              if (token instanceof HTMLInputElement) token.value = '';
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : 'Vérifiez les informations du serveur.',
              );
            }
          }}
        >
          <input type="hidden" name="mcp-provider" value="custom" />
          <div className="mcp-custom-fields">
            <label>
              Nom du serveur
              <input
                name="mcp-name"
                defaultValue={connection?.name}
                maxLength={100}
                autoComplete="off"
                required
                disabled={disabled || Boolean(controller.active)}
                placeholder="Mon espace documentaire"
              />
            </label>
            <label>
              Adresse MCP
              <input
                name="mcp-url"
                defaultValue={connection?.url}
                type="url"
                maxLength={2048}
                autoComplete="off"
                required
                disabled={disabled || Boolean(controller.active)}
                placeholder="https://serveur.exemple/mcp"
              />
            </label>
          </div>
          <label>
            Authentification
            <select
              name="mcp-auth"
              value={auth}
              disabled={disabled || Boolean(controller.active)}
              onChange={(event) => setAuth(event.target.value as McpAuth)}
            >
              <option value="oauth">OAuth · autoriser dans le navigateur</option>
              <option value="bearer">Jeton Bearer</option>
              <option value="none">Sans authentification</option>
            </select>
          </label>
          {auth === 'bearer' ? (
            <label>
              Jeton de connexion
              <input
                name="mcp-token"
                type="password"
                maxLength={8192}
                autoComplete="off"
                spellCheck={false}
                required
                disabled={disabled || Boolean(controller.active)}
              />
              <small>Transmis au gestionnaire local. Il n’est jamais ajouté à votre demande.</small>
            </label>
          ) : null}
          {error ? (
            <p role="alert" className="mcp-connection-error">
              {error}
            </p>
          ) : null}
          <div className="mcp-form-actions">
            <button
              type="button"
              disabled={Boolean(controller.active)}
              onClick={() => {
                setOpen(false);
                onDismiss?.();
              }}
            >
              Fermer les réglages
            </button>
            <button
              type="submit"
              className="primary"
              disabled={disabled || Boolean(controller.active)}
            >
              Connecter le serveur
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export function McpConnectionsPanel({
  controller,
  selectedIds,
  onToggle,
  disabled = false,
}: {
  controller: McpConnectionsController;
  selectedIds: string[];
  onToggle(id: string): void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState('');
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
            onClick={() => void controller.connect({ provider: preset.id })}
          >
            <ConnectorIcon optionId={preset.id} size={28} />
            <span>
              {preset.name}
              <small>Connecter avec OAuth</small>
            </span>
          </button>
        ))}
      </div>
      <CustomConnection controller={controller} disabled={disabled || !controller.supported} />
      <p className="mcp-note">
        Les outils sont disponibles via la connexion ; leur exécution dépend de l’agent. Ces
        connexions servent au contexte et aux outils de l’agent, pas aux API intégrées dans votre
        application.
      </p>
    </section>
  );
}
