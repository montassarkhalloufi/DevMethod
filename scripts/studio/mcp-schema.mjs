import { Worker } from 'node:worker_threads';
import { mcpError, mcpRequire } from './mcp-contract.mjs';

// Provider schemas are untrusted programs (notably their regular expressions).
// Keep compilation and validation off the HTTP event loop, with finite resources.
export function validateMcpArguments(schema, value, { signal, timeoutMs = 5000 } = {}) {
  mcpRequire(
    schema &&
      typeof schema === 'object' &&
      !Array.isArray(schema) &&
      Buffer.byteLength(JSON.stringify(schema)) <= 65536,
    'Schéma MCP absent ou trop volumineux.',
    422,
    'unsupported-schema',
  );
  mcpRequire(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Buffer.byteLength(JSON.stringify(value)) <= 65536,
    'Arguments MCP invalides.',
    400,
    'invalid-arguments',
  );
  mcpRequire(!signal?.aborted, 'Appel MCP annulé.', 409, 'cancelled');
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./mcp-schema-worker.mjs', import.meta.url), {
      workerData: { schema, value },
      stdout: true,
      stderr: true,
      resourceLimits: { maxOldGenerationSizeMb: 48, maxYoungGenerationSizeMb: 8, stackSizeMb: 2 },
    });
    worker.stdout.resume();
    worker.stderr.resume();
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      void worker.terminate();
      if (error) reject(error);
      else resolve();
    };
    const abort = () => finish(mcpError('Appel MCP annulé.', 409, 'cancelled'));
    const timer = setTimeout(
      () => finish(mcpError('Validation du schéma MCP trop coûteuse.', 422, 'unsupported-schema')),
      timeoutMs,
    );
    signal?.addEventListener('abort', abort, { once: true });
    worker.once('message', (status) => {
      if (status === 'valid') finish();
      else if (status === 'invalid')
        finish(
          mcpError(
            'Arguments incompatibles avec le schéma de cet outil MCP.',
            400,
            'invalid-arguments',
          ),
        );
      else
        finish(
          mcpError(
            'Ce schéma MCP ne peut pas être validé par ce client local.',
            422,
            'unsupported-schema',
          ),
        );
    });
    worker.once('error', () =>
      finish(mcpError('Validation du schéma MCP indisponible.', 422, 'unsupported-schema')),
    );
    worker.once('exit', () => {
      if (!settled)
        finish(mcpError('Validation du schéma MCP interrompue.', 422, 'unsupported-schema'));
    });
  });
}
