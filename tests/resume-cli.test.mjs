import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const digest = text => createHash('sha256').update(text).digest('hex');
const cliPath = path.resolve('dist/cli.js');
function fixture(t) {
  const destination = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-resume-cli-'));
  t.after(() => fs.rmSync(destination, { force: true, recursive: true }));
  fs.writeFileSync(path.join(destination, 'source.txt'), 'source');
  fs.writeFileSync(path.join(destination, 'evidence.txt'), 'passed');
  const checkpoint = { format: 1, scope: 'Authorized test scope', status: 'active', nextAction: 'Review evidence',
    sources: [{ id: 'source', path: 'source.txt', sha256: digest('source') }],
    evidence: [{ id: 'check', path: 'evidence.txt', sha256: digest('passed'), sourceIds: ['source'], dependsOn: [], outcome: 'passed' }] };
  const save = () => fs.writeFileSync(path.join(destination, 'checkpoint.json'), JSON.stringify(checkpoint));
  save();
  const run = (args = []) => spawnSync(process.execPath, [cliPath, 'resume', '--dest', destination, '--checkpoint', 'checkpoint.json', ...args], { encoding: 'utf8' });
  return { destination, checkpoint, save, run };
}
test('resume CLI JSON is read-only and fails closed for all nonready statuses', t => {
  const { destination, checkpoint, save, run } = fixture(t);
  const before = fs.readdirSync(destination).map(name => [name, fs.readFileSync(path.join(destination, name), 'hex')]);
  let result = run(['--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, 'ready');
  assert.deepEqual(fs.readdirSync(destination).map(name => [name, fs.readFileSync(path.join(destination, name), 'hex')]), before);
  assert.match(run().stdout, /readiness does not grant execution permission/);
  checkpoint.status = 'complete'; checkpoint.nextAction = null; save();
  result = run(['--json']); assert.equal(result.status, 0); assert.equal(JSON.parse(result.stdout).status, 'complete');
  checkpoint.status = 'blocked'; checkpoint.nextAction = 'Resolve missing environment'; save();
  result = run(['--json']); assert.equal(result.status, 1); assert.equal(JSON.parse(result.stdout).status, 'blocked');
  checkpoint.status = 'active'; save();
  fs.appendFileSync(path.join(destination, 'source.txt'), 'changed');
  result = run(['--json']); assert.equal(result.status, 1); assert.equal(JSON.parse(result.stdout).status, 'reverify');
  fs.writeFileSync(path.join(destination, 'checkpoint.json'), '{invalid');
  result = run(['--json']); assert.equal(result.status, 1); assert.equal(JSON.parse(result.stdout).status, 'invalid');
});
test('resume CLI rejects irrelevant flags and missing checkpoint, and refuses unsafe paths', t => {
  const { destination, run } = fixture(t);
  for (const args of [['--tool', 'codex'], ['--modules', 'scoped-delivery'], ['--dry-run']]) assert.equal(run(args).status, 2);
  for (const args of [['resume'], ['resume', '--checkpoint', ''], ['doctor', '--checkpoint', 'checkpoint.json'], ['update-preview', '--checkpoint', 'checkpoint.json'], ['init', '--tool', 'codex', '--checkpoint', 'checkpoint.json']]) {
    assert.equal(spawnSync(process.execPath, [cliPath, ...args], { encoding: 'utf8', cwd: destination }).status, 2);
  }
  for (const checkpoint of ['../outside.json', '/etc/passwd']) {
    const result = spawnSync(process.execPath, [cliPath, 'resume', '--dest', destination, '--checkpoint', checkpoint, '--json'], { encoding: 'utf8' });
    assert.equal(result.status, 1); assert.equal(JSON.parse(result.stdout).status, 'invalid');
  }
  const result = spawnSync(process.execPath, [cliPath, 'resume', '--checkpoint', 'checkpoint.json', '--json'], { encoding: 'utf8', cwd: destination });
  assert.equal(result.status, 0); assert.equal(JSON.parse(result.stdout).destination, destination);
});
