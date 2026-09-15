import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { inspectEvidence, runEvidence } from '../dist/evidence-runtime.js';

const fixture = fileURLToPath(new URL('../evaluation/evidence-holdout/', import.meta.url));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const version = process.argv[2] ?? 'v2';
assert.ok(['v1', 'v2'].includes(version), 'Expected v1 or v2.');
const manifest = fs.readFileSync(
  path.join(fixture, version === 'v1' ? 'SHA256SUMS' : 'SHA256SUMS-v2'),
  'utf8',
);
for (const line of manifest.trim().split('\n')) {
  const [expected, file] = line.split('  ');
  assert.match(file, /^(?:[a-zA-Z0-9-]+\/)*[a-zA-Z0-9.-]+$/);
  assert.equal(
    sha256(fs.readFileSync(path.join(fixture, file))),
    expected,
    `Frozen file changed: ${file}`,
  );
}

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'devmethod-evidence-holdout-'));
const evaluatorRoot = path.join(workspace, 'evaluator');
fs.mkdirSync(evaluatorRoot);
for (const file of [
  'contract.json',
  'contract-v2.json',
  'runner.mjs',
  'runner-v2.mjs',
  'controls.mjs',
])
  fs.copyFileSync(path.join(fixture, file), path.join(evaluatorRoot, file));
const cases = [];
let runnerProcesses = 0;
let adjudicatorChildren = 0;

for (const candidate of ['healthy', 'duplicate', 'resurrect', 'lost-restart']) {
  const root = path.join(workspace, candidate);
  fs.cpSync(path.join(fixture, 'candidates', candidate), root, { recursive: true });
  const options = {
    root,
    evaluatorRoot,
    contractPath: path.join(evaluatorRoot, version === 'v1' ? 'contract.json' : 'contract-v2.json'),
  };
  const plan = inspectEvidence(options);
  assert.ok(
    runnerProcesses + plan.invocations.length <= (version === 'v1' ? 24 : 16),
    'Preregistered runner budget',
  );
  const report = await runEvidence({
    ...options,
    session: path.join(workspace, `session-${candidate}`),
    permit: plan.permit,
  });
  runnerProcesses += report.results.filter((result) => result.status !== 'not-run').length;
  assert.ok(adjudicatorChildren + 2 <= 8, 'Preregistered restart budget');
  const adjudicatorArgs = [path.join(fixture, 'adjudicate.mjs'), root];
  const actual = spawnSync(process.execPath, adjudicatorArgs, {
    encoding: 'utf8',
    timeout: 7000,
    maxBuffer: 32768,
  });
  adjudicatorChildren += 2;
  const observation = {
    candidate,
    report,
    adjudicatorInvocation: {
      argv: [process.execPath, ...adjudicatorArgs],
      status: actual.status ?? null,
      signal: actual.signal ?? null,
      error: actual.error
        ? { ...actual.error, name: actual.error.name, message: actual.error.message }
        : null,
      stdout: actual.stdout ?? null,
      stderr: actual.stderr ?? null,
    },
  };
  cases.push(observation);
  const observationPath = path.join(workspace, `${candidate}.json`);
  fs.writeFileSync(observationPath, JSON.stringify(observation, null, 2) + '\n');
  const adjudication = [0, 1].includes(actual.status)
    ? JSON.parse(actual.stdout)
    : { status: 'interrupted', exit: actual.status };
  observation.adjudication = adjudication;
  fs.writeFileSync(observationPath, JSON.stringify(observation, null, 2) + '\n');
  console.log(
    `${candidate}: lab=${report.status}, restart=${adjudication.durability ?? 'unavailable'}, finality=${adjudication.finality ?? 'unavailable'}`,
  );
}

const result = {
  format: 1,
  protocolVersion: version,
  workspace,
  createdAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform,
  frozenManifestSha256: sha256(manifest),
  runnerProcesses,
  adjudicatorChildren,
  cases,
  falseSupportOnRestart: cases
    .filter(
      (item) =>
        item.report.status === 'supported' &&
        (item.adjudication.durability === 'failed' || item.adjudication.finality === 'failed'),
    )
    .map((item) => item.candidate),
  limitations:
    'Independently authored post-design deterministic fixture. Partial checker intentionally lacks restart checks. Not a native model comparison or generalization estimate. All predictions and misses retained.',
};
fs.writeFileSync(path.join(workspace, 'results.json'), JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify(
    {
      workspace,
      runnerProcesses,
      adjudicatorChildren,
      falseSupportOnRestart: result.falseSupportOnRestart,
    },
    null,
    2,
  ),
);
