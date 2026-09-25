import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execute = promisify(execFile);
const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));

async function run(args) {
  try {
    return {
      code: 0,
      ...(await execute(process.execPath, [cli, 'studio', ...args], { timeout: 10000 })),
    };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-import-cli-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('studio import CLI inspects without writing then imports a project with no DevMethod files', async (t) => {
  const root = fixture(t),
    source = path.join(root, 'original source'),
    workspace = path.join(root, 'new workspace');
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'main.py'), 'print("existing")\n');
  const args = ['import', '--source', source, '--workspace', workspace];
  const inspected = await run([...args, '--dry-run']);
  assert.equal(inspected.code, 0, inspected.stderr);
  assert.equal(JSON.parse(inspected.stdout).dryRun, true);
  assert.equal(fs.existsSync(workspace), false);
  const imported = await run(args);
  assert.equal(imported.code, 0, imported.stderr);
  assert.equal(JSON.parse(imported.stdout).profile, 'source-only');
  const state = JSON.parse(fs.readFileSync(path.join(workspace, '.devmethod/studio.json'), 'utf8'));
  assert.deepEqual([state.jobs, state.checks, state.decisions], [[], [], []]);
  assert.equal(state.import.inventory.included, 1);
  assert.equal(fs.readFileSync(path.join(source, 'main.py'), 'utf8'), 'print("existing")\n');
  const repeated = await run(args);
  assert.equal(repeated.code, 1);
  assert.match(repeated.stderr, /vide/);
});

test('studio import CLI documents flags and refuses import-only flags on other operations', async (t) => {
  const root = fixture(t);
  const help = await run(['--help']);
  assert.match(help.stdout, /Import : --source/);
  assert.match(help.stdout, /--dry-run/);
  const rejected = await run(['serve', '--workspace', root, '--dry-run']);
  assert.equal(rejected.code, 1);
  assert.match(rejected.stderr, /réservés à import/);
  assert.deepEqual(fs.readdirSync(root), []);
});

test('connector CLI uses exact read/probe/result routes and bounds file payloads before posting', async (t) => {
  const root = fixture(t),
    seen = [];
  const server = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    seen.push({
      path: request.url,
      method: request.method,
      authorization: request.headers.authorization,
      body: Buffer.concat(chunks).toString('utf8'),
    });
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ ok: true }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  fs.mkdirSync(path.join(root, '.devmethod'));
  fs.writeFileSync(
    path.join(root, '.devmethod/runtime.json'),
    JSON.stringify({
      url: 'http://127.0.0.1:' + server.address().port,
      token: 'fixture-worker-token',
    }),
  );
  const file = path.join(root, 'payload.json');
  fs.writeFileSync(file, JSON.stringify({ connectorId: 'local-test' }));
  for (const command of ['connectors', 'connector-probe', 'connector-result']) {
    const result = await run([
      command,
      '--workspace',
      root,
      ...(command === 'connectors' ? [] : ['--file', file]),
    ]);
    assert.equal(result.code, 0, result.stderr);
  }
  assert.deepEqual(
    seen.map((entry) => [entry.method, entry.path]),
    [
      ['GET', '/api/connectors'],
      ['POST', '/api/connectors/probe'],
      ['POST', '/api/connectors/results'],
    ],
  );
  for (const request of seen.slice(1)) {
    assert.equal(request.authorization, 'Bearer fixture-worker-token');
    assert.deepEqual(JSON.parse(request.body), { connectorId: 'local-test' });
  }
  for (const command of ['connector-probe', 'connector-result']) {
    assert.equal((await run([command, '--workspace', root])).code, 1);
    fs.writeFileSync(file, 'x'.repeat(65537));
    const tooLarge = await run([command, '--workspace', root, '--file', file]);
    assert.equal(tooLarge.code, 1);
    assert.match(tooLarge.stderr, /65536 octets/);
  }
  assert.equal(seen.length, 3);
});
