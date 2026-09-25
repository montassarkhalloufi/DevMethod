import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

export function runNpm(args, cwd) {
  const candidates = [
    process.env.npm_execpath,
    path.resolve(path.dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js'),
    path.resolve(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'),
  ];
  const npm = candidates.find((file) => file && fs.existsSync(file));
  assert.ok(npm, 'Run package checks through npm.');
  const result = spawnSync(process.execPath, [npm, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 120000,
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return result.stdout;
}

export function installArchive(archive, consumer, name, { offline = false } = {}) {
  fs.mkdirSync(consumer, { recursive: true });
  fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({ private: true }));
  runNpm(
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      ...(offline
        ? ['--offline', '--cache', path.join(consumer, 'empty-cache')]
        : ['--prefer-offline']),
      path.resolve(archive),
    ],
    consumer,
  );
  const pkg = path.join(consumer, 'node_modules', name);
  assert.equal(JSON.parse(fs.readFileSync(path.join(pkg, 'package.json'))).name, name);
  return pkg;
}
