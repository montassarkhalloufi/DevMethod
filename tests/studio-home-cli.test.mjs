import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execute = promisify(execFile);
const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const signalOptions = {
  skip:
    process.platform === 'win32' &&
    'Windows process.kill does not provide graceful POSIX signal delivery.',
};

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

function launch(args) {
  const child = spawn(process.execPath, [cli, 'studio', ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '',
    stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const ended = new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Studio CLI did not announce its runtime: ' + stderr));
    }, 10000);
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', () => {
      clearTimeout(timeout);
      reject(new Error('Studio CLI exited before startup: ' + stderr));
    });
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      try {
        const runtime = JSON.parse(stdout);
        clearTimeout(timeout);
        resolve(runtime);
      } catch {
        /* Wait for the complete JSON runtime. */
      }
    });
  });
  return {
    ready,
    async stop(signal = 'SIGTERM') {
      if (child.exitCode !== null || child.signalCode !== null) return ended;
      const force = setTimeout(() => child.kill('SIGKILL'), 5000);
      child.kill(signal);
      try {
        return await ended;
      } finally {
        clearTimeout(force);
      }
    },
  };
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-home-cli-'));
  const children = [];
  t.after(async () => {
    await Promise.all(children.map((child) => child.stop()));
    fs.rmSync(root, { recursive: true, force: true });
  });
  return {
    root,
    launch(args) {
      const child = launch(args);
      children.push(child);
      return child;
    },
  };
}

test(
  'studio home CLI opens a real temporary library and SIGINT closes its owned project',
  signalOptions,
  async (t) => {
    const f = fixture(t),
      directory = path.join(f.root, 'library');
    const child = f.launch(['home', '--workspace', directory, '--port', '0']);
    const runtime = await child.ready;
    assert.deepEqual(Object.keys(runtime).sort(), ['directory', 'url']);
    assert.equal(runtime.directory, directory);
    assert.match(runtime.url, /^http:\/\/127\.0\.0\.1:\d+$/);
    assert.deepEqual(await (await fetch(runtime.url + '/api/home')).json(), {
      projects: [],
      limits: { projects: 200 },
    });

    async function post(route, body) {
      const response = await fetch(runtime.url + '/api/home/' + route, {
        method: 'POST',
        headers: { Origin: runtime.url, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 200);
      return response.json();
    }

    const { project } = await post('projects', {
      requestId: randomUUID(),
      kind: 'new',
      name: 'CLI fixture',
    });
    const opened = await post('open', { id: project.id });
    assert.equal((await fetch(opened.url + '/api/state')).status, 200);
    assert.equal(fs.existsSync(path.join(project.workspace, '.devmethod/studio.lock')), true);
    assert.deepEqual(await child.stop('SIGINT'), { code: 0, signal: null });
    assert.equal(fs.existsSync(path.join(directory, 'home.lock')), false);
    assert.equal(fs.existsSync(path.join(project.workspace, '.devmethod/studio.lock')), false);
    assert.equal(fs.existsSync(path.join(project.workspace, '.devmethod/runtime.json')), false);
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(directory, 'home.json'))).projects[0].id,
      project.id,
    );
  },
);

test(
  'workspace shorthand and explicit serve keep the direct project CLI and status contract',
  signalOptions,
  async (t) => {
    const f = fixture(t);
    for (const command of [[], ['serve']]) {
      const workspace = path.join(f.root, command.length ? 'explicit' : 'shorthand');
      const child = f.launch([
        ...command,
        '--workspace',
        workspace,
        '--port',
        '0',
        '--preview-port',
        '0',
      ]);
      const runtime = await child.ready;
      assert.equal(runtime.workspace, workspace);
      assert.equal(runtime.homeUrl, undefined);
      assert.equal(runtime.token, undefined);
      assert.equal(runtime.agent.automatic, false);
      const status = await run(['status', '--workspace', workspace]);
      assert.equal(status.code, 0, status.stderr);
      assert.deepEqual(
        JSON.parse(status.stdout),
        await (await fetch(runtime.url + '/api/state')).json(),
      );
      assert.deepEqual(await child.stop(), { code: 0, signal: null });
      assert.equal(fs.existsSync(path.join(workspace, '.devmethod/studio.lock')), false);
    }
  },
);

test('home CLI rejects project-only options and missing project workspaces before creating a library', async (t) => {
  const f = fixture(t),
    directory = path.join(f.root, 'not-created');
  for (const option of [
    ['--agent', 'codex'],
    ['--preview-port', '0'],
    ['--max-jobs', '1'],
    ['--timeout-ms', '5000'],
    ['--source', f.root],
    ['--file', path.join(f.root, 'payload.json')],
    ['--worker', 'fixture'],
    ['--dry-run'],
    ['--delegate-technical'],
  ]) {
    const result = await run(['home', '--workspace', directory, ...option]);
    assert.equal(result.code, 1, option.join(' '));
    assert.match(result.stderr, /accueil Studio n’accepte pas/);
  }
  const implicit = await run(['--agent', 'codex']);
  assert.equal(implicit.code, 1);
  assert.match(implicit.stderr, /accueil Studio n’accepte pas.*--agent/);
  for (const command of ['serve', 'status', 'import']) {
    const result = await run([command]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /--workspace.*absolu/);
  }
  const relative = await run(['home', '--workspace', 'relative-library']);
  assert.equal(relative.code, 1);
  assert.match(relative.stderr, /--workspace.*absolu/);
  assert.deepEqual(fs.readdirSync(f.root), []);
});

test('home help and direct import remain available without starting a default library', async (t) => {
  const f = fixture(t),
    source = path.join(f.root, 'source'),
    workspace = path.join(f.root, 'imported');
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'main.py'), 'print("kept")\n');
  const help = await run(['--help']);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /Accueil : devmethod studio/);
  assert.match(help.stdout, /home : \[--workspace \/bibliothèque\]/);
  const inspected = await run([
    'import',
    '--source',
    source,
    '--workspace',
    workspace,
    '--dry-run',
  ]);
  assert.equal(inspected.code, 0, inspected.stderr);
  assert.equal(JSON.parse(inspected.stdout).dryRun, true);
  assert.equal(fs.existsSync(workspace), false);
  assert.equal(fs.readFileSync(path.join(source, 'main.py'), 'utf8'), 'print("kept")\n');
  assert.deepEqual(fs.readdirSync(f.root), ['source']);
});
