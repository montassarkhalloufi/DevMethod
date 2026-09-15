import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonReadiness } from '../scripts/comparison-readiness.mjs';

test('initialization success alone cannot admit an unattended comparison', () => {
  const result = comparisonReadiness({ bmadInitializationPassed: true });
  assert.equal(result.ready, false);
  assert.ok(result.missing.includes('synchronousSubagentsAvailable'));
  assert.ok(result.missing.includes('descendantUsageMeasured'));
  assert.ok(result.missing.includes('gitMetadataWritable'));
});

test('all requirements are explicit and missing or non-boolean evidence blocks admission', () => {
  const fields = comparisonReadiness({}).missing;
  const complete = Object.fromEntries(fields.map((key) => [key, true]));
  assert.equal(comparisonReadiness(complete).ready, true);
  for (const key of fields) {
    assert.deepEqual(comparisonReadiness({ ...complete, [key]: 'passed' }).missing, [key]);
  }
});
