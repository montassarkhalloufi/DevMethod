import { useI18n } from '../../../i18n';
import { connectorText } from '../../connectors/model/i18n';
import { useEffect, useState } from 'react';
import { mcpRequest } from '../model/permissions';
interface Usage {
  supported: boolean;
  projects: { id: string; name: string }[];
  unavailable?: number;
}
export function McpUsage({ connectionId }: { connectionId: string }) {
  const { locale } = useI18n();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void mcpRequest<Usage>(
      'usage?connectionId=' + encodeURIComponent(connectionId),
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted) {
          setUsage(value);
          setError('');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Utilisation dans les projets indisponible.');
      });
    return () => controller.abort();
  }, [connectionId, attempt]);
  return (
    <div className="mcp-usage">
      <h4>{connectorText('Projets utilisant cette connexion', locale)}</h4>
      {error ? (
        <p role="alert">
          {connectorText(error, locale)}{' '}
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            {connectorText('Actualiser', locale)}
          </button>
        </p>
      ) : null}
      {usage ? (
        usage.supported ? (
          <>
            {usage.projects.length ? (
              <ul>
                {usage.projects.map((project) => (
                  <li key={project.id}>{project.name}</li>
                ))}
              </ul>
            ) : (
              <p className="mcp-note">
                {connectorText('Aucun projet enregistré ne sélectionne cette connexion.', locale)}
              </p>
            )}
            {usage.unavailable ? (
              <p className="mcp-note">
                {usage.unavailable.toLocaleString(locale)}{' '}
                {connectorText(
                  'projet(s) indisponible(s) : leur sélection reste inconnue.',
                  locale,
                )}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mcp-note">
            {connectorText('La liste des projets est disponible depuis l’accueil.', locale)}
          </p>
        )
      ) : !error ? (
        <p role="status">{connectorText('Lecture des projets…', locale)}</p>
      ) : null}
    </div>
  );
}
