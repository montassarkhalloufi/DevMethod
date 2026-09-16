// Experimental local product rehearsal. No provider dispatch or external service.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createAtelierServer } from './atelier/server.mjs';

const flags = process.argv.slice(2);
const allowed = new Set(['--workspace', '--project', '--port']);
if (flags.includes('--help')) {
  console.log(
    'node scripts/atelier.mjs [--workspace ABSOLUTE_PATH] [--project PROJECT_JSON] [--port 4318]',
  );
  process.exit(0);
}
const options = {};
for (let index = 0; index < flags.length; index += 2) {
  if (!allowed.has(flags[index]) || !flags[index + 1])
    throw new Error('Unknown or missing option. Use --help.');
  options[flags[index]] = flags[index + 1];
}
const workspace = options['--workspace'] ?? path.join(os.tmpdir(), 'devmethod-atelier');
if (!path.isAbsolute(workspace)) throw new Error('Use an absolute workspace path.');
const projectFile =
  options['--project'] ?? fileURLToPath(new URL('./atelier/gazette.json', import.meta.url));
const project = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
const port = Number(options['--port'] ?? '4318');
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('Use a port from 1024 to 65535.');
const server = createAtelierServer({ workspace, project });
server.on('error', (error) => {
  console.error(error.message);
  server.close();
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log('DevMethod Atelier: http://127.0.0.1:' + port);
  console.log('Local state: ' + workspace + ' — no agent/provider connected automatically.');
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
