import { body, send, sameOrigin } from './http.mjs';
import { getRuntimeServices } from './backend-runtime.mjs';

function inputShape(input, keys) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !keys.includes(key))
  )
    throw new Error('Requête Control Plane invalide.');
}

export async function controlRoute(url, request, response, { control, worker, runtime }) {
  if (!url.pathname.startsWith('/api/control')) return false;
  const current = runtime();
  response.setHeader('Cache-Control', 'no-store');
  if (request.method === 'GET' && url.pathname === '/api/control') {
    if (request.headers['sec-fetch-site'] === 'cross-site')
      throw Object.assign(new Error('Origine non autorisée.'), { status: 403 });
    if (request.headers.origin && request.headers.origin !== current.url)
      throw Object.assign(new Error('Origine non autorisée.'), { status: 403 });
    if ([...url.searchParams.keys()].some((key) => key !== 'revision'))
      throw new Error('Paramètre inconnu.');
    send(response, 200, (await control()).read(url.searchParams.get('revision')));
    return true;
  }
  if (request.method !== 'POST')
    throw Object.assign(new Error('Route Control Plane inconnue.'), { status: 404 });
  authorizeMutation(url.pathname, request, worker, current.url);
  const input = await body(request, 8192);
  const plane = await control();
  const actions = {
    '/api/control/continue': { keys: ['version', 'snapshotKey'], run: () => plane.continue(input) },
    '/api/control/read': { keys: ['version', 'snapshotKey'], run: () => plane.markRead(input) },
    '/api/control/decide': {
      keys: ['version', 'snapshotKey', 'itemId', 'resolution', 'reason'],
      run: () => plane.decide(input),
    },
    '/api/control/verify': {
      keys: ['revisionId', 'checkId', 'requestId'],
      run: () => plane.verify(input),
    },
    '/api/control/runtime': {
      keys: [],
      run: async () => plane.observeRuntime(await getRuntimeServices(current)),
    },
  };
  const action = actions[url.pathname];
  if (!action) throw Object.assign(new Error('Action Control Plane inconnue.'), { status: 404 });
  inputShape(input, action.keys);
  send(response, 200, await action.run());
  return true;
}

function authorizeMutation(route, request, worker, origin) {
  const continuation = route === '/api/control/continue';
  if ((worker || request.headers.authorization) && !(worker && continuation))
    throw Object.assign(new Error('Cette action appartient à la personne.'), { status: 403 });
  if (!worker) sameOrigin(request, origin);
}
