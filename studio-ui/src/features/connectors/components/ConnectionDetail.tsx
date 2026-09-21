import { useI18n } from '../../../i18n';
import { connectorText, connectorMessage } from '../model/i18n';
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
function probeRequest(
  connection: ConnectorConnection,
  option: ConnectorOption,
  locale: 'en' | 'fr',
) {
  return [
    connectorMessage(
      'Vérifier la disponibilité du connecteur {name} pour ce projet.',
      'Check availability of connector {name} for this project.',
      locale,
      { name: option.title },
    ),
    connectorMessage(
      'Connexion : {id}, configuration {version}. Profil : {profile}.',
      'Connection: {id}, configuration {version}. Profile: {profile}.',
      locale,
      {
        id: connection.id,
        version: connection.version,
        profile: connection.profileRef || connectorText('à préciser dans l’hôte', locale),
      },
    ),
    connectorMessage(
      'Capacités attendues : {capabilities}. Documentation : {docs}',
      'Expected capabilities: {capabilities}. Documentation: {docs}',
      locale,
      { capabilities: option.capabilities.join(', '), docs: option.docs },
    ),
    connectorText(
      'Utiliser uniquement les accès autorisés dans l’agent hôte. Ne pas envoyer de message, provisionner ou modifier les données pour cette vérification.',
      locale,
    ),
    connectorText(
      'Publier le résultat via le bridge worker POST /api/connectors/probe avec connectionId, connectionVersion, eventId unique, status available ou failed, tool {name, version}, capabilities, observedAt, summary et tools si MCP. Ne publier available qu’après une réponse réelle ; une configuration ne prouve pas la connexion. Aucune clé ni sortie sensible dans le rapport.',
      locale,
    ),
  ].join('\n');
}

function ConfigurationConflict({ draft, version }: { draft: ConnectorDraft; version: number }) {
  const { locale } = useI18n();
  if (!draft.dirty || draft.baseVersion === version) return null;
  return (
    <p role="alert" className="connector-error">
      {connectorText(
        'La configuration a changé. Vos réponses sont conservées ; relisez la version enregistrée avant de les remplacer.',
        locale,
      )}
    </p>
  );
}

export function ConnectionDetail(props: Props) {
  const { locale } = useI18n();
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
    <section
      className="connector-detail"
      aria-label={connectorMessage('Configurer {name}', 'Configure {name}', locale, {
        name: option.title,
      })}
    >
      <h3>{option.title}</h3>
      <p className={`connector-state state-${connection?.status || 'proposed'}`}>
        {connectorText(connectionLabel(connection), locale)}
      </p>
      <p>{option.description}</p>
      <p className="connector-cost">{option.cost}</p>
      <a href={option.docs} target="_blank" rel="noopener noreferrer">
        {connectorText('Documentation officielle ↗', locale)}
      </a>
      {props.guidePanel}
      <ConfigurationConflict draft={draft} version={connection?.version || 0} />
      <form onSubmit={(event) => void configure(event)}>
        <details className="connector-advanced">
          <summary>{connectorText('Configuration avancée', locale)}</summary>
          <label>
            {connectorText('Profil dans l’agent hôte', locale)}{' '}
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
            {connectorText('Références des accès, une par ligne', locale)}{' '}
            <textarea
              value={references}
              onChange={(event) => onDraft({ references: event.target.value })}
              disabled={busy}
              name="connector-secret-references"
              autoComplete="off"
              spellCheck={false}
              placeholder={connectorMessage(
                'env:NOM_DE_VARIABLE\nhost:nom-du-secret',
                'env:VARIABLE_NAME\nhost:secret-name',
                locale,
              )}
              rows={2}
            />
          </label>
          <p className="connector-note">
            {connectorText(
              'Indiquez les noms des accès conservés dans l’hôte. Ne collez aucune clé secrète. Enregistrer ne connecte ni n’installe un service.',
              locale,
            )}
          </p>
        </details>
        <button type="submit" disabled={busy || props.guideReady === false}>
          {connection
            ? connectorText('Enregistrer les réglages', locale)
            : connectorText('Enregistrer la configuration', locale)}
        </button>
      </form>
      {connection ? (
        <>
          {draft.dirty ? (
            <p className="connector-note">
              {connectorText(
                'Enregistrez les réglages avant de préparer une demande avec cette configuration.',
                locale,
              )}
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy || draft.dirty}
            onClick={() => onPrepareRequest({ prompt: probeRequest(connection, option, locale) })}
          >
            {connectorText('Préparer la vérification de connexion →', locale)}
          </button>
          {connection.probe ? (
            <div className="connector-probe">
              <p>{connection.probe.summary}</p>
              <small>
                {connection.probe.tool.name} · {connection.probe.tool.version} ·{' '}
                {connectorMessage('constat du', 'observed on', locale)}{' '}
                {new Date(connection.probe.observedAt).toLocaleString(
                  locale === 'fr' ? 'fr-FR' : 'en-US',
                )}
              </small>
            </div>
          ) : null}
          {option.purpose === 'diagnostics' ? (
            <label>
              {connectorText('Contrôle à exécuter', locale)}
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
              {connectorText('Capacité à intégrer', locale)}
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
              ? connectorText('Préparer l’exécution avec l’agent hôte →', locale)
              : connectorText('Préparer l’intégration au projet →', locale)}
          </button>
          <TargetNote revisionId={revisionId} purpose={option.purpose} />
        </>
      ) : null}
      <details>
        <summary>{connectorText('Portée et limites', locale)}</summary>
        <ul>
          {option.limits.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function TargetNote({
  revisionId,
  purpose,
}: {
  revisionId?: string | null;
  purpose: ConnectorOption['purpose'];
}) {
  const { locale } = useI18n();
  return (
    <p className="connector-note">
      {revisionId
        ? connectorMessage('Version ciblée : {id}. ', 'Target version: {id}. ', locale, {
            id: revisionId.slice(0, 8),
          })
        : connectorText('Une version du projet est nécessaire.', locale)}
      {purpose === 'diagnostics'
        ? connectorText('Le résultat reçu sera rattaché aux sources contrôlées.', locale)
        : connectorText(
            'La demande prépare une évolution du code. Aucun service n’est provisionné et aucun e-mail n’est envoyé.',
            locale,
          )}
    </p>
  );
}
