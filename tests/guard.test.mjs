import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { digest, gitState } from '../dist/records.js';
import { suite, oracle } from '../scripts/evaluate-behavior.mjs';
import { inspectAcceptance } from '../dist/closure.js';
import { behavioralReceipt } from '../dist/behavior.js';
import { captureGuardSnapshot } from '../dist/guard-context.js';

const cli = path.resolve('dist/cli.js');

function fixture(t) {
  const parent = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-guard-'));
  const root = path.join(parent, 'repo');
  const session = path.join(parent, 'session');
  fs.mkdirSync(root);
  fs.mkdirSync(path.join(root, 'artifacts'));
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  const write = (file, body) => fs.writeFileSync(path.join(root, file), body);
  const json = (file, value) => write(file, JSON.stringify(value));
  const git = (...args) =>
    execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  const mission = {
    format: 1,
    id: 'GUARD',
    path: 'standard',
    owner: 'fixture',
    outcome: 'Enforce the reviewed guard contract',
    scope: ['Guard'],
    exclusions: ['Publish'],
    invariants: ['Stop after repeated failures'],
    uncertainties: [],
    status: 'active',
    nextAction: 'Implement guard',
    stopConditions: ['Verified evidence'],
    dependencies: [],
    contradictions: [],
    acceptance: [
      {
        id: 'AC1',
        description: 'The guard follows the contract',
        changes: ['code.ts'],
        verification: 'DO NOT EXECUTE THIS STRING',
        kind: 'automated',
      },
    ],
    sources: [
      {
        id: 'contract',
        path: 'contract.md',
        level: 'domain',
        reason: 'Guard contract',
        authority: 'Fixture',
        kind: 'accepted-decision',
        revision: 'fixture',
      },
    ],
  };
  write('.gitignore', 'checkpoint.json\nreport.json\nartifacts/\n');
  write('contract.md', 'Stop when the same behavioral failure occurs twice consecutively.');
  write('code.ts', 'export const attempts = 2;\n');
  json('mission.json', mission);
  json('report.json', { format: 1, runs: [] });
  git('init');
  git('add', '.');
  git(
    '-c',
    'user.name=Fixture',
    '-c',
    'user.email=fixture@example.invalid',
    'commit',
    '-m',
    'Fixture',
  );
  const invoke = (command, extra = []) => {
    const result = spawnSync(
      process.execPath,
      [
        cli,
        'guard',
        '--command',
        command,
        '--dest',
        root,
        '--session',
        session,
        '--mission',
        'mission.json',
        ...extra,
      ],
      { encoding: 'utf8', timeout: 30000 },
    );
    assert.equal(result.error, undefined);
    return { code: result.status, ...JSON.parse(result.stdout) };
  };
  const verify = (extra = []) =>
    invoke('/verify', ['--report', 'report.json', '--artifacts', 'artifacts', ...extra]);
  const state = () => JSON.parse(fs.readFileSync(path.join(session, 'state.json'), 'utf8'));
  const checkpoint = () => {
    const pin = (id, file) => ({
      id,
      path: file,
      sha256: digest(fs.readFileSync(path.join(root, file))),
    });
    const record = {
      format: 1,
      scope: 'Guard',
      status: 'active',
      nextAction: 'Review',
      git: gitState(root),
      sources: [
        pin('mission', 'mission.json'),
        pin('contract', 'contract.md'),
        pin('code', 'code.ts'),
      ],
      evidence: [
        {
          ...pin('behavior', 'report.json'),
          sourceIds: ['mission', 'contract', 'code'],
          dependsOn: [],
          outcome: 'passed',
          criterionIds: ['AC1'],
          kind: 'automated',
          revision: git('rev-parse', 'HEAD'),
        },
      ],
    };
    json('checkpoint.json', record);
    return record;
  };
  return { root, session, write, json, mission, invoke, verify, state, checkpoint };
}

function campaign(f, verdict = 'pass', kind = 'native') {
  // Constructed records exercise validation; these are not native performance evidence.
  const methodRevision = gitState(f.root).commit;
  const runs = [];
  for (const c of suite.cases) {
    for (let repetition = 1; repetition <= suite.repetitions; repetition++) {
      const artifacts = Array.from({ length: c.minimumSessions }, (_, i) => {
        const body = `Constructed test transcript ${c.id} ${repetition} ${i}.\n`;
        const file = `${c.id}-${repetition}-${i}.txt`;
        f.write(`artifacts/${file}`, body);
        return { id: `trace-${i}`, path: file, sha256: digest(body), kind: 'transcript' };
      });
      runs.push({
        id: `${c.id}-${repetition}`,
        caseId: c.id,
        repetition,
        status: 'completed',
        kind,
        artifacts,
        provenance: {
          host: 'fixture',
          hostVersion: '1',
          model: 'fixture',
          methodRevision,
          fixtureRevision: 'fixture',
          permissions: 'local',
          startedAt: '2026-09-15T00:00:00Z',
          endedAt: '2026-09-15T00:01:00Z',
          sessions: artifacts.map((a) => ({ id: a.id, transcriptId: a.id })),
          adjudicator: 'fixture-independent-judge',
        },
        judgments: oracle.cases
          .find((o) => o.caseId === c.id)
          .criteria.map((criterion) => ({
            criterionId: criterion.id,
            verdict,
            justification: 'Constructed judgment for a validation test.',
            evidenceIds: ['trace-0'],
          })),
        metrics: { humanInterventions: null, tokens: null, elapsedMs: null, costUsd: null },
      });
    }
  }
  const report = { format: 1, runs };
  f.json('report.json', report);
  return report;
}

test('command gates block unresolved dependencies and verification before implementation', (t) => {
  const f = fixture(t);
  assert.equal(f.verify().allowed, false);
  f.mission.dependencies = [
    { id: 'db', owner: 'fixture', status: 'blocked', detail: 'Unavailable' },
  ];
  f.json('mission.json', f.mission);
  assert.equal(f.invoke('/implement').allowed, false);
  assert.equal(fs.existsSync(path.join(f.session, 'state.json')), false);
});

test('two identical failures latch a persistent stop, preserve context and deny every command', (t) => {
  const f = fixture(t);
  assert.equal(f.invoke('/implement').allowed, true);
  const first = f.verify();
  assert.equal(first.status, 'verification-failed');
  assert.equal(first.code, 1); // The offline scorer itself returns zero for this pending campaign.
  assert.equal(f.verify().reason, 'diagnosis-required');
  const second = f.verify([
    '--diagnosis',
    'Missing observations',
    '--adjustment',
    'Checked host availability',
  ]);
  assert.equal(second.status, 'human-intervention');
  assert.equal(second.reason, 'repeated-failure-signature');
  assert.equal(second.nextAction, null);
  assert.equal(f.state().attempts.length, 2);
  const frozen = fs.readFileSync(path.join(f.session, 'context.json'));
  f.write('code.ts', 'Changed after the stop.');
  fs.rmSync(path.join(f.root, 'report.json')); // A stopped request must not even read evaluator inputs.
  for (const command of ['/verify', '/implement', '/integrate']) {
    assert.equal(f.invoke(command).status, 'human-intervention');
  }
  assert.equal(f.state().attempts.length, 2);
  assert.deepEqual(fs.readFileSync(path.join(f.session, 'context.json')), frozen);
  const snapshot = JSON.parse(frozen);
  assert.equal(
    Buffer.from(
      snapshot.files.find((file) => file.path === 'code.ts').content,
      'base64',
    ).toString(),
    'export const attempts = 2;\n',
  );
});

test('failure signatures ignore run ordering and commentary', (t) => {
  const f = fixture(t);
  f.invoke('/implement');
  const report = campaign(f);
  report.runs[0].judgments[0].verdict = 'fail';
  f.json('report.json', report);
  const first = f.verify();
  report.runs.reverse();
  for (const run of report.runs)
    for (const j of run.judgments) j.justification = 'Reworded observation.';
  f.json('report.json', report);
  const second = f.verify([
    '--diagnosis',
    'Same invariant',
    '--adjustment',
    'Inspect changed implementation',
  ]);
  assert.equal(first.failureSignature, second.failureSignature);
  assert.equal(second.reason, 'repeated-failure-signature');
});

test('different failures permit a diagnosed correction and unchanged passing evidence is reused', (t) => {
  const f = fixture(t);
  f.invoke('/implement');
  const report = campaign(f);
  const judgments = report.runs[0].judgments;
  judgments[0].verdict = 'fail';
  f.json('report.json', report);
  const first = f.verify();
  judgments[0].verdict = 'pass';
  judgments[1].verdict = 'fail';
  f.json('report.json', report);
  const retry = [
    '--diagnosis',
    'Different invariant',
    '--adjustment',
    'Correct the observed defect',
  ];
  const second = f.verify(retry);
  assert.equal(second.status, 'verification-failed');
  assert.notEqual(first.failureSignature, second.failureSignature);
  judgments[1].verdict = 'pass';
  f.json('report.json', report);
  assert.equal(f.verify(retry).status, 'verified');
  assert.equal(f.verify().status, 'verified');
  assert.equal(f.state().attempts.length, 3);
});

test('reports for an earlier method revision cannot verify the current revision', (t) => {
  const f = fixture(t);
  f.invoke('/implement');
  const report = campaign(f);
  for (const run of report.runs) run.provenance.methodRevision = 'old-revision';
  f.json('report.json', report);
  assert.equal(f.verify().status, 'verification-failed');
  assert.equal(f.state().receipt, null);
});

test('a passing report cannot be rebound to changed code under the same HEAD', (t) => {
  const f = fixture(t);
  f.invoke('/implement');
  campaign(f);
  f.verify();
  f.checkpoint();
  assert.equal(f.invoke('/integrate', ['--checkpoint', 'checkpoint.json']).status, 'accepted');
  f.write('code.ts', 'export const attempts = 100;\n');
  assert.equal(f.verify().status, 'verification-failed');
  f.checkpoint();
  assert.equal(f.invoke('/integrate', ['--checkpoint', 'checkpoint.json']).allowed, false);
  assert.equal(f.state().receipt, null);
});

test('a manufactured hash for an unexecuted campaign cannot satisfy acceptance', (t) => {
  const f = fixture(t);
  f.invoke('/implement');
  f.checkpoint();
  const snapshot = captureGuardSnapshot(f.root, {
    missionPath: 'mission.json',
    reportPath: 'report.json',
    artifactPath: 'artifacts',
  });
  const forged = behavioralReceipt(snapshot);
  assert.equal(inspectAcceptance(f.root, 'mission.json', 'checkpoint.json', forged).allowed, false);
});

test('an evaluator validation error participates in the same persistent circuit breaker', (t) => {
  const f = fixture(t);
  f.invoke('/implement');
  const report = campaign(f);
  delete report.runs[0].metrics;
  f.json('report.json', report);
  assert.equal(f.verify().status, 'verification-failed');
  assert.equal(
    f.verify(['--diagnosis', 'Invalid report', '--adjustment', 'Investigated producer']).reason,
    'repeated-failure-signature',
  );
});

test('unowned session directories and scope changes cannot overwrite existing records', (t) => {
  const f = fixture(t);
  fs.mkdirSync(f.session);
  const sentinel = path.join(f.session, 'context.json');
  fs.writeFileSync(sentinel, 'Existing user file');
  assert.equal(f.invoke('/implement').allowed, false);
  assert.equal(fs.readFileSync(sentinel, 'utf8'), 'Existing user file');
  fs.unlinkSync(sentinel);
  assert.equal(f.invoke('/implement').allowed, true);
  const original = fs.readFileSync(path.join(f.session, 'state.json'));
  f.json('other-mission.json', f.mission);
  assert.equal(f.invoke('/implement', ['--mission', 'other-mission.json']).allowed, false);
  assert.deepEqual(fs.readFileSync(path.join(f.session, 'state.json')), original);
});

test('integration needs current native evidence tied to every mission criterion', (t) => {
  const f = fixture(t);
  f.invoke('/implement');
  assert.equal(f.invoke('/integrate', ['--checkpoint', 'checkpoint.json']).allowed, false);
  campaign(f);
  assert.equal(f.verify().status, 'verified');
  const record = f.checkpoint();
  const result = f.invoke('/integrate', ['--checkpoint', 'checkpoint.json']);
  assert.equal(result.status, 'accepted');
  assert.match(result.behavioralEvidenceSignature, /^[a-f0-9]{64}$/);
  assert.equal(f.state().featureState, 'accepted');
  f.write('code.ts', 'export const attempts = 3;');
  assert.equal(f.invoke('/integrate', ['--checkpoint', 'checkpoint.json']).allowed, false);
  assert.notEqual(f.state().featureState, 'accepted');
  assert.equal(record.evidence[0].criterionIds[0], 'AC1');
});

test('synthetic campaigns cannot create verified receipts', (t) => {
  const f = fixture(t);
  f.invoke('/implement');
  campaign(f, 'pass', 'synthetic');
  assert.equal(f.verify().status, 'verification-failed');
  assert.equal(f.state().receipt, null);
});

test('locks and interrupted pending verification fail closed without automatic recovery', (t) => {
  const f = fixture(t);
  f.invoke('/implement');
  fs.writeFileSync(path.join(f.session, 'lock'), 'occupied');
  assert.equal(f.verify().status, 'human-intervention');
  fs.unlinkSync(path.join(f.session, 'lock'));
  const state = f.state();
  state.pending = true;
  fs.writeFileSync(path.join(f.session, 'state.json'), JSON.stringify(state));
  const result = f.verify();
  assert.equal(result.status, 'human-intervention');
  assert.equal(result.reason, 'interrupted-verification');
  assert.equal(f.state().attempts.length, 0);
});

test('artifact mutation invalidates a receipt even when ignored by Git', (t) => {
  const f = fixture(t);
  f.invoke('/implement');
  campaign(f);
  assert.equal(f.verify().status, 'verified');
  f.checkpoint();
  f.write('artifacts/FOUNDATION-POS-1-0.txt', 'Modified artifact');
  assert.equal(f.invoke('/integrate', ['--checkpoint', 'checkpoint.json']).allowed, false);
  assert.notEqual(f.state().featureState, 'accepted');
});

test('a missing declared input invalidates persisted acceptance and requires human reconciliation', (t) => {
  const f = fixture(t);
  f.invoke('/implement');
  campaign(f);
  f.verify();
  f.checkpoint();
  assert.equal(f.invoke('/integrate', ['--checkpoint', 'checkpoint.json']).status, 'accepted');
  fs.unlinkSync(path.join(f.root, 'contract.md'));
  assert.equal(f.verify().status, 'human-intervention');
  assert.equal(f.state().status, 'halted');
  assert.notEqual(f.state().featureState, 'accepted');
  assert.equal(f.state().receipt, null);
});

test('a supported checkpoint cannot substitute unrelated evidence for the behavioral report', (t) => {
  const f = fixture(t);
  f.invoke('/implement');
  campaign(f);
  f.verify();
  const record = f.checkpoint();
  record.evidence[0].path = 'contract.md';
  record.evidence[0].sha256 = digest(fs.readFileSync(path.join(f.root, 'contract.md')));
  f.json('checkpoint.json', record);
  const result = f.invoke('/integrate', ['--checkpoint', 'checkpoint.json']);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'behavioral-coverage-missing');
});
