import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeAttention } from '../scripts/studio/public/attention-model.js';
import { evaluateControl } from '../scripts/studio/control-policy.mjs';

const evidence = (id, overrides = {}) => ({
  id,
  type: 'evidence',
  revisionId: 'candidate',
  kind: 'technical',
  status: 'failed',
  freshness: 'current',
  trusted: true,
  ...overrides,
});
const control = (nodes) => ({ graph: { revisionId: 'candidate', nodes } });

test('no selected revision cannot implicitly attribute unscoped evidence to a candidate', () => {
  const result = summarizeAttention({
    graph: { revisionId: null, nodes: [evidence('unscoped', { revisionId: null })] },
  });
  assert.equal(result.revisionId, null);
  assert.equal(result.currentCount, 0);
  assert.equal(result.observedCount, 0);
  assert.equal(result.historicalCount, 1);
  assert.deepEqual(result.groups, []);
});

test('attention separates current observations, stale evidence and unrelated historical scopes', () => {
  const result = summarizeAttention(
    control([
      evidence('passed', { status: 'passed' }),
      evidence('failed'),
      evidence('stale', { status: 'passed', freshness: 'reevaluate' }),
      evidence('untrusted', { status: 'passed', trusted: false }),
      evidence('foreign', { revisionId: 'historical' }),
      evidence('unscoped', { revisionId: undefined }),
      { id: 'criterion', type: 'criterion' },
    ]),
  );
  assert.equal(result.revisionId, 'candidate');
  assert.equal(result.observedCount, 3);
  assert.equal(result.currentCount, 3);
  assert.equal(result.historicalCount, 2);
  assert.deepEqual(result.groups, [
    {
      kind: 'technical',
      count: 3,
      evidenceIds: ['failed', 'stale', 'untrusted'],
      currentIds: ['failed', 'untrusted'],
      staleIds: ['stale'],
      untrustedIds: ['untrusted'],
    },
  ]);
});

test('unknown properties stay visible and counts deduplicate IDs without inventing source correlations', () => {
  const node = evidence('unknown', {
    kind: undefined,
    status: undefined,
    freshness: undefined,
    trusted: undefined,
  });
  const result = summarizeAttention(
    control([node, structuredClone(node), evidence('distinct-a'), evidence('distinct-b')]),
  );
  assert.equal(result.observedCount, 3);
  assert.deepEqual(
    result.groups.map((group) => [group.kind, group.count]),
    [
      ['technical', 2],
      ['unknown', 1],
    ],
  );
  assert.deepEqual(result.groups[1].staleIds, ['unknown']);
  assert.deepEqual(result.groups[1].untrustedIds, ['unknown']);
});

test('every category remains visible with deterministic count and lexical ordering without input mutation', () => {
  const input = control([
    evidence('z', { kind: 'zeta' }),
    evidence('b', { kind: 'alpha' }),
    evidence('a', { kind: 'alpha' }),
    evidence('c', { kind: 'beta' }),
  ]);
  const before = structuredClone(input);
  const first = summarizeAttention(input);
  assert.deepEqual(
    first.groups.map((group) => group.kind),
    ['alpha', 'beta', 'zeta'],
  );
  assert.deepEqual(summarizeAttention(control([...input.graph.nodes].reverse())), first);
  assert.deepEqual(summarizeAttention(input), first);
  assert.deepEqual(input, before);
  first.groups[0].evidenceIds.push('output only');
  assert.deepEqual(input, before);
});

test('critical factors and stops survive an empty graph without synthesizing missing business observations', () => {
  const input = {
    graph: { revisionId: 'candidate', nodes: [] },
    risk: {
      factors: [
        { id: 'critical-singleton', severity: 'critical', reason: 'External outcome unknown' },
        { id: 'moderate', severity: 'moderate' },
      ],
    },
    autonomy: { action: 'stop', reasons: ['usage-unknown'] },
  };
  const result = summarizeAttention(input);
  assert.equal(result.observedCount, 0);
  assert.deepEqual(result.groups, []);
  assert.deepEqual(result.criticalFactors, [input.risk.factors[0]]);
  assert.deepEqual(result.stopReasons, ['usage-unknown']);
  result.criticalFactors[0].reason = 'Changed projection';
  result.stopReasons.push('output only');
  assert.equal(input.risk.factors[0].reason, 'External outcome unknown');
  assert.deepEqual(input.autonomy.reasons, ['usage-unknown']);
  assert.deepEqual(
    summarizeAttention({
      autonomy: { action: 'strengthen-verification', reasons: ['business-evidence-missing'] },
    }).stopReasons,
    [],
  );
});

test('real control graph replaces a linked check with its receipt and attention counts it once', () => {
  const state = {
    project: { mode: 'guided' },
    brief: { criteria: [] },
    revisions: [{ id: 'candidate', jobId: 'job', files: [] }],
    jobs: [{ id: 'job', status: 'ready' }],
    checks: [
      {
        id: 'syntax',
        revisionId: 'candidate',
        kind: 'command',
        executor: 'studio',
        status: 'passed',
      },
    ],
  };
  const evaluated = evaluateControl({
    state,
    revisionId: 'candidate',
    evidence: [
      {
        id: 'quality:syntax',
        linkedCheckId: 'syntax',
        revisionId: 'candidate',
        kind: 'technical',
        executor: 'studio',
        trusted: true,
        provenance: 'studio-adapter',
        freshness: 'reevaluate',
        status: 'failed',
      },
    ],
    admission: { allowed: true },
    delegation: { adoption: 'agent', correction: 'agent' },
    execution: { correctionAttempts: 0, localOnly: true, reversible: true },
  });
  assert.equal(evaluated.graph.nodes.filter((node) => node.type === 'evidence').length, 1);
  const result = summarizeAttention(evaluated);
  assert.equal(result.observedCount, 1);
  assert.equal(result.currentCount, 0);
  assert.deepEqual(result.groups[0].evidenceIds, ['evidence:quality:syntax']);
  assert.deepEqual(result.groups[0].staleIds, ['evidence:quality:syntax']);
});
