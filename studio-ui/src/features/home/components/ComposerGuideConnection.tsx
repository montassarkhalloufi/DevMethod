import { useI18n } from '../../../i18n';
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
  const { t } = useI18n();
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
        t(
          'Cette préparation ne propose pas de connexion MCP prise en charge. Revenez aux outils pour choisir un serveur.',
          'This preparation has no supported MCP connection. Return to tools to choose a server.',
        ),
      );
    }
  }
  return (
    <div className="composer-guide-connect">
      <p>
        {' '}
        {t(
          'L’ajout à la demande prépare le travail. La connexion autorise séparément l’accès de l’assistant.',
          'Adding this to your request prepares the work. Connecting separately authorizes assistant access.',
        )}{' '}
      </p>
      {native?.providerId === 'github' ? (
        <McpCredentialForm
          input={guidedMcpInput(preparation)}
          controller={composer.mcp}
          disabled={composer.busy}
        />
      ) : (
        <button type="button" disabled={composer.busy || Boolean(active)} onClick={connect}>
          {connection?.status === 'connected'
            ? t('Reconnecter', 'Reconnect')
            : t('Connecter', 'Connect')}{' '}
          {title}
        </button>
      )}
      {active ? (
        <p role="status">
          {active.authorizing
            ? t(
                'Autorisation attendue dans la fenêtre du fournisseur…',
                'Waiting for authorization in the provider window…',
              )
            : t('Connexion MCP en cours…', 'Connecting to MCP…')}
        </p>
      ) : null}
      {connection?.status === 'connected' ? (
        <p role="status">
          {' '}
          {t('Connecté ·', 'Connected ·')} {connection.tools.length}{' '}
          {t(
            'outils découverts. L’usage dans l’application reste distinct.',
            'tools discovered. Use within the application remains separate.',
          )}{' '}
        </p>
      ) : null}
      {active?.id ? (
        <button type="button" onClick={() => void composer.mcp.change(active.id!, 'disconnect')}>
          {' '}
          {t('Annuler la connexion', 'Cancel connection')}{' '}
        </button>
      ) : null}
      {connectionError || composer.mcp.error ? (
        <p role="alert">{connectionError || composer.mcp.error}</p>
      ) : null}
    </div>
  );
}
