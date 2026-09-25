import type {
  ProjectAnalysis,
  ProjectCallbacks,
  ProjectElement,
  ProjectRelation,
  Provenance,
  SourceRef,
} from '../model/contracts';
import { ProjectIcon } from './ProjectIcon';
const detailNames: Record<string, string> = {
  feature: 'Fonctionnalité',
  role: 'Rôle',
  language: 'Langage',
  symbols: 'Fonctions et paramètres',
  interactions: 'Interactions',
  method: 'Méthode',
  route: 'Route',
  path: 'Chemin',
  framework: 'Framework',
  resource: 'Ressource',
};
const provenanceNames = {
  detected: 'Détecté dans le code',
  declared: 'Déclaré',
  observed: 'Observé en exécution',
  inferred: 'Supposé',
};
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
  return (
    <>
      {entries.map((entry, index) => (
        <div className="inspector-provenance" key={index}>
          <span className={'provenance-tag provenance-' + entry.kind}>
            {provenanceNames[entry.kind]}
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
  return (
    <aside className="project-inspector" aria-label="Inspection du projet">
      <div className="inspector-heading">
        <ProjectIcon />
        <h3>Élément absent de cette version</h3>
        <button onClick={onClose} aria-label="Fermer l’inspecteur" title="Fermer l’inspecteur">
          ×
        </button>
      </div>
      <p>
        L’élément ou la connexion sélectionné n’existe pas dans l’analyse de la version{' '}
        {revisionId.slice(0, 8)}. Il peut avoir été supprimé ou ne plus être résolu.
      </p>
      <p>
        Aucun autre fichier n’est substitué à cette sélection. Consultez la version précédente
        depuis l’historique pour retrouver ses sources.
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
    <aside className="project-inspector" aria-label="Inspection du projet">
      <div className="inspector-heading">
        <ProjectIcon name={relation ? 'graph' : 'file'} />
        <h3>{relation?.label || element?.label || file?.path.split('/').at(-1) || 'Inspection'}</h3>
        <button onClick={onClose} aria-label="Fermer l’inspecteur" title="Fermer l’inspecteur">
          ×
        </button>
      </div>
      <p>
        {element?.details.role ||
          element?.description ||
          file?.role ||
          'Sélectionnez un fichier, un élément ou une connexion.'}
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
          <h4>Fichier source</h4>
          <Sources sources={selectedSources} onOpenSource={onOpenSource} />
          {element && (
            <>
              <details>
                <summary>Fonctions, interactions et métadonnées</summary>
                {Object.keys(element.details).length ? (
                  <dl>
                    {Object.entries(element.details)
                      .filter(([name]) => name !== 'sha256')
                      .map(([name, value]) => (
                        <div key={name}>
                          <dt>{detailNames[name] || name}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                  </dl>
                ) : (
                  <p>Entrées et sorties non résolues par cet extracteur.</p>
                )}
              </details>
              <h4>Connexions et dépendances</h4>
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
                <p>Aucune connexion résolue ; cela ne prouve pas l’absence de dépendance.</p>
              )}
            </>
          )}
          <div className="inspector-actions">
            <button onClick={() => onView('flows')}>
              <ProjectIcon name="graph" />
              Voir le flux <span>→</span>
            </button>
            <button onClick={() => onView('impact')}>
              <ProjectIcon name="code" />
              Voir l’impact <span>→</span>
            </button>
          </div>
          <details>
            <summary>Contrats associés · {contracts.length}</summary>
            {contracts.length ? (
              contracts.map(selectRelated)
            ) : (
              <p>Aucun contrat directement lié détecté.</p>
            )}
          </details>
          <details open>
            <summary>Tests associés · {tests.length}</summary>
            {tests.length ? (
              <>
                <p>
                  Association par une relation d’import ou de test détectée ; aucun succès déduit.
                </p>
                {tests.map(selectRelated)}
              </>
            ) : (
              <p>Aucune association directe détectée.</p>
            )}
            <button onClick={() => onShowChecks(selectedSources[0]?.path)}>
              Consulter les vérifications →
            </button>
          </details>
          <details>
            <summary>Provenance et fraîcheur</summary>
            {element ? (
              <ProvenanceList entries={element.provenance} onOpenSource={onOpenSource} />
            ) : (
              <p>Fichier présent dans le manifeste vérifié de cette version.</p>
            )}
            <p>Runtime : {runtimeLabel(element)}</p>
            {element?.details.sha256 && (
              <p>
                Empreinte du fichier : <code>{element.details.sha256}</code>
              </p>
            )}
            <p>
              Version {analysis.revisionId.slice(0, 8)}
              {analysis.localChanges ? ' + brouillon local' : ''}
              <br />
              {new Date(analysis.analyzedAt).toLocaleString('fr-FR')}
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
  return (
    <>
      <p className="provenance-tag">Relation · {relation.kind}</p>
      <div className="inspector-connections">
        {[relation.source, relation.target].map((id, index) => (
          <button key={id + index} onClick={() => onSelect(id)}>
            {index ? 'Vers : ' : 'Depuis : '}
            {analysis.elements.find((item) => item.id === id)?.label || id}
          </button>
        ))}
      </div>
      <h4>Provenance</h4>
      <ProvenanceList entries={relation.provenance} onOpenSource={onOpenSource} />
      <p className="project-caution">
        Une connexion dans le code ne prouve pas son bon fonctionnement en exécution.
      </p>
    </>
  );
}

function runtimeLabel(element: ProjectElement | undefined): string {
  return element?.runtime === 'observed' ? 'observation disponible, voir la preuve' : 'non observé';
}
