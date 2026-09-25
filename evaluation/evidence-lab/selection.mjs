import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

// Fixed authored fixtures; no model calls, hidden cases, or generated candidates.
const directory = path.dirname(fileURLToPath(import.meta.url));
const hash = (value) => createHash('sha256').update(value).digest('hex');
const capacityCases = `
  assert.equal(run({ capacity: 5, occupied: 2, quantity: 3 }), 0);
  assert.equal(run({ capacity: 5, occupied: 4, quantity: 2 }), null);`;
const invoiceCases = `
  assert.equal(run({ lines: [{ cents: 199, quantity: 3 }], discountBps: 0 }), 597);
  assert.equal(run({ lines: [{ cents: 101, quantity: 2 }, { cents: 200, quantity: 1 }], discountBps: 0 }), 402);`;
const domains = [
  {
    id: 'capacity-booking',
    implementations: {
      healthy: 'export const run = ({ capacity, occupied, quantity }) => quantity > 0 && occupied + quantity <= capacity ? capacity - occupied - quantity : null;',
      'primary-fault': 'export const run = ({ capacity, occupied, quantity }) => quantity > 0 && quantity <= capacity ? capacity - occupied - quantity : null;',
      'secondary-fault': 'export const run = ({ capacity, occupied, quantity }) => occupied + quantity <= capacity ? capacity - occupied - quantity : null;',
    },
    assertions: {
      strong: `${capacityCases}
  assert.equal(run({ capacity: 5, occupied: 2, quantity: 0 }), null);
  assert.equal(run({ capacity: 5, occupied: 2, quantity: -1 }), null);`,
      partial: capacityCases,
      tautological: 'const input = { capacity: 5, occupied: 4, quantity: 2 }; assert.equal(run(input), run(input));',
    },
  },
  {
    id: 'cents-invoice',
    implementations: {
      healthy: 'export const run = ({ lines, discountBps }) => Math.round(lines.reduce((sum, line) => sum + line.cents * line.quantity, 0) * (10000 - discountBps) / 10000);',
      'primary-fault': 'export const run = ({ lines, discountBps }) => Math.round(lines.reduce((sum, line) => sum + line.cents, 0) * (10000 - discountBps) / 10000);',
      'secondary-fault': 'export const run = ({ lines, discountBps }) => Math.floor(lines.reduce((sum, line) => sum + line.cents * line.quantity, 0) * (10000 - discountBps) / 10000);',
    },
    assertions: {
      strong: `${invoiceCases}
  assert.equal(run({ lines: [{ cents: 105, quantity: 1 }], discountBps: 5000 }), 53);
  assert.equal(run({ lines: [{ cents: 199, quantity: 3 }], discountBps: 10000 }), 0);`,
      partial: invoiceCases,
      tautological: 'const input = { lines: [{ cents: 105, quantity: 3 }], discountBps: 5000 }; assert.equal(run(input), run(input));',
    },
  },
];
const oracleIds = ['strong', 'partial', 'tautological', 'always-fail', 'broken-import'];
const candidateIds = ['healthy', 'primary-fault', 'secondary-fault'];
const runner = `
try {
  const { run } = await import('./implementation.mjs');
  const { check } = await import('./oracle.mjs');
  check(run);
  console.log(JSON.stringify({ outcome: 'pass' }));
} catch (error) {
  const outcome = error?.code === 'ERR_ASSERTION' ? 'criterion-failure' : 'infrastructure-error';
  console.log(JSON.stringify({ outcome, code: error?.code ?? null, message: String(error?.message).slice(0, 600) }));
  process.exitCode = outcome === 'criterion-failure' ? 1 : 2;
}`;
const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: directory, encoding: 'utf8', timeout: 1000 });
const report = {
  format: 1,
  kind: 'deterministic-mechanism-fixtures-not-native',
  startedAt: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform,
  baseRevision: git.status === 0 ? git.stdout.trim() : null,
  protocolSha256: hash(fs.readFileSync(path.join(directory, 'PROTOCOL.md'))),
  scriptSha256: hash(fs.readFileSync(fileURLToPath(import.meta.url))),
  runnerSha256: hash(runner),
  budget: { maximumExperimentalProcesses: 100, childTimeoutMs: 1000, childOutputLimitBytes: 16384 },
  measurementsUnavailable: ['tokens', 'model-cost', 'candidate-generation-cost', 'user-interruptions', 'native-model-success'],
  cases: domains.map((domain) => ({ id: domain.id, split: 'development', implementations: domain.implementations, assertions: domain.assertions })),
  executions: [],
  decisions: [],
  arms: {},
};
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'devmethod-evidence-selection-'));

function oracleSource(domain, oracle) {
  if (oracle === 'broken-import') return "import './missing-dependency.mjs'; export const check = () => {};";
  const assertions = oracle === 'always-fail' ? "assert.fail('Deliberately unusable criterion');" : domain.assertions[oracle];
  return `import assert from 'node:assert/strict';\nexport function check(run) { ${assertions}\n}\n`;
}

function classify(child) {
  if (child.error?.code === 'ETIMEDOUT') return { outcome: 'timeout' };
  if (child.error || child.signal) return { outcome: 'infrastructure-error', code: child.error?.code ?? child.signal };
  try {
    const result = JSON.parse(child.stdout);
    const statuses = { pass: 0, 'criterion-failure': 1, 'infrastructure-error': 2 };
    if (statuses[result.outcome] !== child.status || !Object.hasOwn(statuses, result.outcome)) return { outcome: 'output-protocol-error' };
    return result;
  } catch {
    return { outcome: 'output-protocol-error' };
  }
}

function evaluate(arm, domain, oracle, candidate, role = 'candidate') {
  if (report.executions.length >= 100) throw new Error('Experimental process budget exhausted');
  const id = report.executions.length + 1;
  const cwd = path.join(temporary, String(id));
  fs.mkdirSync(cwd);
  const source = oracleSource(domain, oracle);
  fs.writeFileSync(path.join(cwd, 'implementation.mjs'), domain.implementations[candidate]);
  fs.writeFileSync(path.join(cwd, 'oracle.mjs'), source);
  fs.writeFileSync(path.join(cwd, 'runner.mjs'), runner);
  const start = performance.now();
  const child = spawnSync(process.execPath, ['runner.mjs'], { cwd, encoding: 'utf8', timeout: 1000, maxBuffer: 16384 });
  const record = {
    id, arm, domain: domain.id, oracle, candidate, role,
    elapsedMs: Math.round((performance.now() - start) * 1000) / 1000,
    exitCode: child.status, signal: child.signal, ...classify(child),
    implementationSha256: hash(domain.implementations[candidate]), oracleSha256: hash(source),
    stdout: (child.stdout ?? '').replaceAll(temporary, '<temporary>'),
    stderr: (child.stderr ?? '').replaceAll(temporary, '<temporary>'),
  };
  if (record.message) record.message = record.message.replaceAll(temporary, '<temporary>');
  report.executions.push(record);
  return record;
}

function assessCandidate(arm, domain, oracle, candidate) {
  const execution = evaluate(arm, domain, oracle, candidate);
  report.decisions.push({
    arm, domain: domain.id, oracle, candidate, truth: candidate === 'healthy' ? 'healthy' : 'faulty',
    outcome: execution.outcome === 'pass' ? 'accepted' : execution.outcome === 'criterion-failure' ? 'rejected' : 'check-unavailable',
    executionIds: [execution.id],
  });
}

function runArm(arm, execute) {
  const start = performance.now();
  const first = report.executions.length;
  for (const domain of domains) for (const oracle of oracleIds) execute(domain, oracle);
  const executions = report.executions.slice(first);
  report.arms[arm] = {
    executions: executions.length,
    cumulativeChildMs: Math.round(executions.reduce((sum, row) => sum + row.elapsedMs, 0) * 1000) / 1000,
    wallMs: Math.round((performance.now() - start) * 1000) / 1000,
    childOutcomes: Object.fromEntries(['pass', 'criterion-failure', 'infrastructure-error', 'timeout', 'output-protocol-error'].map((outcome) => [outcome, executions.filter((row) => row.outcome === outcome).length])),
  };
}

try {
  runArm('A-candidate-only', (domain, oracle) => {
    for (const candidate of candidateIds) assessCandidate('A-candidate-only', domain, oracle, candidate);
  });
  runArm('B-calibrated', (domain, oracle) => {
    const healthy = evaluate('B-calibrated', domain, oracle, 'healthy', 'healthy-control');
    const fault = evaluate('B-calibrated', domain, oracle, 'primary-fault', 'fault-control');
    const valid = healthy.outcome === 'pass' && fault.outcome === 'criterion-failure';
    report.decisions.push({ arm: 'B-calibrated', domain: domain.id, oracle, role: 'calibration', outcome: valid ? 'valid' : 'invalid-oracle', invalidHealthyControl: healthy.outcome !== 'pass', invalidFaultControl: fault.outcome !== 'criterion-failure', executionIds: [healthy.id, fault.id] });
    for (const candidate of candidateIds) {
      if (valid) assessCandidate('B-calibrated', domain, oracle, candidate);
      else report.decisions.push({ arm: 'B-calibrated', domain: domain.id, oracle, candidate, truth: candidate === 'healthy' ? 'healthy' : 'faulty', outcome: 'invalid-oracle', executionIds: [] });
    }
  });
  runArm('C-portfolio', (domain, oracle) => {
    const order = [...candidateIds].sort((a, b) => hash(`DevMethod-evidence-lab-v1:${domain.id}:${a}`).localeCompare(hash(`DevMethod-evidence-lab-v1:${domain.id}:${b}`)));
    const executions = candidateIds.map((candidate) => evaluate('C-portfolio', domain, oracle, candidate));
    const selected = order.find((candidate) => executions.some((row) => row.candidate === candidate && row.outcome === 'pass')) ?? null;
    report.decisions.push({ arm: 'C-portfolio', domain: domain.id, oracle, order, selected, truth: selected === null ? null : selected === 'healthy' ? 'healthy' : 'faulty', firstCandidate: order[0], firstCandidateAcceptedByA: report.decisions.some((row) => row.arm === 'A-candidate-only' && row.domain === domain.id && row.oracle === oracle && row.candidate === order[0] && row.outcome === 'accepted'), outcome: selected === null ? 'no-selection' : 'accepted', executionIds: executions.map((row) => row.id) });
  });
  for (const arm of ['A-candidate-only', 'B-calibrated']) {
    const rows = report.decisions.filter((row) => row.arm === arm && row.candidate);
    const count = (test) => rows.filter(test).length;
    report.arms[arm].candidateMetrics = {
      falseAcceptance: count((row) => row.truth === 'faulty' && row.outcome === 'accepted'), faultyCandidates: count((row) => row.truth === 'faulty'),
      falseRejection: count((row) => row.truth === 'healthy' && row.outcome === 'rejected'), healthyCandidates: count((row) => row.truth === 'healthy'),
      healthyWithheldInvalidOracle: count((row) => row.truth === 'healthy' && row.outcome === 'invalid-oracle'),
      healthyCheckUnavailable: count((row) => row.truth === 'healthy' && row.outcome === 'check-unavailable'),
    };
  }
  const calibrations = report.decisions.filter((row) => row.role === 'calibration');
  report.arms['B-calibrated'].controlMetrics = { calibrations: calibrations.length, invalidOracles: calibrations.filter((row) => row.outcome === 'invalid-oracle').length, invalidHealthyControls: calibrations.filter((row) => row.invalidHealthyControl).length, invalidFaultControls: calibrations.filter((row) => row.invalidFaultControl).length };
  const portfolios = report.decisions.filter((row) => row.arm === 'C-portfolio');
  report.arms['C-portfolio'].selectionMetrics = { portfolios: portfolios.length, wrongSelection: portfolios.filter((row) => row.truth === 'faulty').length, healthySelection: portfolios.filter((row) => row.truth === 'healthy').length, noSelection: portfolios.filter((row) => row.selected === null).length };
  report.status = 'complete';
} catch (error) {
  report.status = 'aborted';
  report.error = String(error.message);
  process.exitCode = 1;
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
  report.finishedAt = new Date().toISOString();
  const resultPath = path.join(directory, 'results.json');
  fs.writeFileSync(`${resultPath}.tmp`, `${JSON.stringify(report, null, 2)}\n`);
  fs.renameSync(`${resultPath}.tmp`, resultPath);
  console.log(JSON.stringify({ status: report.status, experimentalProcesses: report.executions.length, arms: report.arms }, null, 2));
}
