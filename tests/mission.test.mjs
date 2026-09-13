import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { captureContext, inspectContext, validateMission, missionStatus } from '../dist/mission.js';
import { gitState, discover } from '../dist/records.js';
import { inspectCheckpoint } from '../dist/checkpoint.js';
import { createHash } from 'node:crypto';
const hash = b => createHash('sha256').update(b).digest('hex');
const cli = path.resolve('dist/cli.js');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-mission-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  fs.writeFileSync(path.join(root, 'contract.md'), 'Titles contain 1 to 120 characters.');
  fs.writeFileSync(path.join(root, 'check.log'), 'passed');
  git('init'); git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture');
  const mission = { format: 1, id: 'TASK-1', path: 'quick', outcome: 'Reject empty titles', scope: ['Title validation'], exclusions: ['Publication'], invariants: ['Preserve API'], uncertainties: [], owner: 'fixture', status: 'active', nextAction: 'Review title validation', stopConditions: ['Acceptance passes'], acceptance: [{ id: 'AC1', description: 'Reject empty titles', changes: ['contract.md'], verification: 'node --test', kind: 'automated' }], sources: [{ id: 'contract', path: 'contract.md', level: 'domain', reason: 'Defines validation', authority: 'Accepted API contract for task titles', kind: 'accepted-decision', revision: git('rev-parse', 'HEAD') }], dependencies: [], contradictions: [] };
  return { root, git, mission };
}
test('mission context retains provenance without source bodies and detects changed contracts', t => {
  const { root, mission } = fixture(t);
  const context = captureContext(root, mission);
  assert.equal(inspectContext(root, context).status, 'ready');
  assert.ok(!JSON.stringify(context).includes('Titles contain'));
  fs.writeFileSync(path.join(root, 'contract.md'), 'Allow any title');
  const report = inspectContext(root, context);
  assert.equal(report.status, 'reverify'); assert.equal(report.sources[0].state, 'changed');
  assert.equal(report.gitChanged, true);
});
test('Git changes include dirty-to-dirty edits and branch changes; complete never gains a next action', t => {
  const { root, mission, git } = fixture(t);
  fs.writeFileSync(path.join(root, 'check.log'), 'dirty A'); const state = gitState(root);
  fs.writeFileSync(path.join(root, 'check.log'), 'dirty B'); assert.notEqual(gitState(root).diffSha256, state.diffSha256);
  mission.status = 'complete'; mission.nextAction = null;
  const context = captureContext(root, mission); git('checkout', '-b', 'another');
  const report = inspectContext(root, context); assert.equal(report.status, 'reverify'); assert.equal(report.nextAction, null);
});
test('dependencies and declared contradictions block without modifying records', t => {
  const { root, mission } = fixture(t);
  mission.dependencies.push({ id: 'API', owner: 'contract-owner', status: 'blocked', detail: 'Waiting for API decision' });
  assert.equal(missionStatus(validateMission(mission)), 'blocked');
  assert.equal(inspectContext(root, captureContext(root, mission)).status, 'blocked');
  mission.dependencies = []; mission.sources.push({ ...mission.sources[0], id: 'code', path: 'check.log', kind: 'fact' });
  mission.contradictions.push({ sourceIds: ['contract', 'code'], detail: 'Code disagrees with contract', resolved: false });
  assert.equal(missionStatus(validateMission(mission)), 'blocked');
});
test('secret paths, credential text, symlinks, oversized sources and tampered pins fail closed', t => {
  const { root, mission } = fixture(t);
  for (const file of ['.env', '.env.local', '../outside', '/etc/passwd', '.git/config', 'credentials.json', 'NUL', 'a\\b']) {
    const value = structuredClone(mission); value.sources[0].path = file; assert.throws(() => captureContext(root, value));
  }
  const context = captureContext(root, mission); context.sources[0].reason = 'tampered'; assert.throws(() => inspectContext(root, context));
  fs.writeFileSync(path.join(root, 'contract.md'), 'token = "12345678901234567890123456789"'); assert.throws(() => captureContext(root, mission));
  fs.writeFileSync(path.join(root, 'contract.md'), 'x'.repeat(256 * 1024 + 1)); assert.throws(() => captureContext(root, mission));
  fs.unlinkSync(path.join(root, 'contract.md')); fs.symlinkSync('check.log', path.join(root, 'contract.md')); assert.throws(() => captureContext(root, mission));
});
test('discovery omits secret paths; CLI never executes verification strings and rejects unrelated flags', t => {
  const { root, mission, git } = fixture(t);
  fs.writeFileSync(path.join(root, '.env'), 'private'); git('add', '.env');
  assert.ok(!discover(root).includes('.env'));
  mission.acceptance[0].verification = 'touch SHOULD-NOT-EXIST';
  fs.writeFileSync(path.join(root, 'mission.json'), JSON.stringify(mission));
  const run = (...args) => spawnSync(process.execPath, [cli, ...args, '--dest', root], { encoding: 'utf8' });
  const result = run('mission', '--mission', 'mission.json', '--json'); assert.equal(result.status, 0); assert.equal(JSON.parse(result.stdout).status, 'ready');
  assert.equal(fs.existsSync(path.join(root, 'SHOULD-NOT-EXIST')), false);
  for (const args of [['context'], ['discover', '--mission', 'mission.json'], ['doctor', '--context', 'x'], ['plan', '--tool', 'codex']]) assert.equal(run(...args).status, 2);
});
test('checkpoint extensions preserve legacy pins, blocked outcome, and selective Git reassessment', t => {
  const { root, git } = fixture(t);
  const checkpoint = { format: 1, scope: 'Title', status: 'active', nextAction: 'Review', sources: [{ id: 'contract', path: 'contract.md', sha256: hash(fs.readFileSync(path.join(root, 'contract.md'))) }], evidence: [{ id: 'check', path: 'check.log', sha256: hash('passed'), sourceIds: ['contract'], dependsOn: [], outcome: 'passed', criterionIds: ['AC1'], kind: 'automated', revision: 'fixture' }], git: gitState(root) };
  assert.equal(inspectCheckpoint(root, checkpoint).status, 'ready'); git('checkout', '-b', 'changed');
  const report = inspectCheckpoint(root, checkpoint); assert.equal(report.status, 'reverify'); assert.equal(report.evidence[0].state, 'valid');
  delete checkpoint.git; checkpoint.evidence[0].outcome = 'blocked'; assert.equal(inspectCheckpoint(root, checkpoint).status, 'blocked');
  checkpoint.evidence[0].outcome = 'passed'; checkpoint.blockers = ['API dependency unresolved']; assert.equal(inspectCheckpoint(root, checkpoint).status, 'blocked');
});

test('Git provenance cannot execute repository fsmonitor or clean filters', t => {
  const { root, git } = fixture(t);
  const marker = path.join(root, 'SIDE-EFFECT');
  const hook = path.join(root, 'hook.cjs');
  fs.writeFileSync(hook, `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'executed');`);
  const command = `"${process.execPath.replaceAll('\\', '/')}" "${hook.replaceAll('\\', '/')}"`;
  git('config', 'core.fsmonitor', command);
  git('config', 'filter.fixture.clean', command);
  fs.writeFileSync(path.join(root, '.gitattributes'), 'contract.md filter=fixture\n');
  fs.writeFileSync(path.join(root, 'contract.md'), 'changed to trigger content comparison');
  gitState(root);
  assert.equal(fs.existsSync(marker), false);
});

test('unknown mission/source properties are omitted from generated context', t => {
  const { root, mission } = fixture(t);
  mission.credentials = 'DO-NOT-COPY'; mission.sources[0].content = 'DO-NOT-COPY';
  const context = captureContext(root, mission);
  assert.equal(JSON.stringify(context).includes('DO-NOT-COPY'), false);
});
