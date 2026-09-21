import { parentPort, workerData } from 'node:worker_threads';
import Ajv from 'ajv';
import Ajv2019 from 'ajv/dist/2019.js';
import Ajv2020 from 'ajv/dist/2020.js';

try {
  const dialect = workerData.schema.$schema;
  const Provider =
    dialect === 'http://json-schema.org/draft-07/schema#'
      ? Ajv
      : dialect === 'https://json-schema.org/draft/2019-09/schema'
        ? Ajv2019
        : Ajv2020;
  // MCP defaults to 2020-12; older declared dialects are explicit. A new instance
  // prevents one connection's $id from reusing another provider's schema.
  const validator = new Provider({
    strictSchema: true,
    strictTypes: false,
    strictTuples: false,
    allErrors: false,
    validateFormats: false,
    ownProperties: true,
    logger: false,
  });
  const validate = validator.compile(workerData.schema);
  // Async/custom schemas must never turn a truthy Promise into accepted input.
  if (validate.$async) throw new Error('Unsupported async schema');
  parentPort.postMessage(validate(workerData.value) ? 'valid' : 'invalid');
} catch {
  // Never return provider schema text, arguments or library error strings.
  parentPort.postMessage('unsupported');
}
