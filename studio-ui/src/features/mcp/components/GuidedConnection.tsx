import { useI18n } from '../../../i18n';
import { connectorText } from '../../connectors/model/i18n';
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
  const { locale } = useI18n();
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
            {connectorText('Connecté ·', locale)}
            {connection.name} · {connection.tools.length.toLocaleString(locale)}{' '}
            {connectorText('outils découverts', locale)}
          </p>
          {selection.connectionIds.includes(connection.id) ? (
            <p>
              {connectorText(
                'Utilisé dans ce projet. Disponible pour la prochaine mission.',
                locale,
              )}
            </p>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void selection.select(connection.id, true)}
            >
              {connectorText('Utiliser dans ce projet', locale)}
            </button>
          )}
        </>
      ) : input.auth === 'bearer' ? (
        <McpCredentialForm input={input} controller={controller} />
      ) : (
        <button type="button" disabled={busy} onClick={() => void controller.connect(input)}>
          {connection ? connectorText('Reconnecter', locale) : connectorText('Connecter', locale)}{' '}
          {providerNames[input.provider]}
        </button>
      )}
      {controller.active ? (
        <p role="status">
          {controller.active.authorizing
            ? connectorText('Terminez l’autorisation dans la fenêtre du fournisseur.', locale)
            : connectorText('Vérification de la connexion…', locale)}
        </p>
      ) : null}
      {controller.error || selection.error ? (
        <p role="alert">{connectorText(controller.error || selection.error, locale)}</p>
      ) : null}
    </div>
  );
}
