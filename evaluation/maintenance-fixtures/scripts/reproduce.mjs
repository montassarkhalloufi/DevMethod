import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const pkg = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [suite, output, version = 'v3'] = process.argv.slice(2);
assert.ok(suite && output && path.isAbsolute(suite) && path.isAbsolute(output));
assert.ok(!fs.existsSync(output), 'Use a new output path');
assert.ok(['v2', 'v3'].includes(version));
assert.equal(process.version, 'v24.18.0', 'Use pinned Node 24.18.0');
let evaluator = path.join(suite, 'evaluator/evaluate.mjs');
if (version === 'v2') {
  const dir = path.join(path.dirname(output), 'v2-evaluator-' + process.pid);
  fs.cpSync(path.join(suite, 'evaluator'), dir, { recursive: true });
  fs.copyFileSync(path.join(pkg, 'history/v2-evaluate.mjs'), path.join(dir, 'evaluate.mjs'));
  evaluator = path.join(dir, 'evaluate.mjs');
}
const historical = JSON.parse(fs.readFileSync(path.join(pkg, 'evidence', version + '-public-calibration.json')));
const controls = JSON.parse(fs.readFileSync(path.join(suite, 'evaluator/controls.json')));
const rows = [];
for (const recorded of historical.executions) {
  const { case: id, variant } = recorded;
  const relative = variant === 'starting' ? 'cases/' + id + '/worker' : variant === 'healthy' ? controls[id].healthy : controls[id].mutants[variant].directory;
  const argv = [evaluator, id, path.join(suite, relative)];
  const started = performance.now();
  const actual = spawnSync(process.execPath, argv, { encoding: 'utf8', timeout: 10000, maxBuffer: 262144 });
  let report = null;
  try { report = JSON.parse(actual.stdout); } catch {}
  const statusMatches = actual.status === recorded.status;
  const verdictsMatch = JSON.stringify(report?.verdicts) === JSON.stringify(recorded.report?.verdicts);
  rows.push({ case: id, variant, argv: [process.execPath, ...argv], status: actual.status, signal: actual.signal, error: actual.error?.message ?? null, stdout: actual.stdout, stderr: actual.stderr, durationMs: performance.now() - started, report, expectedHistoricalStatus: recorded.status, statusMatches, verdictsMatch });
}
const mismatches = rows.filter((r) => !r.statusMatches || !r.verdictsMatch);
const result = { format: 1, kind: 'Public derivative deterministic witness reproduction, not agent tests or native evidence', version, node: process.version, rows, matchesHistoricalPublicVerdicts: mismatches.length === 0, outerInvocations: rows.length, nestedStoreInvocations: rows.reduce((sum, row) => sum + (row.report?.processes ?? 0), 0) };
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ output, rows: rows.length, mismatches: mismatches.length, nestedStoreInvocations: result.nestedStoreInvocations }));
process.exitCode = mismatches.length ? 1 : 0;
