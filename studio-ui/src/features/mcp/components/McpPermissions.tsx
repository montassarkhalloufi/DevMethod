import { useState } from 'react';
import { useMcpPolicy } from '../hooks/useMcpPolicy';
import { permissionLabels } from '../model/permissions';
import type { McpPermission } from '../model/permissions';

export function McpPermissions({ connectionId }: { connectionId: string }) {
  const control = useMcpPolicy(connectionId);
  const [search, setSearch] = useState('');
  const policy = control.policy;
  const query = search.trim().toLocaleLowerCase('fr');
  const tools =
    policy?.tools.filter((tool) =>
      `${tool.title || ''} ${tool.name}`.toLocaleLowerCase('fr').includes(query),
    ) || [];
  const visiblePermission = tools.every((tool) => tool.permission === tools[0]?.permission)
    ? (tools[0]?.permission ?? 'ask')
    : 'mixed';
  return (
    <section className="mcp-permissions" aria-label="Permissions de l’assistant">
      <h4>Ce que l’assistant peut faire</h4>
      <p className="mcp-note">
        Ces règles s’appliquent aux appels du pont MCP DevMethod dans tous les projets utilisant
        cette connexion. Chaque nouvel outil demande votre accord.
      </p>
      {control.error ? (
        <div role="alert">
          <p>{control.error}</p>
          <button type="button" disabled={control.busy} onClick={control.refresh}>
            Relire les permissions
          </button>
        </div>
      ) : null}
      {!policy ? (
        <p role="status">Lecture des permissions…</p>
      ) : (
        <>
          <label className="mcp-permission-global">
            {query ? `Outils affichés (${tools.length})` : 'Tous les outils de cette connexion'}
            <select
              value={visiblePermission}
              disabled={control.busy || !tools.length}
              onChange={(event) => void control.change(tools, event.target.value as McpPermission)}
            >
              <option value="mixed" disabled>
                Personnalisé
              </option>
              {Object.entries(permissionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <p className="mcp-note">
            Une restriction prend effet immédiatement. Un élargissement durable s’applique à la
            prochaine mission. « Autoriser » permet l’exécution sans accord ponctuel.
          </p>
          {policy.tools.length > 6 ? (
            <label>
              Rechercher un outil
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          ) : null}
          <ul className="mcp-permission-tools">
            {tools.map((tool) => (
              <li key={tool.name}>
                <div>
                  <strong>{tool.title || tool.name}</strong>
                  <small>{tool.name}</small>
                  {tool.description ? <p>{tool.description}</p> : null}
                </div>
                <label>
                  <span className="mcp-sr">Permission pour {tool.name}</span>
                  <select
                    value={tool.permission}
                    disabled={control.busy}
                    onChange={(event) =>
                      void control.change([tool], event.target.value as McpPermission)
                    }
                  >
                    {Object.entries(permissionLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
          {!tools.length ? <p>Aucun outil à afficher.</p> : null}
          {control.busy ? <p role="status">Enregistrement…</p> : null}
        </>
      )}
    </section>
  );
}
