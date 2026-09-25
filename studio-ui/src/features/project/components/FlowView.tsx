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
  if (!element)
    return (
      <li className="flow-step flow-unresolved">
        <span className="flow-number" aria-hidden="true">
          ?
        </span>
        <div>
          <h4>Chaînon non résolu</h4>
          <p>
            L’élément {id} n’est pas présent dans cette analyse. Le parcours n’est pas complété
            arbitrairement.
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
          <span>{ELEMENT_LABELS[element.type]}</span>
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
          <small>Aucune source reliée.</small>
        )}
        {relations.length ? (
          <ul className="flow-connections">
            {relations.map((relation) => (
              <li key={relation.id}>
                <button type="button" onClick={() => onSelect(relation.id)}>
                  {RELATION_LABELS[relation.kind]} · {relation.label}
                </button>
                <small>{relation.provenance.map((item) => item.method).join(' · ')}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="arch-note">Aucune connexion sortante résolue dans ce périmètre.</p>
        )}
      </div>
    </li>
  );
}

function ObservedTrace({ flow, revisionId }: { flow: ProjectFlow; revisionId: string }) {
  if (flow.kind !== 'observed')
    return (
      <p className="arch-note">
        Flux déduit du code. Aucun temps de réponse ni succès à l’exécution ne peut être conclu de
        ce parcours.
      </p>
    );
  if (!flow.trace)
    return (
      <p className="arch-note">
        Flux marqué observé, mais trace absente. Observation non vérifiable dans cet écran.
      </p>
    );
  return (
    <details className="flow-trace" open>
      <summary>
        Trace observée · version {flow.trace.revisionId.slice(0, 8)} · {flow.trace.environment}
      </summary>
      {flow.trace.revisionId !== revisionId ? (
        <p className="arch-note">
          Trace d’une autre version : elle n’établit pas le comportement de la version affichée.
        </p>
      ) : null}
      <p>
        {flow.trace.durationMs === undefined
          ? 'Durée totale indisponible.'
          : `Durée mesurée : ${new Intl.NumberFormat('fr-FR').format(flow.trace.durationMs)} ms.`}
      </p>
      <ol>
        {flow.trace.events.slice(0, 100).map((event, index) => (
          <li key={`${index}-${event.at ?? ''}`}>
            <strong>{redactTrace(event.label)}</strong>
            {event.at ? <time>{new Date(event.at).toLocaleString('fr-FR')}</time> : null}
            {event.durationMs === undefined ? null : (
              <span>{new Intl.NumberFormat('fr-FR').format(event.durationMs)} ms</span>
            )}
            {event.error ? <p className="flow-error">{redactTrace(event.error)}</p> : null}
          </li>
        ))}
      </ol>
      {flow.trace.events.length > 100 ? <p>Affichage limité aux 100 premiers événements.</p> : null}
      <small>
        Masquage complémentaire des jetons et adresses reconnaissables. Les traces doivent être
        expurgées à la collecte ; cette vue n’est pas un filtre exhaustif.
      </small>
    </details>
  );
}

function FlowDetails({ flow, props }: { flow: ProjectFlow; props: ModelViewProps }) {
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
              ? 'Parcours déduit des liens du code'
              : 'Parcours avec trace observée'}
          </p>
        </div>
        <span className={`model-kind ${flow.kind === 'observed' ? 'observed' : ''}`}>
          {flow.kind === 'code' ? 'Analyse statique' : 'Observation enregistrée'}
        </span>
      </div>
      <ObservedTrace flow={flow} revisionId={analysis.revisionId} />
      <p className="flow-scope">
        Éléments et dépendances associés à l’entrée, sans ordre d’exécution déduit. D’autres routes
        du même fichier peuvent figurer dans ce périmètre.
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
          Parcours limité aux 80 premiers éléments. Réduisez le périmètre d’analyse.
        </p>
      ) : null}
      {missingRelations.length ? (
        <p className="arch-note">
          {missingRelations.length} connexion(s) de ce parcours ne sont plus résolues dans
          l’analyse.
        </p>
      ) : null}
      <details className="flow-errors" open>
        <summary>
          Branches d’erreur identifiées dans les sources associées · {flow.errors.length}
        </summary>
        {flow.errors.length ? (
          <ul>
            {flow.errors.map((error, index) => (
              <li key={`${error.source.path}-${index}`}>
                <span>{redactTrace(error.label)}</span>
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
            Aucune branche d’erreur identifiée par cet extracteur. Cela ne prouve pas que le
            parcours gère les erreurs.
          </p>
        )}
      </details>
      <details className="model-limits" open>
        <summary>Limites du parcours</summary>
        <ul>
          {flow.limits.map((limit, index) => (
            <li key={index}>{limit}</li>
          ))}
          <li>L’ordre des dépendances n’établit pas à lui seul une chronologie d’exécution.</li>
        </ul>
      </details>
      <button
        type="button"
        onClick={() => props.onShowChecks(byId.get(flow.entryId)?.sources[0]?.path)}
      >
        Voir les vérifications liées à l’entrée
      </button>
    </>
  );
}

export function FlowView(props: ModelViewProps) {
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
    <section className="flow-view" aria-label="Parcours des données du projet">
      <div className="arch-toolbar">
        <label className="arch-search">
          <span className="sr-only">Rechercher un scénario ou endpoint</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            name="flow-search"
            autoComplete="off"
            placeholder="Scénario, entrée, endpoint…"
          />
        </label>
        <label className="flow-select">
          Parcours{' '}
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
              <option value="">Aucun parcours disponible</option>
            )}
          </select>
        </label>
        <span className="arch-count">{matches.length} parcours</span>
      </div>
      {matches.length > 150 ? (
        <p className="arch-note">Sélecteur limité à 150 parcours. Utilisez la recherche.</p>
      ) : null}
      {selected ? (
        <FlowDetails flow={selected} props={props} />
      ) : (
        <div className="arch-empty">
          <h3>Aucun parcours résolu</h3>
          <p>
            {flows.length
              ? 'Aucun scénario ne correspond à la recherche.'
              : 'Aucune entrée ou chaîne de dépendances exploitable n’a été identifiée dans ces sources. Aucun scénario d’exécution n’est inventé.'}
          </p>
        </div>
      )}
    </section>
  );
}
