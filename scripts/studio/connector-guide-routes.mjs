import { body, send, sameOrigin } from './http.mjs';
import { readConnectorGuides, prepareConnectorGuide } from './connector-guides.mjs';

export async function connectorGuideRoute(request, response, url, origin) {
  if (!['/api/connectors/guides', '/api/connectors/guides/prepare'].includes(url.pathname))
    return false;
  try {
    if (request.method === 'GET' && url.pathname === '/api/connectors/guides')
      send(response, 200, readConnectorGuides());
    else if (request.method === 'POST' && url.pathname === '/api/connectors/guides/prepare') {
      sameOrigin(request, origin);
      send(response, 200, prepareConnectorGuide(await body(request, 65536)));
    } else send(response, 405, { error: 'Méthode non autorisée.' });
  } catch (error) {
    send(response, error.status || 400, {
      error: error.status ? error.message : 'Préparation du parcours refusée.',
    });
  }
  return true;
}
