import { useI18n } from '../../../i18n';
import { connectorText } from '../../connectors/model/i18n';
import { useMcpActions } from '../hooks/useMcpActions';
import type { McpAction } from '../hooks/useMcpActions';

const statusLabels: Record<McpAction['status'], string> = {
  pending: 'Votre accord est nécessaire',
  executing: 'Action en cours',
  completed: 'Résultat reçu',
  denied: 'Action refusée',
  expired: 'Demande expirée',
  cancelled: 'Demande annulée',
  unknown: 'Résultat inconnu',
};
export function McpActionCards({ jobId, running }: { jobId: string; running: boolean }) {
  const { locale } = useI18n();
  const control = useMcpActions(jobId, running);
  if (!control.actions.length && !control.error) return null;
  return (
    <section
      className="mcp-action-cards"
      aria-label={connectorText('Actions des connecteurs', locale)}
    >
      {control.error ? (
        <div role="alert">
          <p>{connectorText(control.error, locale)}</p>
          <button type="button" onClick={control.refresh}>
            {connectorText('Réessayer l’actualisation', locale)}
          </button>
        </div>
      ) : null}
      {control.actions.map((action) => (
        <article className="mcp-action-card" key={action.requestId}>
          <header>
            <strong>{action.connectionName}</strong>
            <span role="status">{connectorText(statusLabels[action.status], locale)}</span>
          </header>
          <h3>{action.toolName}</h3>
          {action.connectionUrl ? (
            <p className="mcp-note">
              {connectorText('Destination :', locale)}
              {action.connectionUrl}
            </p>
          ) : null}
          <details open={action.status === 'pending'}>
            <summary>{connectorText('Paramètres exacts de l’action', locale)}</summary>
            <pre>{JSON.stringify(action.arguments, null, 2)}</pre>
          </details>
          {action.error ? <p role="alert">{connectorText(action.error.message, locale)}</p> : null}
          {action.status === 'pending' ? (
            <>
              <p className="mcp-note">
                {connectorText('Accord unique pour ces paramètres, valable jusqu’à', locale)}{' '}
                {new Date(action.expiresAt).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                {connectorText(
                  '. Les règles durables se modifient dans la fiche du connecteur.',
                  locale,
                )}
              </p>
              <div className="mcp-form-actions">
                <button
                  type="button"
                  disabled={Boolean(control.busy) || !running}
                  onClick={() => void control.decide(action.requestId, 'deny')}
                >
                  {connectorText('Refuser', locale)}
                </button>
                <button
                  className="primary"
                  type="button"
                  disabled={Boolean(control.busy) || !running}
                  onClick={() => void control.decide(action.requestId, 'allow')}
                >
                  {connectorText('Autoriser cette action', locale)}
                </button>
              </div>
            </>
          ) : null}
          {action.status === 'unknown' ? (
            <p>
              {connectorText(
                'L’opération a pu avoir lieu chez le fournisseur. Vérifiez son résultat avant de demander une nouvelle action.',
                locale,
              )}
            </p>
          ) : null}
          {action.status === 'completed' ? (
            <details>
              <summary>
                {action.isError
                  ? connectorText('Le fournisseur a signalé une erreur', locale)
                  : connectorText('Voir le résultat', locale)}
              </summary>
              <pre>{JSON.stringify(action.result, null, 2)}</pre>
            </details>
          ) : null}
        </article>
      ))}
    </section>
  );
}
