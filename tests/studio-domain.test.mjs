import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialStudioState, validateStudioState } from '../scripts/studio/store.mjs';
import {
  queueRequest,
  claimJob,
  finishJob as finishDomainJob,
  cancelJob,
  failJob,
  activateRevision,
  chooseDesign,
  recordCheck,
  updateProject,
  setDraft,
  approvePlan,
  planApprovalKey,
  hasApprovedPlan,
} from '../scripts/studio/domain.mjs';

const revision = (id, jobId) => ({
  id,
  jobId,
  title: 'Version',
  summary: 'Ajout utilisable',
  createdAt: new Date().toISOString(),
  files: [{ path: 'index.html', sha256: 'a'.repeat(64), bytes: 30 }],
});

// These domain-only fixtures supply a controlled receipt; no real HTML execution is claimed.
function finishJob(state, input, options = {}) {
  const checks = input.revision
    ? [
        {
          label: 'Controlled document-check fixture',
          kind: 'command',
          protocol: 'studio-document-syntax-v1',
          command: 'fixture',
          status: 'passed',
        },
        ...(options.checks ?? []),
      ]
    : (options.checks ?? []);
  return finishDomainJob(state, input, { ...options, checks });
}

function ready(state, id) {
  if (state.project.mode !== 'delegated' && !hasApprovedPlan(state)) {
    if (!state.project.idea) state.project.idea = 'Inscrire les participants';
    if (!state.brief.outcome) state.brief.outcome = 'Une inscription persistante';
    if (!state.brief.criteria.length)
      state.brief.criteria.push({ id: 'saved', text: 'Une inscription reste après redémarrage' });
    approvePlan(state, { reason: 'Périmètre du test approuvé' });
  }
  const job = queueRequest(state, { request: 'Construire une inscription persistante' });
  claimJob(state, { worker: 'test' });
  finishJob(state, { jobId: job.id, revision: revision(id, job.id) });
  return job;
}

test('guided completion stays ready until activation, checks remain tied to old revision', () => {
  const state = createInitialStudioState();
  ready(state, 'one');
  assert.equal(state.activeRevision, null);
  activateRevision(state, { id: 'one', reason: 'Essayé' });
  recordCheck(state, {
    revisionId: 'one',
    label: 'Inscription',
    status: 'passed',
    kind: 'agent-observation',
    output: 'Observation locale',
  });
  ready(state, 'two');
  activateRevision(state, { id: 'two', reason: 'Nouvelle demande' });
  assert.equal(state.checks[0].revisionId, 'one');
  assert.equal(
    state.checks.filter(
      (check) => check.revisionId === state.activeRevision && check.kind === 'agent-observation',
    ).length,
    0,
  );
  validateStudioState(state);
});

test('delegated completion activates a revision using only the supplied document receipt', () => {
  const state = createInitialStudioState();
  updateProject(state, {
    name: 'Les Ateliers',
    idea: 'Gérer les places',
    mode: 'delegated',
    constraints: ['Local'],
  });
  ready(state, 'one');
  assert.equal(state.activeRevision, 'one');
  assert.ok(state.checks.every((check) => check.protocol === 'studio-document-syntax-v1'));
  validateStudioState(state);
});

test('automatic adoption replaces the prior manual active-version decision without inventing user approval', () => {
  const state = createInitialStudioState();
  ready(state, 'manual-version');
  activateRevision(state, { id: 'manual-version', reason: 'Ancienne version essayée' });
  const previous = state.decisions.find((entry) => entry.topic === 'Version active');
  const userDecisions = state.decisions.filter((entry) => entry.source === 'user').length;
  updateProject(state, {
    ...state.project,
    delegation: { structure: 'agent', visual: 'agent', adoption: 'agent' },
  });
  const job = queueRequest(state, { request: 'Ajouter une liste d’attente' });
  claimJob(state, { worker: 'agent' });
  finishJob(state, {
    jobId: job.id,
    revision: {
      ...revision('automatic-version', job.id),
      title: 'Version avec liste d’attente',
    },
  });

  assert.equal(state.activeRevision, 'automatic-version');
  const active = state.decisions.filter(
    (entry) => entry.topic === 'Version active' && entry.status === 'active',
  );
  assert.equal(active.length, 1);
  assert.equal(active[0].choice, 'Version avec liste d’attente');
  assert.equal(active[0].source, 'agent');
  assert.match(active[0].reason, /délégation/);
  assert.equal(previous.status, 'superseded');
  assert.equal(previous.source, 'user');
  assert.equal(previous.reason, 'Ancienne version essayée');
  assert.equal(state.decisions.filter((entry) => entry.source === 'user').length, userDecisions);
  assert.ok(state.checks.every((check) => check.protocol === 'studio-document-syntax-v1'));
  validateStudioState(state);
});

test('cancelled work cannot finish or fail late; only one worker owns a running job', () => {
  const state = createInitialStudioState();
  const job = queueRequest(state, { request: 'Créer les ateliers' });
  const next = queueRequest(state, { request: 'Ajouter un filtre' });
  assert.equal(claimJob(state, { worker: 'worker-a' }).id, job.id);
  assert.throws(() => claimJob(state, { worker: 'worker-b' }), { status: 409 });
  cancelJob(state, { jobId: job.id });
  assert.throws(() => finishJob(state, { jobId: job.id, revision: revision('one', job.id) }), {
    status: 409,
  });
  assert.throws(() => failJob(state, { jobId: job.id, error: 'Trop tard' }), { status: 409 });
  assert.equal(claimJob(state, { worker: 'worker-b' }).id, next.id);
  validateStudioState(state);
});

test('code produced on an obsolete base is refused without losing the running job', () => {
  const state = createInitialStudioState();
  ready(state, 'one');
  const job = queueRequest(state, { request: 'Ajouter un calendrier' });
  claimJob(state, { worker: 'worker' });
  activateRevision(state, { id: 'one', reason: 'Choix pendant le travail' });
  assert.throws(() => finishJob(state, { jobId: job.id, revision: revision('two', job.id) }), {
    status: 409,
  });
  assert.equal(job.status, 'running');
  assert.equal(state.revisions.length, 1);
});

test('framing can complete without inventing a code revision; active decisions are superseded', () => {
  const state = createInitialStudioState();
  const finish = (id, choice) => {
    const job = queueRequest(state, { request: 'Préciser le stockage' });
    claimJob(state, { worker: 'worker' });
    finishJob(state, {
      jobId: job.id,
      decisions: [
        { id, topic: 'Stockage', choice, reason: 'Usage local', source: 'agent', status: 'active' },
      ],
    });
  };
  finish('first', 'Mémoire');
  finish('second', 'Fichier persistant');
  assert.deepEqual(
    state.decisions.map((d) => d.status),
    ['superseded', 'active'],
  );
  assert.equal(state.decisions[0].choice, 'Mémoire');
  assert.deepEqual(state.revisions, []);
  validateStudioState(state);
});

test('design selection refers to an uploaded reference and records explicit user choice', () => {
  const state = createInitialStudioState();
  state.references.push({
    id: 'ref',
    name: 'Maquette.png',
    mime: 'image/png',
    file: 'references/ref.png',
  });
  const job = queueRequest(state, { request: 'Proposer un design' });
  claimJob(state, { worker: 'worker' });
  finishJob(state, {
    jobId: job.id,
    designs: [{ id: 'design', title: 'Agenda', description: 'Les dates visibles', file: 'ref' }],
  });
  chooseDesign(state, { id: 'design', reason: 'Dates prioritaires' });
  assert.equal(state.selectedDesignId, 'design');
  assert.equal(state.decisions.at(-1).source, 'user');
  assert.throws(() => chooseDesign(state, { id: 'absent', reason: '' }), { status: 404 });
  validateStudioState(state);
});

test('requests preserve element context and clear only the submitted draft', () => {
  const state = createInitialStudioState();
  setDraft(state, { text: 'Rendre ce titre lisible' });
  const job = queueRequest(state, {
    request: state.draft,
    element: { selector: '#title', text: 'Les Ateliers' },
  });
  assert.equal(state.draft, '');
  assert.deepEqual(job.element, { selector: '#title', text: 'Les Ateliers' });
});

test('DevAuto keeps its explicit mode and activates a finished implementation', () => {
  const state = createInitialStudioState();
  updateProject(state, {
    name: 'Les Ateliers',
    idea: 'Gérer les places',
    mode: 'devauto',
    constraints: [],
  });
  ready(state, 'one');
  assert.equal(state.project.mode, 'devauto');
  assert.equal(state.activeRevision, 'one');
  assert.ok(state.checks.every((check) => check.protocol === 'studio-document-syntax-v1'));
  validateStudioState(state);
});

test('invalid provider completion never creates fake user decisions or empty results', () => {
  const state = createInitialStudioState();
  const job = queueRequest(state, { request: 'Cadrer' });
  claimJob(state, { worker: 'worker' });
  assert.throws(() => finishJob(state, { jobId: job.id }), { status: 400 });
  assert.throws(
    () =>
      finishJob(state, {
        jobId: job.id,
        decisions: [
          {
            id: 'fake',
            topic: 'Choix',
            choice: 'Oui',
            reason: '',
            source: 'user',
            status: 'active',
          },
        ],
      }),
    { status: 400 },
  );
  assert.equal(job.status, 'running');
  assert.deepEqual(state.decisions, []);
});

function framedState(mode = 'devauto') {
  const state = createInitialStudioState();
  state.project = {
    name: 'Les Ateliers',
    idea: 'Réserver une place',
    mode,
    constraints: ['Données locales'],
  };
  state.brief = {
    outcome: 'Éviter les doubles inscriptions',
    scope: ['Inscription'],
    excluded: ['Paiement'],
    criteria: [{ id: 'capacity', text: 'La capacité ne peut pas être dépassée' }],
  };
  return state;
}

test('guided and DevAuto require approval of the current scope; delegated mode creates no fake approval', () => {
  for (const mode of ['guided', 'devauto']) {
    const state = framedState(mode);
    assert.equal(hasApprovedPlan(state), false);
    approvePlan(state, { reason: 'Ce périmètre convient' });
    assert.equal(hasApprovedPlan(state), true);
    assert.equal(state.decisions.at(-1).source, 'user');
    assert.equal(state.decisions.at(-1).choice, planApprovalKey(state));
    validateStudioState(state);
  }
  const autonomous = framedState('delegated');
  assert.equal(hasApprovedPlan(autonomous), true);
  assert.deepEqual(autonomous.decisions, []);
  assert.throws(() => approvePlan(createInitialStudioState(), { reason: '' }), { status: 400 });
});

test('changed brief, design, architecture or intention invalidate approval; versions and checks do not', () => {
  const state = framedState();
  approvePlan(state, { reason: 'Accord' });
  ready(state, 'one');
  recordCheck(state, {
    revisionId: 'one',
    label: 'Build',
    kind: 'command',
    command: 'node --check app.js',
    status: 'passed',
  });
  state.version++;
  assert.equal(hasApprovedPlan(state), true);
  for (const modify of [
    (draft) => {
      draft.brief.scope.push('Liste d’attente');
    },
    (draft) => {
      draft.selectedDesignId = 'new-design';
    },
    (draft) => {
      draft.project.idea = 'Vendre des billets';
    },
    (draft) => {
      draft.project.constraints.push('Accès distant');
    },
    (draft) => {
      draft.decisions.push({
        id: 'arch',
        topic: 'Architecture',
        choice: 'Serveur distant',
        reason: 'Partage',
        source: 'agent',
        status: 'active',
      });
    },
  ]) {
    const changed = structuredClone(state);
    modify(changed);
    assert.equal(hasApprovedPlan(changed), false);
  }
});

test('renewed approval supersedes its predecessor and agent-authored approval never opens the gate', () => {
  const state = framedState();
  approvePlan(state, { reason: 'Première portée' });
  state.brief.scope.push('Annulation');
  approvePlan(state, { reason: 'Portée révisée' });
  const approvals = state.decisions.filter((d) => d.topic === 'delivery-scope');
  assert.deepEqual(
    approvals.map((d) => d.status),
    ['superseded', 'active'],
  );
  assert.equal(approvals[0].reason, 'Première portée');
  assert.equal(hasApprovedPlan(state), true);
  approvals[1].source = 'agent';
  assert.equal(hasApprovedPlan(state), false);
});

test('approval hash is independent of object insertion order and non-structural decisions', () => {
  const state = framedState();
  const same = structuredClone(state);
  same.brief = {
    criteria: [{ text: state.brief.criteria[0].text, id: 'capacity' }],
    excluded: ['Paiement'],
    scope: ['Inscription'],
    outcome: state.brief.outcome,
  };
  same.decisions.push({
    id: 'other',
    topic: 'Libellé du bouton',
    choice: 'Réserver',
    reason: 'Clair',
    status: 'active',
    source: 'agent',
  });
  assert.equal(planApprovalKey(state), planApprovalKey(same));
});

test('code completion enforces approval before and after structural changes without partial mutation', () => {
  for (const mode of ['guided', 'devauto']) {
    const state = framedState(mode);
    const job = queueRequest(state, { request: 'Construire le périmètre prévu' });
    claimJob(state, { worker: 'worker' });
    const code = revision('one', job.id);
    assert.throws(() => finishJob(state, { jobId: job.id, revision: code }), { status: 409 });
    approvePlan(state, { reason: 'Accord après lecture' });
    const before = structuredClone(state);
    assert.throws(
      () =>
        finishJob(state, {
          jobId: job.id,
          revision: code,
          brief: { ...state.brief, scope: ['Paiements en ligne'] },
        }),
      { status: 409 },
    );
    assert.deepEqual(state, before);
    assert.throws(
      () =>
        finishJob(state, {
          jobId: job.id,
          revision: code,
          decisions: [
            {
              id: 'new-arch',
              topic: 'architecture',
              choice: 'Nouvelle base distante',
              reason: 'Modification pendant exécution',
              source: 'agent',
              status: 'active',
            },
          ],
        }),
      { status: 409 },
    );
    assert.deepEqual(state, before);
    finishJob(state, { jobId: job.id, revision: code });
    assert.equal(state.jobs[0].status, 'ready');
    assert.equal(state.activeRevision, mode === 'guided' ? null : 'one');
  }
});

function reservedVisualState(mode = 'guided', adoption = 'agent') {
  const state = framedState(mode);
  updateProject(state, {
    ...state.project,
    delegation: { structure: 'agent', visual: 'user', adoption },
  });
  state.references.push({
    id: 'visual-ref',
    name: 'Proposal.png',
    file: 'references/proposal.png',
    mime: 'image/png',
  });
  state.designs.push(
    { id: 'visual-one', title: 'Direction A', description: 'First visual', file: 'visual-ref' },
    { id: 'visual-two', title: 'Direction B', description: 'Second visual', file: 'visual-ref' },
  );
  return state;
}

test('guided can delegate structure and adoption while reserving an explicit visual choice before code', () => {
  const state = reservedVisualState();
  assert.equal(hasApprovedPlan(state), false);
  assert.throws(
    () => approvePlan(state, { reason: 'Structure accepted without a visual choice' }),
    /visuel/i,
  );
  const job = queueRequest(state, { request: 'Build after visual approval' });
  claimJob(state, { worker: 'fixture' });
  assert.throws(
    () => finishJob(state, { jobId: job.id, revision: revision('visual-rev', job.id) }),
    { status: 409 },
  );
  chooseDesign(state, { id: 'visual-two', reason: 'Visual B selected' });
  assert.equal(hasApprovedPlan(state), true);
  assert.equal(
    state.decisions.find((entry) => entry.topic === 'visual-approval').choice,
    'visual-two',
  );
  finishJob(state, {
    jobId: job.id,
    revision: revision('visual-rev', job.id),
    brief: { ...state.brief, scope: ['Reversible refinement'] },
    decisions: [
      {
        id: 'delegated-architecture',
        topic: 'architecture',
        choice: 'Local JSON',
        reason: 'Delegated choice',
        source: 'agent',
        status: 'active',
      },
    ],
  });
  assert.equal(state.activeRevision, 'visual-rev');
  assert.equal(
    state.decisions.some((entry) => entry.topic === 'delivery-scope'),
    false,
  );
  validateStudioState(state);
});

test('autonomous visual reservation still gates code and explicit adoption user prevents autoactivation', () => {
  const state = reservedVisualState('delegated', 'user');
  assert.equal(hasApprovedPlan(state), false);
  // Merely having a selected design is not a recorded visual approval.
  state.selectedDesignId = 'visual-one';
  assert.equal(hasApprovedPlan(state), false);
  chooseDesign(state, { id: 'visual-one', reason: 'Reviewed image' });
  const job = queueRequest(state, { request: 'Build chosen direction' });
  claimJob(state, { worker: 'fixture' });
  finishJob(state, { jobId: job.id, revision: revision('manual-adoption', job.id) });
  assert.equal(state.activeRevision, null);
  assert.equal(state.jobs.at(-1).status, 'ready');
  activateRevision(state, { id: 'manual-adoption', reason: 'Tried the result' });
  assert.equal(state.activeRevision, 'manual-adoption');
});

test('visual approval follows the selected id and cannot be forged or superseded by an agent delivery', () => {
  const state = reservedVisualState('delegated');
  chooseDesign(state, { id: 'visual-one', reason: 'Chosen image' });
  state.selectedDesignId = 'visual-two';
  assert.equal(hasApprovedPlan(state), false);
  chooseDesign(state, { id: 'visual-two', reason: 'New explicit choice' });
  assert.equal(hasApprovedPlan(state), true);
  const job = queueRequest(state, { request: 'Build the approved visual' });
  claimJob(state, { worker: 'fixture' });
  const before = structuredClone(state);
  for (const source of ['user', 'agent']) {
    assert.throws(() =>
      finishJob(state, {
        jobId: job.id,
        revision: revision('forged-revision', job.id),
        decisions: [
          {
            id: 'forged',
            topic: 'visual-approval',
            choice: 'visual-two',
            reason: 'Invented approval',
            status: 'active',
            source,
          },
        ],
      }),
    );
    assert.deepEqual(state, before);
  }
  state.decisions.find(
    (entry) => entry.topic === 'visual-approval' && entry.status === 'active',
  ).source = 'agent';
  assert.equal(hasApprovedPlan(state), false);
});

test('explicit delegation is complete, validated and survives a project update from a legacy client', () => {
  const state = reservedVisualState();
  updateProject(state, {
    name: 'Renamed',
    idea: state.project.idea,
    mode: 'guided',
    constraints: [],
  });
  assert.deepEqual(state.project.delegation, {
    structure: 'agent',
    visual: 'user',
    adoption: 'agent',
  });
  for (const delegation of [
    null,
    {},
    { structure: 'agent', visual: 'user' },
    { structure: 'agent', visual: 'user', adoption: 'sometimes' },
  ])
    assert.throws(() => updateProject(state, { ...state.project, delegation }));
  validateStudioState(state);
});
