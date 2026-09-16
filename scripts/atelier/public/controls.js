// Choices are derived from the prototype being used, never from another lane.
export function controlChoices(project, lanes, variantId) {
  const variants = variantId
    ? project.variants.filter((variant) => variant.id === variantId)
    : project.variants;
  const actions = variants.flatMap((variant) => variant.actions);
  const actionsOfKind = (kind) => [
    ...new Map(
      actions.filter((action) => action.kind === kind).map((action) => [action.id, action]),
    ).values(),
  ];
  const records = [
    ...new Map(
      Object.values(lanes)
        .flatMap((lane) => lane.records)
        .map((record) => [record.id, record]),
    ).values(),
  ];
  return {
    records,
    transitions: actionsOfKind('transition'),
    creations: actionsOfKind('create'),
  };
}

export function hasIndividualTrials(session) {
  return Object.values(session.lanes).some(
    (lane) => lane.events.length !== session.situation.length,
  );
}
