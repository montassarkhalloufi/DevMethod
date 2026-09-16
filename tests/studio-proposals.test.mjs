import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialStudioState } from '../scripts/studio/store.mjs';
import {
  validateStudioState,
  proposeDecision,
  selectProposalOption,
  approveProposal,
  approvePlan,
  queueRequest,
  claimJob,
  finishJob,
  activateRevision,
  recordCheck,
  hasApprovedPlan,
  planApprovalStatus,
  chooseDesign,
  setDesignMaster,
  approveDesignMaster,
  addDesignScreen,
  linkDesignPrototype,
} from '../scripts/studio/domain.mjs';
import { proposalComparison, validateProposalTransition } from '../scripts/studio/proposals.mjs';
import {
  designJourneyView,
  validateDesignJourneyTransition,
} from '../scripts/studio/design-journey.mjs';

function fixture() {
  const state = createInitialStudioState();
  state.project = {
    name: 'Fixture',
    idea: 'Compare working alternatives',
    mode: 'delegated',
    constraints: [],
    delegation: { structure: 'agent', visual: 'agent', adoption: 'user' },
  };
  for (const id of ['first', 'second']) {
    const job = queueRequest(state, { request: `Prepare ${id}` });
    claimJob(state, { worker: 'fixture' });
    finishJob(state, {
      jobId: job.id,
      revision: {
        id,
        jobId: job.id,
        title: id,
        summary: 'Real fixture revision',
        createdAt: new Date().toISOString(),
        files: [{ path: 'index.html', sha256: 'a'.repeat(64), bytes: 12 }],
      },
    });
  }
  activateRevision(state, { id: 'first', reason: 'Baseline' });
  state.references.push({
    id: 'image',
    name: 'Alternative',
    mime: 'image/png',
    file: 'references/image.png',
  });
  return state;
}

function input() {
  return {
    id: 'proposal',
    topic: 'Navigation',
    stage: 'implementation',
    question: 'Which navigation supports the task?',
    options: [
      {
        id: 'compact',
        title: 'Compact list',
        consequences: ['More items visible'],
        preview: {
          kind: 'revision',
          revisionId: 'second',
          status: 'implemented',
          route: '/items?view=compact',
          element: { selector: '#items', text: 'Items' },
        },
      },
      {
        id: 'visual',
        title: 'Visual proposal',
        consequences: ['Extra space per item'],
        preview: { kind: 'image', referenceId: 'image', status: 'simulation' },
      },
    ],
    recommendation: { optionId: 'compact', reason: 'Keeps the current task short' },
  };
}

test('legacy state is accepted and selection, approval and adoption remain separate', () => {
  const state = fixture();
  validateStudioState(state);
  assert.equal(state.proposals, undefined);
  const before = structuredClone(state);
  const proposal = proposeDecision(state, input());
  validateProposalTransition(before, state);
  const proposed = structuredClone(state);
  selectProposalOption(state, { proposalId: proposal.id, optionId: 'compact' });
  validateProposalTransition(proposed, state);
  const selected = structuredClone(state);
  assert.deepEqual(state.decisions, before.decisions);
  assert.equal(state.activeRevision, before.activeRevision);
  assert.deepEqual(state.checks, before.checks);
  approveProposal(state, {
    proposalId: proposal.id,
    optionId: 'compact',
    reason: 'Explicit choice',
  });
  assert.equal(state.proposals[0].resolution.source, 'user');
  assert.equal(state.proposals[0].resolution.preview.revisionId, 'second');
  assert.equal(state.decisions.at(-1).choice, 'Compact list');
  assert.equal(state.activeRevision, 'first');
  assert.deepEqual(state.checks, before.checks);
  validateProposalTransition(selected, state);
  validateStudioState(state);
});

test('comparison exposes only checks for the exact implemented revision and never marks an image implemented', () => {
  const state = fixture();
  recordCheck(state, {
    revisionId: 'first',
    label: 'Baseline only',
    kind: 'agent-observation',
    status: 'passed',
  });
  recordCheck(state, {
    revisionId: 'second',
    label: 'Candidate failed',
    kind: 'agent-observation',
    status: 'failed',
  });
  proposeDecision(state, input());
  const comparison = proposalComparison(state, 'proposal');
  assert.equal(comparison.options[0].checks.length, 1);
  assert.equal(comparison.options[0].checks[0].revisionId, 'second');
  assert.equal(comparison.options[0].checks[0].status, 'failed');
  assert.deepEqual(comparison.options[1].checks, []);
  assert.equal(comparison.options[1].preview.status, 'simulation');
  comparison.options[0].checks[0].status = 'passed';
  assert.equal(state.checks.at(-1).status, 'failed');
  const invalid = input();
  invalid.id = 'invalid';
  invalid.options[1].preview.status = 'implemented';
  const before = structuredClone(state);
  assert.throws(() => proposeDecision(state, invalid), /simulation/i);
  assert.deepEqual(state, before);
});

test('an explicit architecture choice renews only an already approved unchanged plan', () => {
  for (const previouslyApproved of [true, false]) {
    const state = fixture();
    state.project.mode = 'guided';
    state.project.delegation.structure = 'user';
    state.brief = {
      outcome: 'Choose a navigation that supports finding an item',
      scope: ['Navigation'],
      excluded: [],
      criteria: [{ id: 'find', text: 'An item can be found' }],
    };
    if (previouslyApproved) approvePlan(state, { reason: 'Current scope accepted' });
    const previousApprovals = state.decisions.filter((entry) => entry.topic === 'delivery-scope');
    proposeDecision(state, { ...input(), topic: 'Architecture' });
    selectProposalOption(state, { proposalId: 'proposal', optionId: 'compact' });
    const before = structuredClone(state);
    approveProposal(state, {
      proposalId: 'proposal',
      optionId: 'compact',
      reason: 'Approve this specific architecture change',
    });
    assert.equal(hasApprovedPlan(state), previouslyApproved);
    assert.equal(state.activeRevision, 'first');
    const approvals = state.decisions.filter((entry) => entry.topic === 'delivery-scope');
    assert.equal(approvals.length, previouslyApproved ? 2 : 0);
    if (previouslyApproved) {
      assert.equal(approvals[0].id, previousApprovals[0].id);
      assert.equal(approvals[0].status, 'superseded');
      assert.equal(approvals[1].status, 'active');
      assert.equal(approvals[1].source, 'user');
      assert.notEqual(approvals[1].choice, approvals[0].choice);
    }
    validateProposalTransition(before, state);
    validateStudioState(state);
  }
});

test('stale revision or changed planning context cannot be selected or approved and does not lose the proposal', () => {
  for (const change of [
    (state) => {
      state.activeRevision = 'second';
    },
    (state) => {
      state.project.constraints.push('New constraint');
    },
  ]) {
    const state = fixture();
    proposeDecision(state, input());
    selectProposalOption(state, { proposalId: 'proposal', optionId: 'compact' });
    change(state);
    const before = structuredClone(state);
    assert.throws(
      () => selectProposalOption(state, { proposalId: 'proposal', optionId: 'visual' }),
      { status: 409 },
    );
    assert.throws(
      () =>
        approveProposal(state, { proposalId: 'proposal', optionId: 'compact', reason: 'Too late' }),
      { status: 409 },
    );
    assert.equal(proposalComparison(state, 'proposal').stale, true);
    assert.deepEqual(state, before);
  }
});

test('a reserved visual choice cannot be approved by an agent and cannot bypass global visual approval', () => {
  const state = fixture();
  state.project.delegation.visual = 'user';
  proposeDecision(state, { ...input(), stage: 'visual' });
  selectProposalOption(state, { proposalId: 'proposal', optionId: 'visual' });
  const before = structuredClone(state);
  assert.throws(
    () =>
      approveProposal(
        state,
        { proposalId: 'proposal', optionId: 'visual', reason: 'Agent choice' },
        { actor: 'agent' },
      ),
    { status: 409 },
  );
  assert.deepEqual(state, before);
  approveProposal(state, { proposalId: 'proposal', optionId: 'visual', reason: 'Keep the mockup' });
  assert.equal(state.selectedDesignId, null);
  assert.equal(hasApprovedPlan(state), false);
  assert.equal(state.proposals[0].resolution.preview.status, 'simulation');
});

test('resolved proposals and their history cannot be rewritten; a new proposal may supersede them', () => {
  const state = fixture();
  proposeDecision(state, input());
  selectProposalOption(state, { proposalId: 'proposal', optionId: 'compact' });
  approveProposal(state, { proposalId: 'proposal', optionId: 'compact', reason: 'Accepted' });
  const before = structuredClone(state);
  assert.throws(() => selectProposalOption(state, { proposalId: 'proposal', optionId: 'visual' }), {
    status: 409,
  });
  for (const mutate of [
    (s) => {
      s.proposals[0].question = 'Rewritten';
    },
    (s) => {
      s.proposals[0].resolution.reason = 'Rewritten';
    },
    (s) => {
      s.proposals = [];
    },
  ]) {
    const changed = structuredClone(state);
    mutate(changed);
    assert.throws(() => validateProposalTransition(before, changed));
  }
  proposeDecision(state, { ...input(), id: 'follow-up', supersedes: 'proposal' });
  assert.deepEqual(state.proposals[0], before.proposals[0]);
  assert.equal(proposalComparison(state, 'proposal').status, 'superseded');
  validateProposalTransition(before, state);
});

test('forged authority, unknown previews, unsafe routes and mismatched selected options fail without partial mutations', () => {
  const state = fixture();
  const invalids = [
    { ...input(), source: 'user' },
    { ...input(), topic: 'visual-approval' },
    {
      ...input(),
      options: [
        {
          id: 'bad',
          title: 'Missing',
          consequences: [],
          preview: { kind: 'revision', revisionId: 'unknown', status: 'implemented' },
        },
      ],
    },
    {
      ...input(),
      options: [
        {
          id: 'bad',
          title: 'External',
          consequences: [],
          preview: {
            kind: 'revision',
            revisionId: 'first',
            status: 'implemented',
            route: '//example.invalid/',
          },
        },
      ],
    },
  ];
  for (const value of invalids) {
    const before = structuredClone(state);
    assert.throws(() => proposeDecision(state, value));
    assert.deepEqual(state, before);
  }
  proposeDecision(state, input());
  const before = structuredClone(state);
  assert.throws(
    () =>
      approveProposal(state, {
        proposalId: 'proposal',
        optionId: 'compact',
        reason: 'No selection',
      }),
    { status: 409 },
  );
  assert.deepEqual(state, before);
});

test('an agent can finish with pending proposals but cannot forge their resolution or partially finish an invalid batch', () => {
  const state = fixture();
  const job = queueRequest(state, { request: 'Compare alternatives' });
  claimJob(state, { worker: 'fixture' });
  const before = structuredClone(state);
  assert.throws(() =>
    finishJob(state, {
      jobId: job.id,
      proposals: [input(), { ...input(), id: 'forged', resolution: { source: 'user' } }],
    }),
  );
  assert.deepEqual(state, before);
  finishJob(state, { jobId: job.id, proposals: [input()] });
  assert.equal(state.jobs.at(-1).status, 'ready');
  assert.equal(state.proposals[0].source, 'agent');
  assert.equal(state.proposals[0].resolution, null);
  assert.equal(state.proposals[0].selectedOptionId, null);
  assert.equal(proposalComparison(state, 'proposal').stale, false);
  validateStudioState(state);
});

function designFixture() {
  const state = fixture();
  state.designs.push({
    id: 'direction',
    title: 'Chosen direction',
    description: '',
    file: 'image',
  });
  state.selectedDesignId = 'direction';
  return state;
}

test('replacing or approving the master invalidates a proposal prepared under its previous design context', () => {
  for (const changeMaster of [
    (state) =>
      setDesignMaster(state, { id: 'replacement', designId: 'direction', referenceId: 'image' }),
    (state) => approveDesignMaster(state, { masterId: 'master', reason: 'Exact master accepted' }),
  ]) {
    const state = designFixture();
    setDesignMaster(state, { id: 'master', designId: 'direction', referenceId: 'image' });
    proposeDecision(state, input());
    selectProposalOption(state, { proposalId: 'proposal', optionId: 'compact' });
    changeMaster(state);
    const before = structuredClone(state);
    assert.equal(proposalComparison(state, 'proposal').stale, true);
    assert.throws(
      () => selectProposalOption(state, { proposalId: 'proposal', optionId: 'visual' }),
      { status: 409 },
    );
    assert.throws(
      () =>
        approveProposal(state, {
          proposalId: 'proposal',
          optionId: 'compact',
          reason: 'Old context',
        }),
      { status: 409 },
    );
    assert.deepEqual(state, before);
    const refreshed = proposeDecision(state, {
      ...input(),
      id: 'refreshed',
      supersedes: 'proposal',
    });
    assert.notEqual(refreshed.contextKey, state.proposals[0].contextKey);
    assert.equal(proposalComparison(state, 'refreshed').stale, false);
  }
});

function pendingImplementation(state) {
  const job = queueRequest(state, { request: 'Implement the approved master' });
  claimJob(state, { worker: 'fixture' });
  return {
    jobId: job.id,
    revision: {
      ...structuredClone(state.revisions[0]),
      id: 'master-implementation',
      jobId: job.id,
    },
  };
}

test('a chosen direction does not authorize code while its exact master awaits user approval', () => {
  const state = designFixture();
  state.project.delegation.visual = 'user';
  chooseDesign(state, { id: 'direction', reason: 'Accept direction, not a detailed interface' });
  assert.equal(hasApprovedPlan(state), true, 'legacy direction approval remains compatible');
  setDesignMaster(state, { id: 'master', designId: 'direction', referenceId: 'image' });
  const completion = pendingImplementation(state);
  const before = structuredClone(state);
  assert.throws(() => finishJob(state, completion), { status: 409 });
  assert.deepEqual(state, before, 'refusal preserves the pending work and its baseline');
  const approval = planApprovalStatus(state);
  assert.deepEqual(approval.missing, ['visual']);
  assert.equal(approval.visualBlock.kind, 'master-unapproved');
  assert.equal(approval.visualBlock.masterId, 'master');
  assert.match(approval.visualBlock.message, /master/i);
  assert.throws(
    () =>
      approveDesignMaster(state, { masterId: 'master', reason: 'Skip review' }, { actor: 'agent' }),
    { status: 409 },
  );
  approveDesignMaster(state, { masterId: 'master', reason: 'This exact interface is accepted' });
  assert.equal(planApprovalStatus(state).visualBlock, null);
  finishJob(state, completion);
  assert.equal(state.revisions.at(-1).id, completion.revision.id);
  assert.equal(state.activeRevision, 'first', 'master approval is not adoption');
});

test('delegation still requires an explicit master approval and a stale master never opens the gate', () => {
  const state = designFixture();
  setDesignMaster(state, { id: 'master', designId: 'direction', referenceId: 'image' });
  assert.equal(hasApprovedPlan(state), false);
  approveDesignMaster(
    state,
    { masterId: 'master', reason: 'Reviewed under delegation' },
    { actor: 'agent' },
  );
  assert.equal(hasApprovedPlan(state), true);
  state.project.delegation.visual = 'user';
  chooseDesign(state, { id: 'direction', reason: 'Direction retained, master review reserved' });
  assert.equal(planApprovalStatus(state).visualBlock.kind, 'master-unapproved');
  state.project.delegation.visual = 'agent';
  state.designs.push({ id: 'other-direction', title: 'Other', description: '', file: 'image' });
  chooseDesign(state, { id: 'other-direction', reason: 'Change direction' });
  const completion = pendingImplementation(state);
  const before = structuredClone(state);
  assert.throws(() => finishJob(state, completion), { status: 409 });
  assert.deepEqual(state, before);
  assert.equal(planApprovalStatus(state).visualBlock.kind, 'master-stale');
  setDesignMaster(state, { id: 'replacement', designId: 'other-direction', referenceId: 'image' });
  assert.equal(planApprovalStatus(state).visualBlock.kind, 'master-unapproved');
  approveDesignMaster(state, { masterId: 'replacement', reason: 'New master accepted' });
  finishJob(state, completion);
  assert.equal(hasApprovedPlan(state), true);
});

test('choosing a direction or providing an image never approves its detailed master', () => {
  const state = designFixture();
  const before = structuredClone(state);
  setDesignMaster(state, { id: 'master', designId: 'direction', referenceId: 'image' });
  assert.equal(state.designJourney.masters[0].approvedBy, null);
  assert.equal(designJourneyView(state).stage, 'master');
  assert.throws(
    () =>
      addDesignScreen(state, {
        id: 'screen',
        title: 'Detail',
        masterId: 'master',
        referenceId: 'image',
      }),
    { status: 409 },
  );
  assert.throws(() => linkDesignPrototype(state, { masterId: 'master', revisionId: 'second' }), {
    status: 409,
  });
  assert.deepEqual(state.decisions, before.decisions);
  assert.deepEqual(state.checks, before.checks);
  validateDesignJourneyTransition(before, state);
  validateStudioState(state);
});

test('master approval respects visual reservation and attaches derived screens and prototype without adoption', () => {
  const state = designFixture();
  state.project.delegation.visual = 'user';
  setDesignMaster(state, { id: 'master', designId: 'direction', referenceId: 'image' });
  const before = structuredClone(state);
  assert.throws(
    () =>
      approveDesignMaster(
        state,
        { masterId: 'master', reason: 'Agent suggestion' },
        { actor: 'agent' },
      ),
    { status: 409 },
  );
  assert.deepEqual(state, before);
  approveDesignMaster(state, { masterId: 'master', reason: 'Exact master accepted' });
  assert.equal(state.designJourney.masters[0].source, 'agent');
  assert.equal(state.designJourney.masters[0].approvedBy, 'user');
  addDesignScreen(state, {
    id: 'screen',
    title: 'Detail screen',
    masterId: 'master',
    referenceId: 'image',
  });
  linkDesignPrototype(state, { id: 'prototype', masterId: 'master', revisionId: 'second' });
  const view = designJourneyView(state);
  assert.equal(view.stage, 'prototype');
  assert.equal(view.prototype.revisionId, 'second');
  assert.equal(state.activeRevision, 'first');
  assert.deepEqual(state.checks, []);
  assert.equal(hasApprovedPlan(state), false);
  validateStudioState(state);
});

test('master and derivative history survive replacement and cannot be rewritten or reused after a direction change', () => {
  const state = designFixture();
  setDesignMaster(state, { id: 'master', designId: 'direction', referenceId: 'image' });
  approveDesignMaster(state, { masterId: 'master', reason: 'Approved' }, { actor: 'agent' });
  addDesignScreen(state, {
    id: 'screen',
    title: 'Screen',
    masterId: 'master',
    referenceId: 'image',
  });
  const approved = structuredClone(state);
  state.selectedDesignId = null;
  assert.equal(designJourneyView(state).stale, true);
  assert.throws(() => linkDesignPrototype(state, { masterId: 'master', revisionId: 'second' }), {
    status: 409,
  });
  state.selectedDesignId = 'direction';
  setDesignMaster(state, { id: 'replacement', designId: 'direction', referenceId: 'image' });
  assert.deepEqual(state.designJourney.masters[0], approved.designJourney.masters[0]);
  assert.deepEqual(designJourneyView(state).screens, []);
  validateDesignJourneyTransition(approved, state);
  const invalid = structuredClone(state);
  invalid.designJourney.masters[0].approvedBy = 'user';
  assert.throws(() => validateDesignJourneyTransition(state, invalid));
  const removed = structuredClone(state);
  removed.designJourney.screens = [];
  assert.throws(() => validateDesignJourneyTransition(state, removed));
});

test('unknown or nonimage references and unknown prototype revisions are rejected before mutation', () => {
  const state = designFixture();
  state.references.push({
    id: 'text',
    name: 'Notes',
    mime: 'text/plain',
    file: 'references/notes.txt',
  });
  for (const referenceId of ['missing', 'text']) {
    const before = structuredClone(state);
    assert.throws(() => setDesignMaster(state, { designId: 'direction', referenceId }));
    assert.deepEqual(state, before);
  }
  setDesignMaster(state, { id: 'master', designId: 'direction', referenceId: 'image' });
  approveDesignMaster(state, { masterId: 'master', reason: 'Approved' });
  const before = structuredClone(state);
  assert.throws(() => linkDesignPrototype(state, { masterId: 'master', revisionId: 'missing' }));
  assert.deepEqual(state, before);
});
