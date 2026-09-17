import { useState } from 'react';
import type {
  ConnectorConnection,
  ConnectorOption,
  ConnectorWidgetOptions,
} from '../model/contracts';

export function connectionLabel(connection: ConnectorConnection | undefined) {
  if (!connection) return 'À configurer';
  if (connection.status === 'failed') return 'Échec de la vérification de connexion';
  if (connection.status === 'attested') return 'Disponibilité attestée par l’agent hôte';
  return 'Configuré · connexion à vérifier';
}
interface Props extends ConnectorWidgetOptions {
  option: ConnectorOption;
  connection?: ConnectorConnection;
  busy: boolean;
  action(route: string, input: Record<string, unknown>): Promise<unknown | null>;
  refresh(): void;
}
function probeRequest(connection: ConnectorConnection, option: ConnectorOption) {
  return [
    `Vérifier la disponibilité du connecteur ${option.title} pour ce projet.`,
    `Connexion : ${connection.id}, configuration ${connection.version}. Profil : ${connection.profileRef || 'à préciser dans l’hôte'}.`,
    `Capacités attendues : ${option.capabilities.join(', ')}. Documentation : ${option.docs}`,
    'Utiliser uniquement les accès autorisés dans l’agent hôte. Ne pas envoyer de message, provisionner ou modifier les données pour cette vérification.',
    'Publier le résultat via le bridge worker POST /api/connectors/probe avec connectionId, connectionVersion, eventId unique, status available ou failed, tool {name, version}, capabilities, observedAt, summary et tools si MCP. Ne publier available qu’après une réponse réelle ; une configuration ne prouve pas la connexion. Aucune clé ni sortie sensible dans le rapport.',
  ].join('\n');
}
export function ConnectionDetail(props: Props) {
  const { option, connection, revisionId, busy, action, refresh, onPrepareRequest } = props;
  const [profile, setProfile] = useState(connection?.profileRef || '');
  const [references, setReferences] = useState(connection?.secretRefs.join('\n') || '');
  const [control, setControl] = useState(
    option.checkIds.includes(props.checkId || '') ? props.checkId! : option.checkIds[0] || '',
  );
  const [capability, setCapability] = useState(option.capabilities[0] || '');
  async function configure(event: React.FormEvent) {
    event.preventDefault();
    const result = await action('configure', {
      id: connection?.id || option.id,
      optionId: option.id,
      purpose: option.purpose,
      ...(profile.trim() ? { profileRef: profile.trim() } : {}),
      secretRefs: references
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
      ...(connection ? { expectedVersion: connection.version } : {}),
    });
    if (result) refresh();
  }
  async function prepare() {
    if (!connection || !revisionId) return;
    const result = await action(option.purpose === 'diagnostics' ? 'executions' : 'prepare', {
      connectionId: connection.id,
      revisionId,
      ...(option.purpose === 'diagnostics' ? { checkId: control } : { capability }),
    });
    if (
      result &&
      typeof result === 'object' &&
      'prompt' in result &&
      typeof result.prompt === 'string'
    )
      onPrepareRequest({ prompt: result.prompt });
  }
  return (
    <section className="connector-detail" aria-label={`Configurer ${option.title}`}>
      <h3>{option.title}</h3>
      <p className={`connector-state state-${connection?.status || 'proposed'}`}>
        {connectionLabel(connection)}
      </p>
      <p>{option.description}</p>
      <p className="connector-cost">{option.cost}</p>
      <a href={option.docs} target="_blank" rel="noopener noreferrer">
        Documentation officielle ↗
      </a>
      <form onSubmit={(event) => void configure(event)}>
        <label>
          Profil dans l’agent hôte{' '}
          <input
            value={profile}
            onChange={(event) => setProfile(event.target.value)}
            placeholder="host:mon-profil"
            pattern="host:[A-Za-z0-9_.-]+"
          />
        </label>
        <label>
          Références des accès, une par ligne{' '}
          <textarea
            value={references}
            onChange={(event) => setReferences(event.target.value)}
            placeholder={'env:NOM_DE_VARIABLE\nhost:nom-du-secret'}
            rows={2}
          />
        </label>
        <p className="connector-note">
          Indiquez les noms des accès conservés dans l’hôte. Ne collez aucune clé secrète.
          Enregistrer ne connecte ni n’installe un service.
        </p>
        <button type="submit" disabled={busy}>
          {connection ? 'Enregistrer les réglages' : 'Enregistrer la configuration'}
        </button>
      </form>
      {connection ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => onPrepareRequest({ prompt: probeRequest(connection, option) })}
          >
            Préparer la vérification de connexion →
          </button>
          {connection.probe ? (
            <div className="connector-probe">
              <p>{connection.probe.summary}</p>
              <small>
                {connection.probe.tool.name} · {connection.probe.tool.version} · constat du{' '}
                {new Date(connection.probe.observedAt).toLocaleString('fr-FR')}
              </small>
            </div>
          ) : null}
          {option.purpose === 'diagnostics' ? (
            <label>
              Contrôle à exécuter
              <select value={control} onChange={(event) => setControl(event.target.value)}>
                {option.checkIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Capacité à intégrer
              <select value={capability} onChange={(event) => setCapability(event.target.value)}>
                {option.capabilities.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            className="primary"
            disabled={
              busy ||
              !revisionId ||
              (option.purpose === 'diagnostics' && (connection.status !== 'attested' || !control))
            }
            onClick={() => void prepare()}
          >
            {option.purpose === 'diagnostics'
              ? 'Préparer l’exécution avec l’agent hôte →'
              : 'Préparer l’intégration au projet →'}
          </button>
          <p className="connector-note">
            {revisionId
              ? `Version ciblée : ${revisionId.slice(0, 8)}. `
              : 'Une version du projet est nécessaire. '}
            {option.purpose === 'diagnostics'
              ? 'Le résultat reçu sera rattaché aux sources contrôlées.'
              : 'La demande prépare une évolution du code. Aucun service n’est provisionné et aucun e-mail n’est envoyé.'}
          </p>
        </>
      ) : null}
      <details>
        <summary>Portée et limites</summary>
        <ul>
          {option.limits.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
