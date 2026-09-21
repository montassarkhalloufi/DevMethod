import { useI18n } from '../../../i18n';
import { connectorText, connectorMessage } from '../../connectors/model/i18n';
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
  const { locale } = useI18n();
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
          <strong>{mcpDisplayName(connection, locale)}</strong>
          <span className={`mcp-status mcp-status-${connection.status}`}>
            {connectorText(mcpStatusLabels[connection.status], locale)}
            {available
              ? connectorMessage(' · {count} outil(s)', ' · {count} tool(s)', locale, {
                  count: connection.tools.length.toLocaleString(locale),
                })
              : ''}
          </span>
        </div>
      </div>
      <p className="mcp-note">
        {connectorText(
          serviceDescriptions[connection.provider] ||
            'Ajoutez les outils de ce service au contexte de l’assistant.',
          locale,
        )}
      </p>
      {selected ? (
        <p className="mcp-status mcp-status-connected">
          {connectorText('Utilisé dans ce projet', locale)}
        </p>
      ) : null}
      {connection.error ? (
        <p className="mcp-connection-error">{connectorText(connection.error.message, locale)}</p>
      ) : null}
      <button type="button" aria-expanded={detail} onClick={() => setDetail(!detail)}>
        {detail
          ? connectorText('Fermer la fiche', locale)
          : connectorText('Compte et permissions', locale)}
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
  const { locale } = useI18n();
  const available = connection.status === 'connected';
  return (
    <div className="mcp-connection-detail">
      <h4>{connectorText('Connexion partagée', locale)}</h4>
      <p>{connection.name}</p>
      <p className="mcp-note">
        {connectorText(
          'L’identité du compte n’est pas fournie par ce serveur. Les droits du compte sont ceux accordés chez le fournisseur.',
          locale,
        )}
      </p>
      <details>
        <summary>{connectorText('Configuration avancée', locale)}</summary>
        <p className="mcp-server-url">{connection.url}</p>
        <p>
          {connectorText('Authentification :', locale)}{' '}
          {connection.auth === 'bearer'
            ? connectorText('Jeton personnel', locale)
            : connection.auth === 'oauth'
              ? 'OAuth'
              : connectorText('Sans authentification', locale)}
        </p>
      </details>
      {serviceDocumentation[connection.provider] ? (
        <a
          href={serviceDocumentation[connection.provider]}
          target="_blank"
          rel="noopener noreferrer"
        >
          {connectorText('Documentation du service ↗', locale)}
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
          {connectorText(
            'Reconnectez ce service pour vérifier ses outils et régler leurs permissions.',
            locale,
          )}
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
  const { locale } = useI18n();
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
        {connectorText('Utiliser pour ce projet', locale)}
      </label>
      <div>
        {available ? (
          <button
            type="button"
            disabled={disabled || Boolean(active)}
            onClick={() => void controller.change(connection.id, 'refresh')}
          >
            {connectorText('Actualiser les outils', locale)}
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
            {connectorText('Reconnecter', locale)}
          </button>
        )}
        {connection.status !== 'disconnected' ? (
          <button
            type="button"
            disabled={disabled || Boolean(active && active.id !== connection.id)}
            onClick={() => void controller.change(connection.id, 'disconnect')}
          >
            {active?.id === connection.id
              ? connectorText('Annuler la connexion', locale)
              : connectorText('Déconnecter', locale)}
          </button>
        ) : null}
      </div>
    </div>
  );
}
