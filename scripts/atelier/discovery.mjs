import { findWitness } from '../discovery/search.mjs';
import { createSession, performAction } from './domain.mjs';

const NEW_TITLE = 'Élément fictif de découverte';

function freshId(records) {
  const ids = new Set(records.map((record) => record.id));
  let id = 'discovery-record';
  for (let suffix = 1; ids.has(id); suffix += 1) id = `discovery-record-${suffix}`;
  return id;
}

function recordValues(records) {
  return records.map(({ id, state, owner, title }) => ({ id, state, owner, title }));
}

function stateKey({ session }) {
  return JSON.stringify(
    session.project.variants.map(({ id }) => ({
      id,
      records: recordValues(session.lanes[id].records),
      // The actual domain enforces a 500-event quota. Only the content is inert.
      events: session.lanes[id].events.length,
    })),
  );
}

function actionAlphabet(project, newId) {
  const all = project.variants.flatMap((variant) => variant.actions);
  const actionIds = [...new Set(all.map((action) => action.id))].sort();
  const creates = new Set(
    all.filter((action) => action.kind === 'create').map((action) => action.id),
  );
  const actors = project.actors.map((actor) => actor.id).sort();
  const originalIds = project.records.map((record) => record.id).sort();
  return ({ session }) => {
    const created = Object.values(session.lanes).some((lane) =>
      lane.records.some((record) => record.id === newId),
    );
    const records = created ? [...originalIds, newId] : originalIds;
    const actions = [];
    for (const actorId of actors)
      for (const actionId of actionIds) {
        const recordIds = !created && creates.has(actionId) ? [...records, newId] : records;
        for (const recordId of recordIds)
          actions.push({
            actorId,
            actionId,
            recordId,
            // An ID may be a creation in one lane and a transition in another.
            ...(creates.has(actionId) ? { title: NEW_TITLE } : {}),
          });
      }
    return actions;
  };
}

/** Compare initial fictional data, never the user's current lane/session state. */
export function discoverProject(project, options = {}) {
  const session = createSession(project);
  const newId = freshId(session.project.records);
  const result = findWitness(
    {
      initial: { session },
      key: stateKey,
      actions: actionAlphabet(session.project, newId),
      step: (state, action) => {
        const next = performAction(state.session, action);
        return {
          state: { session: next.session },
          observations: next.outcomes.map((outcome) => ({
            variantId: outcome.variantId,
            value: {
              allowed: outcome.allowed,
              records: recordValues(next.session.lanes[outcome.variantId].records),
            },
            reason: outcome.reason,
          })),
        };
      },
    },
    options,
  );
  return {
    ...result,
    steps: result.trace.map((entry) => structuredClone(entry.action)),
    scope:
      'Données initiales fictives du projet ; actions communes aux variantes, avec tous les acteurs et identifiants d’action déclarés. ' +
      `Enregistrements initiaux et au plus un nouvel identifiant (${newId}), de titre fixe « ${NEW_TITLE} ». ` +
      'Comparaison exacte des permissions et des enregistrements (id, état, propriétaire, titre), sans les libellés ni raisons. ' +
      'Les compteurs de la limite de 500 observations sont conservés. Une recherche bornée ne prouve aucune équivalence ; ' +
      'un espace épuisé ne concerne que cet alphabet et cette abstraction, pas la qualité ou la préférence du propriétaire.',
  };
}
