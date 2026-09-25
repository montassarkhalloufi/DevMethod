import type { GuidePreparation } from '../../connectors';
import { useMcpConnections } from '../hooks/useMcpConnections';
import { useMcpSelection } from '../hooks/useMcpSelection';
import { guidedMcpInput } from '../model/guided-mcp';
import { McpCredentialForm } from './McpCredentialForm';

const providerNames: Record<string, string> = {
  notion: 'Notion',
  linear: 'Linear',
  github: 'GitHub',
};

export function GuidedConnection({ preparation }: { preparation: GuidePreparation }) {
  const selection = useMcpSelection();
  const controller = useMcpConnections(
    (id) => void selection.select(id, true),
    (id) => void selection.select(id, false),
  );
  if (!preparation.nativeConnection) return null;
  const input = guidedMcpInput(preparation);
  const connection = controller.connections.find(
    (item) => item.provider === input.provider && item.url === input.url,
  );
  const connected = connection?.status === 'connected';
  const busy = Boolean(controller.active) || selection.saving;
  return (
    <div className="connector-guide-connect">
      {connected ? (
        <>
          <p role="status">
            Connecté · {connection.name} · {connection.tools.length} outils découverts
          </p>
          {selection.connectionIds.includes(connection.id) ? (
            <p>Utilisé dans ce projet. Disponible pour la prochaine mission.</p>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void selection.select(connection.id, true)}
            >
              Utiliser dans ce projet
            </button>
          )}
        </>
      ) : input.auth === 'bearer' ? (
        <McpCredentialForm input={input} controller={controller} />
      ) : (
        <button type="button" disabled={busy} onClick={() => void controller.connect(input)}>
          {connection ? 'Reconnecter' : 'Connecter'} {providerNames[input.provider]}
        </button>
      )}
      {controller.active ? (
        <p role="status">
          {controller.active.authorizing
            ? 'Terminez l’autorisation dans la fenêtre du fournisseur.'
            : 'Vérification de la connexion…'}
        </p>
      ) : null}
      {controller.error || selection.error ? (
        <p role="alert">{controller.error || selection.error}</p>
      ) : null}
    </div>
  );
}
