import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { createStore } from './store.mjs';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
]);

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

async function body(request) {
  let input = '';
  for await (const chunk of request) {
    input += chunk;
    if (input.length > 4096)
      throw Object.assign(new Error('The request is too large.'), { code: 'BAD_REQUEST' });
  }
  try {
    const value = JSON.parse(input);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw Object.assign(new Error('Send a JSON object.'), { code: 'BAD_REQUEST' });
  }
}

function errorStatus(code) {
  if (['CAPACITY_EXCEEDED', 'REQUEST_CONFLICT'].includes(code)) return 409;
  if (['SLOT_NOT_FOUND', 'RESERVATION_NOT_FOUND'].includes(code)) return 404;
  if (['BAD_REQUEST', 'INVALID_SEATS', 'INVALID_REQUEST'].includes(code)) return 400;
  return 500;
}

function isLocal(request, address) {
  return (
    request.headers.host === address &&
    (!request.headers.origin || request.headers.origin === `http://${address}`)
  );
}

export function createApp(filePath) {
  const store = createStore(filePath);
  store.listSlots();
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    );
    try {
      const address = `127.0.0.1:${request.socket.localPort}`;
      if (!isLocal(request, address)) {
        json(response, 403, {
          error: 'LOCAL_ONLY',
          message: 'Open this demo using its 127.0.0.1 address.',
        });
        return;
      }
      const path = new URL(request.url, `http://${address}`).pathname;
      if (request.method === 'GET' && path === '/api/state') {
        json(response, 200, { slots: store.listSlots(), reservations: store.listReservations() });
      } else if (request.method === 'POST' && path === '/api/reservations') {
        if (!request.headers['content-type']?.startsWith('application/json'))
          throw Object.assign(new Error('Use application/json.'), { code: 'BAD_REQUEST' });
        json(response, 200, store.reserve(await body(request)));
      } else if (request.method === 'POST' && /^\/api\/reservations\/[^/]+\/cancel$/.test(path)) {
        json(response, 200, store.cancel(decodeURIComponent(path.split('/')[3])));
      } else if (request.method === 'GET' && assets.has(path)) {
        const [name, mime] = assets.get(path);
        const content = await readFile(new URL(`./public/${name}`, import.meta.url));
        response.writeHead(200, { 'Content-Type': mime });
        response.end(content);
      } else
        json(response, 404, { error: 'NOT_FOUND', message: 'This page or action does not exist.' });
    } catch (error) {
      const status = errorStatus(error.code);
      json(response, status, {
        error: error.code || 'INTERNAL_ERROR',
        message:
          status === 500
            ? 'The store could not be read or saved. Preserve the data file and inspect the server.'
            : error.message,
      });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({
    options: {
      port: { type: 'string', default: '4177' },
      data: { type: 'string', default: '/tmp/devmethod-volunteers.json' },
    },
  });
  const port = Number(values.port);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535)
    throw new Error('Port must be an integer from 1 to 65535.');
  const server = createApp(values.data);
  server.listen(port, '127.0.0.1', () =>
    process.stdout.write(`Volunteer demo: http://127.0.0.1:${port}\n`),
  );
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
