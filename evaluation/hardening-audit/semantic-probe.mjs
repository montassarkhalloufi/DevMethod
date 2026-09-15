import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { inspectClosure } from '../../dist/closure.js';
import { digest, gitState } from '../../dist/records.js';

// Fixed fictional contract and two implementations; no model is invoked.
// The same real, weak check runs against both. The contract oracle is external
// to its assertions. All files and declared dependencies are honestly pinned.
const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'devmethod-semantic-'));
const rows = [];
try {
  for (const [variant, expression, oracleExit] of [
    ['seeded-defect', 'value * 0.2', 1], ['healthy-control', 'value * 1.2', 0]
  ]) {
    const project = path.join(root, variant); fs.mkdirSync(project);
    const write = (name, value) => fs.writeFileSync(path.join(project, name), value);
    const git = (...args) => execFileSync('git', args, { cwd: project, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    write('.gitignore', 'checkpoint.json\n');
    write('contract.md', 'A 20% increase on 100 returns 120.\n');
    write('value.mjs', `export const increase = value => ${expression};\n`);
    write('weak.test.mjs', "import assert from 'node:assert/strict'; import { increase } from './value.mjs'; assert.equal(typeof increase(100), 'number');\n");
    const weak = spawnSync(process.execPath, ['weak.test.mjs'], { cwd: project, encoding: 'utf8', timeout: 10000 });
    assert.equal(weak.status, 0, weak.stderr);
    write('check.log', `Executed node weak.test.mjs; exit ${weak.status}.\n`);
    write('mission.json', JSON.stringify({ format: 1, id: 'INCREASE', path: 'standard', owner: 'audit',
      outcome: 'Correctly add 20%', scope: ['Compute increase'], exclusions: ['External actions'],
      invariants: ['100 becomes 120'], uncertainties: [], status: 'active', nextAction: 'Review criterion evidence',
      stopConditions: ['AC1 verified'], dependencies: [], contradictions: [],
      acceptance: [{ id: 'AC1', description: '100 increased by 20% equals 120', changes: ['value.mjs'], verification: 'node weak.test.mjs', kind: 'automated' }],
      sources: [{ id: 'contract', path: 'contract.md', level: 'domain', reason: 'Expected arithmetic', authority: 'Fictional fixed contract', kind: 'accepted-decision', revision: 'audit-1' }] }));
    git('init'); git('add', '.');
    git('-c', 'user.name=Audit', '-c', 'user.email=audit@example.invalid', 'commit', '-m', 'Fictional semantic probe');
    const pin = (id, file) => ({ id, path: file, sha256: digest(fs.readFileSync(path.join(project, file))) });
    const snapshot = gitState(project);
    write('checkpoint.json', JSON.stringify({ format: 1, scope: 'Compute increase', status: 'complete', nextAction: null, git: snapshot,
      sources: [pin('mission', 'mission.json'), pin('contract', 'contract.md'), pin('code', 'value.mjs'), pin('test', 'weak.test.mjs')],
      evidence: [{ ...pin('check', 'check.log'), sourceIds: ['mission', 'contract', 'code', 'test'], dependsOn: [], outcome: 'passed', criterionIds: ['AC1'], kind: 'automated', revision: snapshot.commit }] }));
    const oracle = spawnSync(process.execPath, ['--input-type=module', '-e', "import assert from 'node:assert/strict'; import { increase } from './value.mjs'; assert.equal(increase(100), 120);"], { cwd: project, encoding: 'utf8', timeout: 10000 });
    assert.equal(oracle.status, oracleExit, oracle.stderr);
    const closure = inspectClosure(project, 'mission.json', 'checkpoint.json');
    assert.equal(closure.status, 'supported');
    rows.push({ variant, weakCheckExit: weak.status, contractOracleExit: oracle.status, closureStatus: closure.status });
  }
  console.log(JSON.stringify({ kind: 'deterministic-contract-probe-not-native', rows,
    conclusion: 'Structural support does not certify assertion relevance. The contract oracle discriminates this seeded defect from the healthy control; no reviewer accuracy or general mutation score is measured.' }, null, 2));
} finally { fs.rmSync(root, { recursive: true, force: true }); }
