export function send(response, status, value, type = 'application/json; charset=utf-8') {
  response.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  response.end(
    Buffer.isBuffer(value)
      ? value
      : type.startsWith('application/json')
        ? JSON.stringify(value)
        : value,
  );
}
export async function body(request, max = 12 * 1024 * 1024) {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json')
    throw new Error('Un corps JSON est requis.');
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > max) throw new Error('Envoi trop volumineux.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function sameOrigin(request, origin) {
  if (request.headers.host !== new URL(origin).host || request.headers.origin !== origin) {
    const error = new Error('Origine non autorisée.');
    error.status = 403;
    throw error;
  }
}
export function errorResponse(response, error) {
  send(response, error.status ?? (error.code === 'ENOENT' ? 404 : 400), { error: error.message });
}
