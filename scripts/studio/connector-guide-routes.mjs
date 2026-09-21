import { body, send, sameOrigin } from './http.mjs';
import {
  readConnectorGuides,
  prepareConnectorGuide,
  projectConnectorPreparation,
} from './connector-guides.mjs';

export async function connectorGuideRoute(request, response, url, origin) {
  if (!['/api/connectors/guides', '/api/connectors/guides/prepare'].includes(url.pathname))
    return false;
  const locale = url.searchParams.get('language') === 'fr' ? 'fr' : 'en';
  try {
    if (request.method === 'GET' && url.pathname === '/api/connectors/guides')
      send(response, 200, readConnectorGuides(locale));
    else if (request.method === 'POST' && url.pathname === '/api/connectors/guides/prepare') {
      sameOrigin(request, origin);
      send(
        response,
        200,
        projectConnectorPreparation(prepareConnectorGuide(await body(request, 65536)), locale),
      );
    } else
      send(response, 405, {
        error: locale === 'fr' ? 'Méthode non autorisée.' : 'Method not allowed.',
      });
  } catch (error) {
    send(response, error.status || 400, {
      error:
        locale === 'fr'
          ? error.status
            ? error.message
            : 'Préparation du parcours refusée.'
          : 'Guide preparation refused. Check the selected flow and answers.',
    });
  }
  return true;
}
