import test from 'node:test';
import assert from 'node:assert/strict';
import { profileChanges } from '../scripts/studio/risk-profile.mjs';

const profile = (before, after, path = 'src/app.ts') => profileChanges([{ path, before, after }]);

test('risk profiles distinguish spacing from CSS interaction changes', () => {
  const spacing = profile('.card { padding: 8px; }', '.card { padding: 12px; }', 'app.css');
  assert.deepEqual(spacing.categories, ['visual']);
  assert.deepEqual(spacing.checks, ['visual-comparison']);
  const interaction = profile(
    'button { color: red; }',
    'button { pointer-events: none; }',
    'app.css',
  );
  assert.ok(interaction.categories.includes('interaction'));
  assert.ok(interaction.checks.includes('end-to-end'));
});

test('changed asynchronous persistence requires concurrency evidence, unlike cosmetic CSS', () => {
  const result = profile(
    '',
    'async function reserve() { const n = await db.count(); await db.insert(n + 1); }',
  );
  assert.ok(result.categories.includes('concurrency'));
  assert.ok(result.checks.includes('concurrency'));
  assert.ok(result.findings.every((finding) => finding.line > 0));
});

test('comments and unchanged concurrent functions do not create new concurrency findings', () => {
  const code = 'async function reserve() { await db.update(); }';
  const result = profile(
    code + '\nconst title = "a";',
    code + '\nconst title = "b"; // await db.insert()',
  );
  assert.ok(!result.categories.includes('concurrency'));
});

test('network state, permission branches, deleted code and unsupported syntax retain coverage limits', () => {
  assert.ok(
    profile('', 'async function search() { setRows(await fetch(url)); }').checks.includes(
      'network-recovery',
    ),
  );
  assert.ok(
    profile('if (user.role === "admin") allow();', 'allow();').checks.includes('authorization'),
  );
  assert.ok(profile('', 'def reserve(): pass', 'app.py').limits.length);
  assert.ok(profile('', 'const broken = ;').limits.length);
});

test('an additional identical statement is still a changed behavior', () => {
  assert.ok(profile('charge();', 'charge(); charge();').categories.includes('logic'));
});

test('named persistence operations still require concurrent verification', () => {
  const result = profile(
    '',
    'async function book() { const n = await db.capacity(); await db.insertBooking(); await db.setCapacity(n - 1); }',
  );
  assert.ok(result.checks.includes('concurrency'));
});
