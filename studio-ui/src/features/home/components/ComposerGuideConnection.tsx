import { useState } from 'react';
import type { GuidePreparation } from '../../connectors';
import { guidedMcpInput, McpCredentialForm } from '../../mcp';
import type { IdeaComposerController } from '../hooks/useIdeaComposer';

export function ComposerGuideConnection({
  composer,
  preparation,
  title,
}: {
  composer: IdeaComposerController;
  preparation: GuidePreparation;
  title: string;
}) {
  const [connectionError, setConnectionError] = useState('');
  const native = preparation.nativeConnection;
  const connection = composer.mcp.connections.find(
    (item) => item.provider === native?.providerId && item.url === native?.url,
  );
  const active = composer.mcp.active;
  function connect() {
    setConnectionError('');
    try {
      void composer.mcp.connect(guidedMcpInput(preparation));
    } catch {
      setConnectionError(
        'Cette préparation ne propose pas de connexion MCP prise en charge. Revenez aux outils pour choisir un serveur.',
      );
    }
  }
  return (
    <div className="composer-guide-connect">
      <p>
        L’ajout à la demande prépare le travail. La connexion autorise séparément l’accès de
        l’assistant.
      </p>
      {native?.providerId === 'github' ? (
        <McpCredentialForm
          input={guidedMcpInput(preparation)}
          controller={composer.mcp}
          disabled={composer.busy}
        />
      ) : (
        <button type="button" disabled={composer.busy || Boolean(active)} onClick={connect}>
          {connection?.status === 'connected' ? 'Reconnecter' : 'Connecter'} {title}
        </button>
      )}
      {active ? (
        <p role="status">
          {active.authorizing
            ? 'Autorisation attendue dans la fenêtre du fournisseur…'
            : 'Connexion MCP en cours…'}
        </p>
      ) : null}
      {connection?.status === 'connected' ? (
        <p role="status">
          Connecté · {connection.tools.length} outils découverts. L’usage dans l’application reste
          distinct.
        </p>
      ) : null}
      {active?.id ? (
        <button type="button" onClick={() => void composer.mcp.change(active.id!, 'disconnect')}>
          Annuler la connexion
        </button>
      ) : null}
      {connectionError || composer.mcp.error ? (
        <p role="alert">{connectionError || composer.mcp.error}</p>
      ) : null}
    </div>
  );
}
