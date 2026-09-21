import {
  object,
  text,
  list,
  identifier,
  constraints,
  validateProject,
  validateVariant,
  copySession,
  intent,
} from './schema.mjs';

export { validateProject } from './schema.mjs';

function startingLanes(project) {
  return Object.fromEntries(
    project.variants.map((variant) => [
      variant.id,
      { records: structuredClone(project.records), events: [] },
    ]),
  );
}

export function createSession(input) {
  const project = validateProject(input);
  return {
    format: 1,
    revision: 1,
    project,
    lanes: startingLanes(project),
    situation: [],
    decision: null,
    history: [],
    requests: [],
  };
}

function creationRefusal(lane, action, record, input) {
  if (record) return `Record ${input.recordId} already exists.`;
  if (action.otherOwner)
    return 'The creator would be the record owner, which this action does not permit.';
  if (!input.title?.trim() || input.title.trim().length > 140)
    return 'A new record title must contain 1–140 characters after trimming.';
  if (lane.records.length >= 200)
    return 'The 200-record limit is reached; export this experience before starting a new one.';
  return null;
}

function refusal(session, lane, action, record, input) {
  if (!session.project.actors.some((actor) => actor.id === input.actorId))
    return `Unknown actor: ${input.actorId}.`;
  if (!action) return `Unknown action: ${input.actionId}.`;
  if (action.kind === 'transition' && !record) return `Unknown record: ${input.recordId}.`;
  if (!action.actors.includes(input.actorId))
    return `Actor ${input.actorId} does not have permission for ${action.label}.`;
  if (action.kind === 'create') return creationRefusal(lane, action, record, input);
  if (!action.from.includes(record.state))
    return `Action ${action.label} is not allowed from state ${record.state}.`;
  if (action.otherOwner && record.owner === input.actorId)
    return 'The record owner cannot perform this action; another permitted actor is required.';
  return null;
}

function observe(session, variant, input) {
  const lane = session.lanes[variant.id];
  const action = variant.actions.find((candidate) => candidate.id === input.actionId);
  const record = lane.records.find((candidate) => candidate.id === input.recordId);
  const before = record?.state ?? null;
  const reason = refusal(session, lane, action, record, input);
  if (!reason) {
    if (action.kind === 'create')
      lane.records.push({
        id: input.recordId,
        title: input.title.trim(),
        state: action.to,
        owner: input.actorId,
      });
    else record.state = action.to;
  }
  const outcome = {
    variantId: variant.id,
    actionId: input.actionId,
    actorId: input.actorId,
    recordId: input.recordId,
    allowed: reason === null,
    before,
    after: reason ? before : action.to,
    reason: reason ?? `${action.label}: ${before ?? 'new record'} → ${action.to}.`,
  };
  lane.events.push(outcome);
  return structuredClone(outcome);
}

export function performAction(original, input) {
  const step = intent(input);
  const session = copySession(original);
  const variants = step.variantId
    ? session.project.variants.filter((variant) => variant.id === step.variantId)
    : session.project.variants;
  if (!variants.length) throw new Error(`Unknown variant: ${step.variantId}.`);
  if (
    variants.some((variant) => session.lanes[variant.id].events.length >= 500) ||
    (!step.variantId && session.situation.length >= 500)
  )
    throw new Error(
      'The 500-observation limit is reached; export and explicitly reset this experience before continuing.',
    );
  const outcomes = variants.map((variant) => observe(session, variant, step));
  if (!step.variantId) session.situation.push(step);
  return { session, outcomes };
}

export function replaySituation(original, steps = original.situation) {
  let session = copySession(original);
  list(steps, 'situation steps', 0, 500);
  const scenario = steps.map((step) => intent(step, true));
  session.lanes = startingLanes(session.project);
  session.situation = [];
  for (const step of scenario) session = performAction(session, step).session;
  return session;
}

export function chooseDirection(original, input) {
  object(input, ['variantId', 'reason'], 'direction choice');
  identifier(input.variantId, 'variantId');
  text(input.reason, 'decision reason', 4000);
  const session = copySession(original);
  const variant = session.project.variants.find((candidate) => candidate.id === input.variantId);
  if (!variant) throw new Error(`Unknown variant: ${input.variantId}.`);
  if (session.decision) {
    if (session.history.length >= 200)
      throw new Error('Decision history is full; export before starting a new experience.');
    session.history.push(session.decision);
  }
  session.decision = {
    variantId: variant.id,
    variant: structuredClone(variant),
    revision: session.revision,
    scenario: structuredClone(session.situation),
    context: structuredClone({
      brief: session.project.brief,
      constraints: session.project.constraints,
      sources: session.project.sources,
      questions: session.project.questions,
    }),
    observations: structuredClone(session.lanes),
    reason: input.reason.trim(),
    reviewNeeded: false,
  };
  return session;
}

function reconsider(session) {
  if (session.revision === Number.MAX_SAFE_INTEGER)
    throw new Error('Project revision limit reached; export this experience.');
  session.revision += 1;
  if (session.decision) session.decision.reviewNeeded = true;
}

export function reviseIntent(original, input) {
  object(input, ['brief', 'constraints'], 'revised intent');
  text(input.brief, 'project brief', 10000);
  constraints(input.constraints);
  const session = copySession(original);
  session.project.brief = input.brief;
  session.project.constraints = structuredClone(input.constraints);
  reconsider(session);
  return session;
}

function proposedProject(session, input) {
  object(input, ['baseRevision', 'summary', 'variants'], 'proposal');
  if (!Number.isSafeInteger(input.baseRevision) || input.baseRevision !== session.revision)
    throw new Error(
      `Stale proposal: expected baseRevision ${session.revision}. Request a proposal against the current project.`,
    );
  text(input.summary, 'proposal summary', 4000);
  list(input.variants, 'proposal variants', 1, 4);
  const actors = new Set(session.project.actors.map((actor) => actor.id));
  const incoming = new Map();
  for (const variant of input.variants) {
    validateVariant(variant, actors);
    if (incoming.has(variant.id))
      throw new Error(`Proposal contains duplicate variant ${variant.id}.`);
    incoming.set(variant.id, variant);
  }
  const variants = session.project.variants.map((variant) => incoming.get(variant.id) ?? variant);
  variants.push(...input.variants.filter((variant) => !Object.hasOwn(session.lanes, variant.id)));
  return { ...session.project, variants };
}

function preserveLiveRecords(session, project) {
  const actors = new Set(project.actors.map((actor) => actor.id));
  for (const variant of project.variants) {
    if (!Object.hasOwn(session.lanes, variant.id)) continue;
    const states = new Set(variant.states.map((state) => state.id));
    for (const record of session.lanes[variant.id].records) {
      if (!states.has(record.state) || !actors.has(record.owner))
        throw new Error(
          `Migration needed: record ${record.id} in ${variant.id} has state ${record.state} and owner ${record.owner}. Proposal cannot discard or rewrite it.`,
        );
    }
  }
}

export function applyProposal(original, input) {
  const session = copySession(original);
  const proposed = proposedProject(session, input);
  preserveLiveRecords(session, proposed);
  const project = validateProject(proposed);
  if (session.requests.length >= 200)
    throw new Error('Proposal history is full; export before starting a new experience.');
  for (const variant of project.variants) {
    if (!Object.hasOwn(session.lanes, variant.id))
      session.lanes[variant.id] = { records: structuredClone(project.records), events: [] };
  }
  session.project = project;
  reconsider(session);
  session.requests.push({
    baseRevision: input.baseRevision,
    revision: session.revision,
    summary: input.summary.trim(),
    variantIds: input.variants.map((variant) => variant.id),
  });
  return session;
}

export function exportDecision(original) {
  const session = copySession(original);
  const direction = session.decision
    ? `${session.decision.variant.title} (${session.decision.variantId})`
    : 'No direction chosen';
  return {
    format: 1,
    label:
      'Research prototype — non-production. Observed finite-state behavior is not a quality certification.',
    revision: session.revision,
    project: session.project,
    chosenVariant: session.decision?.variant ?? null,
    decision: session.decision,
    history: session.history,
    scenario: session.situation,
    lanes: session.lanes,
    requests: session.requests,
    agentTask: `Continue this research prototype from the attached project and actual lane observations. Direction: ${direction}. Preserve record identity, titles, owners and accepted decision reasons. ${session.decision?.reviewNeeded ? 'The recorded choice requires reconsideration after a project change.' : 'A choice is a preference, not a quality certificate.'} Discuss unresolved questions and describe design and architecture consequences before proposing changes. Return data-only variants with baseRevision ${session.revision}; do not claim production readiness or a completed deployment.`,
  };
}
