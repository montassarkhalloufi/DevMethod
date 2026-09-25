import { useState } from 'react';
import { McpPermissions } from './McpPermissions';
import { McpUsage } from './McpUsage';
import { McpCredentialForm } from './McpCredentialForm';
import { CustomConnection } from './CustomConnection';
import { ConnectorIcon } from '../../connectors';
import type { McpConnectionsController } from '../hooks/useMcpConnections';
import { mcpDisplayName, mcpStatusLabels, reconnectMcpInput } from '../model/mcp';
import type { McpConnection } from '../model/mcp';
const serviceDescriptions: Record<string, string> = {
  github: 'Consultez le code, les issues et les pull requests avec l’assistant.',
  notion: 'Retrouvez le contexte et préparez la documentation de vos projets.',
  linear: 'Suivez les issues et préparez les mises à jour de votre équipe.',
};
const serviceDocumentation: Record<string, string> = {
  github: 'https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md',
  notion: 'https://developers.notion.com/guides/mcp/build-mcp-client',
  linear: 'https://linear.app/docs/mcp',
};
export function ConnectionRow({
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
  const [credentialForm, setCredentialForm] = useState(false);
  const [detail, setDetail] = useState(false);
  const available = connection.status === 'connected';
  return (
    <li className="mcp-connection-row">
      <div className="mcp-connection-heading">
        <ConnectorIcon
          optionId={connection.provider === 'custom' ? 'application-mcp' : connection.provider}
          size={32}
        />
        <div>
          <strong>{mcpDisplayName(connection)}</strong>
          <span className={`mcp-status mcp-status-${connection.status}`}>
            {mcpStatusLabels[connection.status]}
            {available
              ? ` · ${connection.tools.length} outil${connection.tools.length > 1 ? 's' : ''}`
              : ''}
          </span>
        </div>
      </div>
      <p className="mcp-note">
        {serviceDescriptions[connection.provider] ||
          'Ajoutez les outils de ce service au contexte de l’assistant.'}
      </p>
      {selected ? <p className="mcp-status mcp-status-connected">Utilisé dans ce projet</p> : null}
      {connection.error ? <p className="mcp-connection-error">{connection.error.message}</p> : null}
      <button type="button" aria-expanded={detail} onClick={() => setDetail(!detail)}>
        {detail ? 'Fermer la fiche' : 'Compte et permissions'}
      </button>
      {detail ? <ConnectionDetails connection={connection} selected={selected} /> : null}
      <ConnectionControls
        connection={connection}
        controller={controller}
        selected={selected}
        disabled={disabled}
        onToggle={onToggle}
        onCredentials={() => setCredentialForm(true)}
      />
      {credentialForm ? (
        connection.provider === 'github' ? (
          <McpCredentialForm
            input={reconnectMcpInput(connection)}
            controller={controller}
            disabled={disabled}
          />
        ) : (
          <CustomConnection
            controller={controller}
            disabled={disabled}
            connection={connection}
            onDismiss={() => setCredentialForm(false)}
          />
        )
      ) : null}
    </li>
  );
}

function ConnectionDetails({
  connection,
  selected,
}: {
  connection: McpConnection;
  selected: boolean;
}) {
  const available = connection.status === 'connected';
  return (
    <div className="mcp-connection-detail">
      <h4>Connexion partagée</h4>
      <p>{connection.name}</p>
      <p className="mcp-note">
        L’identité du compte n’est pas fournie par ce serveur. Les droits du compte sont ceux
        accordés chez le fournisseur.
      </p>
      <details>
        <summary>Configuration avancée</summary>
        <p className="mcp-server-url">{connection.url}</p>
        <p>
          Authentification :{' '}
          {connection.auth === 'bearer'
            ? 'Jeton personnel'
            : connection.auth === 'oauth'
              ? 'OAuth'
              : 'Sans authentification'}
        </p>
      </details>
      {serviceDocumentation[connection.provider] ? (
        <a
          href={serviceDocumentation[connection.provider]}
          target="_blank"
          rel="noopener noreferrer"
        >
          Documentation du service ↗
        </a>
      ) : null}
      <McpUsage key={connection.id + ':' + selected} connectionId={connection.id} />
      {available ? (
        <McpPermissions
          key={connection.id + ':' + connection.version}
          connectionId={connection.id}
        />
      ) : (
        <p className="mcp-note">
          Reconnectez ce service pour vérifier ses outils et régler leurs permissions.
        </p>
      )}
    </div>
  );
}

function ConnectionControls({
  connection,
  controller,
  selected,
  disabled,
  onToggle,
  onCredentials,
}: {
  connection: McpConnection;
  controller: McpConnectionsController;
  selected: boolean;
  disabled: boolean;
  onToggle(): void;
  onCredentials(): void;
}) {
  const available = connection.status === 'connected';
  const active = controller.active;
  return (
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
                ? onCredentials()
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
  );
}
