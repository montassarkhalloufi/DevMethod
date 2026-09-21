import { body, send, sameOrigin } from './http.mjs';
import { mcpRequire } from './mcp-contract.mjs';
import { mcpBrokerLimits } from './mcp-broker.mjs';

export async function mcpBrokerRoute(url, request, response, context) {
  if (
    ![
      '/api/mcp/selection',
      '/api/mcp/tools',
      '/api/mcp/call',
      '/api/mcp/actions',
      '/api/mcp/actions/decide',
    ].includes(url.pathname)
  )
    return false;
  try {
    await route(url, request, response, context);
  } catch (error) {
    send(response, error.status ?? 400, {
      error: error.mcpSafe ? error.message : 'Requête MCP refusée ou stockage local illisible.',
      code: error.mcpSafe ? error.code : 'request-failed',
    });
  }
  return true;
}

async function actionRoute(url, request, response, { broker, origin, worker }) {
  if (url.pathname === '/api/mcp/actions' && request.method === 'GET') {
    if (!worker) {
      mcpRequire(
        !request.headers.origin || request.headers.origin === origin,
        'Origine non autorisée.',
        403,
      );
      mcpRequire(request.headers['sec-fetch-site'] !== 'cross-site', 'Origine non autorisée.', 403);
    }
    mcpRequire(
      [...url.searchParams.keys()].every(
        (key) => ['jobId', 'requestId'].includes(key) && url.searchParams.getAll(key).length === 1,
      ),
      'Paramètres MCP invalides.',
    );
    response.setHeader('Cache-Control', 'no-store');
    send(response, 200, broker.actions(Object.fromEntries(url.searchParams)));
    return true;
  }
  mcpRequire(
    url.pathname === '/api/mcp/actions/decide' && request.method === 'POST',
    'Méthode non autorisée.',
    405,
  );
  mcpRequire(
    !worker && request.headers.authorization === undefined,
    'Seule la personne peut autoriser cette action.',
    403,
  );
  mcpRequire(!url.search, 'Paramètres MCP inattendus.');
  sameOrigin(request, origin);
  const result = broker.decide(await body(request, 4096));
  send(response, result.status === 'executing' ? 202 : 200, result);
  return true;
}

async function route(url, request, response, context) {
  const { broker, origin, worker } = context;
  if (url.pathname === '/api/mcp/actions' || url.pathname === '/api/mcp/actions/decide')
    return actionRoute(url, request, response, context);
  if (url.pathname === '/api/mcp/selection') {
    mcpRequire(!url.search, 'Paramètres MCP inattendus.');
    if (request.method === 'GET') {
      mcpRequire(
        !request.headers.origin || request.headers.origin === origin,
        'Origine non autorisée.',
        403,
      );
      mcpRequire(request.headers['sec-fetch-site'] !== 'cross-site', 'Origine non autorisée.', 403);
      send(response, 200, broker.selection());
    } else if (request.method === 'POST') {
      mcpRequire(
        !worker && request.headers.authorization === undefined,
        'Seule la personne peut sélectionner les connexions de ce projet.',
        403,
      );
      sameOrigin(request, origin);
      send(response, 200, broker.select(await body(request, 4096)));
    } else send(response, 405, { error: 'Méthode non autorisée.' });
    return true;
  }
  mcpRequire(worker, 'Cette action appartient à l’agent hôte connecté.', 403);
  if (url.pathname === '/api/mcp/tools' && request.method === 'GET') {
    mcpRequire(
      [...url.searchParams.keys()].every(
        (key) =>
          ['jobId', 'connectionId', 'toolName'].includes(key) &&
          url.searchParams.getAll(key).length === 1,
      ),
      'Paramètres MCP invalides.',
    );
    send(response, 200, broker.tools(Object.fromEntries(url.searchParams)));
  } else if (url.pathname === '/api/mcp/call' && request.method === 'POST') {
    mcpRequire(!url.search, 'Paramètres MCP inattendus.');
    const result = await broker.call(await body(request, mcpBrokerLimits.inputBytes));
    send(response, ['pending', 'executing'].includes(result.status) ? 202 : 200, result);
  } else send(response, 405, { error: 'Méthode non autorisée.' });
  return true;
}
