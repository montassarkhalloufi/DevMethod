import { useRef, useState } from 'react';
import type { McpConnectionsController } from '../hooks/useMcpConnections';
import { mcpConnectionInput } from '../model/mcp';
import type { McpAuth, McpConnection } from '../model/mcp';

export function CustomConnection({
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
