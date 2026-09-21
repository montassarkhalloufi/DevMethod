import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { safeFile, digest, mimeType } from './files.mjs';
import { send } from './http.mjs';
import { readHomeProjectState } from './home-store.mjs';
import { withHomeDataSnapshot } from './home-preview-data.mjs';
import { withHomeAssetURLs } from './home-preview-assets.mjs';

const route = /^\/projects\/([a-f0-9-]{36})\/revisions\/([A-Za-z0-9_-]{1,128})\/(.+)$/;
const servedExtensions = new Set([
  '.html',
  '.js',
  '.mjs',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.gif',
  '.avif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
]);
const unavailableHTML =
  '<!doctype html><html lang="fr"><meta charset="utf-8"><title>Aperçu indisponible</title><body><p>Aperçu indisponible. Ouvrez le projet pour consulter sa version.</p></body></html>';

function selectedRevision(state) {
  return state.activeRevision
    ? state.revisions.find((revision) => revision.id === state.activeRevision)
    : state.revisions.at(-1);
}

function artifact(project, revision, relative) {
  if (
    revision.profile === 'source-only' ||
    relative.split('/').some((part) => part.startsWith('.')) ||
    !servedExtensions.has(path.extname(relative))
  )
    throw new Error('Unsupported preview artifact');
  const manifest = revision.compilation?.files ?? revision.files;
  const expected = manifest.find((file) => file.path === relative);
  if (!expected) throw new Error('Artifact outside manifest');
  const file = safeFile(
    project.workspace,
    `revisions/${revision.id}/${revision.compilation ? 'compiled' : 'app'}/${relative}`,
  );
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.size !== expected.bytes || stat.size > 32 * 1024 * 1024)
    throw new Error('Invalid preview artifact');
  const content = fs.readFileSync(file);
  if (digest(content) !== expected.sha256) throw new Error('Changed preview artifact');
  return { file, content };
}

function describe(project, origin) {
  let state;
  try {
    state = readHomeProjectState(project.workspace);
  } catch {
    return { status: 'unavailable', reason: 'state-unavailable' };
  }
  const revision = selectedRevision(state);
  if (!revision) return { status: 'empty', reason: 'no-revision' };
  const base = { status: 'unavailable', revisionId: revision.id };
  if (revision.profile === 'source-only') return { ...base, reason: 'source-only' };
  try {
    artifact(project, revision, 'index.html');
  } catch {
    return { ...base, reason: 'artifacts-unavailable' };
  }
  return {
    status: 'ready',
    revisionId: revision.id,
    selection: state.activeRevision ? 'active' : 'candidate',
    url: `${origin}/projects/${project.id}/revisions/${revision.id}/index.html`,
  };
}

function restrict(response, origin, homeOrigin) {
  response.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'none'",
      `script-src ${origin} 'unsafe-inline'`,
      `style-src ${origin} 'unsafe-inline'`,
      `img-src ${origin} data:`,
      `font-src ${origin} data:`,
      "connect-src 'none'",
      "form-action 'none'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'none'",
      `frame-ancestors ${homeOrigin || "'none'"}`,
      'sandbox allow-scripts',
    ].join('; ') + ';',
  );
  // Module scripts in sandboxed frames have an opaque Origin: null. No credentials or API is served.
  response.setHeader('Access-Control-Allow-Origin', 'null');
  response.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  );
}

export function createHomePreview({ getProject, getHomeOrigin }) {
  const origin = () => 'http://127.0.0.1:' + server.address().port;
  const server = http.createServer((request, response) => {
    restrict(response, origin(), getHomeOrigin());
    if (request.headers.host !== new URL(origin()).host)
      return send(response, 403, unavailableHTML, 'text/html; charset=utf-8');
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET');
      return send(response, 405, unavailableHTML, 'text/html; charset=utf-8');
    }
    try {
      const url = new URL(request.url, origin());
      const match = route.exec(decodeURIComponent(url.pathname));
      if (!match) throw new Error('Unknown preview route');
      const [, projectId, revisionId, relative] = match;
      const project = getProject(projectId);
      if (!project) throw new Error('Unregistered project');
      const state = readHomeProjectState(project.workspace);
      const revision = state.revisions.find((entry) => entry.id === revisionId);
      if (!revision) throw new Error('Unknown revision');
      const { file, content } = artifact(project, revision, relative);
      const rebased = withHomeAssetURLs(content, {
        extension: path.extname(file),
        prefix: `/projects/${projectId}/revisions/${revisionId}/`,
        manifest: revision.compilation?.files ?? revision.files,
      });
      const display =
        path.extname(file) === '.html' ? withHomeDataSnapshot(rebased, project.workspace) : rebased;
      send(response, 200, display, mimeType(file));
    } catch {
      send(response, 404, unavailableHTML, 'text/html; charset=utf-8');
    }
  });
  return { server, describe: (project) => describe(project, origin()) };
}
