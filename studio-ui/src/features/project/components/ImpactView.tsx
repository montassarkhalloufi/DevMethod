import { translate } from '../../../i18n';
import { useI18n } from '../../../i18n';
import { useState } from 'react';
import type { ModelViewProps, ProjectChange, ProjectElement } from '../model/contracts';
import './architecture.css';

const CHANGE_LABELS = (locale: 'en' | 'fr' = 'en') => ({
  added: translate('Ajouté', 'Added', undefined, locale),
  modified: translate('Modifié', 'Modified', undefined, locale),
  removed: translate('Supprimé', 'Removed', undefined, locale),
});

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
  const { t } = useI18n();
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
                  <span>
                    {t('Élément non résolu :', 'Unresolved element:')} {id}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <small>{t('Aucune association détectée.', 'No association detected.')}</small>
      )}
      {ids.length > 40 ? (
        <small>
          {t(
            'Affichage limité aux 40 premières associations.',
            'Display limited to the first 40 associations.',
          )}
        </small>
      ) : null}
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
  const { t } = useI18n();
  const contractsChanged = change.contractIds.filter((id) => change.elementIds.includes(id));
  const tests = change.testIds
    .map((id) => elements.get(id))
    .filter((item): item is ProjectElement => Boolean(item));
  return (
    <div className="impact-detail">
      <div className="impact-columns">
        <ElementReferences
          title={t('Éléments modifiés', 'Changed elements')}
          ids={change.elementIds}
          elements={elements}
          onSelect={props.onSelect}
          note={t(
            'Associés au fichier effectivement modifié.',
            'Associated with the file actually modified.',
          )}
        />
        <ElementReferences
          title={t('Dépendances directes', 'Direct dependencies')}
          ids={change.dependencyIds}
          elements={elements}
          onSelect={props.onSelect}
          note={t(
            'Relations établies par l’analyse ; elles ne prouvent pas une régression.',
            'Relationships established by analysis; they do not prove a regression.',
          )}
        />
        <ElementReferences
          title={t('Consommateurs potentiels', 'Potential consumers')}
          ids={change.consumerIds}
          elements={elements}
          onSelect={props.onSelect}
          note={t(
            'À réexaminer. L’effet réel nécessite un contrôle de comportement.',
            'To review. The actual effect requires a behavior check.',
          )}
        />
        <ElementReferences
          title={t('Contrats à réexaminer', 'Contracts to review')}
          ids={change.contractIds}
          elements={elements}
          onSelect={props.onSelect}
          note={t(
            '{count} contrat(s) directement rattaché(s) aux éléments modifiés. Aucun changement de schéma non extrait n’est déduit.',
            '{count} contract(s) directly linked to changed elements. No unextracted schema change is inferred.',
            { count: contractsChanged.length },
          )}
        />
      </div>
      <div className="impact-reference">
        <h4>
          {t('Tests associés', 'Related tests')} <span>{tests.length}</span>
        </h4>
        {tests.length ? (
          <ul>
            {tests.slice(0, 40).map((test) => (
              <li key={test.id}>
                <button type="button" onClick={() => props.onSelect(test.id)}>
                  {test.label}
                </button>
                <small>
                  {t('Association :', 'Association:')}{' '}
                  {test.provenance.map((item) => `${item.kind} · ${item.method}`).join(' ; ') ||
                    t('méthode non renseignée', 'method not provided')}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            {t(
              'Aucun test associé par l’analyse. Cette absence ne constitue pas une couverture suffisante.',
              'No test associated by analysis. This absence does not establish sufficient coverage.',
            )}
          </p>
        )}
      </div>
      <div className="impact-actions">
        {change.kind !== 'removed' ? (
          <button type="button" onClick={() => props.onOpenSource(change.path)}>
            {t('Ouvrir le fichier actuel', 'Open current file')}
          </button>
        ) : (
          <span>
            {t(
              'Fichier supprimé de la version actuelle.',
              'File removed from the current version.',
            )}
          </span>
        )}
        <button type="button" onClick={() => props.onShowChecks(change.path)}>
          {t('Examiner les vérifications', 'Inspect checks')}
        </button>
      </div>
    </div>
  );
}

export function ImpactView(props: ModelViewProps) {
  const { t, locale } = useI18n();
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
        <h3>{t('Comparaison obsolète', 'Outdated comparison')}</h3>
        <p>
          {t(
            'Cette analyse d’impact appartient à une autre version. Actualisez le modèle avant de la rapprocher des sources affichées.',
            'This impact analysis belongs to another version. Refresh the model before comparing it with the displayed sources.',
          )}
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
    <section className="impact-view" aria-label={t('Impact des modifications', 'Change impact')}>
      <div className="model-heading">
        <div>
          <h3>
            {t('Comprendre ce que le changement touche', 'Understand what the change affects')}
          </h3>
          <p>
            {impact.baseRevisionId
              ? `${impact.baseRevisionId.slice(0, 8)} → ${impact.revisionId.slice(0, 8)}`
              : t('Aucune version de référence disponible', 'No reference version available')}
            {analysis.localChanges
              ? t(' · modifications locales analysées', ' · local changes analyzed')
              : ''}
          </p>
        </div>
        <span className="model-kind">{t('Analyse statique', 'Static analysis')}</span>
      </div>
      <div className="arch-toolbar">
        <label className="arch-search">
          <span className="sr-only">
            {t('Filtrer les fichiers modifiés', 'Filter changed files')}
          </span>
          <input
            name="impact-search"
            autoComplete="off"
            placeholder={t('Rechercher un fichier…', 'Search for a file…')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          {t('Modification', 'Change')}{' '}
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="all">{t('Toutes', 'All')}</option>
            {Object.entries(CHANGE_LABELS(locale)).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="impact-counts" aria-live="polite">
        <span>
          <strong>{counts.added}</strong> {t('ajout(s)', 'addition(s)')}
        </span>
        <span>
          <strong>{counts.modified}</strong> {t('modification(s)', 'change(s)')}
        </span>
        <span>
          <strong>{counts.removed}</strong> {t('suppression(s)', 'removal(s)')}
        </span>
        <span>
          <strong>{impact.staleCheckIds.length}</strong>{' '}
          {t(
            'preuve(s) à réexaminer sur l’ensemble du changement',
            'piece(s) of evidence to review across the change',
          )}
        </span>
      </div>
      {!impact.baseRevisionId ? (
        <p className="arch-note">
          {t(
            'Sans référence antérieure, l’absence de différence ne prouve pas la stabilité du projet.',
            'Without an earlier reference, the absence of differences does not prove project stability.',
          )}
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
                  {CHANGE_LABELS(locale)[change.kind]}
                </span>
                <code>{change.path}</code>
                <span>
                  {change.consumerIds.length}{' '}
                  {t('consommateur(s) potentiel(s)', 'potential consumer(s)')}
                </span>
              </summary>
              <ChangeDetails change={change} props={props} elements={elements} />
            </details>
          ))
        ) : (
          <div className="arch-empty">
            <h3>{t('Aucune modification dans ce périmètre', 'No changes in this scope')}</h3>
            <p>
              {t(
                'Une absence de différence ou de dépendance détectée ne garantit pas une absence d’impact.',
                'No detected difference or dependency does not guarantee no impact.',
              )}
            </p>
          </div>
        )}
      </div>
      {changes.length > 100 ? (
        <p className="arch-note">
          {t('100 fichiers affichés sur', '100 files shown out of')} {changes.length}
          {t('. Réduisez le périmètre avec la recherche.', '. Narrow the scope using search.')}
        </p>
      ) : null}
      <details className="model-limits">
        <summary>
          {t('Preuves à réexaminer ·', 'Evidence to review ·')} {impact.staleCheckIds.length}
        </summary>
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
              {t('Ouvrir les preuves et leur version', 'Open evidence and its version')}
            </button>
          </>
        ) : (
          <p>
            {t(
              'Aucune preuve marquée par cette comparaison. Cela ne signifie pas que tous les comportements ont été contrôlés.',
              'No evidence flagged by this comparison. This does not mean all behavior was checked.',
            )}
          </p>
        )}
      </details>
      <details className="model-limits" open>
        <summary>{t('Impact inconnu et limites', 'Unknown impact and limitations')}</summary>
        <ul>
          {impact.limits.map((limit, index) => (
            <li key={index}>{limit}</li>
          ))}
          <li>
            {t(
              'Les appels dynamiques et consommateurs externes non résolus restent inconnus.',
              'Unresolved dynamic calls and external consumers remain unknown.',
            )}
          </li>
          <li>
            {t(
              'Les contrats et schémas ne sont analysés que lorsqu’un extracteur fournit une association.',
              'Contracts and schemas are analyzed only when an extractor provides an association.',
            )}
          </li>
        </ul>
      </details>
    </section>
  );
}
