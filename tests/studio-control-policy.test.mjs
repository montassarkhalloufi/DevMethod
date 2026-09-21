import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateControl,
  criteriaFingerprint,
  revisionFingerprint,
} from '../scripts/studio/control-policy.mjs';

function fixture() {
  const state = {
    project: { mode: 'guided' },
    brief: { criteria: [{ id: 'save', text: 'Conserver les saisies.' }] },
    revisions: [{ id: 'r1', jobId: 'j1', files: [{ path: 'main.js', sha256: 'abc', bytes: 3 }] }],
    jobs: [{ id: 'j1', status: 'ready' }],
    checks: [
      { id: 'syntax', revisionId: 'r1', kind: 'command', executor: 'studio', status: 'passed' },
    ],
  };
  return {
    state,
    revisionId: 'r1',
    admission: { allowed: true },
    delegation: { adoption: 'agent', correction: 'agent' },
    evidence: [
      {
        id: 'journey',
        revisionId: 'r1',
        kind: 'business',
        executor: 'studio',
        status: 'passed',
        criterionIds: ['save'],
        criteriaFingerprint: criteriaFingerprint(state),
      },
    ],
    execution: {
      localOnly: true,
      reversible: true,
      persistentData: false,
      contractChanged: false,
      correctionAttempts: 0,
    },
  };
}

function reviewedConsequences(input) {
  delete input.execution.persistentData;
  delete input.execution.contractChanged;
  input.consequences = {
    signals: [{ kind: 'persistent-data', path: 'main.js', line: 1 }],
    data: { nonEmpty: true },
    reviews: [
      {
        decisionId: 'review-1',
        resolution: 'accept-local',
        assessment: { persistentData: 'affected', contractChanged: 'not-affected' },
        freshness: 'current',
        contributes: true,
        holds: false,
      },
    ],
  };
  return input;
}

test('a scoped consequence acceptance permits the next operation without erasing uncertainty or risk', () => {
  const input = reviewedConsequences(fixture());
  const before = structuredClone(input);
  const control = evaluateControl(input);
  assert.equal(control.autonomy.operation, 'activate');
  assert.deepEqual(control.risk.unknowns, ['persistentData', 'contractChanged']);
  assert.deepEqual(control.risk.reviewedUnknowns, ['persistentData', 'contractChanged']);
  assert.equal(control.risk.severity, 'moderate');
  assert.ok(control.risk.factors.some((factor) => factor.id === 'persistent-data'));
  assert.deepEqual(control.risk.acceptedFactors, ['persistent-data']);
  assert.ok(
    control.graph.nodes.some(
      (node) => node.id === 'decision:review-1' && node.type === 'consequence-assessment',
    ),
  );
  assert.ok(
    control.graph.edges.some(
      (edge) =>
        edge.from === 'revision:r1' &&
        edge.to === 'decision:review-1' &&
        edge.relation === 'assessed-by',
    ),
  );
  assert.deepEqual(input, before);
});

test('an obsolete appraisal cannot resolve consequences and a retained stop remains effective', () => {
  const input = reviewedConsequences(fixture());
  input.consequences.reviews[0].freshness = 'reevaluate';
  input.consequences.reviews[0].contributes = false;
  assert.deepEqual(evaluateControl(input).autonomy.reasons, ['consequences-to-check']);
  input.consequences.reviews[0].resolution = 'keep-stopped';
  input.consequences.reviews[0].holds = true;
  assert.ok(evaluateControl(input).autonomy.reasons.includes('consequences-held'));
  assert.equal(evaluateControl(input).autonomy.action, 'stop');
});

test('acceptance does not override missing business proof, admission, reserved adoption or execution stops', () => {
  for (const key of [
    'usageUnknown',
    'budgetClosed',
    'externalOutcomeUnknown',
    'permissionRevoked',
  ]) {
    const input = reviewedConsequences(fixture());
    input.execution[key] = true;
    assert.equal(evaluateControl(input).autonomy.action, 'stop');
  }
  const input = reviewedConsequences(fixture());
  input.delegation.adoption = 'user';
  assert.deepEqual(evaluateControl(input).autonomy.reasons, ['adoption-reserved']);
  input.evidence = [];
  assert.deepEqual(evaluateControl(input).autonomy.reasons, ['business-evidence-missing']);
  input.admission.allowed = false;
  assert.deepEqual(evaluateControl(input).autonomy.reasons, ['admission-missing']);
});

test('graph links criteria, immutable revision, job and actual checks without mutating inputs', () => {
  const input = fixture(),
    before = structuredClone(input);
  const result = evaluateControl(input);
  assert.equal(result.autonomy.operation, 'activate');
  assert.equal(result.autonomy.requestedMode, 'guided');
  assert.equal(result.risk.probability, 'unknown');
  assert.ok(result.graph.edges.some((edge) => edge.from === 'job:j1' && edge.to === 'revision:r1'));
  assert.ok(
    result.graph.edges.some(
      (edge) => edge.from === 'evidence:journey' && edge.to === 'criterion:save',
    ),
  );
  assert.deepEqual(input, before);
});

test('changed criteria stale only business evidence; technical success does not cover behavior', () => {
  const input = fixture();
  input.state.brief.criteria[0].text = 'Conserver les saisies après redémarrage.';
  const result = evaluateControl(input);
  assert.equal(
    result.graph.nodes.find((node) => node.id === 'evidence:syntax').freshness,
    'current',
  );
  assert.equal(
    result.graph.nodes.find((node) => node.id === 'evidence:journey').freshness,
    'obsolete',
  );
  assert.equal(result.autonomy.action, 'strengthen-verification');
  assert.ok(result.autonomy.reasons.includes('business-evidence-missing'));
});

test('one attributable local correction is allowed but second correction remains stopped after restart', () => {
  const input = fixture();
  input.state.checks[0].status = 'failed';
  input.admission.allowed = false;
  input.execution.technicalFailureAttributable = true;
  assert.equal(evaluateControl(input).autonomy.operation, 'correct');
  input.execution.correctionAttempts = 1;
  assert.equal(evaluateControl(JSON.parse(JSON.stringify(input))).autonomy.action, 'stop');
});

test('missing correction history and non-attributable failures cannot dispatch', () => {
  const input = fixture();
  input.state.checks[0].status = 'failed';
  assert.equal(evaluateControl(input).autonomy.action, 'arbitrate');
  delete input.execution.correctionAttempts;
  assert.equal(evaluateControl(input).autonomy.action, 'stop');
});

test('explicit human control survives reassuring evidence and delegated mode', () => {
  const input = fixture();
  input.state.project.mode = 'delegated';
  input.delegation.adoption = 'user';
  assert.deepEqual(evaluateControl(input).autonomy.reasons, ['adoption-reserved']);
  input.state.checks[0].status = 'failed';
  input.execution.technicalFailureAttributable = true;
  input.delegation.correction = 'user';
  assert.deepEqual(evaluateControl(input).autonomy.reasons, ['correction-reserved']);
});

for (const key of [
  'usageUnknown',
  'interrupted',
  'contextChanged',
  'permissionRevoked',
  'externalOutcomeUnknown',
  'budgetClosed',
])
  test(`${key} stops even a valid candidate and keeps an intervention`, () => {
    const input = fixture();
    input.execution[key] = true;
    const result = evaluateControl(input);
    assert.equal(result.autonomy.action, 'stop');
    assert.equal(result.interventions.length, 1);
  });

test('consequence unknowns stay unknown; persistent data and irreversible effects reduce autonomy', () => {
  const input = fixture();
  delete input.execution.localOnly;
  assert.equal(evaluateControl(input).risk.severity, 'unknown');
  assert.equal(evaluateControl(input).autonomy.action, 'strengthen-verification');
  input.execution.localOnly = true;
  input.execution.persistentData = true;
  assert.equal(evaluateControl(input).risk.severity, 'moderate');
  input.execution.irreversible = true;
  assert.equal(evaluateControl(input).autonomy.action, 'arbitrate');
});

test('foreign revision, mismatched fingerprint and untrusted business success never admit', () => {
  for (const change of [
    (input) => {
      input.evidence[0].revisionId = 'old';
    },
    (input) => {
      input.evidence[0].fingerprint = 'wrong';
    },
    (input) => {
      delete input.evidence[0].executor;
    },
  ]) {
    const input = fixture();
    change(input);
    assert.equal(evaluateControl(input).autonomy.action, 'strengthen-verification');
  }
  const input = fixture();
  input.evidence[0].fingerprint = revisionFingerprint(input.state.revisions[0]);
  assert.equal(evaluateControl(input).autonomy.operation, 'activate');
});

test('repeated failure signature stops even when a later success was recorded', () => {
  const input = fixture();
  input.execution.attempts = [
    { outcome: 'failed', failureSignature: 'a'.repeat(64) },
    { outcome: 'failed', failureSignature: 'a'.repeat(64) },
    { outcome: 'passed' },
  ];
  assert.deepEqual(evaluateControl(input).autonomy.reasons, ['repeated-failure']);
});

test('intervention grouping is deterministic, changes with scope, and duplicate evidence is rejected', () => {
  const input = fixture();
  input.execution.interrupted = true;
  const first = evaluateControl(input).interventions[0].id;
  assert.equal(evaluateControl(input).interventions[0].id, first);
  input.state.brief.criteria[0].text = 'Changed';
  assert.notEqual(evaluateControl(input).interventions[0].id, first);
  input.evidence[0].id = 'syntax';
  assert.throws(() => evaluateControl(input), /dupliquée/);
});

test('quality freshness replaces linked receipts without promoting host assertions', () => {
  const input = fixture();
  input.evidence = [
    {
      id: 'quality:syntax',
      linkedCheckId: 'syntax',
      revisionId: 'r1',
      kind: 'technical',
      executor: 'studio',
      trusted: true,
      provenance: 'studio-adapter',
      freshness: 'reevaluate',
      status: 'failed',
    },
  ];
  input.execution.technicalFailureAttributable = true;
  let result = evaluateControl(input);
  assert.equal(result.graph.nodes.filter((node) => node.type === 'evidence').length, 1);
  assert.equal(result.graph.nodes.find((node) => node.type === 'evidence').freshness, 'reevaluate');
  assert.equal(result.autonomy.action, 'strengthen-verification');
  input.evidence[0].freshness = 'current';
  assert.equal(evaluateControl(input).autonomy.operation, 'correct');
  input.evidence[0].trusted = false;
  input.evidence[0].provenance = 'host-attested';
  result = evaluateControl(input);
  assert.equal(result.autonomy.action, 'strengthen-verification');
  assert.equal(result.graph.nodes.find((node) => node.type === 'evidence').trusted, false);
});

test('source integrity invalidates even historical admission receipts', () => {
  const input = fixture();
  input.invalidated = true;
  input.execution.contextChanged = true;
  const result = evaluateControl(input);
  assert.equal(result.autonomy.action, 'stop');
  assert.ok(
    result.graph.nodes
      .filter((node) => node.type === 'evidence')
      .every((node) => node.freshness === 'reevaluate'),
  );
});

test('pending tool request keeps broker identity and prevents automatic correction', () => {
  const input = fixture();
  input.state.checks[0].status = 'failed';
  input.execution.technicalFailureAttributable = true;
  input.execution.toolPending = [
    { requestId: 'original-request', jobId: 'j1', permission: 'awaiting-approval' },
  ];
  const result = evaluateControl(input);
  assert.equal(result.autonomy.action, 'arbitrate');
  assert.equal(result.interventions.at(-1).id, 'original-request');
  assert.deepEqual(result.interventions.at(-1).options, ['inspect-tool-request']);
  input.execution.externalOutcomeUnknown = true;
  assert.equal(evaluateControl(input).autonomy.action, 'stop');
});
