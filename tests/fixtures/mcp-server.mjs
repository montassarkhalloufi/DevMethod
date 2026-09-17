import http from 'node:http';
import { createHash, randomUUID } from 'node:crypto';

function json(response, status, value, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  response.end(JSON.stringify(value));
}

async function requestBody(request) {
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 65536) throw new Error('body');
  }
  return raw;
}

function metadata(pathname, origin, state) {
  if (pathname.includes('/.well-known/oauth-protected-resource'))
    return {
      resource: origin + '/mcp',
      authorization_servers: [origin],
      scopes_supported: ['fixture'],
    };
  if (pathname.includes('/.well-known/oauth-authorization-server'))
    return {
      issuer: origin,
      authorization_endpoint: origin + '/authorize',
      token_endpoint: state.tokenEndpoint ?? origin + '/token',
      registration_endpoint: origin + '/register',
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['none'],
      code_challenge_methods_supported: ['S256'],
    };
  return null;
}

function tokenReply(raw, state, response) {
  const input = new URLSearchParams(raw);
  if (input.get('grant_type') === 'refresh_token') {
    state.refreshes++;
    if (input.get('refresh_token') !== state.refresh || state.denied)
      return json(response, 400, {
        error: 'invalid_grant',
        error_description: 'private-error-sentinel',
      });
    state.access += '-rotated';
    state.refresh += '-rotated';
  } else {
    state.tokens++;
    const challenge = createHash('sha256')
      .update(input.get('code_verifier') ?? '')
      .digest('base64url');
    if (
      input.get('code') !== state.code ||
      challenge !== state.authorization?.code_challenge ||
      input.get('redirect_uri') !== state.authorization?.redirect_uri
    )
      return json(response, 400, { error: 'invalid_grant' });
  }
  return json(response, 200, {
    access_token: state.access,
    refresh_token: state.refresh,
    token_type: 'Bearer',
    expires_in: 60,
  });
}

function listReply(message, state) {
  state.listed++;
  if (state.listError) return { error: { code: -32603, message: 'private-error-sentinel' } };
  const second = message.params?.cursor === 'second';
  const tools = state.malformed
    ? [{ name: 'bad', inputSchema: {} }]
    : state.tools.slice(second ? 1 : 0, second ? undefined : 1);
  return {
    result: { tools, ...(!second && state.tools.length > 1 ? { nextCursor: 'second' } : {}) },
  };
}

function protocolReply(message, state) {
  const envelope = { jsonrpc: '2.0', id: message.id };
  if (message.method === 'initialize') {
    state.initialized++;
    return {
      ...envelope,
      result: {
        protocolVersion: '2025-11-25',
        capabilities: { tools: {} },
        serverInfo: { name: 'Real local MCP fixture', version: '1.0.0' },
      },
    };
  }
  if (message.method === 'tools/list') return { ...envelope, ...listReply(message, state) };
  if (message.method === 'tools/call') {
    state.calls++;
    return {
      ...envelope,
      result: {
        content: [{ type: 'text', text: 'Fixture result' }],
        isError: Boolean(state.toolError),
      },
    };
  }
  return { ...envelope, error: { code: -32601, message: 'Not supported by fixture' } };
}

function mcpReply(request, response, url, raw, origin, state) {
  if (!['/mcp', '/messages'].includes(url.pathname)) return json(response, 404, {});
  if (state.redirect) {
    response.writeHead(302, { Location: state.redirect });
    response.end();
    return;
  }
  if (state.hang) return;
  if (state.auth !== 'none' && request.headers.authorization !== `Bearer ${state.access}`)
    return json(
      response,
      401,
      { error: 'private-error-sentinel' },
      {
        'WWW-Authenticate': `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
      },
    );
  if (state.sse && url.pathname === '/mcp') {
    if (request.method !== 'GET') return json(response, 405, {});
    response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
    state.stream = response;
    response.write('event: endpoint\ndata: /messages?session=fixture\n\n');
    return;
  }
  if (request.method === 'GET') return json(response, 405, {});
  const message = JSON.parse(raw);
  if (!Object.hasOwn(message, 'id')) {
    response.writeHead(202);
    response.end();
    return;
  }
  const reply = protocolReply(message, state);
  if (state.sse) {
    state.stream.write('event: message\ndata: ' + JSON.stringify(reply) + '\n\n');
    response.writeHead(202);
    response.end();
    return;
  }
  return json(response, 200, reply);
}

async function serve(request, response, origin, state) {
  const url = new URL(request.url, origin),
    discovered = metadata(url.pathname, origin, state);
  if (discovered) return json(response, 200, discovered);
  if (url.pathname === '/authorize') {
    state.authorization = Object.fromEntries(url.searchParams);
    const callback = new URL(url.searchParams.get('redirect_uri'));
    state.code = randomUUID();
    callback.searchParams.set('state', url.searchParams.get('state'));
    callback.searchParams.set('code', state.code);
    response.writeHead(302, { Location: callback.href });
    response.end();
    return;
  }
  const raw = await requestBody(request);
  if (url.pathname === '/register') {
    state.registers++;
    state.registration = JSON.parse(raw);
    return json(response, 201, { ...state.registration, client_id: 'fixture-client' });
  }
  if (url.pathname === '/token') return tokenReply(raw, state, response);
  return mcpReply(request, response, url, raw, origin, state);
}

export async function mockMcpServer(t, auth = 'none') {
  const state = {
    auth,
    access: 'fixture-access-secret',
    refresh: 'fixture-refresh-secret',
    registers: 0,
    tokens: 0,
    refreshes: 0,
    initialized: 0,
    listed: 0,
    calls: 0,
    denied: false,
    listError: false,
    malformed: false,
    redirect: null,
    tools: [
      {
        name: 'fixture.read',
        description: 'Read fixture data',
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string' } },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'fixture_write',
        description: 'Fixture write tool, never called by discovery',
        inputSchema: { type: 'object' },
      },
    ],
  };
  let origin;
  const server = http.createServer((request, response) => {
    serve(request, response, origin, state).catch(() => {
      if (!response.headersSent) json(response, 400, {});
      else response.end();
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  return { origin, url: origin + '/mcp', state };
}
