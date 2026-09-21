import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const toolName = /^[A-Za-z0-9_.-]{1,128}$/;
const properties = {
  connectionId: { type: 'string', format: 'uuid' },
  toolName: { type: 'string', pattern: toolName.source },
  requestId: { type: 'string', format: 'uuid' },
  arguments: { type: 'object' },
};
const tools = [
  {
    name: 'studio_tools',
    description: 'Inspect selected tools and their current permissions; no invocation or approval.',
    fields: ['connectionId', 'toolName'],
    required: ['connectionId'],
  },
  {
    name: 'studio_call',
    description:
      'Request a tool action. Preserve requestId for identical retries; pending is not success. This tool cannot grant approval.',
    fields: ['connectionId', 'toolName', 'arguments', 'requestId'],
    required: ['connectionId', 'toolName', 'arguments', 'requestId'],
  },
  {
    name: 'studio_actions',
    description: 'Read action status; unknown outcomes must not be blindly retried.',
    fields: ['requestId'],
    required: [],
  },
];
const failure = (message) => ({
  content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
  isError: true,
});

function configuration(env) {
  const value = env.DEVMETHOD_NATIVE_TOOLS_URL;
  const match =
    typeof value === 'string' && /^http:\/\/127\.0\.0\.1:(\d+)\/[^?#\s\\]*$/.exec(value);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 65535)
    throw new Error('Invalid local tool bridge configuration.');
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash || !url.pathname.endsWith('/'))
    throw new Error('Invalid local tool bridge configuration.');
  const token = env.DEVMETHOD_NATIVE_TOOLS_TOKEN;
  if (
    typeof token !== 'string' ||
    !token.length ||
    token.length > 1024 ||
    /[^\x21-\x7e]/.test(token)
  )
    throw new Error('Invalid local tool bridge credentials.');
  return { url: url.href, token };
}

function validInput(definition, input) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !definition.fields.includes(key)) ||
    definition.required.some((key) => !Object.hasOwn(input, key))
  )
    return false;
  if (
    input.connectionId !== undefined &&
    (typeof input.connectionId !== 'string' || !uuid.test(input.connectionId))
  )
    return false;
  if (
    input.requestId !== undefined &&
    (typeof input.requestId !== 'string' || !uuid.test(input.requestId))
  )
    return false;
  if (
    input.toolName !== undefined &&
    (typeof input.toolName !== 'string' || !toolName.test(input.toolName))
  )
    return false;
  return (
    input.arguments === undefined ||
    (input.arguments !== null &&
      typeof input.arguments === 'object' &&
      !Array.isArray(input.arguments))
  );
}

async function responseBody(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Invalid response');
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 256 * 1024) throw new Error('Oversized response');
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

export function createNativeToolsServer({ env = process.env, timeoutMs = 30000 } = {}) {
  const config = configuration(env);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000)
    throw new Error('Invalid local tool timeout.');
  const server = new Server(
    { name: 'devmethod-native-tools', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(({ name, description, fields, required }) => ({
      name,
      description,
      inputSchema: {
        type: 'object',
        properties: Object.fromEntries(fields.map((field) => [field, properties[field]])),
        required,
        additionalProperties: false,
      },
    })),
  }));
  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    const definition = tools.find((entry) => entry.name === params.name);
    const input = params.arguments ?? {};
    if (!definition || !validInput(definition, input))
      return failure(
        'Invalid tool name or arguments. Job identity and approvals are server-controlled.',
      );
    const body = JSON.stringify(input);
    if (Buffer.byteLength(body) > 256 * 1024)
      return failure('Tool arguments exceed the local transport limit.');
    try {
      const response = await fetch(new URL(params.name.slice(7), config.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.token}` },
        body,
        redirect: 'error',
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        await response.body?.cancel();
        return failure(`Local tool bridge refused the request (HTTP ${response.status}).`);
      }
      const result = await responseBody(response);
      const text = JSON.stringify(result, (_key, value) =>
        typeof value === 'string'
          ? value.replaceAll(config.token, '[redacted]').replaceAll(config.url, '[local bridge]')
          : value,
      );
      const structuredContent = JSON.parse(text);
      return {
        content: [{ type: 'text', text }],
        ...(structuredContent &&
        typeof structuredContent === 'object' &&
        !Array.isArray(structuredContent)
          ? { structuredContent }
          : {}),
        isError: result?.isError === true || result?.result?.isError === true,
      };
    } catch {
      return failure(
        'Local tool request failed, timed out or returned an invalid response. Its effect may be unknown; do not retry blindly.',
      );
    }
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await createNativeToolsServer().connect(
      new StdioServerTransport(process.stdin, process.stdout, { maxBufferSize: 512 * 1024 }),
    );
  } catch {
    process.stderr.write('Local tool bridge could not start. Check its scoped configuration.\n');
    process.exitCode = 1;
  }
}
