import http from 'node:http';
import { createReservations } from './reservations.ts';
export function createServer(store = createReservations()) {
  return http.createServer(async (request, response) => {
    response.setHeader('content-type', 'application/json');
    if (request.method === 'GET' && request.url === '/availability') return response.end(JSON.stringify({remaining:store.availability()}));
    if (request.method === 'POST' && request.url === '/reservations') {
      try { const row = await store.reserve('fictional-request', () => new Promise(resolve => setTimeout(resolve, 10))); response.statusCode = 201; return response.end(JSON.stringify(row)); }
      catch { response.statusCode = 409; return response.end(JSON.stringify({error:'CAPACITY_FULL'})); }
    }
    response.statusCode = 404; response.end(JSON.stringify({error:'NOT_FOUND'}));
  });
}
if (process.argv[1]?.endsWith('/server.mjs')) createServer().listen(4317, '127.0.0.1');
