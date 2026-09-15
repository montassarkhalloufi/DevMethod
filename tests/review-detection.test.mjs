import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { scoreDetection } from '../evaluation/review-detection/score.mjs';

test('seeded application defects are reproducible, independent of report formatting', () => {
  const result = spawnSync(
    process.execPath,
    ['--test', 'evaluation/review-detection/reproduce.test.mjs'],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
test('calibration counts missed defects, false positives and unresolved findings separately', () => {
  const oracle = JSON.parse(fs.readFileSync('evaluation/review-detection/oracle.json'));
  const expected = oracle.cases.flatMap((c) => c.defects.map((d) => d.id));
  // Constructed scorer calibration, NOT an observed model response.
  const findings = [
    'found-leak',
    'found-race',
    'duplicate-race',
    'style-blocker',
    'risk',
    'unread',
  ].map((id) => ({ id, confidence: id === 'risk' ? 'suspected' : 'confirmed' }));
  const match = (findingId, defectIds) => ({
    findingId,
    defectIds,
    verdict: 'matched',
    evidenceReviewed: true,
    impactJustified: true,
  });
  const result = scoreDetection(expected, findings, [
    match('found-leak', ['LEAK']),
    match('found-race', ['RACE']),
    match('duplicate-race', ['RACE']),
    { findingId: 'style-blocker', verdict: 'false-positive' },
    { findingId: 'risk', verdict: 'unresolved' },
  ]);
  assert.deepEqual(result.detected, ['LEAK', 'RACE']);
  assert.deepEqual(result.missed, ['PARTIAL', 'TIMEOUT', 'CONTRACT']);
  assert.deepEqual(result.falsePositives, ['style-blocker']);
  assert.deepEqual(result.unresolved, ['risk']);
  assert.deepEqual(result.unadjudicated, ['unread']);
  assert.equal(result.recall, 2 / 5);
  assert.equal(scoreDetection([], [], []).recall, null);
  assert.equal(scoreDetection(expected, [], []).missed.length, 5);
  assert.throws(
    () => scoreDetection(expected, findings, [match('risk', ['TIMEOUT'])]),
    /unconfirmed/,
  );
  assert.throws(
    () =>
      scoreDetection(expected, findings, [
        { ...match('found-leak', ['LEAK']), impactJustified: false },
      ]),
    /impact/,
  );
  assert.throws(
    () => scoreDetection(expected, findings, [match('found-leak', ['invented'])]),
    /Unknown/,
  );
});
