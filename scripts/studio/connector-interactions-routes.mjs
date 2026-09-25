import { body, sameOrigin, send } from './http.mjs';
import { rejectConnector } from './connectors-validation.mjs';

const prefix = '/api/connectors/';
const paths = new Set(
  [
    'interactions',
    'interactions/request',
    'interactions/draft',
    'interactions/answer',
    'guide-drafts',
    'guide-drafts/remove',
  ].map((name) => prefix + name),
);

function readAccess(request, origin, worker) {
  if (request.headers.host !== new URL(origin).host) rejectConnector('Hôte non autorisé.', 403);
  if (worker) return;
  if (
    request.headers.authorization ||
    (request.headers.origin && request.headers.origin !== origin) ||
    request.headers['sec-fetch-site'] === 'cross-site'
  )
    rejectConnector('Origine non autorisée.', 403);
}

function humanAccess(request, origin) {
  if (request.headers.authorization !== undefined)
    rejectConnector('Seule la personne peut répondre ou modifier ces brouillons.', 403);
  sameOrigin(request, origin);
}

async function dispatch(request, url, { origin, worker, interactions, drafts }) {
  readAccess(request, origin, worker);
  const route = url.pathname.slice(prefix.length);
  if (route.startsWith('interactions') && !interactions)
    rejectConnector('Ouvrez un projet pour consulter ses questionnaires.', 409);
  if (request.method === 'GET') {
    if (route === 'guide-drafts' && !url.search) return drafts.list();
    if (
      route === 'interactions' &&
      [...url.searchParams.keys()].every((key) => key === 'jobId') &&
      url.searchParams.getAll('jobId').length <= 1
    )
      return interactions.list(url.searchParams.get('jobId') ?? undefined);
    rejectConnector('Lecture du guide inconnue.');
  }
  if (request.method !== 'POST') rejectConnector('Méthode non autorisée.', 405);
  if (url.search) rejectConnector('Paramètres inattendus.');
  if (route === 'interactions/request') {
    if (!worker) rejectConnector('Cette demande appartient à l’agent connecté.', 403);
    return interactions.request(await body(request, 65536));
  }
  humanAccess(request, origin);
  const input = await body(request, 65536);
  const mutate = {
    'interactions/draft': interactions?.saveDraft,
    'interactions/answer': interactions?.answer,
    'guide-drafts': drafts.save,
    'guide-drafts/remove': drafts.remove,
  }[route];
  if (!mutate) rejectConnector('Modification inconnue.', 405);
  return mutate(input);
}

export async function connectorInteractionRoute(request, response, url, options) {
  if (!paths.has(url.pathname)) return false;
  try {
    send(response, 200, await dispatch(request, url, options));
  } catch (error) {
    send(response, error.status || 400, {
      error: error.status
        ? error.message
        : 'Questionnaire indisponible. Vos réponses sont conservées.',
    });
  }
  return true;
}
