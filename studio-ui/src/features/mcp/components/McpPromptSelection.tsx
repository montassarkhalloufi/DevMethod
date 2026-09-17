import { ConnectorIcon } from '../../connectors';
import type { McpConnection } from '../model/mcp';

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
  const visible = connections.filter(
    (connection) => connection.status === 'connected' || selectedIds.includes(connection.id),
  );
  return (
    <div className="mcp-prompt-selection" aria-label="Serveurs MCP pour ce projet">
      {visible.map((connection) => (
        <button
          key={connection.id}
          type="button"
          className={`mcp-prompt-chip${connection.status === 'connected' ? '' : ' mcp-prompt-chip-unavailable'}`}
          aria-pressed={selectedIds.includes(connection.id)}
          aria-label={`Utiliser ${connection.name} pour ce projet`}
          disabled={
            disabled || (connection.status !== 'connected' && !selectedIds.includes(connection.id))
          }
          onClick={() => onToggle(connection.id)}
          title={`${connection.name} · ${connection.status === 'connected' ? `${connection.tools.length} outils disponibles` : 'À reconnecter'}`}
        >
          <ConnectorIcon
            optionId={connection.provider === 'custom' ? 'application-mcp' : connection.provider}
            size={18}
          />
          <span>{connection.name}</span>
          <small>{connection.status === 'connected' ? 'Connecté' : 'À reconnecter'}</small>
        </button>
      ))}
      <button
        type="button"
        className="mcp-manage"
        disabled={disabled}
        onClick={(event) => onManage(event.currentTarget)}
      >
        {visible.length ? 'Gérer les MCP' : '+ Connecter un MCP'}
      </button>
    </div>
  );
}
