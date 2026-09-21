import { useI18n } from '../../../i18n';
import { connectorText, connectorMessage } from '../../connectors/model/i18n';
import { ConnectorIcon } from '../../connectors';
import type { McpConnection } from '../model/mcp';
import { mcpDisplayName } from '../model/mcp';

export function McpPromptSelection({
  connections,
  selectedIds,
  onToggle,
  onManage,
  disabled = false,
}: {
  connections: McpConnection[];
  selectedIds: string[];
  onToggle(id: string): void;
  onManage(button: HTMLButtonElement): void;
  disabled?: boolean;
}) {
  const { locale } = useI18n();
  const visible = connections.filter(
    (connection) => connection.status === 'connected' || selectedIds.includes(connection.id),
  );
  return (
    <div
      className="mcp-prompt-selection"
      aria-label={connectorText('Serveurs MCP pour ce projet', locale)}
    >
      {visible.map((connection) => (
        <button
          key={connection.id}
          type="button"
          className={`mcp-prompt-chip${connection.status === 'connected' ? '' : ' mcp-prompt-chip-unavailable'}`}
          aria-pressed={selectedIds.includes(connection.id)}
          aria-label={connectorMessage(
            'Utiliser {name} pour ce projet',
            'Use {name} for this project',
            locale,
            { name: mcpDisplayName(connection, locale) },
          )}
          disabled={
            disabled || (connection.status !== 'connected' && !selectedIds.includes(connection.id))
          }
          onClick={() => onToggle(connection.id)}
          title={`${mcpDisplayName(connection, locale)} · ${connection.status === 'connected' ? connectorMessage('{count} outils disponibles', '{count} tools available', locale, { count: connection.tools.length.toLocaleString(locale) }) : connectorText('À reconnecter', locale)}`}
        >
          <ConnectorIcon
            optionId={connection.provider === 'custom' ? 'application-mcp' : connection.provider}
            size={18}
          />
          <span>{mcpDisplayName(connection, locale)}</span>
          <small>
            {connection.status === 'connected'
              ? connectorText('Connecté', locale)
              : connectorText('À reconnecter', locale)}
          </small>
        </button>
      ))}
      <button
        type="button"
        className="mcp-manage"
        disabled={disabled}
        onClick={(event) => onManage(event.currentTarget)}
      >
        {visible.length
          ? connectorText('Gérer les MCP', locale)
          : connectorMessage('+ Connecter un MCP', '+ Connect MCP', locale)}
      </button>
    </div>
  );
}
