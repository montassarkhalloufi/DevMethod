import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { findWitness } from '../scripts/discovery/search.mjs';
import { discoverProject } from '../scripts/atelier/discovery.mjs';
import { createSession, replaySituation } from '../scripts/atelier/domain.mjs';

const observations = (left, right = left) => [
  { variantId: 'left', value: left },
  { variantId: 'right', value: right },
];
const chain = (end = 2, difference = Infinity) => ({
  initial: 0,
  key: String,
  actions: (state) => (state < end ? ['next'] : []),
  step: (state) => ({
    state: state + 1,
    observations: observations(true, state + 1 !== difference),
  }),
});

test('BFS returns a shortest real difference, not the first depth-first branch', () => {
  const edges = {
    start: ['long', 'short'],
    long: ['longer'],
    short: ['end'],
    longer: ['end'],
    end: [],
  };
  const result = findWitness({
    initial: 'start',
    key: String,
    actions: (state) => edges[state],
    step: (state, action) => ({
      state: action,
      observations: observations(0, action === 'end' ? 1 : 0),
    }),
  });
  assert.equal(result.status, 'witness');
  assert.deepEqual(
    result.trace.map((entry) => entry.action),
    ['short', 'end'],
  );
  assert.deepEqual(result.trace.at(-1).observations, observations(0, 1));
});

test('canonical values ignore object key order and cosmetic metadata, not array order', () => {
  const machine = {
    initial: false,
    key: String,
    actions: (done) => (done ? [] : ['inspect']),
    step: () => ({
      state: true,
      observations: [
        { variantId: 'a', reason: 'Label A', value: { z: [1, { b: 2, a: 1 }], a: true } },
        { variantId: 'b', reason: 'Label B', value: { a: true, z: [1, { a: 1, b: 2 }] } },
      ],
    }),
  };
  assert.equal(findWitness(machine).status, 'exhausted');
  machine.step = () => ({ state: true, observations: observations([1, 2], [2, 1]) });
  assert.equal(findWitness(machine).status, 'witness');
});

test('equivalent cycles exhaust their reachable keys instead of looping to the depth bound', () => {
  const result = findWitness({
    initial: 0,
    key: String,
    actions: () => ['flip'],
    step: (state) => ({ state: 1 - state, observations: observations(null) }),
  });
  assert.equal(result.status, 'exhausted');
  assert.equal(result.reason, 'frontier-exhausted');
  assert.deepEqual(result.stats, { states: 2, transitions: 2 });
});

test('depth frontier distinguishes an unexplored continuation, a terminal leaf and a witness', () => {
  const bounded = findWitness(chain(), { maxDepth: 1 });
  assert.equal(bounded.status, 'bounded');
  assert.equal(bounded.reason, 'maxDepth');
  assert.deepEqual(bounded.trace, []);
  assert.equal(findWitness(chain(), { maxDepth: 2 }).status, 'exhausted');
  assert.equal(findWitness(chain(2, 2), { maxDepth: 2 }).status, 'witness');
  assert.equal(findWitness(chain(), { maxDepth: 0 }).status, 'bounded');
  assert.equal(findWitness(chain(0), { maxDepth: 0 }).status, 'exhausted');
});

test('state and transition budgets stop only when work remains', () => {
  const states = findWitness(chain(), { maxStates: 1 });
  assert.equal(states.status, 'bounded');
  assert.equal(states.reason, 'maxStates');
  assert.deepEqual(states.stats, { states: 1, transitions: 1 });
  const transitions = findWitness(chain(), { maxTransitions: 1 });
  assert.equal(transitions.status, 'bounded');
  assert.equal(transitions.reason, 'maxTransitions');
  assert.deepEqual(transitions.stats, { states: 2, transitions: 1 });
  const exact = findWitness(chain(1), { maxStates: 2, maxTransitions: 1 });
  assert.equal(exact.status, 'exhausted');
  const immediate = findWitness(chain(1, 1), { maxStates: 1, maxTransitions: 1 });
  assert.equal(immediate.status, 'witness');
  assert.deepEqual(immediate.stats, { states: 1, transitions: 1 });
});

test('callbacks cannot mutate the supplied initial state, sibling inputs or saved actions', () => {
  const initial = { count: 0, touched: [] };
  const actions = [{ add: 1 }, { add: 2 }];
  const starts = [];
  const result = findWitness({
    initial,
    key: (state) => {
      state.touched.push('key');
      return String(state.count);
    },
    actions: (state) => {
      state.touched.push('actions');
      return state.count ? [] : actions;
    },
    step: (state, action) => {
      starts.push(structuredClone(state));
      state.count += action.add;
      action.add = 99;
      return {
        state,
        observations: observations(state.count, state.count === 2 ? 3 : state.count),
      };
    },
  });
  assert.equal(result.status, 'witness');
  assert.deepEqual(initial, { count: 0, touched: [] });
  assert.deepEqual(starts, [initial, initial]);
  assert.deepEqual(actions, [{ add: 1 }, { add: 2 }]);
  assert.deepEqual(result.trace[0].action, { add: 2 });
});

test('invalid limits and malformed machine responses fail explicitly', () => {
  for (const options of [
    null,
    [],
    { unknown: 1 },
    { maxDepth: -1 },
    { maxDepth: 33 },
    { maxDepth: 0.5 },
    { maxStates: 0 },
    { maxStates: 10001 },
    { maxTransitions: 50001 },
    { maxTransitions: NaN },
  ])
    assert.throws(() => findWitness(chain(), options), /option|integer/i);
  assert.throws(() => findWitness({ ...chain(), key: () => 1 }), /key.*string/);
  assert.throws(() => findWitness({ ...chain(), actions: () => new Set() }), /actions.*array/);
  assert.throws(() => findWitness({ ...chain(), step: () => ({}) }), /state, observations/);
  assert.throws(
    () => findWitness({ ...chain(), step: () => ({ state: 1, observations: [] }) }),
    /two observations/,
  );
  assert.throws(
    () =>
      findWitness({
        ...chain(),
        step: () => ({
          state: 1,
          observations: [
            { variantId: 'a', value: 1 },
            { variantId: 'a', value: 1 },
          ],
        }),
      }),
    /unique variantId/,
  );
  assert.throws(
    () =>
      findWitness({
        ...chain(),
        step: () => {
          throw new Error('domain failed');
        },
      }),
    /domain failed/,
  );
});

test('non-JSON and cyclic values are rejected rather than silently compared as null', () => {
  const cyclic = {};
  cyclic.self = cyclic;
  for (const initial of [NaN, undefined, { value: undefined }, new Date(), cyclic, Array(2)])
    assert.throws(() => findWitness({ ...chain(), initial }), /JSON|cycles/);
  assert.throws(
    () =>
      findWitness({
        ...chain(),
        step: () => ({ state: 1, observations: observations(NaN, null) }),
      }),
    /JSON/,
  );
});

const gazette = JSON.parse(
  fs.readFileSync(new URL('../scripts/atelier/gazette.json', import.meta.url), 'utf8'),
);

function fixture(
  records = [{ id: 'story', title: 'Texte fictif', state: 'draft', owner: 'owner' }],
) {
  const project = structuredClone(gazette);
  project.actors = [
    { id: 'owner', label: 'Auteur' },
    { id: 'editor', label: 'Éditeur' },
  ];
  project.records = records;
  project.variants.forEach((variant, index) => {
    variant.states = ['draft', 'ready', 'published'].map((id) => ({ id, label: id }));
    variant.actions = [
      {
        id: 'create',
        label: 'Créer',
        kind: 'create',
        from: [],
        to: 'draft',
        actors: ['owner', 'editor'],
        otherOwner: false,
      },
      {
        id: 'submit',
        label: 'Soumettre',
        kind: 'transition',
        from: ['draft'],
        to: 'ready',
        actors: ['owner', 'editor'],
        otherOwner: false,
      },
      {
        id: 'publish',
        label: 'Publier',
        kind: 'transition',
        from: ['ready'],
        to: 'published',
        actors: index ? ['editor', 'owner'] : ['editor'],
        otherOwner: false,
      },
    ];
  });
  return project;
}

function assertReplay(project, result) {
  for (let index = 0; index < result.trace.length; index += 1) {
    const replayed = replaySituation(createSession(project), result.steps.slice(0, index + 1));
    for (const observation of result.trace[index].observations) {
      const lane = replayed.lanes[observation.variantId];
      assert.deepEqual(observation.value, {
        allowed: lane.events.at(-1).allowed,
        records: lane.records.map(({ id, state, owner, title }) => ({ id, state, owner, title })),
      });
    }
  }
}

test('Atelier witness needs two actions and replays through the actual domain without mutating the project', () => {
  const project = fixture();
  const before = JSON.stringify(project);
  const result = discoverProject(project);
  assert.equal(result.status, 'witness');
  assert.deepEqual(
    result.steps.map((step) => step.actionId),
    ['submit', 'publish'],
  );
  assert.equal(result.steps.at(-1).actorId, 'owner');
  assertReplay(project, result);
  assert.equal(JSON.stringify(project), before);
  assert.match(result.scope, /initiales fictives/);
  assert.deepEqual(discoverProject(project), result);
});

test('a new record can unlock a later difference, with only one fresh identity in the replay', () => {
  const project = fixture([]);
  const result = discoverProject(project);
  assert.equal(result.status, 'witness');
  assert.deepEqual(
    result.steps.map((step) => step.actionId),
    ['create', 'submit', 'publish'],
  );
  assert.equal(new Set(result.steps.map((step) => step.recordId)).size, 1);
  assertReplay(project, result);
});

test('mixed create/transition IDs retain both existing-record and fresh-record behavior', () => {
  const project = fixture();
  project.variants[0].actions = [{ ...project.variants[0].actions[1], id: 'mixed' }];
  project.variants[1].actions = [{ ...project.variants[1].actions[0], id: 'mixed' }];
  let result = discoverProject(project);
  assert.equal(result.status, 'witness');
  assert.equal(result.steps[0].recordId, 'story');
  assertReplay(project, result);
  project.records = [];
  result = discoverProject(project);
  assert.equal(result.status, 'witness');
  assert.equal(result.steps[0].recordId, 'discovery-record');
  assertReplay(project, result);
});

test('cosmetic reasons do not make a witness and the domain quota counter is not silently merged', () => {
  const project = fixture();
  for (const [index, variant] of project.variants.entries())
    variant.actions = [
      { ...variant.actions[1], from: ['draft'], to: 'draft', label: `Other label ${index}` },
    ];
  const result = discoverProject(project, { maxDepth: 2 });
  assert.equal(result.status, 'bounded');
  assert.equal(result.reason, 'maxDepth');
  assert.equal(result.stats.states, 3);
  assert.deepEqual(result.steps, []);
});

test('adapter accepts no-action projects, avoids record ID collisions and rejects invalid projects', () => {
  const project = fixture();
  project.variants.forEach((variant) => {
    variant.actions = [];
  });
  assert.equal(discoverProject(project).status, 'exhausted');
  const collision = fixture([
    { id: 'discovery-record', title: 'Texte', state: 'draft', owner: 'owner' },
  ]);
  assert.match(discoverProject(collision).scope, /discovery-record-1/);
  assert.throws(() => discoverProject({ ...project, variants: [] }), /2–4/);
});
