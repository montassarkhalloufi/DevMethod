import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProject,
  createSession,
  performAction,
  replaySituation,
  chooseDirection,
  reviseIntent,
  applyProposal,
  exportDecision,
} from '../scripts/atelier/domain.mjs';

function project() {
  const direct = {
    id: 'direct',
    title: 'Direct booking',
    premise: 'People reserve directly.',
    tradeoff: 'Less coordination, less oversight.',
    design: { layout: 'board', accent: '#325978' },
    architecture: {
      boundaries: ['Local state'],
      data: 'Fictional bookings',
      tradeoffs: ['No sync'],
    },
    states: [
      { id: 'queued', label: 'Queued' },
      { id: 'active', label: 'Active' },
      { id: 'done', label: 'Done' },
    ],
    actions: [
      {
        id: 'request',
        label: 'Request',
        kind: 'create',
        from: [],
        to: 'active',
        actors: ['requester', 'facilitator'],
        otherOwner: false,
      },
      {
        id: 'start',
        label: 'Start',
        kind: 'transition',
        from: ['queued'],
        to: 'active',
        actors: ['requester', 'facilitator'],
        otherOwner: false,
      },
      {
        id: 'finish',
        label: 'Finish',
        kind: 'transition',
        from: ['active'],
        to: 'done',
        actors: ['requester', 'facilitator'],
        otherOwner: false,
      },
    ],
  };
  const review = structuredClone(direct);
  review.id = 'review';
  review.title = 'Facilitated booking';
  review.actions[0].to = 'queued';
  review.actions[1].actors = ['facilitator'];
  review.actions[1].otherOwner = true;
  return {
    format: 1,
    id: 'room',
    title: 'Room choices',
    brief: 'Explore fictional booking choices.',
    actors: [
      { id: 'requester', label: 'Requester' },
      { id: 'facilitator', label: 'Facilitator' },
    ],
    constraints: [{ id: 'preserve', text: 'Keep existing reservations.' }],
    sources: [{ title: 'Reference', url: 'https://example.org/rooms', note: 'Fictional context' }],
    questions: ['Who should confirm?'],
    records: [{ id: 'r1', title: 'Shared room', state: 'queued', owner: 'requester' }],
    variants: [direct, review],
  };
}

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

const start = { actionId: 'start', actorId: 'requester', recordId: 'r1' };

test('project import validates references, bounds and unknown fields without changing input', () => {
  const input = freeze(project());
  const accepted = validateProject(input);
  assert.deepEqual(accepted, input);
  assert.notEqual(accepted.variants[0], input.variants[0]);
  const invalid = [
    [
      (p) => {
        p.variants[0].actions[0].expression = 'run()';
      },
      /unknown.*expression/i,
    ],
    [
      (p) => {
        p.actors.push(p.actors[0]);
      },
      /duplicate.*requester/i,
    ],
    [
      (p) => {
        p.records[0].state = 'missing';
      },
      /state.*missing/i,
    ],
    [
      (p) => {
        p.records[0].owner = 'missing';
      },
      /owner.*missing/i,
    ],
    [
      (p) => {
        p.variants[0].actions[0].actors = ['missing'];
      },
      /actor.*missing/i,
    ],
    [
      (p) => {
        p.variants[0].actions[1].from = ['missing'];
      },
      /state.*missing/i,
    ],
    [
      (p) => {
        p.sources[0].url = 'javascript:alert(1)';
      },
      /https?/i,
    ],
    [
      (p) => {
        p.variants = [p.variants[0]];
      },
      /variants.*2.*4/i,
    ],
    [
      (p) => {
        p.brief = 'x'.repeat(10001);
      },
      /brief/i,
    ],
  ];
  for (const [change, expected] of invalid) {
    const candidate = project();
    change(candidate);
    const before = structuredClone(candidate);
    assert.throws(() => validateProject(candidate), expected);
    assert.deepEqual(candidate, before);
  }
});

test('one shared intent yields independent actual outcomes and preserves record identity', () => {
  const original = freeze(createSession(project()));
  const { session, outcomes } = performAction(original, start);
  assert.equal(outcomes[0].allowed, true);
  assert.equal(outcomes[0].before, 'queued');
  assert.equal(outcomes[0].after, 'active');
  assert.equal(outcomes[1].allowed, false);
  assert.match(outcomes[1].reason, /actor|permission/i);
  assert.deepEqual(session.lanes.direct.records[0], {
    id: 'r1',
    title: 'Shared room',
    owner: 'requester',
    state: 'active',
  });
  assert.equal(session.lanes.review.records[0].state, 'queued');
  assert.equal(original.lanes.direct.records[0].state, 'queued');
  assert.deepEqual(session.situation, [start]);
  assert.deepEqual(session.lanes.review.events, [outcomes[1]]);
  assert.notEqual(session.lanes.direct.records, session.lanes.review.records);
});

test('refusals never fabricate transitions, and targeted actions do not enter shared situations', () => {
  const session = createSession(project());
  const cases = [
    [{ ...start, actorId: 'nobody' }, /unknown actor/i],
    [{ ...start, actionId: 'missing' }, /unknown action/i],
    [{ ...start, recordId: 'missing' }, /unknown record/i],
    [{ ...start, actionId: 'finish' }, /state/i],
  ];
  for (const [input, reason] of cases) {
    const result = performAction(freeze(structuredClone(session)), input);
    for (const outcome of result.outcomes) {
      assert.equal(outcome.allowed, false);
      assert.match(outcome.reason, reason);
    }
    assert.deepEqual(result.session.lanes.direct.records, session.lanes.direct.records);
  }
  const targeted = performAction(session, { ...start, variantId: 'direct' });
  assert.equal(targeted.outcomes.length, 1);
  assert.deepEqual(targeted.session.situation, []);
  assert.deepEqual(targeted.session.lanes.review, session.lanes.review);
  assert.throws(
    () => performAction(session, { ...start, variantId: 'missing' }),
    /unknown variant/i,
  );
});

test('create keeps common IDs and normalized titles while owner rules and duplicates remain visible', () => {
  const created = performAction(createSession(project()), {
    actionId: 'request',
    actorId: 'facilitator',
    recordId: 'r2',
    title: '  Evening room  ',
  });
  assert.deepEqual(
    created.outcomes.map((o) => o.after),
    ['active', 'queued'],
  );
  assert.deepEqual(created.session.lanes.review.records[1], {
    id: 'r2',
    title: 'Evening room',
    owner: 'facilitator',
    state: 'queued',
  });
  const own = performAction(created.session, {
    variantId: 'review',
    actionId: 'start',
    actorId: 'facilitator',
    recordId: 'r2',
  });
  assert.equal(own.outcomes[0].allowed, false);
  assert.match(own.outcomes[0].reason, /owner/i);
  const duplicate = performAction(created.session, {
    actionId: 'request',
    actorId: 'requester',
    recordId: 'r2',
    title: 'Replacement',
  });
  assert.ok(duplicate.outcomes.every((o) => !o.allowed && /already|duplicate/i.test(o.reason)));
  assert.equal(duplicate.session.lanes.direct.records[1].title, 'Evening room');
  for (const title of [' ', 'x'.repeat(141)]) {
    const bad = performAction(created.session, {
      actionId: 'request',
      actorId: 'requester',
      recordId: 'r3',
      title,
    });
    assert.ok(bad.outcomes.every((o) => !o.allowed && /title/i.test(o.reason)));
    assert.equal(bad.session.lanes.direct.records.length, 2);
  }
});

test('an other-owner creation rule cannot silently create a record owned by its actor', () => {
  const input = project();
  input.variants[0].actions[0].otherOwner = true;
  const result = performAction(createSession(input), {
    actionId: 'request',
    actorId: 'requester',
    recordId: 'r2',
    title: 'Another room',
  });
  assert.equal(result.outcomes[0].allowed, false);
  assert.match(result.outcomes[0].reason, /owner/i);
  assert.equal(result.session.lanes.direct.records.length, 1);
  assert.equal(result.outcomes[1].allowed, true);
});

test('replay rebuilds from starting data and preserves decision and context without duplicate events', () => {
  let session = performAction(createSession(project()), start).session;
  session = performAction(session, { ...start, actionId: 'finish', variantId: 'direct' }).session;
  session = chooseDirection(session, { variantId: 'direct', reason: 'Requester control matters.' });
  const replayed = replaySituation(freeze(session));
  assert.equal(replayed.lanes.direct.records[0].state, 'active');
  assert.equal(replayed.lanes.direct.events.length, 1);
  assert.equal(replayed.lanes.review.events.length, 1);
  assert.deepEqual(replayed.decision, session.decision);
  assert.deepEqual(replaySituation(replayed), replayed);
  assert.equal(session.lanes.direct.records[0].state, 'done');
});

test('a changed intent preserves experience and choice reasons while requiring reconsideration', () => {
  let session = performAction(createSession(project()), start).session;
  session = chooseDirection(session, { variantId: 'direct', reason: 'Less coordination.' });
  const previous = freeze(session);
  const changed = reviseIntent(previous, {
    brief: 'A facilitator now shares the space.',
    constraints: [{ id: 'fairness', text: 'Discuss allocation.' }],
  });
  assert.equal(changed.revision, 2);
  assert.equal(changed.decision.reviewNeeded, true);
  assert.equal(changed.decision.reason, 'Less coordination.');
  assert.equal(changed.decision.revision, 1);
  assert.deepEqual(changed.lanes, previous.lanes);
  assert.equal(previous.decision.reviewNeeded, false);
  const chosen = chooseDirection(changed, {
    variantId: 'review',
    reason: 'Shared responsibility.',
  });
  assert.equal(chosen.history.length, 1);
  assert.equal(chosen.history[0].reason, 'Less coordination.');
  assert.equal(chosen.decision.variant.id, 'review');
  assert.equal(chosen.decision.reviewNeeded, false);
  assert.throws(() => chooseDirection(chosen, { variantId: 'review', reason: '  ' }), /reason/i);
});

test('proposal merge keeps current records/events and chosen snapshots; new lanes use starting records', () => {
  let session = performAction(createSession(project()), start).session;
  session = chooseDirection(session, { variantId: 'direct', reason: 'Keep this experience.' });
  const changed = structuredClone(session.project.variants[0]);
  changed.title = 'Edited direction';
  const added = { ...structuredClone(changed), id: 'third', title: 'A third direction' };
  const result = applyProposal(freeze(session), {
    baseRevision: 1,
    summary: 'Explore a third option.',
    variants: [changed, added],
  });
  assert.equal(result.revision, 2);
  assert.deepEqual(result.lanes.direct, session.lanes.direct);
  assert.deepEqual(result.lanes.third.records, session.project.records);
  assert.deepEqual(result.lanes.third.events, []);
  assert.equal(result.project.variants.length, 3);
  assert.equal(result.decision.variant.title, 'Direct booking');
  assert.equal(result.decision.reviewNeeded, true);
  assert.equal(result.requests[0].summary, 'Explore a third option.');
  assert.throws(
    () => applyProposal(result, { baseRevision: 1, summary: 'Old response', variants: [changed] }),
    /stale/i,
  );
});

test('proposal incompatible with a live state is rejected atomically with migration guidance', () => {
  const session = freeze(performAction(createSession(project()), start).session);
  const changed = structuredClone(session.project.variants[0]);
  changed.states = changed.states.filter((s) => s.id !== 'active');
  changed.actions = changed.actions.filter((a) => a.id !== 'finish');
  changed.actions.forEach((a) => {
    a.to = 'done';
  });
  assert.throws(
    () =>
      applyProposal(session, { baseRevision: 1, summary: 'Remove active', variants: [changed] }),
    /migration.*active|active.*migration/i,
  );
  assert.equal(session.revision, 1);
  assert.equal(session.lanes.direct.records[0].state, 'active');
  assert.equal(session.requests.length, 0);
});

test('removing a still-used starting state also explains that migration is required', () => {
  const session = freeze(createSession(project()));
  const changed = structuredClone(session.project.variants[0]);
  changed.states = changed.states.filter((state) => state.id !== 'queued');
  changed.actions = changed.actions.filter((action) => action.id !== 'start');
  assert.throws(
    () => applyProposal(session, { baseRevision: 1, summary: 'Remove queue', variants: [changed] }),
    /migration.*queued|queued.*migration/i,
  );
  assert.equal(session.lanes.direct.records[0].state, 'queued');
});

test('500 observations are retained and the next action is refused instead of silently truncating', () => {
  let session = createSession(project());
  for (let i = 0; i < 500; i++)
    session = performAction(session, {
      ...start,
      actionId: 'missing',
      variantId: 'direct',
    }).session;
  assert.equal(session.lanes.direct.events.length, 500);
  assert.throws(() => performAction(freeze(session), start), /500.*export|export.*500/i);
  assert.equal(session.lanes.review.events.length, 0);
});

test('decision export is honest, independent data containing actual observations and an agent handoff', () => {
  let session = performAction(createSession(project()), start).session;
  session = chooseDirection(session, { variantId: 'direct', reason: 'Keep direct control.' });
  const exported = exportDecision(freeze(session));
  assert.match(exported.label, /research.*prototype.*non.production/i);
  assert.equal(exported.decision.reason, 'Keep direct control.');
  assert.equal(exported.lanes.review.events[0].allowed, false);
  assert.deepEqual(exported.scenario, [start]);
  assert.match(exported.agentTask, /direct|Direct booking/);
  exported.decision.reason = 'External edit';
  assert.equal(session.decision.reason, 'Keep direct control.');
  assert.equal(exportDecision(createSession(project())).decision, null);
});
