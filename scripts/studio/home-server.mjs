import { readMcpUsage } from './mcp-usage.mjs';
import { createConnectorGuideDrafts } from './connector-interactions-drafts.mjs';
import { connectorInteractionRoute } from './connector-interactions-routes.mjs';
import { connectorGuideRoute } from './connector-guide-routes.mjs';
import fs from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { body, send, sameOrigin } from './http.mjs';
import { safeFile, mimeType } from './files.mjs';
import { startStudio } from './server.mjs';
import { createHomeStore, homeError } from './home-store.mjs';
import { projectHomeLaunchCatalog, homeLaunchLimits } from './home-launch.mjs';
import { createHomePreview } from './home-preview.mjs';
import { createMcpManager } from './mcp-manager.mjs';
import { createMcpRoutes } from './mcp-routes.mjs';
import { validateMcpSelection } from './mcp-selection.mjs';

const publicRoot = fileURLToPath(new URL('./public/', import.meta.url));
const widgetRoot = fileURLToPath(new URL('../../dist/studio-ui/', import.meta.url));
const closeServer = (server) =>
  new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  });

function publicError(error) {
  if (error.homeSafe || error.mcpSafe) return { status: error.status, message: error.message };
  if (/verrouill|verrouillé/.test(error.message))
    return {
      status: 409,
      message:
        'Ce projet est déjà ouvert dans une autre session. Retrouvez cette session ou fermez-la avant de reprendre ici. Aucun verrou n’a été retiré.',
    };
  if (error.status === 403) return { status: 403, message: 'Origine non autorisée.' };
  if (error.code === 'ENOENT')
    return { status: 404, message: 'Dossier, projet ou fichier introuvable.' };
  if (/symbolique/.test(error.message))
    return { status: 400, message: 'Utilisez un chemin réel, sans lien symbolique.' };
  return {
    status: 400,
    message:
      'Action refusée : vérifiez le dossier, les données du projet et les limites d’import. Aucun projet existant n’a été réinitialisé.',
  };
}

export async function startStudioHome({ directory, port = 4330 }) {
  let mcpManager;
  const store = createHomeStore(directory, {
      resolveMcpSelection: (ids) => validateMcpSelection(ids, mcpManager),
    }),
    sessions = new Map(),
    guideDrafts = createConnectorGuideDrafts(store.root, { scope: 'home' });
  let url,
    previewOrigin,
    closing = false,
    closingTask,
    mutations = Promise.resolve();
  try {
    mcpManager = createMcpManager({
      directory: safeFile(store.root, '.mcp-private'),
      getOrigin: () => url,
    });
  } catch (error) {
    await store.close();
    throw error;
  }
  const mcpUsage = (connectionId) => readMcpUsage(store.read().projects, connectionId);
  const mcpRoutes = createMcpRoutes(mcpManager, () => url, { getUsage: mcpUsage });
  const preview = createHomePreview({
    getProject: (id) => store.read().projects.find((project) => project.id === id),
    getHomeOrigin: () => url,
  });
  const serialize = (action) => {
    if (closing) throw homeError('Cet accueil est en cours de fermeture.', 409);
    const task = mutations.then(action);
    mutations = task.catch(() => {});
    return task;
  };

  async function open(input) {
    if (
      !input ||
      typeof input !== 'object' ||
      Array.isArray(input) ||
      Object.keys(input).some((key) => key !== 'id')
    )
      throw homeError('Demande d’ouverture invalide.');
    const project = store.project(input.id);
    let studio = sessions.get(project.id);
    if (!studio) {
      studio = await startStudio({
        workspace: project.workspace,
        port: 0,
        previewPort: 0,
        agent: null,
        homeUrl: url,
        mcpManager,
        mcpUsage,
      });
      sessions.set(project.id, studio);
    }
    return { project: await store.opened(project.id), url: studio.runtime().url };
  }

  function asset(requestUrl, response) {
    const relative =
      requestUrl.pathname === '/' ? 'home.html' : decodeURIComponent(requestUrl.pathname.slice(1));
    const file = relative.startsWith('studio-ui/')
      ? safeFile(widgetRoot, relative.slice('studio-ui/'.length))
      : safeFile(publicRoot, relative);
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; frame-src " +
        previewOrigin,
    );
    send(response, 200, fs.readFileSync(file), mimeType(file));
  }

  const server = http.createServer(async (request, response) => {
    try {
      if (request.headers.host !== new URL(url).host) throw homeError('Hôte non autorisé.', 403);
      const requestUrl = new URL(request.url, url);
      if (await connectorGuideRoute(request, response, requestUrl, url)) return;
      if (
        await connectorInteractionRoute(request, response, requestUrl, {
          origin: url,
          worker: false,
          drafts: guideDrafts,
        })
      )
        return;
      if (await mcpRoutes(request, response, requestUrl)) return;
      if (request.method === 'GET') {
        if (requestUrl.pathname === '/api/home') {
          const report = store.read();
          return send(response, 200, {
            ...report,
            projects: report.projects.map((project) => ({
              ...project,
              preview: preview.describe(project),
            })),
          });
        }
        if (requestUrl.pathname === '/api/home/catalog')
          return send(
            response,
            200,
            projectHomeLaunchCatalog(requestUrl.searchParams.get('language')),
          );
        if (requestUrl.pathname.startsWith('/api/')) throw homeError('Route inconnue.', 404);
        return asset(requestUrl, response);
      }
      if (request.method !== 'POST')
        return send(response, 405, { error: 'Méthode non autorisée.' });
      sameOrigin(request, url);
      const actions = {
        '/api/home/projects': async (input) => ({ project: await store.create(input) }),
        '/api/home/open': open,
      };
      const action = actions[requestUrl.pathname];
      if (!action) throw homeError('Route inconnue.', 404);
      const input = await body(
        request,
        requestUrl.pathname === '/api/home/projects' ? homeLaunchLimits.bodyBytes : 65536,
      );
      send(response, 200, await serialize(() => action(input)));
    } catch (error) {
      const failure = publicError(error);
      send(response, failure.status, { error: failure.message });
    }
  });
  try {
    await new Promise((resolve, reject) => {
      preview.server.once('error', reject);
      preview.server.listen(0, '127.0.0.1', () => {
        preview.server.removeListener('error', reject);
        resolve();
      });
    });
    previewOrigin = 'http://127.0.0.1:' + preview.server.address().port;
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', () => {
        server.removeListener('error', reject);
        resolve();
      });
    });
    url = 'http://127.0.0.1:' + server.address().port;
  } catch (error) {
    await Promise.all([server, preview.server].map(closeServer));
    await mcpManager.close();
    await store.close();
    throw error;
  }
  return {
    runtime: () => ({ url, directory: store.root }),
    close() {
      closingTask ??= (async () => {
        closing = true;
        await Promise.all([server, preview.server].map(closeServer));
        await mutations;
        await mcpManager.close();
        const results = await Promise.allSettled(
          [...sessions.values()].map((studio) => studio.close()),
        );
        await store.close();
        const failed = results.find((result) => result.status === 'rejected');
        if (failed) throw failed.reason;
      })();
      return closingTask;
    },
  };
}
