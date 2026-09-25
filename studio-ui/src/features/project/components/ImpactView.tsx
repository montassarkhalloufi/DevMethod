import { useState } from 'react';
import type { ModelViewProps, ProjectChange, ProjectElement } from '../model/contracts';
import './architecture.css';

const CHANGE_LABELS = { added: 'Ajouté', modified: 'Modifié', removed: 'Supprimé' };

function ElementReferences({
  title,
  ids,
  elements,
  onSelect,
  note,
}: {
  title: string;
  ids: string[];
  elements: Map<string, ProjectElement>;
  onSelect: ModelViewProps['onSelect'];
  note: string;
}) {
  return (
    <div className="impact-reference">
      <h4>
        {title} <span>{ids.length}</span>
      </h4>
      <p>{note}</p>
      {ids.length ? (
        <ul>
          {ids.slice(0, 40).map((id) => {
            const element = elements.get(id);
            return (
              <li key={id}>
                {element ? (
                  <button type="button" onClick={() => onSelect(id)}>
                    {element.label}
                  </button>
                ) : (
                  <span>Élément non résolu : {id}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <small>Aucune association détectée.</small>
      )}
      {ids.length > 40 ? <small>Affichage limité aux 40 premières associations.</small> : null}
    </div>
  );
}

function ChangeDetails({
  change,
  props,
  elements,
}: {
  change: ProjectChange;
  props: ModelViewProps;
  elements: Map<string, ProjectElement>;
}) {
  const contractsChanged = change.contractIds.filter((id) => change.elementIds.includes(id));
  const tests = change.testIds
    .map((id) => elements.get(id))
    .filter((item): item is ProjectElement => Boolean(item));
  return (
    <div className="impact-detail">
      <div className="impact-columns">
        <ElementReferences
          title="Éléments modifiés"
          ids={change.elementIds}
          elements={elements}
          onSelect={props.onSelect}
          note="Associés au fichier effectivement modifié."
        />
        <ElementReferences
          title="Dépendances directes"
          ids={change.dependencyIds}
          elements={elements}
          onSelect={props.onSelect}
          note="Relations établies par l’analyse ; elles ne prouvent pas une régression."
        />
        <ElementReferences
          title="Consommateurs potentiels"
          ids={change.consumerIds}
          elements={elements}
          onSelect={props.onSelect}
          note="À réexaminer. L’effet réel nécessite un contrôle de comportement."
        />
        <ElementReferences
          title="Contrats à réexaminer"
          ids={change.contractIds}
          elements={elements}
          onSelect={props.onSelect}
          note={`${contractsChanged.length} contrat(s) directement rattaché(s) aux éléments modifiés. Aucun changement de schéma non extrait n’est déduit.`}
        />
      </div>
      <div className="impact-reference">
        <h4>
          Tests associés <span>{tests.length}</span>
        </h4>
        {tests.length ? (
          <ul>
            {tests.slice(0, 40).map((test) => (
              <li key={test.id}>
                <button type="button" onClick={() => props.onSelect(test.id)}>
                  {test.label}
                </button>
                <small>
                  Association :{' '}
                  {test.provenance.map((item) => `${item.kind} · ${item.method}`).join(' ; ') ||
                    'méthode non renseignée'}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Aucun test associé par l’analyse. Cette absence ne constitue pas une couverture
            suffisante.
          </p>
        )}
      </div>
      <div className="impact-actions">
        {change.kind !== 'removed' ? (
          <button type="button" onClick={() => props.onOpenSource(change.path)}>
            Ouvrir le fichier actuel
          </button>
        ) : (
          <span>Fichier supprimé de la version actuelle.</span>
        )}
        <button type="button" onClick={() => props.onShowChecks(change.path)}>
          Examiner les vérifications
        </button>
      </div>
    </div>
  );
}

export function ImpactView(props: ModelViewProps) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const { impact, analysis, previous } = props.model;
  const elements = new Map(
    [...(previous?.elements ?? []), ...analysis.elements].map((element) => [element.id, element]),
  );
  if (impact.revisionId !== analysis.revisionId)
    return (
      <section className="impact-view">
        <h3>Comparaison obsolète</h3>
        <p>
          Cette analyse d’impact appartient à une autre version. Actualisez le modèle avant de la
          rapprocher des sources affichées.
        </p>
      </section>
    );
  const changes = impact.changes.filter(
    (change) =>
      (kind === 'all' || change.kind === kind) &&
      change.path.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')),
  );
  const counts = {
    added: changes.filter((change) => change.kind === 'added').length,
    modified: changes.filter((change) => change.kind === 'modified').length,
    removed: changes.filter((change) => change.kind === 'removed').length,
  };
  return (
    <section className="impact-view" aria-label="Impact des modifications">
      <div className="model-heading">
        <div>
          <h3>Comprendre ce que le changement touche</h3>
          <p>
            {impact.baseRevisionId
              ? `${impact.baseRevisionId.slice(0, 8)} → ${impact.revisionId.slice(0, 8)}`
              : 'Aucune version de référence disponible'}
            {analysis.localChanges ? ' · modifications locales analysées' : ''}
          </p>
        </div>
        <span className="model-kind">Analyse statique</span>
      </div>
      <div className="arch-toolbar">
        <label className="arch-search">
          <span className="sr-only">Filtrer les fichiers modifiés</span>
          <input
            name="impact-search"
            autoComplete="off"
            placeholder="Rechercher un fichier…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          Modification{' '}
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="all">Toutes</option>
            {Object.entries(CHANGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="impact-counts" aria-live="polite">
        <span>
          <strong>{counts.added}</strong> ajout(s)
        </span>
        <span>
          <strong>{counts.modified}</strong> modification(s)
        </span>
        <span>
          <strong>{counts.removed}</strong> suppression(s)
        </span>
        <span>
          <strong>{impact.staleCheckIds.length}</strong> preuve(s) à réexaminer sur l’ensemble du
          changement
        </span>
      </div>
      {!impact.baseRevisionId ? (
        <p className="arch-note">
          Sans référence antérieure, l’absence de différence ne prouve pas la stabilité du projet.
        </p>
      ) : null}
      <div className="impact-changes">
        {changes.length ? (
          changes.slice(0, 100).map((change) => (
            <details
              key={change.path}
              open={expanded === change.path}
              onToggle={(event) => {
                if (event.currentTarget.open) setExpanded(change.path);
                else if (expanded === change.path) setExpanded(null);
              }}
            >
              <summary>
                <span className={`impact-change-kind ${change.kind}`}>
                  {CHANGE_LABELS[change.kind]}
                </span>
                <code>{change.path}</code>
                <span>{change.consumerIds.length} consommateur(s) potentiel(s)</span>
              </summary>
              <ChangeDetails change={change} props={props} elements={elements} />
            </details>
          ))
        ) : (
          <div className="arch-empty">
            <h3>Aucune modification dans ce périmètre</h3>
            <p>
              Une absence de différence ou de dépendance détectée ne garantit pas une absence
              d’impact.
            </p>
          </div>
        )}
      </div>
      {changes.length > 100 ? (
        <p className="arch-note">
          100 fichiers affichés sur {changes.length}. Réduisez le périmètre avec la recherche.
        </p>
      ) : null}
      <details className="model-limits">
        <summary>Preuves à réexaminer · {impact.staleCheckIds.length}</summary>
        {impact.staleCheckIds.length ? (
          <>
            <ul>
              {impact.staleCheckIds.slice(0, 100).map((id) => (
                <li key={id}>
                  <code>{id}</code>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => props.onShowChecks()}>
              Ouvrir les preuves et leur version
            </button>
          </>
        ) : (
          <p>
            Aucune preuve marquée par cette comparaison. Cela ne signifie pas que tous les
            comportements ont été contrôlés.
          </p>
        )}
      </details>
      <details className="model-limits" open>
        <summary>Impact inconnu et limites</summary>
        <ul>
          {impact.limits.map((limit, index) => (
            <li key={index}>{limit}</li>
          ))}
          <li>Les appels dynamiques et consommateurs externes non résolus restent inconnus.</li>
          <li>
            Les contrats et schémas ne sont analysés que lorsqu’un extracteur fournit une
            association.
          </li>
        </ul>
      </details>
    </section>
  );
}
