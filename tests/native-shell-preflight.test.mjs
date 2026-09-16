import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { nativeArguments, nativeShellPreflight } from '../scripts/native-journey-smoke.mjs';

test('native arguments place both Node and zsh temporary files inside the assigned workspace', () => {
  const directory = path.resolve('fictional workspace');
  const args = nativeArguments(directory, ['/fictional/global-skill']);
  const setting = args.find((value) => value.startsWith('shell_environment_policy.set='));
  const temporary = path.join(directory, '.runtime/tmp');
  assert.ok(setting.includes(`TMPDIR=${JSON.stringify(temporary)}`));
  assert.ok(setting.includes(`TMPPREFIX=${JSON.stringify(path.join(temporary, 'zsh'))}`));
  const pinnedPath = [path.dirname(process.execPath), process.env.PATH]
    .filter(Boolean)
    .join(path.delimiter);
  assert.ok(setting.includes(`PATH=${JSON.stringify(pinnedPath)}`));
  assert.ok(args.includes('allow_login_shell=false'));
  assert.ok(args.includes('sandbox_workspace_write.exclude_slash_tmp=true'));
  assert.ok(args.includes('sandbox_workspace_write.exclude_tmpdir_env_var=true'));
  assert.equal(args.at(-1), '-');
});

test(
  'local shell preflight reproduces denied heredoc and verifies the bounded correction',
  { skip: process.platform !== 'darwin' },
  (t) => {
    const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'native-shell-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const result = nativeShellPreflight(directory);
    assert.equal(result.mode, 'local-shell-no-model');
    assert.equal(result.legacy.exit, 1);
    assert.equal(result.legacy.stdout, '');
    assert.match(
      result.legacy.stderr,
      /can't create temp file for here document: operation not permitted/,
    );
    assert.deepEqual(result.configured, {
      exit: 0,
      signal: null,
      stdout: 'heredoc-ok\n',
      stderr: '',
    });
    assert.equal(result.runtime.exit, 0);
    assert.deepEqual(result.runtime.observed, {
      version: process.version,
      executable: process.execPath,
    });
    assert.deepEqual(result.runtime.observed, result.runtime.expected);
    assert.deepEqual(fs.readdirSync(path.join(directory, '.runtime/tmp')), []);
  },
);
