import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createStore } from './store.mjs';
import { discoverProject } from './discovery.mjs';
import {
  performAction,
  replaySituation,
  chooseDirection,
  reviseIntent,
  applyProposal,
  exportDecision,
} from './domain.mjs';

const assets = fileURLToPath(new URL('./public/', import.meta.url));
const discoveryAssets = fileURLToPath(new URL('../discovery/', import.meta.url));
const contract = fileURLToPath(
  new URL('../../docs/missions/product-alternatives/CONTRACT.md', import.meta.url),
);
const maxBody = 512 * 1024;

function send(response, status, value, type = 'application/json; charset=utf-8') {
  response.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy':
      "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  });
  response.end(type.startsWith('application/json') ? JSON.stringify(value) : value);
}

async function body(request) {
  if (!request.headers['content-type']?.startsWith('application/json'))
    throw Object.assign(new Error('Une requête JSON est nécessaire.'), { status: 415 });
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > maxBody)
      throw Object.assign(new Error('Proposition trop volumineuse.'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error();
    return input;
  } catch {
    throw new Error('Le document JSON est invalide.');
  }
}

function prepareRequest(store, session, question) {
  if (typeof question !== 'string' || !question.trim() || question.length > 6000)
    throw new Error('Décrivez la question à explorer (1 à 6 000 caractères).');
  if (session.requests.length >= 20)
    throw new Error('Limite locale de 20 demandes atteinte. Exportez cet atelier.');
  const id = randomUUID();
  const task = {
    format: 1,
    id,
    baseRevision: session.revision,
    question: question.trim(),
    project: session.project,
    currentLanes: session.lanes,
    decision: session.decision,
    contract: fs.readFileSync(contract, 'utf8'),
    instruction:
      'Explore the supplied question using the real project context. Separate sources, assumptions and unresolved choices. Preserve understanding, exploration, framing, design and architecture as relevant lenses. Return a JSON proposal {baseRevision,summary,variants} compatible with the supplied contract. Propose genuinely different behaviors if useful, preserve current records and state IDs, and identify what the prototype cannot represent. Do not fabricate research, user choices or model execution. A clarification/no-code recommendation is valid: return no variant until the question is resolved. Do not access unrelated workspaces, invoke paid services or publish. This is an agent handoff, not authorization for any other action.',
  };
  const folder = path.join(store.root, 'requests');
  fs.mkdirSync(folder, { recursive: true });
  const file = path.join(folder, id + '.json');
  fs.writeFileSync(file, JSON.stringify(task, null, 2) + '\n', { flag: 'wx' });
  const next = structuredClone(session);
  next.requests.push({
    id,
    question: question.trim(),
    baseRevision: session.revision,
    status: 'prepared',
  });
  return { session: next, extra: { request: { id, file, task } } };
}

function mutate(store, pathname, session, input) {
  if (pathname === '/api/action') return performAction(session, input.action);
  if (pathname === '/api/replay') return { session: replaySituation(session, input.steps) };
  if (pathname === '/api/decision') return { session: chooseDirection(session, input.decision) };
  if (pathname === '/api/intent') return { session: reviseIntent(session, input.intent) };
  if (pathname === '/api/proposal') return { session: applyProposal(session, input.proposal) };
  if (pathname === '/api/request') return prepareRequest(store, session, input.question);
  throw Object.assign(new Error('Action inconnue.'), { status: 404 });
}

function getResource(store, url, response) {
  if (url.pathname === '/api/session') return send(response, 200, store.read());
  if (url.pathname.startsWith('/api/request/')) {
    const id = url.pathname.slice('/api/request/'.length);
    const known = store.read().session.requests.some((request) => request.id === id);
    if (!/^[a-f0-9-]{36}$/.test(id) || !known)
      return send(response, 404, { error: 'Demande introuvable.' });
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="devmethod-request-' + id + '.json"',
    );
    return send(
      response,
      200,
      JSON.parse(fs.readFileSync(path.join(store.root, 'requests', id + '.json'), 'utf8')),
    );
  }
  if (url.pathname === '/api/export') {
    response.setHeader('Content-Disposition', 'attachment; filename="devmethod-decision.json"');
    return send(response, 200, exportDecision(store.read().session));
  }
  const known = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
    '/views.js': ['views.js', 'text/javascript; charset=utf-8'],
    '/controls.js': ['controls.js', 'text/javascript; charset=utf-8'],
    '/discovery-view.js': ['discovery-view.js', 'text/javascript; charset=utf-8'],
    '/style.css': ['style.css', 'text/css; charset=utf-8'],
    '/transfer': ['transfer.html', 'text/html; charset=utf-8'],
    '/transfer-app.js': ['transfer-app.js', 'text/javascript; charset=utf-8'],
    '/transfer.css': ['transfer.css', 'text/css; charset=utf-8'],
  };
  const knownDiscovery = {
    '/discovery/search.mjs': 'search.mjs',
    '/transfer/domain.mjs': 'transfer/domain.mjs',
    '/transfer/machine.mjs': 'transfer/machine.mjs',
  };
  if (Object.hasOwn(knownDiscovery, url.pathname))
    return send(
      response,
      200,
      fs.readFileSync(path.join(discoveryAssets, knownDiscovery[url.pathname])),
      'text/javascript; charset=utf-8',
    );
  const resource = known[url.pathname];
  if (!resource) return send(response, 404, { error: 'Ressource introuvable.' });
  return send(response, 200, fs.readFileSync(path.join(assets, resource[0])), resource[1]);
}

export function createAtelierServer({ workspace, project }) {
  const store = createStore(workspace, project);
  const server = http.createServer(async (request, response) => {
    try {
      const address = server.address();
      const host = '127.0.0.1:' + address.port;
      if (request.headers.host !== host)
        return send(response, 403, { error: 'Hôte local attendu.' });
      const url = new URL(request.url, 'http://' + host);
      if (request.method === 'GET') return getResource(store, url, response);
      if (request.method !== 'POST')
        return send(response, 405, { error: 'Méthode non autorisée.' });
      if (request.headers.origin !== 'http://' + host)
        return send(response, 403, { error: 'Origine locale attendue.' });
      const input = await body(request);
      const before = store.read();
      if (input.version !== before.storageVersion)
        throw Object.assign(
          new Error('Une autre modification a été enregistrée. Rechargez le projet.'),
          { status: 409 },
        );
      if (url.pathname === '/api/discover')
        return send(response, 200, {
          ...discoverProject(before.session.project),
          storageVersion: before.storageVersion,
        });
      const result = mutate(store, url.pathname, before.session, input);
      const saved = store.commit(input.version, result.session);
      return send(response, 200, { ...saved, outcomes: result.outcomes, ...result.extra });
    } catch (error) {
      if (!response.headersSent) send(response, error.status ?? 400, { error: error.message });
    }
  });
  server.on('close', () => store.close());
  return server;
}
