import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';
import { mcpURL, mcpRequire } from './mcp-contract.mjs';

export function publicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && [0, 2, 168].includes(b)) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && [18, 19, 51].includes(b)) ||
      (a === 203 && b === 0)
    );
  }
  return (
    isIP(address) === 6 &&
    /^[23][a-f0-9]{3}:/i.test(address) &&
    !/^2001:(?:0:|db8:|2:|1[0-9a-f]:)/i.test(address)
  );
}

export async function mcpTarget(value, serverURL) {
  const server = mcpURL(serverURL),
    url = mcpURL(String(value), { query: true, localOrigin: server.origin });
  const explicitLocal =
    ['127.0.0.1', 'localhost'].includes(server.hostname) && url.origin === server.origin;
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await dns.lookup(hostname, { all: true });
  mcpRequire(
    addresses.length &&
      addresses.every(({ address }) =>
        explicitLocal ? ['127.0.0.1', '::1'].includes(address) : publicAddress(address),
      ),
    'Destination réseau MCP non autorisée.',
    400,
    'network-target',
  );
  return { url, address: addresses[0] };
}

function responseBody(incoming, maximumBytes) {
  const iterator = incoming[Symbol.asyncIterator]();
  let size = 0,
    cancelled = false;
  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await iterator.next();
        if (cancelled) return;
        if (done) {
          controller.close();
          return;
        }
        size += value.length;
        if (size > maximumBytes) throw new Error('MCP response limit');
        controller.enqueue(value);
      } catch (error) {
        if (!cancelled) controller.error(error);
        incoming.destroy();
      }
    },
    async cancel() {
      cancelled = true;
      incoming.destroy();
      await iterator.return().catch(() => {});
    },
  });
}

function fetchResponse(incoming, url, method, maximumBytes) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(incoming.headers))
    if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  // Validate metadata before starting the stream; Response also rejects non-HTTP status ranges.
  const response = new Response(null, { status: incoming.statusCode, headers });
  const noBody = method.toUpperCase() === 'HEAD' || [204, 205, 304].includes(incoming.statusCode);
  if (noBody) incoming.resume();
  const result = noBody
    ? response
    : new Response(responseBody(incoming, maximumBytes), {
        status: response.status,
        headers: response.headers,
      });
  Object.defineProperty(result, 'url', { value: url.href });
  return result;
}

export function createMcpFetch(serverURL, signal, { maximumBytes = 2 * 1024 * 1024 } = {}) {
  return async (input, init = {}) => {
    const target = await mcpTarget(input instanceof Request ? input.url : input, serverURL);
    const signals = [signal, init.signal, AbortSignal.timeout(15000)].filter(Boolean);
    const combined = AbortSignal.any(signals);
    combined.throwIfAborted();
    return await new Promise((resolve, reject) => {
      const headers = Object.fromEntries(new Headers(init.headers).entries());
      const request = (target.url.protocol === 'https:' ? https : http).request(
        target.url,
        {
          method: init.method ?? 'GET',
          headers,
          signal: combined,
          // Resolve once and pin this socket: a second DNS answer cannot redirect it into a private network.
          lookup: (_hostname, options, callback) =>
            callback(
              null,
              options.all ? [target.address] : target.address.address,
              target.address.family,
            ),
        },
        (incoming) => {
          if (incoming.statusCode >= 300 && incoming.statusCode < 400) {
            incoming.destroy();
            reject(new Error('MCP redirects are not followed'));
            return;
          }
          try {
            resolve(fetchResponse(incoming, target.url, init.method ?? 'GET', maximumBytes));
          } catch (error) {
            incoming.destroy();
            reject(error);
          }
        },
      );
      request.on('error', reject);
      request.end(init.body ? String(init.body) : undefined);
    });
  };
}
