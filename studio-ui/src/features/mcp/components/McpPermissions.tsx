import { useI18n } from '../../../i18n';
import { connectorText, connectorMessage } from '../../connectors/model/i18n';
import { useState } from 'react';
import { useMcpPolicy } from '../hooks/useMcpPolicy';
import { permissionLabels } from '../model/permissions';
import type { McpPermission } from '../model/permissions';

export function McpPermissions({ connectionId }: { connectionId: string }) {
  const { locale } = useI18n();
  const control = useMcpPolicy(connectionId);
  const [search, setSearch] = useState('');
  const policy = control.policy;
  const query = search.trim().toLocaleLowerCase(locale);
  const tools =
    policy?.tools.filter((tool) =>
      `${tool.title || ''} ${tool.name}`.toLocaleLowerCase(locale).includes(query),
    ) || [];
  const visiblePermission = tools.every((tool) => tool.permission === tools[0]?.permission)
    ? (tools[0]?.permission ?? 'ask')
    : 'mixed';
  return (
    <section
      className="mcp-permissions"
      aria-label={connectorText('Permissions de l’assistant', locale)}
    >
      <h4>{connectorText('Ce que l’assistant peut faire', locale)}</h4>
      <p className="mcp-note">
        {connectorText(
          'Ces règles s’appliquent aux appels du pont MCP DevMethod dans tous les projets utilisant cette connexion. Chaque nouvel outil demande votre accord.',
          locale,
        )}
      </p>
      {control.error ? (
        <div role="alert">
          <p>{connectorText(control.error, locale)}</p>
          <button type="button" disabled={control.busy} onClick={control.refresh}>
            {connectorText('Relire les permissions', locale)}
          </button>
        </div>
      ) : null}
      {!policy ? (
        <p role="status">{connectorText('Lecture des permissions…', locale)}</p>
      ) : (
        <>
          <label className="mcp-permission-global">
            {query
              ? connectorMessage('Outils affichés ({count})', 'Visible tools ({count})', locale, {
                  count: tools.length.toLocaleString(locale),
                })
              : connectorText('Tous les outils de cette connexion', locale)}
            <select
              value={visiblePermission}
              disabled={control.busy || !tools.length}
              onChange={(event) => void control.change(tools, event.target.value as McpPermission)}
            >
              <option value="mixed" disabled>
                {connectorText('Personnalisé', locale)}
              </option>
              {Object.entries(permissionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {connectorText(label, locale)}
                </option>
              ))}
            </select>
          </label>
          <p className="mcp-note">
            {connectorText(
              'Une restriction prend effet immédiatement. Un élargissement durable s’applique à la prochaine mission. « Autoriser » permet l’exécution sans accord ponctuel.',
              locale,
            )}
          </p>
          {policy.tools.length > 6 ? (
            <label>
              {connectorText('Rechercher un outil', locale)}
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
                  <span className="mcp-sr">
                    {connectorText('Permission pour', locale)}
                    {tool.name}
                  </span>
                  <select
                    value={tool.permission}
                    disabled={control.busy}
                    onChange={(event) =>
                      void control.change([tool], event.target.value as McpPermission)
                    }
                  >
                    {Object.entries(permissionLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {connectorText(label, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
          {!tools.length ? <p>{connectorText('Aucun outil à afficher.', locale)}</p> : null}
          {control.busy ? (
            <p role="status">{connectorMessage('Enregistrement…', 'Saving…', locale)}</p>
          ) : null}
        </>
      )}
    </section>
  );
}
