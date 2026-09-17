import { body, send, sameOrigin } from './http.mjs';
import { mcpPresets, mcpLimits, mcpShape, mcpError } from './mcp-contract.mjs';

const routes = new Set([
  '/api/mcp',
  '/api/mcp/connect',
  '/api/mcp/refresh',
  '/api/mcp/disconnect',
  '/api/mcp/callback',
]);
const page = (message) =>
  '<!doctype html><html lang="fr"><meta charset="utf-8"><title>Connexion MCP</title><p>' +
  message +
  '</p></html>';
const unavailable = {
  supported: false,
  nativeRunner: false,
  presets: mcpPresets,
  connections: [],
  limits: mcpLimits,
};

async function mutation(manager, request, url, origin) {
  sameOrigin(request, origin);
  const input = await body(request, 16384);
  if (url.pathname === '/api/mcp/connect') return manager.connect(input);
  mcpShape(input, ['id']);
  return url.pathname === '/api/mcp/refresh'
    ? manager.refresh(input.id)
    : manager.disconnect(input.id);
}

async function dispatch(manager, request, response, url, origin) {
  if (request.headers.host !== new URL(origin).host) throw mcpError('Hôte non autorisé.', 403);
  if (request.method === 'GET' && url.pathname === '/api/mcp') {
    send(response, 200, manager ? manager.list() : unavailable);
    return;
  }
  if (!manager)
    throw mcpError(
      'Ouvrez ce projet depuis l’accueil pour gérer ses connexions MCP.',
      409,
      'unsupported',
    );
  if (url.pathname === '/api/mcp/callback' && request.method === 'GET') {
    const result = await manager.completeAuthorization(url.searchParams);
    const connected = result.connection.status === 'connected';
    const message = connected
      ? 'Connexion établie et outils découverts.'
      : 'Connexion non établie. Consultez le statut dans Studio.';
    send(
      response,
      connected ? 200 : 400,
      page(message + ' Vous pouvez fermer cette fenêtre.'),
      'text/html; charset=utf-8',
    );
    return;
  }
  if (
    request.method !== 'POST' ||
    !['/api/mcp/connect', '/api/mcp/refresh', '/api/mcp/disconnect'].includes(url.pathname)
  )
    throw mcpError('Méthode non autorisée.', 405);
  send(response, 200, await mutation(manager, request, url, origin));
}

export function createMcpRoutes(manager, getOrigin) {
  return async (request, response, url) => {
    if (!routes.has(url.pathname)) return false;
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
    try {
      await dispatch(manager, request, response, url, getOrigin());
    } catch (error) {
      const message = error.mcpSafe
        ? error.message
        : 'Requête MCP refusée ou connexion interrompue.';
      if (url.pathname === '/api/mcp/callback')
        send(
          response,
          error.status ?? 400,
          page('Retour OAuth refusé. Revenez dans Studio et reconnectez le service.'),
          'text/html; charset=utf-8',
        );
      else
        send(response, error.status ?? 400, {
          error: message,
          code: error.mcpSafe ? error.code : 'request-failed',
        });
    }
    return true;
  };
}
