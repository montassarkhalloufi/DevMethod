import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateControl,
  resolveAttention,
  markAttentionRead,
} from '../dist/control-plane/engine.js';
import { refreshGraph } from '../dist/control-plane/graph.js';
import { validateControlPlane } from '../dist/control-plane/validation.js';

const at = '2026-09-25T10:00:00.000Z';

function input(overrides = {}) {
  return {
    projectId: 'test',
    missionId: 'mission',
    revisionId: 'r1',
    requested: 'delegated',
    at,
    action: {
      id: 'apply:r1',
      label: 'Appliquer',
      kind: 'delivery',
      reversible: true,
      impact: 'low',
      reserved: false,
    },
    nodes: [
      {
        id: 'test',
        kind: 'check',
        label: 'Vérification réelle',
        projectId: 'test',
        missionId: 'mission',
        actionId: 'apply:r1',
        revisionId: 'r1',
        at,
        status: 'observed',
        freshness: 'current',
        outcome: 'passed',
        source: 'test runner',
        explanation: 'Assertion exécutée',
        limits: [],
        dependencies: { 'file:a': 'hash-a' },
        dependencyScope: 'complete',
        required: true,
      },
    ],
    edges: [],
    dependencies: { 'file:a': 'hash-a', 'file:b': 'hash-b' },
    signals: [],
    sourceIssues: [],
    stopSignature: null,
    ...overrides,
  };
}

test('sufficient current observed evidence and delegated reversible action permit Auto-Continue', () => {
  const result = evaluateControl(input());
  assert.equal(result.snapshot.decision.effective, 'Auto-Continue');
  validateControlPlane(result);
});
test('missing, stale, declared, inferred and running proofs never permit Auto-Continue', () => {
  for (const patch of [
    { status: 'missing' },
    { freshness: 'stale' },
    { status: 'declared' },
    { status: 'inferred' },
    { outcome: 'running' },
    { outcome: 'failed' },
  ]) {
    const value = input();
    Object.assign(value.nodes[0], patch);
    assert.equal(evaluateControl(value).snapshot.decision.effective, 'Verify');
  }
  assert.equal(evaluateControl(input({ nodes: [] })).snapshot.decision.effective, 'Verify');
  assert.equal(
    evaluateControl(input({ sourceIssues: ['source inaccessible'] })).snapshot.decision.effective,
    'Verify',
  );
});
test('permissions and high risk require Human Decision; critical failure and nonconvergence stop', () => {
  for (const [level, expected] of [
    ['medium', 'Verify'],
    ['high', 'Human Decision'],
    ['critical', 'Bounded Stop'],
  ]) {
    const signal = {
      id: 'permissions',
      category: 'permissions',
      level,
      reason: 'Accès élargi',
      evidenceIds: [],
      humanResolvable: true,
    };
    assert.equal(
      evaluateControl(input({ signals: [signal] })).snapshot.decision.effective,
      expected,
    );
  }
  assert.equal(
    evaluateControl(input({ stopSignature: 'repeated-failure' })).snapshot.decision.effective,
    'Bounded Stop',
  );
});
test('new revision invalidates only dependent proofs, including transitive contradictions and added scope', () => {
  const value = input({
    revisionId: 'r2',
    dependencies: { 'file:a': 'hash-a', 'file:b': 'new-b' },
  });
  value.nodes.push({ ...value.nodes[0], id: 'b', dependencies: { 'file:b': 'hash-b' } });
  let graph = refreshGraph(value);
  assert.equal(graph.nodes[0].freshness, 'current');
  assert.equal(graph.nodes[1].freshness, 'stale');
  value.edges.push({
    id: 'dependency',
    from: 'test',
    to: 'b',
    relation: 'depends-on',
    explanation: 'dépendance réelle',
  });
  graph = refreshGraph(value);
  assert.equal(graph.nodes[0].freshness, 'stale');
  value.edges = [
    {
      id: 'contradiction',
      from: 'b',
      to: 'test',
      relation: 'contradicts',
      explanation: 'Observation contradictoire',
    },
  ];
  assert.equal(refreshGraph(value).nodes[0].freshness, 'stale');
});
test('renewed successful proof restores graph, risk and autonomy; identical polling is idempotent', () => {
  const value = input();
  value.nodes[0].freshness = 'stale';
  const first = evaluateControl(value);
  const second = evaluateControl(input(), first);
  assert.equal(second.snapshot.decision.effective, 'Auto-Continue');
  assert.equal(second.snapshot.risk.level, 'low');
  const polled = evaluateControl(input({ at: '2026-09-25T10:01:00.000Z' }), second);
  assert.equal(polled.history.length, 2);
  assert.equal(
    polled.attention.filter((entry) => ['open', 'read'].includes(entry.status)).length,
    0,
  );
});
test('human decisions persist, deduplicate, replay and cannot manufacture passed evidence', () => {
  const value = input({
    signals: [
      {
        id: 'access',
        category: 'permissions',
        level: 'high',
        reason: 'Accès',
        evidenceIds: [],
        humanResolvable: true,
      },
    ],
  });
  const state = evaluateControl(value);
  markAttentionRead(state, at);
  assert.equal(state.attention[0].status, 'read');
  const answer = {
    itemId: state.attention[0].id,
    resolution: 'accept',
    reason: 'Accès limité examiné',
  };
  resolveAttention(state, answer, at);
  resolveAttention(state, answer, at);
  const next = evaluateControl(value, state);
  assert.equal(next.interventions.length, 1);
  assert.equal(next.snapshot.decision.effective, 'Auto-Continue');
  assert.deepEqual(evaluateControl(value, JSON.parse(JSON.stringify(next))), next);
  value.nodes[0].outcome = 'failed';
  assert.equal(evaluateControl(value, next).snapshot.decision.effective, 'Verify');
  value.revisionId = 'r2';
  assert.equal(evaluateControl(value, next).snapshot.decision.effective, 'Human Decision');
});
test('changing requested mode recalculates reserved responsibilities without bypassing risk', () => {
  const value = input();
  const first = evaluateControl(value);
  value.requested = 'guided';
  value.action.reserved = true;
  const second = evaluateControl(value, first);
  assert.equal(second.snapshot.decision.requested, 'guided');
  assert.equal(second.snapshot.decision.effective, 'Human Decision');
  value.requested = 'delegated';
  value.action.reserved = false;
  value.sourceIssues = ['Missing'];
  assert.equal(evaluateControl(value, second).snapshot.decision.effective, 'Verify');
});
