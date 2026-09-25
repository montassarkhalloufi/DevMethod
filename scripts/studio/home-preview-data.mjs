import fs from 'node:fs';
import { safeFile } from './files.mjs';

// Each frame receives only its own saved application data. This does not create or update data.
function readSnapshot(workspace) {
  try {
    const file = safeFile(workspace, '.devmethod/data.json');
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.size > 1024 * 1024) return null;
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (
      !Number.isSafeInteger(value.version) ||
      value.version < 1 ||
      !value.data ||
      typeof value.data !== 'object' ||
      Array.isArray(value.data)
    )
      return null;
    return { version: value.version, data: value.data };
  } catch {
    return null;
  }
}

export function installHomeDataSnapshot(serialized) {
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (input, init) => {
    const url = new URL(
      typeof input === 'string' || input instanceof URL ? input : input.url,
      globalThis.location.href,
    );
    if (url.origin === globalThis.location.origin && url.pathname === '/api/data') {
      const method = String(init?.method ?? input?.method ?? 'GET').toUpperCase();
      return Promise.resolve(
        new Response(
          method === 'GET' ? serialized : JSON.stringify({ error: 'Aperçu en lecture seule.' }),
          {
            status: method === 'GET' ? 200 : 405,
            headers: { 'Content-Type': 'application/json', Allow: 'GET' },
          },
        ),
      );
    }
    return originalFetch(input, init);
  };
}

export function withHomeDataSnapshot(content, workspace) {
  const snapshot = readSnapshot(workspace);
  if (!snapshot) return content;
  // JSON is passed as a string and '<' escaped so saved text cannot close the script element.
  const serialized = JSON.stringify(JSON.stringify(snapshot)).replaceAll('<', '\\u003c');
  const script = `<script>(${installHomeDataSnapshot.toString()})(${serialized});</script>`;
  const html = content.toString('utf8');
  const offset = /^\uFEFF?\s*<!doctype[^>]*>/i.exec(html)?.[0].length ?? 0;
  return Buffer.from(html.slice(0, offset) + script + html.slice(offset));
}
