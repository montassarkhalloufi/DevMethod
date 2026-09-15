import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

/** Exercise the extracted package, including scorer resources and persistent state across processes. */
export function checkPackedGuard(call, workspace, session) {
  const common = ['--dest', workspace, '--mission', 'mission.json', '--session', session];
  const invoke = (command, extra = [], code = 0) =>
    JSON.parse(call(['guard', '--command', command, ...common, ...extra], code));
  fs.writeFileSync(path.join(workspace, 'report.json'), JSON.stringify({ format: 1, runs: [] }));
  fs.mkdirSync(path.join(workspace, 'artifacts'));
  assert.equal(invoke('/implement').status, 'implementation-ready');
  const inputs = ['--report', 'report.json', '--artifacts', 'artifacts'];
  assert.equal(invoke('/verify', inputs, 1).status, 'verification-failed');
  const stopped = invoke(
    '/verify',
    [
      ...inputs,
      '--diagnosis',
      'Native observations absent',
      '--adjustment',
      'Checked available evidence',
    ],
    1,
  );
  assert.equal(stopped.reason, 'repeated-failure-signature');
  const frozen = fs.readFileSync(path.join(session, 'context.json'));
  fs.unlinkSync(path.join(workspace, 'report.json'));
  assert.equal(invoke('/integrate', [], 1).status, 'human-intervention');
  assert.deepEqual(fs.readFileSync(path.join(session, 'context.json')), frozen);
  assert.equal(JSON.parse(fs.readFileSync(path.join(session, 'state.json'))).attempts.length, 2);
}
