import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('malformed project JSON never leaks its content through CLI errors', (t) => {
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-json-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const sentinel = 'PRIVATE_FIXTURE_SENTINEL=abcdefg';
  fs.writeFileSync(path.join(dir, 'checkpoint.json'), sentinel);
  fs.writeFileSync(path.join(dir, 'kit-manifest.json'), sentinel);
  for (const args of [
    ['resume', '--checkpoint', 'checkpoint.json', '--json'],
    ['doctor', '--json'],
    ['update-preview', '--json'],
    ['init', '--tool', 'codex'],
  ]) {
    const result = spawnSync(
      process.execPath,
      [path.resolve('dist/cli.js'), ...args, '--dest', dir],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /Invalid JSON record; source text omitted/);
    assert.doesNotMatch(result.stdout + result.stderr, /PRIVATE|abcdefg/);
  }
  assert.equal(fs.readFileSync(path.join(dir, 'kit-manifest.json'), 'utf8'), sentinel);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['checkpoint.json', 'kit-manifest.json']);
});
