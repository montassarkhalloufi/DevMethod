// Choices are derived from the prototype being used, never from another lane.
export function controlChoices(project, lanes, variantId) {
  const variants = variantId
    ? project.variants.filter((variant) => variant.id === variantId)
    : project.variants;
  const actions = [
    ...new Map(
      variants.flatMap((variant) => variant.actions).map((action) => [action.id, action]),
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
    transitions: actions.filter((action) => action.kind === 'transition'),
    creations: actions.filter((action) => action.kind === 'create'),
  };
}

export function hasIndividualTrials(session) {
  return Object.values(session.lanes).some(
    (lane) => lane.events.length !== session.situation.length,
  );
}
