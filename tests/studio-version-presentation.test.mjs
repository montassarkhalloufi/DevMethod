import test from 'node:test';
import assert from 'node:assert/strict';
import { presentation } from '../scripts/studio/public/version-presentation.js';
import { createInitialStudioState } from '../scripts/studio/store.mjs';

function fixture() {
  const state = createInitialStudioState();
  state.revisions = [
    { id: 'active-version', title: 'Version en usage' },
    { id: 'candidate-version', title: 'Formulaire direct' },
    { id: 'local-version', title: 'Travail local' },
  ];
  state.activeRevision = 'active-version';
  state.checks = [
    { id: 'old-pass', revisionId: 'active-version', status: 'passed', kind: 'command' },
    { id: 'old-fail', revisionId: 'active-version', status: 'failed', kind: 'command' },
  ];
  state.proposals = [
    {
      id: 'proposal',
      stage: 'visual',
      question: 'Quel formulaire ?',
      baseRevision: 'active-version',
      selectedOptionId: 'direct',
      resolution: null,
      options: [
        {
          id: 'direct',
          title: 'Direct',
          preview: { kind: 'revision', status: 'implemented', revisionId: 'candidate-version' },
        },
      ],
    },
  ];
  return state;
}

function approve(state, source = 'user') {
  const proposal = state.proposals[0];
  proposal.resolution = {
    source,
    optionId: proposal.selectedOptionId,
    preview: structuredClone(proposal.options[0].preview),
    reason: 'Rendu examiné',
    createdAt: '2026-09-16T22:00:00Z',
  };
}

test('candidate comparison carries only its own evidence and leaves the active version separate', () => {
  const state = fixture();
  const before = structuredClone(state);
  const result = presentation(state, {
    displayedRevisionId: state.activeRevision,
    comparedProposal: state.proposals[0],
  });
  assert.equal(result.displayed.revisionId, 'candidate-version');
  assert.equal(result.displayed.status, 'proposal');
  assert.match(result.displayed.label, /Proposition non appliquée/);
  assert.equal(result.active.revisionId, 'active-version');
  assert.equal(result.checks.revisionId, 'candidate-version');
  assert.deepEqual(result.checks.items, []);
  assert.equal(result.checks.status, 'unverified');
  assert.equal(result.visual.status, 'pending');
  assert.deepEqual(state, before);
});

test('before comparison uses the base revision even when the supplied displayed id is the candidate', () => {
  const state = fixture();
  const result = presentation(state, {
    displayedRevisionId: 'candidate-version',
    comparedProposal: state.proposals[0],
    comparisonSide: 'before',
  });
  assert.equal(result.displayed.revisionId, 'active-version');
  assert.equal(result.displayed.status, 'applied');
  assert.deepEqual(
    result.checks.items.map((item) => item.id),
    ['old-pass', 'old-fail'],
  );
  assert.equal(result.checks.status, 'failed');
  assert.equal(result.visual.approval, null);
});

test('before is a local starting version once it is no longer active, even if a proposal selected it', () => {
  const state = fixture();
  const original = structuredClone(state.proposals[0]);
  original.id = 'historical-choice';
  original.options[0].preview.revisionId = 'active-version';
  state.proposals.unshift(original);
  state.activeRevision = 'local-version';
  const result = presentation(state, {
    comparedProposal: state.proposals[1],
    comparisonSide: 'before',
  });
  assert.equal(result.displayed.revisionId, 'active-version');
  assert.equal(result.displayed.status, 'local');
  assert.match(result.displayed.label, /Version de départ non appliquée/);
  assert.equal(result.proposal, null);
  assert.deepEqual(
    result.checks.items.map((item) => item.id),
    ['old-pass', 'old-fail'],
  );
});

test('an unselected alternative is local outside comparison, while the selected candidate remains a proposal', () => {
  const state = fixture();
  state.activeRevision = 'local-version';
  state.proposals[0].options.push({
    id: 'keep-previous',
    title: 'Conserver le précédent',
    preview: { kind: 'revision', revisionId: 'active-version', status: 'implemented' },
  });
  const old = presentation(state, { displayedRevisionId: 'active-version' });
  assert.equal(old.displayed.status, 'local');
  assert.equal(old.proposal, null);
  const candidate = presentation(state, { displayedRevisionId: 'candidate-version' });
  assert.equal(candidate.displayed.status, 'proposal');
  assert.equal(candidate.proposal.id, 'proposal');
  state.proposals[0].selectedOptionId = null;
  assert.equal(
    presentation(state, { displayedRevisionId: 'candidate-version' }).displayed.status,
    'local',
  );
});

test('a comparison without a base revision and an explicitly empty display never fall back to active evidence', () => {
  const state = fixture();
  state.proposals[0].baseRevision = null;
  for (const options of [
    {
      comparedProposal: state.proposals[0],
      comparisonSide: 'before',
      displayedRevisionId: 'candidate-version',
    },
    { displayedRevisionId: null },
  ]) {
    const result = presentation(state, options);
    assert.equal(result.displayed.revisionId, null);
    assert.equal(result.checks.total, 0);
  }
});

test('a proposal which became active is presented as applied, without inheriting the old checks', () => {
  const state = fixture();
  approve(state);
  state.activeRevision = 'candidate-version';
  const result = presentation(state, { comparedProposal: state.proposals[0] });
  assert.equal(result.displayed.status, 'applied');
  assert.match(result.displayed.label, /Version appliquée/);
  assert.equal(result.checks.total, 0);
  assert.equal(result.visual.status, 'accepted');
  assert.equal(result.visual.approval.source, 'user');
});

test('local revisions and explicitly missing revisions never borrow the active version evidence', () => {
  const state = fixture();
  const local = presentation(state, { displayedRevisionId: 'local-version' });
  assert.equal(local.displayed.status, 'local');
  assert.equal(local.checks.total, 0);
  const missing = presentation(state, { displayedRevisionId: 'missing' });
  assert.equal(missing.displayed.status, 'unavailable');
  assert.equal(missing.displayed.revisionId, null);
  assert.equal(missing.checks.status, 'not-applicable');
  assert.equal(missing.checks.total, 0);
});

test('image and declared revision simulations cannot inherit revision checks or render approval', () => {
  for (const preview of [
    { kind: 'image', referenceId: 'mockup', status: 'simulation' },
    { kind: 'revision', revisionId: 'candidate-version', status: 'simulation' },
  ]) {
    const state = fixture();
    state.checks.push({
      id: 'candidate-pass',
      revisionId: 'candidate-version',
      status: 'passed',
      kind: 'command',
    });
    state.proposals[0].options[0].preview = preview;
    const result = presentation(state, {
      displayedRevisionId: 'candidate-version',
      comparedProposal: state.proposals[0],
    });
    assert.equal(result.displayed.status, 'simulation');
    assert.equal(result.displayed.revisionId, null);
    assert.equal(result.checks.revisionId, null);
    assert.equal(result.checks.status, 'not-applicable');
    assert.equal(result.checks.total, 0);
    assert.equal(result.visual.approval, null);
  }
});

test('accepting an image is reported only as a mockup agreement, never executable evidence', () => {
  const state = fixture();
  state.proposals[0].options[0].preview = {
    kind: 'image',
    referenceId: 'mockup',
    status: 'simulation',
  };
  approve(state);
  const result = presentation(state, { comparedProposal: state.proposals[0] });
  assert.equal(result.visual.status, 'accepted');
  assert.match(result.visual.label, /Maquette acceptée/);
  assert.equal(result.visual.approval.referenceId, 'mockup');
  assert.equal(result.visual.approval.revisionId, null);
  assert.equal(result.checks.total, 0);
});

test('delegation, master approval, selected direction and passing checks do not approve a revision render', () => {
  const state = fixture();
  state.project.delegation = { structure: 'agent', visual: 'agent', adoption: 'agent' };
  state.checks.push({
    id: 'candidate-pass',
    revisionId: 'candidate-version',
    status: 'passed',
    kind: 'agent-observation',
  });
  state.selectedDesignId = 'chosen-direction';
  state.decisions.push({
    topic: 'visual-approval',
    choice: 'chosen-direction',
    source: 'user',
    status: 'active',
  });
  state.designJourney = {
    masters: [{ id: 'master', approvedBy: 'user' }],
    activeMasterId: 'master',
  };
  const result = presentation(state, { displayedRevisionId: 'candidate-version' });
  assert.equal(result.visual.responsibility, 'agent');
  assert.equal(result.visual.approval, null);
  assert.equal(result.visual.status, 'pending');
  assert.equal(result.checks.passed, 1);
  assert.equal(result.checks.observations, 1);
});

test('exact render approval is separate from the effective responsibility and an unrelated pending choice', () => {
  const state = fixture();
  approve(state, 'agent');
  state.proposals.push({
    ...structuredClone(state.proposals[0]),
    id: 'other',
    resolution: null,
    options: [
      {
        id: 'direct',
        preview: { kind: 'revision', revisionId: 'local-version', status: 'implemented' },
      },
    ],
  });
  const delegated = presentation(state, { displayedRevisionId: 'candidate-version' });
  assert.equal(delegated.visual.status, 'accepted');
  assert.equal(delegated.visual.approval.source, 'agent');
  const reserved = presentation(state, {
    displayedRevisionId: 'candidate-version',
    delegation: { visual: 'user' },
  });
  assert.equal(reserved.visual.responsibility, 'user');
  assert.equal(reserved.visual.status, 'review-required');
  assert.equal(reserved.visual.approval.source, 'agent');
  const other = presentation(state, { displayedRevisionId: 'local-version' });
  assert.equal(other.visual.approval, null);
});

test('reopening a visual decision does not keep its superseded approval green', () => {
  const state = fixture();
  approve(state);
  state.proposals.push({
    ...structuredClone(state.proposals[0]),
    id: 'replacement',
    supersedes: 'proposal',
    resolution: null,
  });
  const result = presentation(state, { displayedRevisionId: 'candidate-version' });
  assert.equal(result.visual.status, 'pending');
  assert.equal(result.visual.approval, null);
  assert.equal(result.proposal.id, 'replacement');
});

test('a scoped visual agreement retains its route and element instead of implying every screen was accepted', () => {
  const state = fixture();
  const preview = state.proposals[0].options[0].preview;
  preview.route = '/?form=join';
  preview.element = { selector: '#join', text: 'Inscription' };
  approve(state);
  const result = presentation(state, { displayedRevisionId: 'candidate-version' });
  assert.match(result.visual.label, /Rendu ciblé accepté/);
  assert.equal(result.visual.approval.route, '/?form=join');
  assert.deepEqual(result.visual.approval.element, { selector: '#join', text: 'Inscription' });
});

test('implementation approval and empty selection never become visual approval or a tested display', () => {
  const state = fixture();
  state.proposals[0].stage = 'implementation';
  approve(state);
  const actual = presentation(state, { displayedRevisionId: 'candidate-version' });
  assert.equal(actual.visual.approval, null);
  state.proposals[0].resolution = null;
  state.proposals[0].selectedOptionId = null;
  const empty = presentation(state, { comparedProposal: state.proposals[0] });
  assert.equal(empty.displayed.status, 'unavailable');
  assert.equal(empty.checks.total, 0);
});
