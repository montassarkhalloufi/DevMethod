const unique = (items) => [...new Set(items)];

function affectedElements(analyses, path) {
  return unique(
    analyses.flatMap((analysis) =>
      analysis.elements
        .filter((element) => element.sources.some((source) => source.path === path))
        .map((element) => element.id),
    ),
  );
}

function changeFor(path, kind, current, previous) {
  const analyses = [current, previous],
    elements = analyses.flatMap((analysis) => analysis.elements),
    relations = analyses.flatMap((analysis) => analysis.relations);
  const elementIds = affectedElements(analyses, path),
    ids = new Set(elementIds);
  const dependencyIds = unique(
    relations.filter((edge) => ids.has(edge.source)).map((edge) => edge.target),
  );
  const consumerIds = unique(
    relations
      .filter((edge) => ids.has(edge.target) && ['import', 'http', 'tests'].includes(edge.kind))
      .map((edge) => edge.source),
  );
  const related = new Set([...elementIds, ...dependencyIds, ...consumerIds]);
  return {
    path,
    kind,
    elementIds,
    dependencyIds,
    consumerIds,
    contractIds: unique(
      elements
        .filter((element) => element.type === 'contract' && related.has(element.id))
        .map((element) => element.id),
    ),
    testIds: unique(
      elements
        .filter((element) => element.type === 'test' && related.has(element.id))
        .map((element) => element.id),
    ),
  };
}

export function projectImpact(current, previous, checks = []) {
  const changes = [];
  if (previous) {
    const oldFiles = new Map(previous.files.map((file) => [file.path, file]));
    for (const file of current.files) {
      const old = oldFiles.get(file.path);
      if (!old || old.sha256 !== file.sha256)
        changes.push(changeFor(file.path, old ? 'modified' : 'added', current, previous));
      oldFiles.delete(file.path);
    }
    for (const file of oldFiles.values())
      changes.push(changeFor(file.path, 'removed', current, previous));
  }
  return {
    baseRevisionId: previous?.revisionId || null,
    revisionId: current.revisionId,
    changes: changes.sort((a, b) => a.path.localeCompare(b.path)),
    staleCheckIds: changes.length
      ? checks.filter((check) => check.revisionId === previous.revisionId).map((check) => check.id)
      : [],
    limits: [
      'Impact direct par imports, routes et déclarations ; absence de lien ne garantit pas absence d’impact.',
      'Tests associés par import explicite uniquement ; aucune exécution ni couverture déduite.',
      'Un renommage apparaît comme suppression + ajout. Les modifications non enregistrées dans l’éditeur sont exclues.',
      'Les contrôles de la base ne sont pas transférés à la nouvelle version ; leur périmètre exact doit être réévalué.',
      ...(previous ? [] : ['Aucune base fournie : comparaison non calculée.']),
    ],
  };
}
