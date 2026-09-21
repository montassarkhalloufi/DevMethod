import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { inspectEvidence, runEvidence } from '../dist/evidence-runtime.js';

const repository = fileURLToPath(new URL('../', import.meta.url));
const population = path.join(repository, 'evaluation/evidence-holdout');
const candidates = ['healthy', 'duplicate', 'resurrect', 'lost-restart'];
const maintained = [
  'scripts/evidence-restart-check.mjs',
  'scripts/evidence-restart-comparison.mjs',
  'tests/evidence-restart.test.mjs',
];

function save(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

export function prepareRestartFixture(workspace) {
  const evaluatorRoot = path.join(workspace, 'evaluator');
  fs.mkdirSync(evaluatorRoot);
  for (const name of ['runner-v2.mjs', 'controls.mjs', 'adjudicate.mjs']) {
    fs.copyFileSync(path.join(population, name), path.join(evaluatorRoot, name));
  }
  fs.copyFileSync(
    path.join(repository, maintained[0]),
    path.join(evaluatorRoot, 'restart-check.mjs'),
  );
  const contract = JSON.parse(fs.readFileSync(path.join(population, 'contract-v2.json')));
  contract.id = 'known-queue-restart-repair';
  contract.evaluatorFiles = [
    'restart-check.mjs',
    'runner-v2.mjs',
    'controls.mjs',
    'adjudicate.mjs',
  ];
  contract.checks[0].runner = 'restart-check.mjs';
  contract.limits.childTimeoutMs = 15000;
  contract.limits.attemptTimeoutMs = 65000;
  contract.limits.maxOutputBytes = 32768;
  const contractPath = path.join(evaluatorRoot, 'contract.json');
  save(contractPath, contract);
  for (const candidate of candidates) {
    fs.cpSync(path.join(population, 'candidates', candidate), path.join(workspace, candidate), {
      recursive: true,
    });
  }
  return { evaluatorRoot, contractPath };
}

function ordinaryRun(root, evaluatorRoot) {
  const argv = [path.join(evaluatorRoot, 'restart-check.mjs'), root, 'candidate', 'queue-partial'];
  const start = performance.now();
  const child = spawnSync(process.execPath, argv, {
    encoding: 'utf8',
    timeout: 15000,
    maxBuffer: 32768,
  });
  return {
    argv: [process.execPath, ...argv],
    status: child.status,
    signal: child.signal,
    error: child.error?.message ?? null,
    stdout: child.stdout,
    stderr: child.stderr,
    durationMs: performance.now() - start,
  };
}

function sourceEvidence() {
  const inputs = [
    ...maintained,
    'evaluation/evidence-restart/PROTOCOL.md',
    ...['runner-v2.mjs', 'controls.mjs', 'adjudicate.mjs', 'contract-v2.json'].map(
      (file) => `evaluation/evidence-holdout/${file}`,
    ),
    ...candidates.map((name) => `evaluation/evidence-holdout/candidates/${name}/queue.mjs`),
    ...['evidence-runtime', 'evidence-contract', 'evidence-store', 'evidence-process'].map(
      (name) => `dist/${name}.js`,
    ),
  ];
  return Object.fromEntries(
    inputs.map((file) => {
      const bytes = fs.readFileSync(path.join(repository, file));
      return [
        file,
        {
          sha256: createHash('sha256').update(bytes).digest('hex'),
          bytes: bytes.length,
          lines: bytes.toString('utf8').trimEnd().split('\n').length,
        },
      ];
    }),
  );
}

export async function runRestartComparison() {
  const workspace = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'devmethod-restart-comparison-'),
  );
  const options = prepareRestartFixture(workspace);
  const report = {
    format: 1,
    kind: 'known-fault-repair-not-generalization',
    workspace,
    node: process.version,
    platform: process.platform,
    createdAt: new Date().toISOString(),
    inputs: sourceEvidence(),
    addedMaintainedCode: maintained,
    cases: [],
  };
  save(path.join(workspace, 'results.json'), report);
  for (const candidate of candidates) {
    const root = path.join(workspace, candidate);
    const ordinary = ordinaryRun(root, options.evaluatorRoot);
    const observation = { candidate, ordinary };
    report.cases.push(observation);
    save(path.join(workspace, 'results.json'), report);
    assert.ok(!ordinary.error && !ordinary.signal && [0, 1].includes(ordinary.status));
    ordinary.verdicts = JSON.parse(ordinary.stdout).verdicts;
    const plan = inspectEvidence({ ...options, root });
    const start = performance.now();
    observation.lab = await runEvidence({
      ...options,
      root,
      session: path.join(workspace, `session-${candidate}`),
      permit: plan.permit,
    });
    observation.labDurationMs = performance.now() - start;
    observation.labInvocations = plan.invocations;
    save(path.join(workspace, 'results.json'), report);
  }
  report.runnerInvocations = {
    ordinary: report.cases.length,
    lab: report.cases.reduce(
      (sum, item) => sum + item.lab.results.filter((result) => result.status !== 'not-run').length,
      0,
    ),
  };
  report.derivedNodeProcessesOnCompletedPaths = {
    ordinary: report.runnerInvocations.ordinary * 5,
    lab: report.runnerInvocations.lab * 5,
  };
  report.limitations =
    'Known repair cases, fixed order, one local run; nested process counts derived from completed paths. No native model, author-time, human-effort or user-benefit measurement.';
  save(path.join(workspace, 'results.json'), report);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await runRestartComparison();
  console.log(JSON.stringify({ workspace: report.workspace, counts: report.runnerInvocations }));
}
