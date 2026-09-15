import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { inspectClosure } from '../dist/closure.js';
import { inspectLoop } from '../dist/loop.js';
import { digest, gitState } from '../dist/records.js';
const cli = path.resolve('dist/cli.js');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-closure-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (p, text) => fs.writeFileSync(path.join(root, p), text);
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  write('.gitignore', 'checkpoint.json\nloop.json\n'); write('contract.md', 'Do not allocate a full slot.');
  write('check.log', '1 pass'); write('code.ts', 'export const remaining = 0;');
  const mission = { format: 1, id: 'RESERVE', path: 'standard', owner: 'fixture', outcome: 'Prevent excess bookings',
    scope: ['Reservation'], exclusions: ['Publish'], invariants: ['Capacity'], uncertainties: [], status: 'active',
    nextAction: 'Review evidence', stopConditions: ['Criteria verified'], dependencies: [], contradictions: [],
    acceptance: [{ id: 'AC1', description: 'Reject allocation when full', changes: ['code.ts'], verification: 'DO NOT EXECUTE THIS STRING', kind: 'automated' }],
    sources: [{ id: 'contract', path: 'contract.md', level: 'domain', reason: 'Capacity rule', authority: 'Fixture contract', kind: 'accepted-decision', revision: 'fixture' }] };
  write('mission.json', JSON.stringify(mission));
  git('init'); git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Fixture');
  const pin = (id, p) => ({ id, path: p, sha256: digest(fs.readFileSync(path.join(root, p))) });
  const checkpoint = { format: 1, scope: 'Reservation', status: 'active', nextAction: 'Review', git: gitState(root),
    sources: [pin('mission', 'mission.json'), pin('contract', 'contract.md'), pin('code', 'code.ts')],
    evidence: [{ ...pin('check', 'check.log'), sourceIds: ['mission', 'contract', 'code'], dependsOn: [], outcome: 'passed', criterionIds: ['AC1'], kind: 'automated', revision: git('rev-parse', 'HEAD') }] };
  const save = () => write('checkpoint.json', JSON.stringify(checkpoint)); save();
  return { root, write, mission, checkpoint, save, git };
}
test('closure maps criteria to current pinned typed evidence without changing records', t => {
  const { root } = fixture(t);
  const before = fs.readFileSync(path.join(root, 'checkpoint.json'));
  const r = inspectClosure(root, 'mission.json', 'checkpoint.json');
  assert.equal(r.status, 'supported'); assert.deepEqual(r.criteria[0].evidenceIds, ['check']);
  assert.match(r.limitations, /No commands executed/);
  assert.deepEqual(fs.readFileSync(path.join(root, 'checkpoint.json')), before);
});
test('green unrelated checks cannot close an uncovered user criterion', t => {
  const { root, checkpoint, save } = fixture(t);
  checkpoint.evidence[0].criterionIds = ['UNKNOWN']; save();
  const r = inspectClosure(root, 'mission.json', 'checkpoint.json');
  assert.equal(r.status, 'unmet'); assert.equal(r.criteria[0].status, 'unmet');
  assert.ok(r.findings.some(f => f.code === 'unknown-criterion'));
});
test('kind, inspected revision and changed-file dependencies cannot be substituted', t => {
  const { root, checkpoint, save } = fixture(t); const original = structuredClone(checkpoint.evidence[0]);
  for (const patch of [{ kind: 'recommendation' }, { revision: 'old' }, { sourceIds: ['contract'] }, { sourceIds: ['code', 'contract'] }]) {
    checkpoint.evidence[0] = { ...original, ...patch }; save();
    assert.equal(inspectClosure(root, 'mission.json', 'checkpoint.json').status, 'unmet');
  }
});
test('complete labels cannot bypass changed code, failed evidence or blocked dependencies', t => {
  const { root, checkpoint, save, write } = fixture(t);
  checkpoint.status = 'complete'; checkpoint.nextAction = null;
  checkpoint.evidence[0].outcome = 'failed'; save();
  assert.equal(inspectClosure(root, 'mission.json', 'checkpoint.json').status, 'reverify');
  checkpoint.evidence[0].outcome = 'passed'; checkpoint.blockers = ['Environment unavailable']; save();
  assert.equal(inspectClosure(root, 'mission.json', 'checkpoint.json').status, 'blocked');
  checkpoint.blockers = []; save(); write('code.ts', 'export const remaining = 1;');
  assert.equal(inspectClosure(root, 'mission.json', 'checkpoint.json').status, 'reverify');
});
test('changed mission, missing context pins and absent Git provenance cannot support closure', t => {
  const { root, mission, checkpoint, save, write } = fixture(t);
  delete checkpoint.git; save(); assert.equal(inspectClosure(root, 'mission.json', 'checkpoint.json').status, 'unmet');
  checkpoint.sources = checkpoint.sources.filter(s => s.id !== 'contract');
  checkpoint.evidence[0].sourceIds = ['mission', 'code']; save();
  assert.ok(inspectClosure(root, 'mission.json', 'checkpoint.json').findings.some(f => f.code === 'context-not-pinned'));
  mission.acceptance.push({ ...mission.acceptance[0], id: 'AC2', description: 'Preserve confirmed reservations after capacity edit' });
  write('mission.json', JSON.stringify(mission));
  assert.equal(inspectClosure(root, 'mission.json', 'checkpoint.json').status, 'reverify');
});
test('closure rejects unsafe/secret records and pins before reading them', t => {
  const { root, checkpoint, save } = fixture(t);
  for (const p of ['../outside.json', '/etc/passwd', '.env']) assert.throws(() => inspectClosure(root, p, 'checkpoint.json'));
  checkpoint.sources[0].path = '.env'; save(); assert.throws(() => inspectClosure(root, 'mission.json', 'checkpoint.json'), /Secret/);
});
const attempt = (number, patch = {}) => ({ number, outcome: 'failed', observation: 'Capacity check failed', diagnosis: null,
  adjustment: null, evidenceIds: ['failure'], progress: false, durationMs: 20, tokens: 50, ...patch });
const loop = (attempts = []) => ({ format: 1, missionId: 'RESERVE', state: 'active', nextAction: 'Inspect the failing scenario', stopReason: null,
  limits: { maxAttempts: 3, maxConsecutiveNoProgress: 2, maxDurationMs: 100, maxObservedTokens: 200 }, attempts });
test('loop differentiates initial work, failed checks, diagnosis and stagnation', () => {
  assert.equal(inspectLoop(loop()).status, 'eligible');
  assert.equal(inspectLoop(loop([attempt(1)])).status, 'correct-course');
  const retry = loop([attempt(1), attempt(2, { outcome: 'passed', progress: true })]);
  assert.equal(inspectLoop(retry).status, 'correct-course');
  Object.assign(retry.attempts[1], { diagnosis: 'Nonatomic write', adjustment: 'Add guarded update' });
  assert.equal(inspectLoop(retry).status, 'eligible');
  retry.attempts[1].progress = false;
  assert.equal(inspectLoop(retry).status, 'limit-reached');
});
test('unknown usage is not zero and prevents further bounded admission', () => {
  const r = inspectLoop(loop([attempt(1, { tokens: null })]));
  assert.equal(r.status, 'needs-reconciliation'); assert.equal(r.observed.tokens, null); assert.equal(r.nextAction, null);
});
test('interrupted and blocked attempts require reconciliation even if marked complete', () => {
  for (const outcome of ['interrupted', 'blocked']) {
    const v = loop([attempt(1, { outcome })]); v.state = 'complete'; v.stopReason = 'Claimed finished'; v.nextAction = null;
    assert.equal(inspectLoop(v).status, outcome === 'blocked' ? 'blocked' : 'needs-reconciliation');
    const retry = loop([attempt(1, { outcome }), attempt(2, { outcome: 'passed', progress: true })]);
    assert.equal(inspectLoop(retry).status, 'correct-course');
  }
});
test('complete loop still needs closure and abandoned scope suggests no action', () => {
  const v = loop([attempt(1, { outcome: 'passed', progress: true })]);
  v.state = 'complete'; v.nextAction = null; v.stopReason = 'Criteria ready for review';
  assert.equal(inspectLoop(v).status, 'closure-required'); assert.equal(inspectLoop(v).eligibleToConsider, false);
  v.state = 'abandoned'; assert.equal(inspectLoop(v).status, 'abandoned');
});
test('loop reports observed limit overruns and does not label them hard caps', () => {
  const v = loop([attempt(1, { tokens: 230, durationMs: 120, outcome: 'passed', progress: true })]);
  const r = inspectLoop(v); assert.equal(r.status, 'limit-reached');
  assert.deepEqual(r.limitReasons, ['duration-limit', 'observed-token-limit']);
  assert.match(r.limitations, /not a hard cap/);
});
test('a later success cannot erase a historical limit crossing', () => {
  const v = loop([attempt(1, { outcome: 'passed' }), attempt(2, { outcome: 'passed' }), attempt(3, { outcome: 'passed', progress: true })]);
  v.limits.maxAttempts = 5; v.limits.maxObservedTokens = null;
  const r = inspectLoop(v); assert.equal(r.status, 'correct-course');
  assert.ok(r.findings.includes('attempt-3-after-limit'));
  v.state = 'complete'; v.nextAction = null; v.stopReason = 'Claimed complete';
  assert.equal(inspectLoop(v).status, 'correct-course');
});
test('malformed histories, duplicate attempts and forged passing shapes are rejected', () => {
  const mutations = [v => {v.attempts = [attempt(2)];}, v => {v.limits.maxAttempts = 0;},
    v => {v.attempts = [attempt(1, { outcome: ['passed'] })];}, v => {v.attempts = [attempt(1, { outcome: 'passed', evidenceIds: [] })];},
    v => {v.attempts = [attempt(1, { tokens: -1 })];}, v => {v.attempts = [attempt(1), attempt(1)];},
    v => {v.attempts = [attempt(1, { tokens: Number.MAX_SAFE_INTEGER }), attempt(2, { tokens: 2 })];}];
  for (const mutate of mutations) { const v = loop(); mutate(v); assert.throws(() => inspectLoop(v)); }
});
test('closure and loop CLI preserve inputs, report failing exit codes and reject unrelated flags', t => {
  const { root, write } = fixture(t); write('loop.json', JSON.stringify(loop()));
  const run = args => spawnSync(process.execPath, [cli, ...args, '--dest', root], { encoding: 'utf8' });
  assert.equal(run(['closure', '--mission', 'mission.json', '--checkpoint', 'checkpoint.json']).status, 0);
  assert.equal(run(['loop', '--loop', 'loop.json']).status, 0);
  write('loop.json', JSON.stringify(loop([attempt(1)])));
  assert.equal(run(['loop', '--loop', 'loop.json']).status, 1);
  for (const args of [['closure'], ['closure', '--mission', 'mission.json'], ['loop', '--loop', 'loop.json', '--open'], ['doctor', '--loop', 'loop.json'], ['review', '--loop', 'loop.json']]) assert.equal(run(args).status, 2);
  assert.equal(fs.existsSync(path.join(root, 'DO NOT EXECUTE THIS STRING')), false);
});
