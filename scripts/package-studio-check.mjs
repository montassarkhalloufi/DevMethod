import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { installArchive, runNpm } from './package-npm.mjs';
import { checkPackedStudio } from './package-studio-smoke.mjs';
import { checkPackedReact } from './package-react-smoke.mjs';

const [studioArchive, methodArchive] = process.argv.slice(2);
if (!studioArchive || !methodArchive)
  throw new Error('Usage: npm run test:package:studio -- STUDIO_TGZ METHOD_TGZ');
const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-studio-package-'));

function help(cli, args) {
  const result = spawnSync(process.execPath, [cli, ...args, '--help'], {
    encoding: 'utf8',
    timeout: 30000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /devmethod-studio/);
  return result.stdout;
}

try {
  const consumer = path.join(root, 'consumer');
  const pkg = installArchive(studioArchive, consumer, 'devmethod-studio');
  assert.equal(fs.existsSync(path.join(consumer, 'node_modules/devmethod-ai')), false);
  const metadata = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json')));
  const direct = help(path.join(pkg, metadata.bin['devmethod-studio']), []);
  assert.match(
    runNpm(['exec', '--offline', '--yes=false', '--', 'devmethod-studio', '--help'], consumer),
    /devmethod-studio/,
  );
  const runtime = path.join(pkg, 'build');
  await checkPackedStudio(runtime, path.join(root, 'studio'));
  await checkPackedReact(path.join(root, 'react-studio'), runtime);
  runNpm(
    [
      'install',
      '--ignore-scripts',
      '--offline',
      '--no-audit',
      '--no-fund',
      path.resolve(methodArchive),
    ],
    consumer,
  );
  const forwarded = help(path.join(consumer, 'node_modules/devmethod-ai/dist/cli.js'), ['studio']);
  assert.equal(forwarded, direct);
  console.log(
    'Standalone Studio and explicit method + Studio installation passed. No automatic installation or provider call.',
  );
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
