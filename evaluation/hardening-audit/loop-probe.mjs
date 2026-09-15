import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Run from the checkout under review. The protocol and oracle are fixed.
// Read-only synthetic probe; these are not native model trials.
const { inspectLoop } = await import(pathToFileURL(path.resolve('dist/loop.js')).href);
const values = [null, 0, 199, 200, 201];
const out = { traces: 0, unknownTraces: 0, thresholdDiagnosticsMissed: 0,
  afterLimitDiagnosticsMissed: 0, unsafeEligible: 0, examples: [] };

function check(tokens) {
  const r = inspectLoop({ format: 1, missionId: 'SCIENCE', state: 'active', nextAction: 'Inspect', stopReason: null,
    limits: { maxAttempts: 8, maxConsecutiveNoProgress: 8, maxDurationMs: null, maxObservedTokens: 200 },
    attempts: tokens.map((tokens, i) => ({ number: i + 1, outcome: 'passed', observation: 'Synthetic observation',
      diagnosis: 'Synthetic reconciliation', adjustment: 'Synthetic adjustment', evidenceIds: ['E1'],
      progress: true, durationMs: 0, tokens })) });
  out.traces++;
  const known = tokens.reduce((n, x) => n + BigInt(x ?? 0), 0n);
  const unknown = tokens.includes(null);
  if (unknown) out.unknownTraces++;
  const missThreshold = known >= 200n && !r.limitReasons.includes('observed-token-limit');
  if (missThreshold) out.thresholdDiagnosticsMissed++;
  let bound = 0n, missAfter = false;
  for (let i = 0; i < tokens.length; i++) {
    if (i > 0 && bound >= 200n && !r.findings.includes(`attempt-${i + 1}-after-limit`)) missAfter = true;
    bound += BigInt(tokens[i] ?? 0);
  }
  if (missAfter) out.afterLimitDiagnosticsMissed++;
  if (unknown && r.eligibleToConsider) out.unsafeEligible++;
  if ((missThreshold || missAfter) && out.examples.length < 3)
    out.examples.push({ tokens, missThreshold, missAfter, status: r.status, findings: r.findings, limitReasons: r.limitReasons });
}

function enumerate(prefix, n) {
  if (!n) return check(prefix);
  for (const value of values) enumerate([...prefix, value], n - 1);
}
for (let len = 1; len <= 3; len++) enumerate([], len);
console.log(JSON.stringify(out, null, 2));
