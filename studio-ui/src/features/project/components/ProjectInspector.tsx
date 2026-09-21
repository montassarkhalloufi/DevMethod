import { useI18n } from '../../../i18n';
import { translate } from '../../../i18n';
import type {
  ProjectAnalysis,
  ProjectCallbacks,
  ProjectElement,
  ProjectRelation,
  Provenance,
  SourceRef,
} from '../model/contracts';
import { ProjectIcon } from './ProjectIcon';
const detailNames = (locale: 'en' | 'fr' = 'en'): Record<string, string> => ({
  feature: translate('Fonctionnalité', 'Feature', undefined, locale),
  role: translate('Rôle', 'Role', undefined, locale),
  language: translate('Langage', 'Language', undefined, locale),
  symbols: translate('Fonctions et paramètres', 'Functions and parameters', undefined, locale),
  interactions: translate('Interactions', 'Interactions', undefined, locale),
  method: translate('Méthode', 'Method', undefined, locale),
  route: translate('Route', 'Route', undefined, locale),
  path: translate('Chemin', 'Path', undefined, locale),
  framework: translate('Framework', 'Framework', undefined, locale),
  resource: translate('Ressource', 'Resource', undefined, locale),
});
const provenanceNames = (locale: 'en' | 'fr' = 'en') => ({
  detected: translate('Détecté dans le code', 'Detected in code', undefined, locale),
  declared: translate('Déclaré', 'Declared', undefined, locale),
  observed: translate('Observé en exécution', 'Observed at runtime', undefined, locale),
  inferred: translate('Supposé', 'Assumed', undefined, locale),
});
function Sources({
  sources,
  onOpenSource,
}: {
  sources: SourceRef[];
  onOpenSource: ProjectCallbacks['onOpenSource'];
}) {
  return (
    <div className="inspector-sources">
      {sources.map((source, index) => (
        <button key={source.path + index} onClick={() => onOpenSource(source.path, source.line)}>
          <ProjectIcon />
          {source.path}
          {source.line ? ':' + source.line : ''}
        </button>
      ))}
    </div>
  );
}
function ProvenanceList({
  entries,
  onOpenSource,
}: {
  entries: Provenance[];
  onOpenSource: ProjectCallbacks['onOpenSource'];
}) {
  const { locale } = useI18n();
  return (
    <>
      {entries.map((entry, index) => (
        <div className="inspector-provenance" key={index}>
          <span className={'provenance-tag provenance-' + entry.kind}>
            {provenanceNames(locale)[entry.kind]}
          </span>
          <p>{entry.method}</p>
          <Sources sources={entry.sources} onOpenSource={onOpenSource} />
          {entry.limitation && <p className="project-caution">{entry.limitation}</p>}
        </div>
      ))}
    </>
  );
}
interface Props extends ProjectCallbacks {
  analysis: ProjectAnalysis;
  selectedId: string | null;
  selectedPath: string | null;
  onSelect(id: string): void;
  onClose(): void;
  onView(view: 'flows' | 'impact'): void;
}
function inspection(
  analysis: ProjectAnalysis,
  selectedId: string | null,
  selectedPath: string | null,
) {
  const relation = analysis.relations.find((item) => item.id === selectedId);
  const element =
    analysis.elements.find((item) => item.id === selectedId) ||
    (!selectedId
      ? analysis.elements.find((item) =>
          item.sources.some((source) => source.path === selectedPath),
        )
      : undefined);
  const file = selectedId ? undefined : analysis.files.find((item) => item.path === selectedPath);
  const selectedSources = element?.sources || (file ? [{ path: file.path }] : []);
  const connected = element
    ? analysis.relations.filter((item) => item.source === element.id || item.target === element.id)
    : [];
  const relatedIds = new Set(connected.flatMap((item) => [item.source, item.target]));
  const contracts = analysis.elements.filter(
    (item) => item.type === 'contract' && relatedIds.has(item.id),
  );
  const tests = analysis.elements.filter((item) => item.type === 'test' && relatedIds.has(item.id));
  return { relation, element, file, selectedSources, connected, contracts, tests };
}
function MissingInspection({ revisionId, onClose }: { revisionId: string; onClose(): void }) {
  const { t } = useI18n();
  return (
    <aside
      className="project-inspector"
      aria-label={t('Inspection du projet', 'Project inspection')}
    >
      <div className="inspector-heading">
        <ProjectIcon />
        <h3>{t('Élément absent de cette version', 'Element absent from this version')}</h3>
        <button
          onClick={onClose}
          aria-label={t('Fermer l’inspecteur', 'Close inspector')}
          title={t('Fermer l’inspecteur', 'Close inspector')}
        >
          ×
        </button>
      </div>
      <p>
        {t(
          'L’élément ou la connexion sélectionné n’existe pas dans l’analyse de la version',
          'The selected element or connection is absent from the analysis of version',
        )}{' '}
        {revisionId.slice(0, 8)}
        {t(
          '. Il peut avoir été supprimé ou ne plus être résolu.',
          '. It may have been removed or may no longer resolve.',
        )}
      </p>
      <p>
        {t(
          'Aucun autre fichier n’est substitué à cette sélection. Consultez la version précédente depuis l’historique pour retrouver ses sources.',
          'No other file is substituted for this selection. Use history to inspect the previous version and its sources.',
        )}
      </p>
    </aside>
  );
}
function missingSelection(
  id: string | null,
  element: ProjectElement | undefined,
  relation: ProjectRelation | undefined,
) {
  return Boolean(id && !element && !relation);
}
export function ProjectInspector({
  analysis,
  selectedId,
  selectedPath,
  onSelect,
  onClose,
  onView,
  onOpenSource,
  onShowChecks,
}: Props) {
  const { t, locale } = useI18n();
  const { relation, element, file, selectedSources, connected, contracts, tests } = inspection(
    analysis,
    selectedId,
    selectedPath,
  );
  if (missingSelection(selectedId, element, relation))
    return <MissingInspection revisionId={analysis.revisionId} onClose={onClose} />;
  const selectRelated = (item: ProjectElement) => (
    <button key={item.id} onClick={() => onSelect(item.id)}>
      {item.label}
    </button>
  );
  return (
    <aside
      className="project-inspector"
      aria-label={t('Inspection du projet', 'Project inspection')}
    >
      <div className="inspector-heading">
        <ProjectIcon name={relation ? 'graph' : 'file'} />
        <h3>{relation?.label || element?.label || file?.path.split('/').at(-1) || 'Inspection'}</h3>
        <button
          onClick={onClose}
          aria-label={t('Fermer l’inspecteur', 'Close inspector')}
          title={t('Fermer l’inspecteur', 'Close inspector')}
        >
          ×
        </button>
      </div>
      <p>
        {element?.details.role ||
          element?.description ||
          file?.role ||
          t(
            'Sélectionnez un fichier, un élément ou une connexion.',
            'Select a file, element or connection.',
          )}
      </p>
      {relation ? (
        <Connection
          relation={relation}
          analysis={analysis}
          onSelect={onSelect}
          onOpenSource={onOpenSource}
        />
      ) : (
        <>
          <h4>{t('Fichier source', 'Source file')}</h4>
          <Sources sources={selectedSources} onOpenSource={onOpenSource} />
          {element && (
            <>
              <details>
                <summary>
                  {t(
                    'Fonctions, interactions et métadonnées',
                    'Functions, interactions and metadata',
                  )}
                </summary>
                {Object.keys(element.details).length ? (
                  <dl>
                    {Object.entries(element.details)
                      .filter(([name]) => name !== 'sha256')
                      .map(([name, value]) => (
                        <div key={name}>
                          <dt>{detailNames(locale)[name] || name}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                  </dl>
                ) : (
                  <p>
                    {t(
                      'Entrées et sorties non résolues par cet extracteur.',
                      'Inputs and outputs not resolved by this extractor.',
                    )}
                  </p>
                )}
              </details>
              <h4>{t('Connexions et dépendances', 'Connections and dependencies')}</h4>
              {connected.length ? (
                <div className="inspector-connections">
                  {connected.map((item) => (
                    <button key={item.id} onClick={() => onSelect(item.id)}>
                      <span>{item.kind}</span> {item.source === element.id ? '→ ' : '← '}
                      {analysis.elements.find(
                        (node) =>
                          node.id === (item.source === element.id ? item.target : item.source),
                      )?.label || item.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p>
                  {t(
                    'Aucune connexion résolue ; cela ne prouve pas l’absence de dépendance.',
                    'No resolved connection; this does not prove there are no dependencies.',
                  )}
                </p>
              )}
            </>
          )}
          <div className="inspector-actions">
            <button onClick={() => onView('flows')}>
              <ProjectIcon name="graph" />
              {t('Voir le flux', 'View flow')} <span>→</span>
            </button>
            <button onClick={() => onView('impact')}>
              <ProjectIcon name="code" />
              {t('Voir l’impact', 'View impact')} <span>→</span>
            </button>
          </div>
          <details>
            <summary>
              {t('Contrats associés ·', 'Related contracts ·')} {contracts.length}
            </summary>
            {contracts.length ? (
              contracts.map(selectRelated)
            ) : (
              <p>
                {t(
                  'Aucun contrat directement lié détecté.',
                  'No directly linked contract detected.',
                )}
              </p>
            )}
          </details>
          <details open>
            <summary>
              {t('Tests associés ·', 'Related tests ·')} {tests.length}
            </summary>
            {tests.length ? (
              <>
                <p>
                  {t(
                    'Association par une relation d’import ou de test détectée ; aucun succès déduit.',
                    'Association through a detected import or test relationship; no success inferred.',
                  )}
                </p>
                {tests.map(selectRelated)}
              </>
            ) : (
              <p>{t('Aucune association directe détectée.', 'No direct association detected.')}</p>
            )}
            <button onClick={() => onShowChecks(selectedSources[0]?.path)}>
              {t('Consulter les vérifications →', 'Inspect checks →')}
            </button>
          </details>
          <details>
            <summary>{t('Provenance et fraîcheur', 'Provenance and freshness')}</summary>
            {element ? (
              <ProvenanceList entries={element.provenance} onOpenSource={onOpenSource} />
            ) : (
              <p>
                {t(
                  'Fichier présent dans le manifeste vérifié de cette version.',
                  'File present in the verified manifest for this version.',
                )}
              </p>
            )}
            <p>
              {t('Runtime :', 'Runtime:')} {runtimeLabel(element, locale)}
            </p>
            {element?.details.sha256 && (
              <p>
                {t('Empreinte du fichier :', 'File fingerprint:')}{' '}
                <code>{element.details.sha256}</code>
              </p>
            )}
            <p>
              Version {analysis.revisionId.slice(0, 8)}
              {analysis.localChanges ? t(' + brouillon local', ' + local draft') : ''}
              <br />
              {new Date(analysis.analyzedAt).toLocaleString(locale)}
            </p>
          </details>
        </>
      )}
    </aside>
  );
}
function Connection({
  relation,
  analysis,
  onSelect,
  onOpenSource,
}: {
  relation: ProjectRelation;
  analysis: ProjectAnalysis;
  onSelect(id: string): void;
  onOpenSource: ProjectCallbacks['onOpenSource'];
}) {
  const { t } = useI18n();
  return (
    <>
      <p className="provenance-tag">
        {t('Relation ·', 'Relationship ·')} {relation.kind}
      </p>
      <div className="inspector-connections">
        {[relation.source, relation.target].map((id, index) => (
          <button key={id + index} onClick={() => onSelect(id)}>
            {index ? t('Vers : ', 'To: ') : t('Depuis : ', 'From: ')}
            {analysis.elements.find((item) => item.id === id)?.label || id}
          </button>
        ))}
      </div>
      <h4>Provenance</h4>
      <ProvenanceList entries={relation.provenance} onOpenSource={onOpenSource} />
      <p className="project-caution">
        {t(
          'Une connexion dans le code ne prouve pas son bon fonctionnement en exécution.',
          'A code connection does not prove it works at runtime.',
        )}
      </p>
    </>
  );
}

function runtimeLabel(element: ProjectElement | undefined, locale: 'en' | 'fr' = 'en'): string {
  return element?.runtime === 'observed'
    ? translate(
        'observation disponible, voir la preuve',
        'observation available, see evidence',
        undefined,
        locale,
      )
    : translate('non observé', 'not observed', undefined, locale);
}
