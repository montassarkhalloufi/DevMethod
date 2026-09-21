import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { body, send } from './http.mjs';
import { mcpShape, mcpRequire } from './mcp-contract.mjs';
import { mcpBrokerLimits } from './mcp-broker.mjs';

const fields = {
  tools: ['connectionId', 'toolName'],
  call: ['connectionId', 'toolName', 'arguments', 'requestId'],
  actions: ['requestId'],
};

function authenticated(request, token, origin) {
  const actual = Buffer.from(request.headers.authorization ?? '');
  const expected = Buffer.from(`Bearer ${token}`);
  return (
    request.headers.host === new URL(origin).host &&
    !request.headers.origin &&
    !request.headers['sec-fetch-site'] &&
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  );
}

/** Ephemeral capability for one claimed job. It exposes no settings, decisions,
 * worker credentials, project mutation or approval route. Broker checks remain authoritative. */
export async function createNativeToolsSession({ store, broker, jobId }) {
  const token = randomBytes(32).toString('hex');
  let origin;
  let closed = false;
  const server = http.createServer(async (request, response) => {
    try {
      mcpRequire(!closed && authenticated(request, token, origin), 'Accès natif refusé.', 403);
      mcpRequire(request.method === 'POST', 'Méthode refusée.', 405);
      const route = request.url?.slice(1);
      mcpRequire(Object.hasOwn(fields, route), 'Opération native inconnue.', 404);
      const input = await body(request, mcpBrokerLimits.inputBytes);
      const state = store.read();
      const job = state.jobs.find((entry) => entry.id === jobId);
      mcpRequire(
        job?.status === 'running' && job.baseRevision === state.activeRevision,
        'Mission native arrêtée ou périmètre modifié.',
        409,
      );
      mcpShape(input, fields[route]);
      if (route === 'call')
        mcpRequire(typeof input.requestId === 'string', 'Identifiant de demande requis.');
      const result = await broker[route]({ ...input, jobId });
      mcpRequire(
        Buffer.byteLength(JSON.stringify(result)) <= mcpBrokerLimits.resultBytes,
        'Résultat natif trop volumineux.',
        413,
      );
      send(response, 200, { ...result, nativeRunner: true, execution: 'studio-native-broker' });
    } catch (error) {
      send(response, error.mcpSafe ? error.status : 400, {
        error: error.mcpSafe
          ? error.message
          : 'Opération native refusée ; aucun contenu privé affiché.',
        code: error.mcpSafe ? error.code : 'native-request-failed',
      });
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 5000;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
  return {
    url: origin + '/',
    token,
    async close() {
      closed = true;
      await new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      });
    },
  };
}
