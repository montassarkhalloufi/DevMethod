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
  const control = useMcpActions(jobId, running);
  if (!control.actions.length && !control.error) return null;
  return (
    <section className="mcp-action-cards" aria-label="Actions des connecteurs">
      {control.error ? (
        <div role="alert">
          <p>{control.error}</p>
          <button type="button" onClick={control.refresh}>
            Réessayer l’actualisation
          </button>
        </div>
      ) : null}
      {control.actions.map((action) => (
        <article className="mcp-action-card" key={action.requestId}>
          <header>
            <strong>{action.connectionName}</strong>
            <span role="status">{statusLabels[action.status]}</span>
          </header>
          <h3>{action.toolName}</h3>
          {action.connectionUrl ? (
            <p className="mcp-note">Destination : {action.connectionUrl}</p>
          ) : null}
          <details open={action.status === 'pending'}>
            <summary>Paramètres exacts de l’action</summary>
            <pre>{JSON.stringify(action.arguments, null, 2)}</pre>
          </details>
          {action.error ? <p role="alert">{action.error.message}</p> : null}
          {action.status === 'pending' ? (
            <>
              <p className="mcp-note">
                Accord unique pour ces paramètres, valable jusqu’à{' '}
                {new Date(action.expiresAt).toLocaleTimeString('fr-FR')}. Les règles durables se
                modifient dans la fiche du connecteur.
              </p>
              <div className="mcp-form-actions">
                <button
                  type="button"
                  disabled={Boolean(control.busy) || !running}
                  onClick={() => void control.decide(action.requestId, 'deny')}
                >
                  Refuser
                </button>
                <button
                  className="primary"
                  type="button"
                  disabled={Boolean(control.busy) || !running}
                  onClick={() => void control.decide(action.requestId, 'allow')}
                >
                  Autoriser cette action
                </button>
              </div>
            </>
          ) : null}
          {action.status === 'unknown' ? (
            <p>
              L’opération a pu avoir lieu chez le fournisseur. Vérifiez son résultat avant de
              demander une nouvelle action.
            </p>
          ) : null}
          {action.status === 'completed' ? (
            <details>
              <summary>
                {action.isError ? 'Le fournisseur a signalé une erreur' : 'Voir le résultat'}
              </summary>
              <pre>{JSON.stringify(action.result, null, 2)}</pre>
            </details>
          ) : null}
        </article>
      ))}
    </section>
  );
}
