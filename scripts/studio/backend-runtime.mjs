import http from 'node:http';
import { runtimeSourceCatalog } from './source.mjs';

function checkedOrigin(value) {
  const url = new URL(value);
  if (
    url.protocol !== 'http:' ||
    url.hostname !== '127.0.0.1' ||
    !url.port ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error('La sonde accepte seulement une origine HTTP loopback connue du serveur.');
  return url.origin;
}

export function probeRuntimeService(origin, { timeoutMs = 1200 } = {}) {
  const endpoint = checkedOrigin(origin) + '/api/data';
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 5000)
    throw new Error('Le délai de la sonde doit être compris entre 1 et 5000 ms.');
  const started = Date.now();
  return new Promise((resolve) => {
    let settled = false;
    const finish = (status, code, message, extra = {}) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        status,
        observedAt: new Date().toISOString(),
        elapsedMs: Date.now() - started,
        ...(code ? { error: { code, message } } : {}),
        ...extra,
      });
      request.destroy();
    };
    const request = http.get(endpoint, { agent: false }, (response) => {
      if (response.statusCode !== 200) {
        finish('error', 'HTTP_STATUS', `Le service a répondu HTTP ${response.statusCode}.`, {
          httpStatus: response.statusCode,
        });
        return;
      }
      const chunks = [];
      let bytes = 0;
      response.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > 2 * 1024 * 1024) {
          finish(
            'error',
            'RESPONSE_TOO_LARGE',
            'La réponse dépasse le budget de lecture de la sonde.',
          );
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        if (settled) return;
        try {
          const snapshot = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (
            !Number.isSafeInteger(snapshot.version) ||
            snapshot.version < 1 ||
            !snapshot.data ||
            typeof snapshot.data !== 'object' ||
            Array.isArray(snapshot.data)
          )
            throw new Error('Invalid data contract');
          finish('healthy', null, null, { dataVersion: snapshot.version, httpStatus: 200 });
        } catch {
          finish(
            'error',
            'INVALID_DATA_RESPONSE',
            'Le service ne renvoie pas le contrat JSON attendu.',
          );
        }
      });
      response.on('error', () =>
        finish('unreachable', 'RESPONSE_INTERRUPTED', 'La réponse du service a été interrompue.'),
      );
    });
    const timer = setTimeout(
      () =>
        finish(
          'timeout',
          'HEALTH_TIMEOUT',
          'Le service n’a pas répondu dans le délai. Son état reste indéterminé.',
        ),
      timeoutMs,
    );
    request.on('error', () =>
      finish('unreachable', 'CONNECTION_FAILED', 'La connexion au service local a échoué.'),
    );
  });
}

export async function getRuntimeServices(
  { previewOrigin, editorPreviewOrigin, comparisonPreviewOrigin },
  options = {},
) {
  const definitions = [
    {
      id: 'application',
      name: 'Application et données persistantes',
      origin: previewOrigin,
      access: 'read-write',
    },
    {
      id: 'draft',
      name: 'Brouillon et copie isolée des données',
      origin: editorPreviewOrigin,
      access: 'read-write',
    },
  ];
  if (comparisonPreviewOrigin)
    definitions.push({
      id: 'comparison',
      name: 'Comparaison et données courantes en lecture seule',
      origin: comparisonPreviewOrigin,
      access: 'read-only',
    });
  const services = await Promise.all(
    definitions.map(async (service) => ({
      ...service,
      origin: service.origin || null,
      execution: service.origin ? 'started' : 'not_started',
      endpoints:
        service.access === 'read-only' ? ['GET /api/data'] : ['GET /api/data', 'POST /api/data'],
      health: service.origin
        ? await probeRuntimeService(service.origin, options)
        : {
            status: 'not_checked',
            observedAt: null,
            elapsedMs: null,
          },
    })),
  );
  return {
    topology: 'embedded-monolith',
    processModel: 'single-node-process',
    services,
    sources: runtimeSourceCatalog(),
    capabilities: { persistentJSON: true, compareAndSwap: true, customBackendExecution: false },
    limitations: [
      'Les serveurs HTTP d’aperçu partagent un processus Node ; aucune isolation de processus entre services.',
      'La comparaison lit les données courantes sans pouvoir les modifier ; ce n’est pas un instantané isolé.',
      'La sonde vérifie une réponse du stockage JSON, pas les règles métier ni une écriture.',
      'Les backends de projet déclarés ne sont ni exécutés ni connectés automatiquement.',
    ],
  };
}
