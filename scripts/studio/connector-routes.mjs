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
  send(response, 200, readProjectConnectors(store, url.searchParams.get('revision')));
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
