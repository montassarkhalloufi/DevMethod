import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createStore } from './src/store.mjs';
import { TaskError, validateBody } from './src/domain.mjs';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
]);
function body(request) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0,
      exceeded = false;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > 16384) {
        if (!exceeded) {
          exceeded = true;
          chunks.length = 0;
          reject(new TaskError('Request body exceeds 16 KiB.', 413));
        }
      } else if (!exceeded) chunks.push(chunk);
    });
    request.on('end', () => {
      if (exceeded) return;
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new TaskError('Malformed JSON.'));
      }
    });
    request.on('error', reject);
  });
}
function validateLocalRequest(request) {
  const expectedHost = `127.0.0.1:${request.socket.localPort}`;
  const hostCount = request.rawHeaders.filter(
    (_, index) => index % 2 === 0 && request.rawHeaders[index].toLowerCase() === 'host',
  ).length;
  if (hostCount !== 1 || request.headers.host !== expectedHost)
    throw new TaskError('Use the local 127.0.0.1 address and server port.', 403);
  if (!['POST', 'PATCH', 'DELETE'].includes(request.method)) return;
  const originCount = request.rawHeaders.filter(
    (_, index) => index % 2 === 0 && request.rawHeaders[index].toLowerCase() === 'origin',
  ).length;
  if (
    originCount > 1 ||
    (request.headers.origin !== undefined && request.headers.origin !== `http://${expectedHost}`) ||
    request.headers['sec-fetch-site'] === 'cross-site'
  ) {
    throw new TaskError('Cross-site changes are not permitted.', 403);
  }
}
function requireJSON(request) {
  if (request.headers['content-type']?.split(';', 1)[0].trim().toLowerCase() !== 'application/json')
    throw new TaskError('Content-Type must be application/json.', 415);
}
function json(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(value === undefined ? undefined : JSON.stringify(value));
}
async function routeRequest(request, response, store) {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  if (pathname === '/api/tasks' && request.method === 'GET')
    return json(response, 200, { tasks: await store.list() });
  if (pathname === '/api/tasks' && request.method === 'POST') {
    requireJSON(request);
    return json(response, 201, { task: await store.create(validateBody(await body(request))) });
  }
  const match = /^\/api\/tasks\/([^/]+)$/.exec(pathname);
  if (match && request.method === 'PATCH') {
    requireJSON(request);
    return json(response, 200, {
      task: await store.update(
        decodeURIComponent(match[1]),
        validateBody(await body(request), true),
      ),
    });
  }
  if (match && request.method === 'DELETE') {
    await store.remove(decodeURIComponent(match[1]));
    return json(response, 204);
  }
  if (request.method === 'GET' && assets.has(pathname)) {
    const [file, type] = assets.get(pathname);
    const content = await readFile(new URL(`./public/${file}`, import.meta.url));
    response.writeHead(200, { 'Content-Type': type });
    return response.end(content);
  }
  json(response, 404, { error: 'Not found.' });
}
function respondToError(response, error) {
  const status = error instanceof TaskError ? error.status : error instanceof URIError ? 400 : 500;
  json(response, status, {
    error:
      status === 500
        ? 'Storage or server unavailable. Check local data and server permissions; existing data has not been reset.'
        : error.message,
  });
}
export function createTaskServer({ dataFile }) {
  const store = createStore(resolve(dataFile));
  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    );
    try {
      validateLocalRequest(request);
      await routeRequest(request, response, store);
    } catch (error) {
      respondToError(response, error);
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 4318);
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new Error('PORT must be an integer from 0 to 65535.');
  const server = createTaskServer({
    dataFile: process.env.DATA_FILE ?? fileURLToPath(new URL('./data/tasks.json', import.meta.url)),
  });
  server.on('error', (error) => {
    console.error(`Pocket Tasks could not start: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () =>
    console.log(`Pocket Tasks: http://127.0.0.1:${server.address().port}`),
  );
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
