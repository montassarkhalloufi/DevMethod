import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const criteria = ['capacity', 'idempotency', 'cancellation', 'durability'];
const modes = ['healthy', ...criteria.map((name) => `${name}-fault`)];
const results = [];
function run(runner, mode) {
  const result = spawnSync(
    process.execPath,
    [runner, '/unused-independent-candidate', mode, 'domain'],
    {
      encoding: 'utf8',
      timeout: 5000,
    },
  );
  if (result.error) throw result.error;
  assert.equal(result.signal, null, 'Checker terminated without a normal exit');
  return result;
}
for (const runner of ['check.mjs', 'weak-check.mjs']) {
  for (const mode of modes) {
    const result = run(join(root, runner), mode);
    const report = JSON.parse(result.stdout);
    assert.equal(report.format, 1);
    assert.equal(report.check, 'domain');
    assert.deepEqual(Object.keys(report.verdicts).sort(), [...criteria].sort());
    if (runner === 'check.mjs' && mode !== 'healthy') {
      assert.equal(result.status, 1);
      assert.equal(report.verdicts[mode.replace('-fault', '')], 'failed');
    } else {
      assert.equal(result.status, 0);
      assert(Object.values(report.verdicts).every((value) => value === 'passed'));
    }
    results.push({ runner, mode, exitCode: result.status, stdout: report, stderr: result.stderr });
  }
}
for (const mode of ['unknown-mode', 'candidate']) {
  const result = run(join(root, 'check.mjs'), mode);
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '', 'Technical failure emitted a semantic verdict');
  results.push({ runner: 'check.mjs', mode, exitCode: result.status, validSemanticVerdict: false });
}
const temporary = mkdtempSync(join(tmpdir(), 'devmethod-oracle-maintenance-'));
try {
  for (const name of ['check.mjs', 'reference.mjs', 'expected-seeds.json']) {
    copyFileSync(join(root, name), join(temporary, name));
  }
  const expected = JSON.parse(readFileSync(join(temporary, 'expected-seeds.json'), 'utf8'));
  expected.slots.find((slot) => slot.id === 'garden').capacity = 4;
  writeFileSync(join(temporary, 'expected-seeds.json'), JSON.stringify(expected));
  const result = run(join(temporary, 'check.mjs'), 'healthy');
  const report = JSON.parse(result.stdout);
  assert.equal(result.status, 0);
  assert(Object.values(report.verdicts).every((value) => value === 'passed'));
  results.push({
    probe: 'independent-reference-garden-capacity-4',
    exitCode: result.status,
    stdout: report,
  });
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
writeFileSync(
  join(root, 'control-results.json'),
  `${JSON.stringify(
    {
      format: 1,
      recordedAt: new Date().toISOString(),
      node: process.version,
      command: 'node examples/evidence-lab/evaluator/run-controls.mjs',
      scope: 'Independent controls only; producer and runtime were not read or executed.',
      results,
    },
    null,
    2,
  )}\n`,
);
process.stdout.write(`Validated ${results.length} independent control probes.\n`);
