import type { ReactNode } from 'react';
import type { ConnectorDraft } from '../hooks/useConnectorDrafts';
import { readGuideInput } from '../model/guides';
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
  draft: ConnectorDraft;
  onDraft(patch: Partial<ConnectorDraft>): void;
  onSaved(draft: ConnectorDraft, version: number): void;
  guidePanel?: ReactNode;
  guideReady?: boolean;
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

function ConfigurationConflict({ draft, version }: { draft: ConnectorDraft; version: number }) {
  if (!draft.dirty || draft.baseVersion === version) return null;
  return (
    <p role="alert" className="connector-error">
      La configuration a changé. Vos réponses sont conservées ; relisez la version enregistrée avant
      de les remplacer.
    </p>
  );
}

export function ConnectionDetail(props: Props) {
  const {
    option,
    connection,
    revisionId,
    busy,
    action,
    refresh,
    onPrepareRequest,
    draft,
    onDraft,
  } = props;
  const { profile, references, control, capability } = draft;
  async function configure(event: React.FormEvent) {
    event.preventDefault();
    if (busy || props.guideReady === false) return;
    const result = await action('configure', {
      id: connection?.id || option.id,
      optionId: option.id,
      purpose: option.purpose,
      ...(profile.trim() ? { profileRef: profile.trim() } : {}),
      secretRefs: references
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
      expectedVersion: draft.baseVersion,
      ...(draft.guide ? { guide: draft.guide } : {}),
    });
    if (
      result &&
      typeof result === 'object' &&
      'connections' in result &&
      Array.isArray(result.connections)
    ) {
      const saved = result.connections.find(
        (item: ConnectorConnection) => item.optionId === option.id,
      );
      if (saved) props.onSaved(draft, saved.version);
      refresh();
    }
  }
  async function prepare() {
    if (!connection || !revisionId || busy || draft.dirty) return;
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
      onPrepareRequest({
        prompt: result.prompt,
        ...('connectorGuides' in result && Array.isArray(result.connectorGuides)
          ? { connectorGuides: result.connectorGuides.map(readGuideInput) }
          : {}),
      });
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
      {props.guidePanel}
      <ConfigurationConflict draft={draft} version={connection?.version || 0} />
      <form onSubmit={(event) => void configure(event)}>
        <label>
          Profil dans l’agent hôte{' '}
          <input
            value={profile}
            onChange={(event) => onDraft({ profile: event.target.value })}
            disabled={busy}
            name="connector-profile"
            autoComplete="off"
            placeholder="host:mon-profil"
            pattern="host:[A-Za-z0-9_.-]+"
          />
        </label>
        <label>
          Références des accès, une par ligne{' '}
          <textarea
            value={references}
            onChange={(event) => onDraft({ references: event.target.value })}
            disabled={busy}
            name="connector-secret-references"
            autoComplete="off"
            spellCheck={false}
            placeholder={'env:NOM_DE_VARIABLE\nhost:nom-du-secret'}
            rows={2}
          />
        </label>
        <p className="connector-note">
          Indiquez les noms des accès conservés dans l’hôte. Ne collez aucune clé secrète.
          Enregistrer ne connecte ni n’installe un service.
        </p>
        <button type="submit" disabled={busy || props.guideReady === false}>
          {connection ? 'Enregistrer les réglages' : 'Enregistrer la configuration'}
        </button>
      </form>
      {connection ? (
        <>
          {draft.dirty ? (
            <p className="connector-note">
              Enregistrez les réglages avant de préparer une demande avec cette configuration.
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy || draft.dirty}
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
              <select
                value={control}
                disabled={busy}
                onChange={(event) => onDraft({ control: event.target.value })}
              >
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
              <select
                value={capability}
                disabled={busy}
                onChange={(event) => onDraft({ capability: event.target.value })}
              >
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
              draft.dirty ||
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
