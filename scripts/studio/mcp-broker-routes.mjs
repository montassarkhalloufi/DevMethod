import { body, send, sameOrigin } from './http.mjs';
import { mcpRequire } from './mcp-contract.mjs';
import { mcpBrokerLimits } from './mcp-broker.mjs';

export async function mcpBrokerRoute(url, request, response, context) {
  if (!['/api/mcp/selection', '/api/mcp/tools', '/api/mcp/call'].includes(url.pathname))
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

async function route(url, request, response, { broker, origin, worker }) {
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
    send(response, 200, await broker.call(await body(request, mcpBrokerLimits.inputBytes)));
  } else send(response, 405, { error: 'Méthode non autorisée.' });
  return true;
}
