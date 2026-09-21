import { projectConnectorCatalog } from './connectors-catalog.mjs';
import { body, send, sameOrigin } from './http.mjs';
import {
  connectorLimits,
  readProjectConnectors,
  configureProjectConnector,
  reportConnectorProbe,
  prepareExternalQualityRun,
  prepareConnectorIntegration,
} from './connectors.mjs';

export function readConnectorsRoute(url, response, store) {
  if (url.pathname !== '/api/connectors') return false;
  const report = readProjectConnectors(store, url.searchParams.get('revision'));
  const locale = url.searchParams.get('language') === 'fr' ? 'fr' : 'en';
  send(response, 200, {
    ...report,
    catalog: projectConnectorCatalog(locale),
    limits:
      locale === 'fr'
        ? report.limits
        : [
            'Configuration and host attestation do not mean the integration has run in the application.',
            'No automatic MCP/API client, installation, provisioning or email sending in this panel.',
            'Secret references identify access held by the host; Studio does not resolve them.',
          ],
  });
  return true;
}

export async function writeConnectorsRoute(url, request, response, context, worker) {
  const routes = {
    '/api/connectors/configure': configureProjectConnector,
    '/api/connectors/prepare': prepareConnectorIntegration,
    '/api/connectors/executions': prepareExternalQualityRun,
    '/api/connectors/probe': reportConnectorProbe,
    '/api/connectors/results': async (store, input) => {
      const { importExternalQualityResult } = await context.tools.quality();
      return importExternalQualityResult(store, input);
    },
  };
  const action = routes[url.pathname];
  if (!action) return false;
  const workerOnly = ['/api/connectors/probe', '/api/connectors/results'].includes(url.pathname);
  if (workerOnly && !worker) {
    send(response, 403, {
      error: 'Seul l’agent connecté peut transmettre une observation ou un résultat.',
    });
    return true;
  }
  if (!workerOnly) sameOrigin(request, context.runtime().url);
  const input = await body(request, connectorLimits.inputBytes);
  send(response, 200, await action(context.store, input));
  return true;
}
