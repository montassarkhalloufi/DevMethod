import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { controlChoices } from '../scripts/atelier/public/controls.js';

const seed = JSON.parse(
  fs.readFileSync(new URL('../scripts/atelier/gazette.json', import.meta.url), 'utf8'),
);

test('a valid read-only prototype has a usable empty control state', () => {
  const project = structuredClone(seed);
  project.variants.forEach((variant) => {
    variant.actions = [];
  });
  const result = controlChoices(project, {});
  assert.deepEqual(result.transitions, []);
  assert.deepEqual(result.creations, []);
  assert.deepEqual(result.records, []);
});

test('creation choices follow the target prototype, including new action identities', () => {
  const project = structuredClone(seed);
  project.variants[1].actions[0].id = 'create-peer';
  const single = controlChoices(project, {}, project.variants[1].id);
  assert.equal(single.creations[0].id, 'create-peer');
  const shared = controlChoices(project, {});
  assert.deepEqual(
    shared.creations.map((action) => action.id),
    ['create', 'create-peer'],
  );
});
