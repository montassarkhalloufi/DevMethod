import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { scoreBehavior, suite, oracle, MAX_ARTIFACT_BYTES, MAX_REPORT_BYTES } from '../scripts/evaluate-behavior.mjs';
const clone = x => structuredClone(x);
function fixture(t, caseId = 'FOUNDATION-POS') {
  const artifactRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'behavior-score-'));
  t.after(() => fs.rmSync(artifactRoot, { recursive: true, force: true }));
  const content = 'Synthetic calibration transcript: this is not an actual host run.\n';
  fs.writeFileSync(path.join(artifactRoot, 'transcript.txt'), content);
  const sha256 = createHash('sha256').update(content).digest('hex');
  const run = { id: 'run-1', caseId, repetition: 1, status: 'completed', kind: 'synthetic',
    artifacts: [{ id: 'trace', path: 'transcript.txt', sha256, kind: 'transcript' }],
    judgments: oracle.cases.find(c => c.caseId === caseId).criteria.map(c => ({ criterionId: c.id, verdict: 'pass', justification: 'Constructed calibration judgment only.', evidenceIds: ['trace'] })),
    metrics: { humanInterventions: null, tokens: null, elapsedMs: null, costUsd: null } };
  return { run, report: { format: 1, runs: [run] }, options: { artifactRoot } };
}
function nativeRecord(run) {
  run.kind = 'native'; // Constructed input tests validation; does not certify authentic provenance.
  run.provenance = { host: 'fixture-host', hostVersion: '1', model: 'fixture-model', methodRevision: 'fixture-revision', fixtureRevision: 'fixture-manifest', permissions: 'local-only', startedAt: '2026-09-15T00:00:00Z', endedAt: '2026-09-15T00:01:00Z', sessions: [{ id: 'session-1', transcriptId: 'trace' }], adjudicator: 'independent-fixture-judge' };
}
test('18 scenario specs cover positive and negative controls for all six skills', () => {
  assert.equal(suite.cases.length, 18);
  const skills = [...new Set(suite.cases.filter(c => c.skill).map(c => c.skill))];
  assert.equal(skills.length, 6);
  for (const skill of skills) assert.deepEqual(suite.cases.filter(c => c.skill === skill).map(c => c.trigger).sort(), ['negative', 'positive']);
});
test('missing campaign is not a success and unknown metrics are null', () => {
  const result = scoreBehavior({ format: 1, runs: [] });
  assert.equal(result.plannedRuns, 36); assert.equal(result.outcomes['not-run'], 36);
  assert.equal(result.nativePassRateAmongCompleted, null);
  assert.equal(result.metrics.tokens.observedTotal, null);
});
test('synthetic calibration never inflates native performance', t => {
  const f = fixture(t); const result = scoreBehavior(f.report, f.options);
  assert.equal(result.syntheticRuns, 1); assert.equal(result.nativePassedRuns, 0);
  assert.equal(result.nativePassRateAmongCompleted, null); assert.equal(result.outcomes['not-run'], 35);
});
test('native-shaped constructed records preserve total denominator and unknown measurements', t => {
  const f = fixture(t); nativeRecord(f.run); f.run.metrics.humanInterventions = 0;
  const result = scoreBehavior(f.report, f.options);
  assert.equal(result.nativePassedRuns, 1); assert.equal(result.nativePassFractionOfPlan, 1/36);
  assert.deepEqual(result.metrics.tokens, { knownRuns: 0, unknownRuns: 1, observedTotal: null });
  assert.deepEqual(result.metrics.humanInterventions, { knownRuns: 1, unknownRuns: 0, observedTotal: 0 });
});
test('green-test claim cannot replace missing or failed acceptance judgments', t => {
  const f = fixture(t, 'CLOSURE'); f.run.judgments.pop();
  let result = scoreBehavior(f.report, f.options);
  assert.equal(result.rows.find(r => r.caseId === 'CLOSURE').outcome, 'unresolved');
  f.run.judgments[0].verdict = 'fail';
  result = scoreBehavior(f.report, f.options);
  assert.equal(result.rows.find(r => r.caseId === 'CLOSURE').outcome, 'failed');
});
test('blocked interrupted and explicit not-run retain states and denominator', t => {
  const f = fixture(t);
  for (const status of ['blocked', 'interrupted', 'not-run']) {
    f.run.status = status; f.run.reason = 'Unavailable reviewed fixture.';
    const result = scoreBehavior(f.report, f.options);
    assert.equal(result.rows[0].outcome, status); assert.equal(result.plannedRuns, 36);
  }
});
test('duplicate identity and duplicate slot cannot inflate score', t => {
  const f = fixture(t);
  f.report.runs.push(clone(f.run)); assert.throws(() => scoreBehavior(f.report, f.options), /Duplicate run id/);
  f.report.runs[1].id = 'other'; assert.throws(() => scoreBehavior(f.report, f.options), /Duplicate run slot/);
});
test('unknown cases repetitions and criteria are rejected', t => {
  const f = fixture(t);
  for (const mutation of [r => r.caseId = 'UNKNOWN', r => r.repetition = 3, r => r.repetition = 1.5, r => r.judgments[0].criterionId = 'UNKNOWN']) {
    const report = clone(f.report); mutation(report.runs[0]); assert.throws(() => scoreBehavior(report, f.options));
  }
});
test('malformed reports, unsupported claims and unavailable metric strings are rejected', t => {
  const f = fixture(t);
  for (const mutation of [r => r.passed = true, r => r.metrics.tokens = 'unavailable', r => r.metrics.tokens = -1, r => r.metrics.humanInterventions = 0.5, r => delete r.metrics.costUsd, r => r.judgments = null, r => r.artifacts = {}, r => r.status = 'passed']) {
    const report = clone(f.report); mutation(report.runs[0]); assert.throws(() => scoreBehavior(report, f.options));
  }
  for (const bad of [null, [], {}, {format:1,runs:null}, {format:1,runs:[],nativePassedRuns:99}]) assert.throws(() => scoreBehavior(bad));
});
test('unknown, empty or duplicate evidence references are rejected', t => {
  const f = fixture(t);
  for (const evidenceIds of [[], ['missing'], ['trace','trace']]) {
    const report = clone(f.report); report.runs[0].judgments[0].evidenceIds = evidenceIds;
    assert.throws(() => scoreBehavior(report, f.options), /evidence/);
  }
  f.run.judgments.push(clone(f.run.judgments[0])); assert.throws(() => scoreBehavior(f.report, f.options), /Duplicate judgment/);
});
test('artifact hashing detects tampering and refuses traversal or symbolic evidence', t => {
  const f = fixture(t);
  fs.appendFileSync(path.join(f.options.artifactRoot, 'transcript.txt'), 'tampered');
  assert.throws(() => scoreBehavior(f.report, f.options), /hash/);
  for (const p of ['../transcript.txt', '/tmp/trace', 'a\\trace', './trace']) {
    f.run.artifacts[0].path = p; assert.throws(() => scoreBehavior(f.report, f.options), /Unsafe/);
  }
  fs.symlinkSync('transcript.txt', path.join(f.options.artifactRoot, 'link'));
  f.run.artifacts[0].path = 'link'; assert.throws(() => scoreBehavior(f.report, f.options), /Symbolic/);
});
test('native records require provenance and session transcripts', t => {
  const f = fixture(t); f.run.kind = 'native'; assert.throws(() => scoreBehavior(f.report, f.options), /provenance/);
  nativeRecord(f.run); f.run.provenance.sessions[0].transcriptId = 'missing'; assert.throws(() => scoreBehavior(f.report, f.options), /transcript/);
  f.run.provenance.sessions[0].transcriptId = 'trace'; f.run.provenance.endedAt = '2025-01-01'; assert.throws(() => scoreBehavior(f.report, f.options), /timestamp/);
});
test('resume completion requires distinct sessions and distinct transcript references', t => {
  const f = fixture(t, 'RESUME'); nativeRecord(f.run);
  assert.throws(() => scoreBehavior(f.report, f.options), /Insufficient actual sessions/);
  f.run.provenance.sessions.push({id:'session-2',transcriptId:'trace'});
  assert.throws(() => scoreBehavior(f.report, f.options), /Duplicate session transcript/);
});
test('report content remains inert data', t => {
  const f = fixture(t); const sentinel = path.join(f.options.artifactRoot, 'executed');
  f.run.judgments[0].justification = `$(touch ${sentinel}); require('node:fs').writeFileSync('${sentinel}', 'bad')`;
  scoreBehavior(f.report, f.options); assert.equal(fs.existsSync(sentinel), false);
});
test('suite and oracle inconsistencies fail closed', () => {
  const spec = clone(suite); spec.cases.push(clone(spec.cases[0]));
  assert.throws(() => scoreBehavior({format:1,runs:[]}, {spec}), /Duplicate/);
  const expectations = clone(oracle); expectations.cases.pop();
  assert.throws(() => scoreBehavior({format:1,runs:[]}, {expectations}), /coverage/);
});
test('CLI emits a pending report and fails malformed data without execution', t => {
  const f = fixture(t); const file = path.join(f.options.artifactRoot, 'empty.json');
  fs.writeFileSync(file, JSON.stringify({format:1,runs:[]}));
  const command = new URL('../scripts/evaluate-behavior.mjs', import.meta.url).pathname;
  const result = spawnSync(process.execPath, [command, file], {encoding:'utf8'});
  assert.equal(result.status, 0); assert.equal(JSON.parse(result.stdout).outcomes['not-run'], 36);
  fs.writeFileSync(file, '{');
  assert.equal(spawnSync(process.execPath,[command,file],{encoding:'utf8'}).status, 2);
});

test('separate native configurations cannot be pooled into one score', t => {
  const f = fixture(t); nativeRecord(f.run);
  const other = clone(f.run); other.id = 'run-2'; other.repetition = 2; other.provenance.model = 'different-model';
  f.report.runs.push(other);
  assert.throws(() => scoreBehavior(f.report, f.options), /Mixed native configurations/);
});
test('two-session completion rejects reused bytes even under new artifact identity', t => {
  const f = fixture(t, 'RESUME'); nativeRecord(f.run);
  fs.copyFileSync(path.join(f.options.artifactRoot, 'transcript.txt'), path.join(f.options.artifactRoot, 'second.txt'));
  f.run.artifacts.push({...f.run.artifacts[0], id:'trace-2', path:'second.txt'});
  f.run.provenance.sessions.push({id:'session-2',transcriptId:'trace-2'});
  assert.throws(() => scoreBehavior(f.report, f.options), /Duplicate session transcript bytes/);
  const bytes = 'Separate constructed session 2 transcript after controlled contract change.\n';
  fs.writeFileSync(path.join(f.options.artifactRoot, 'second.txt'), bytes);
  f.run.artifacts[1].sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(scoreBehavior(f.report, f.options).rows.find(r => r.caseId === 'RESUME').outcome, 'passed');
});

test('different fixture revisions for repeated native cases cannot inflate score', t => {
  const f = fixture(t); nativeRecord(f.run);
  const other = clone(f.run); other.id = 'run-2'; other.repetition = 2; other.provenance.fixtureRevision = 'changed-fixture';
  f.report.runs.push(other);
  assert.throws(() => scoreBehavior(f.report, f.options), /Mixed fixture revisions/);
});
test('blocked without invocation does not count as attempted native cost or unknown usage', t => {
  const f = fixture(t); f.run.kind = 'native'; f.run.status = 'blocked'; f.run.reason = 'Host unavailable; no invocation';
  const result = scoreBehavior(f.report, f.options);
  assert.deepEqual(result.metrics.tokens, {knownRuns:0,unknownRuns:0,observedTotal:null});
  assert.equal(result.outcomes.blocked,1); assert.equal(result.plannedRuns,36);
});
test('oversized evidence and CLI reports are rejected before reading payload bytes', t => {
  const f = fixture(t); const artifact = path.join(f.options.artifactRoot, 'transcript.txt');
  fs.truncateSync(artifact,MAX_ARTIFACT_BYTES+1);
  assert.throws(() => scoreBehavior(f.report,f.options), /size limit/);
  const reportFile = path.join(f.options.artifactRoot,'huge.json'); fs.writeFileSync(reportFile,''); fs.truncateSync(reportFile,MAX_REPORT_BYTES+1);
  const command = new URL('../scripts/evaluate-behavior.mjs', import.meta.url).pathname;
  const result = spawnSync(process.execPath,[command,reportFile],{encoding:'utf8'});
  assert.equal(result.status,2); assert.match(result.stderr,/report size limit/);
});
