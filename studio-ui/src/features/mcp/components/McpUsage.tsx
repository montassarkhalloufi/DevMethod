import { useEffect, useState } from 'react';
import { mcpRequest } from '../model/permissions';
interface Usage {
  supported: boolean;
  projects: { id: string; name: string }[];
  unavailable?: number;
}
export function McpUsage({ connectionId }: { connectionId: string }) {
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
      <h4>Projets utilisant cette connexion</h4>
      {error ? (
        <p role="alert">
          {error}{' '}
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            Actualiser
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
              <p className="mcp-note">Aucun projet enregistré ne sélectionne cette connexion.</p>
            )}
            {usage.unavailable ? (
              <p className="mcp-note">
                {usage.unavailable} projet(s) indisponible(s) : leur sélection reste inconnue.
              </p>
            ) : null}
          </>
        ) : (
          <p className="mcp-note">La liste des projets est disponible depuis l’accueil.</p>
        )
      ) : !error ? (
        <p role="status">Lecture des projets…</p>
      ) : null}
    </div>
  );
}
