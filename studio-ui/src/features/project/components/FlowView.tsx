import { useI18n } from '../../../i18n';
import { useState } from 'react';
import type {
  ModelViewProps,
  ProjectElement,
  ProjectFlow,
  ProjectRelation,
} from '../model/contracts';
import { ELEMENT_LABELS, RELATION_LABELS, redactTrace } from './architecture-model';
import './architecture.css';

function FlowStep({
  id,
  element,
  relations,
  onSelect,
  onOpenSource,
  selectedId,
}: {
  id: string;
  element?: ProjectElement;
  relations: ProjectRelation[];
} & Pick<ModelViewProps, 'onSelect' | 'onOpenSource' | 'selectedId'>) {
  const { t, locale } = useI18n();
  if (!element)
    return (
      <li className="flow-step flow-unresolved">
        <span className="flow-number" aria-hidden="true">
          ?
        </span>
        <div>
          <h4>{t('Chaînon non résolu', 'Unresolved link')}</h4>
          <p>
            {t('L’élément', 'Element')} {id}{' '}
            {t(
              'n’est pas présent dans cette analyse. Le parcours n’est pas complété arbitrairement.',
              'is absent from this analysis. The flow is not completed arbitrarily.',
            )}
          </p>
        </div>
      </li>
    );
  const source = element.sources[0];
  return (
    <li className="flow-step" data-selected={selectedId === element.id}>
      <span className="flow-number" aria-hidden="true">
        ◇
      </span>
      <div className="flow-step-body">
        <div className="flow-step-heading">
          <button
            type="button"
            aria-pressed={selectedId === element.id}
            onClick={() => onSelect(element.id)}
          >
            {element.label}
          </button>
          <span>{ELEMENT_LABELS(locale)[element.type]}</span>
        </div>
        <p>{element.description}</p>
        {source ? (
          <button
            className="model-source-link"
            type="button"
            onClick={() => onOpenSource(source.path, source.line)}
          >
            {source.path}
            {source.line ? `:${source.line}` : ''} ↗
          </button>
        ) : (
          <small>{t('Aucune source reliée.', 'No linked source.')}</small>
        )}
        {relations.length ? (
          <ul className="flow-connections">
            {relations.map((relation) => (
              <li key={relation.id}>
                <button type="button" onClick={() => onSelect(relation.id)}>
                  {RELATION_LABELS(locale)[relation.kind]} · {relation.label}
                </button>
                <small>{relation.provenance.map((item) => item.method).join(' · ')}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="arch-note">
            {t(
              'Aucune connexion sortante résolue dans ce périmètre.',
              'No resolved outgoing connection in this scope.',
            )}
          </p>
        )}
      </div>
    </li>
  );
}

function ObservedTrace({ flow, revisionId }: { flow: ProjectFlow; revisionId: string }) {
  const { t, locale } = useI18n();
  if (flow.kind !== 'observed')
    return (
      <p className="arch-note">
        {t(
          'Flux déduit du code. Aucun temps de réponse ni succès à l’exécution ne peut être conclu de ce parcours.',
          'Flow inferred from code. This flow establishes neither response times nor runtime success.',
        )}
      </p>
    );
  if (!flow.trace)
    return (
      <p className="arch-note">
        {t(
          'Flux marqué observé, mais trace absente. Observation non vérifiable dans cet écran.',
          'Flow marked observed, but its trace is missing. The observation cannot be verified here.',
        )}
      </p>
    );
  return (
    <details className="flow-trace" open>
      <summary>
        {t('Trace observée · version', 'Observed trace · version')}{' '}
        {flow.trace.revisionId.slice(0, 8)} · {flow.trace.environment}
      </summary>
      {flow.trace.revisionId !== revisionId ? (
        <p className="arch-note">
          {t(
            'Trace d’une autre version : elle n’établit pas le comportement de la version affichée.',
            'Trace from another version: it does not establish the behavior of the displayed version.',
          )}
        </p>
      ) : null}
      <p>
        {flow.trace.durationMs === undefined
          ? t('Durée totale indisponible.', 'Total duration unavailable.')
          : t('Durée mesurée : {duration} ms.', 'Measured duration: {duration} ms.', {
              duration: new Intl.NumberFormat(locale).format(flow.trace.durationMs),
            })}
      </p>
      <ol>
        {flow.trace.events.slice(0, 100).map((event, index) => (
          <li key={`${index}-${event.at ?? ''}`}>
            <strong>{redactTrace(event.label, locale)}</strong>
            {event.at ? <time>{new Date(event.at).toLocaleString(locale)}</time> : null}
            {event.durationMs === undefined ? null : (
              <span>{new Intl.NumberFormat(locale).format(event.durationMs)} ms</span>
            )}
            {event.error ? <p className="flow-error">{redactTrace(event.error, locale)}</p> : null}
          </li>
        ))}
      </ol>
      {flow.trace.events.length > 100 ? (
        <p>
          {t(
            'Affichage limité aux 100 premiers événements.',
            'Display limited to the first 100 events.',
          )}
        </p>
      ) : null}
      <small>
        {t(
          'Masquage complémentaire des jetons et adresses reconnaissables. Les traces doivent être expurgées à la collecte ; cette vue n’est pas un filtre exhaustif.',
          'Additional masking of recognizable tokens and addresses. Traces must be redacted during collection; this view is not an exhaustive filter.',
        )}
      </small>
    </details>
  );
}

function FlowDetails({ flow, props }: { flow: ProjectFlow; props: ModelViewProps }) {
  const { t, locale } = useI18n();
  const analysis = props.model.analysis;
  const byId = new Map(analysis.elements.map((element) => [element.id, element]));
  const relationIds = new Set(flow.relationIds);
  const outgoing = new Map<string, ProjectRelation[]>();
  for (const relation of analysis.relations) {
    if (!relationIds.has(relation.id)) continue;
    outgoing.set(relation.source, [...(outgoing.get(relation.source) ?? []), relation]);
  }
  const knownRelations = new Set(analysis.relations.map((relation) => relation.id));
  const missingRelations = flow.relationIds.filter((id) => !knownRelations.has(id));
  return (
    <>
      <div className="model-heading">
        <div>
          <h3>{flow.title}</h3>
          <p>
            {flow.kind === 'code'
              ? t('Parcours déduit des liens du code', 'Flow inferred from code links')
              : t('Parcours avec trace observée', 'Flow with an observed trace')}
          </p>
        </div>
        <span className={`model-kind ${flow.kind === 'observed' ? 'observed' : ''}`}>
          {flow.kind === 'code'
            ? t('Analyse statique', 'Static analysis')
            : t('Observation enregistrée', 'Recorded observation')}
        </span>
      </div>
      <ObservedTrace flow={flow} revisionId={analysis.revisionId} />
      <p className="flow-scope">
        {t(
          'Éléments et dépendances associés à l’entrée, sans ordre d’exécution déduit. D’autres routes du même fichier peuvent figurer dans ce périmètre.',
          'Elements and dependencies associated with the entry, without inferred execution order. Other routes in the same file may appear in this scope.',
        )}
      </p>
      <ul className="flow-steps">
        {flow.elementIds.slice(0, 80).map((id, index) => (
          <FlowStep
            key={`${id}-${index}`}
            id={id}
            element={byId.get(id)}
            relations={outgoing.get(id) ?? []}
            selectedId={props.selectedId}
            onSelect={props.onSelect}
            onOpenSource={props.onOpenSource}
          />
        ))}
      </ul>
      {flow.elementIds.length > 80 ? (
        <p className="arch-note">
          {t(
            'Parcours limité aux 80 premiers éléments. Réduisez le périmètre d’analyse.',
            'Flow limited to the first 80 elements. Narrow the analysis scope.',
          )}
        </p>
      ) : null}
      {missingRelations.length ? (
        <p className="arch-note">
          {missingRelations.length}{' '}
          {t(
            'connexion(s) de ce parcours ne sont plus résolues dans l’analyse.',
            'connection(s) in this flow are no longer resolved in the analysis.',
          )}
        </p>
      ) : null}
      <details className="flow-errors" open>
        <summary>
          {t(
            'Branches d’erreur identifiées dans les sources associées ·',
            'Error branches identified in associated sources ·',
          )}{' '}
          {flow.errors.length}
        </summary>
        {flow.errors.length ? (
          <ul>
            {flow.errors.map((error, index) => (
              <li key={`${error.source.path}-${index}`}>
                <span>{redactTrace(error.label, locale)}</span>
                <button
                  className="model-source-link"
                  type="button"
                  onClick={() => props.onOpenSource(error.source.path, error.source.line)}
                >
                  {error.source.path}
                  {error.source.line ? `:${error.source.line}` : ''} ↗
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            {t(
              'Aucune branche d’erreur identifiée par cet extracteur. Cela ne prouve pas que le parcours gère les erreurs.',
              'No error branch identified by this extractor. This does not prove that the flow handles errors.',
            )}
          </p>
        )}
      </details>
      <details className="model-limits" open>
        <summary>{t('Limites du parcours', 'Flow limitations')}</summary>
        <ul>
          {flow.limits.map((limit, index) => (
            <li key={index}>{limit}</li>
          ))}
          <li>
            {t(
              'L’ordre des dépendances n’établit pas à lui seul une chronologie d’exécution.',
              'Dependency order alone does not establish an execution timeline.',
            )}
          </li>
        </ul>
      </details>
      <button
        type="button"
        onClick={() => props.onShowChecks(byId.get(flow.entryId)?.sources[0]?.path)}
      >
        {t('Voir les vérifications liées à l’entrée', 'View checks linked to this entry')}
      </button>
    </>
  );
}

export function FlowView(props: ModelViewProps) {
  const { t } = useI18n();
  const [chosenId, setChosenId] = useState('');
  const [query, setQuery] = useState('');
  const flows = props.model.analysis.flows;
  const matches = flows.filter((flow) =>
    `${flow.title} ${flow.entryId}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')),
  );
  const selected =
    matches.find((flow) => flow.id === chosenId) ??
    matches.find((flow) => flow.elementIds.includes(props.selectedId ?? '')) ??
    matches[0];
  return (
    <section
      className="flow-view"
      aria-label={t('Parcours des données du projet', 'Project data flows')}
    >
      <div className="arch-toolbar">
        <label className="arch-search">
          <span className="sr-only">
            {t('Rechercher un scénario ou endpoint', 'Search for a scenario or endpoint')}
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            name="flow-search"
            autoComplete="off"
            placeholder={t('Scénario, entrée, endpoint…', 'Scenario, entry, endpoint…')}
          />
        </label>
        <label className="flow-select">
          {t('Parcours', 'Flows')}{' '}
          <select
            value={selected?.id ?? ''}
            onChange={(event) => setChosenId(event.target.value)}
            disabled={!matches.length}
          >
            {matches.length ? (
              matches.slice(0, 150).map((flow) => (
                <option key={flow.id} value={flow.id}>
                  {flow.title}
                </option>
              ))
            ) : (
              <option value="">{t('Aucun parcours disponible', 'No flow available')}</option>
            )}
          </select>
        </label>
        <span className="arch-count">
          {matches.length} {t('parcours', 'flows')}
        </span>
      </div>
      {matches.length > 150 ? (
        <p className="arch-note">
          {t(
            'Sélecteur limité à 150 parcours. Utilisez la recherche.',
            'Selector limited to 150 flows. Use search.',
          )}
        </p>
      ) : null}
      {selected ? (
        <FlowDetails flow={selected} props={props} />
      ) : (
        <div className="arch-empty">
          <h3>{t('Aucun parcours résolu', 'No resolved flow')}</h3>
          <p>
            {flows.length
              ? t('Aucun scénario ne correspond à la recherche.', 'No scenario matches the search.')
              : t(
                  'Aucune entrée ou chaîne de dépendances exploitable n’a été identifiée dans ces sources. Aucun scénario d’exécution n’est inventé.',
                  'No usable entry or dependency chain was identified in these sources. No execution scenario is invented.',
                )}
          </p>
        </div>
      )}
    </section>
  );
}
