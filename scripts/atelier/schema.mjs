// Data-only boundary shared by project imports and immutable domain operations.
export function object(value, keys, where) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype)
    throw new Error(`${where} must be an object.`);
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) throw new Error(`${where}: unknown field ${key}.`);
  }
}

export function text(value, where, max = 2000, empty = false) {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim()))
    throw new Error(`${where} must be ${empty ? '0' : '1'}–${max} characters.`);
}

export function identifier(value, where) {
  if (
    typeof value !== 'string' ||
    value.length > 64 ||
    !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value)
  )
    throw new Error(`${where} must be a lowercase slug of at most 64 characters.`);
}

export function list(value, where, min, max) {
  if (!Array.isArray(value) || value.length < min || value.length > max)
    throw new Error(`${where} must contain ${min}–${max} items.`);
}

function unique(values, where) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`${where}: duplicate ${value}.`);
    seen.add(value);
  }
}

function labels(values, where, min, max) {
  list(values, where, min, max);
  for (const value of values) {
    object(value, ['id', 'label'], where);
    identifier(value.id, `${where} id`);
    text(value.label, `${where} label`, 160);
  }
  unique(
    values.map((value) => value.id),
    where,
  );
}

export function constraints(values) {
  list(values, 'constraints', 0, 32);
  for (const value of values) {
    object(value, ['id', 'text'], 'constraint');
    identifier(value.id, 'constraint id');
    text(value.text, 'constraint text');
  }
  unique(
    values.map((value) => value.id),
    'constraints',
  );
}

function references(values, known, where, min = 0) {
  list(values, where, min, 16);
  unique(values, where);
  for (const value of values) {
    identifier(value, where);
    if (!known.has(value)) throw new Error(`${where}: unknown ${value}.`);
  }
}

export function validateRecords(records, actors, states, where = 'records') {
  list(records, where, 0, 200);
  unique(
    records.map((record) => record?.id),
    where,
  );
  for (const record of records) {
    object(record, ['id', 'title', 'state', 'owner'], where);
    identifier(record.id, `${where} id`);
    text(record.title, `${where} title`, 140);
    if (!actors.has(record.owner)) throw new Error(`${where}: unknown owner ${record.owner}.`);
    if (!states.has(record.state)) throw new Error(`${where}: unknown state ${record.state}.`);
  }
}

function action(value, states, actors) {
  object(value, ['id', 'label', 'kind', 'from', 'to', 'actors', 'otherOwner'], 'action');
  identifier(value.id, 'action id');
  text(value.label, 'action label', 160);
  if (!['create', 'transition'].includes(value.kind))
    throw new Error('Action kind must be create or transition.');
  references(value.from, states, 'action source state', value.kind === 'transition' ? 1 : 0);
  if (!states.has(value.to)) throw new Error(`Action destination state: unknown ${value.to}.`);
  references(value.actors, actors, 'action actor', 1);
  if (typeof value.otherOwner !== 'boolean')
    throw new Error('Action otherOwner must be a boolean.');
}

export function validateVariant(variant, actors) {
  object(
    variant,
    ['id', 'title', 'premise', 'tradeoff', 'design', 'architecture', 'states', 'actions'],
    'variant',
  );
  identifier(variant.id, 'variant id');
  text(variant.title, 'variant title', 160);
  text(variant.premise, 'variant premise', 4000);
  text(variant.tradeoff, 'variant tradeoff', 4000);
  object(variant.design, ['layout', 'accent'], 'variant design');
  if (!['board', 'list'].includes(variant.design.layout))
    throw new Error('Design layout must be board or list.');
  text(variant.design.accent, 'design accent', 64);
  object(variant.architecture, ['boundaries', 'data', 'tradeoffs'], 'variant architecture');
  for (const field of ['boundaries', 'tradeoffs']) {
    list(variant.architecture[field], `architecture ${field}`, 0, 16);
    variant.architecture[field].forEach((value) => text(value, `architecture ${field}`));
  }
  text(variant.architecture.data, 'architecture data', 4000);
  labels(variant.states, 'variant states', 1, 12);
  list(variant.actions, 'variant actions', 0, 16);
  const states = new Set(variant.states.map((state) => state.id));
  variant.actions.forEach((value) => action(value, states, actors));
  unique(
    variant.actions.map((value) => value.id),
    'variant actions',
  );
}

function sources(values) {
  list(values, 'sources', 0, 24);
  for (const value of values) {
    object(value, ['title', 'url', 'note'], 'source');
    text(value.title, 'source title', 160);
    text(value.url, 'source URL', 2048);
    text(value.note, 'source note', 2000, true);
    let url;
    try {
      url = new URL(value.url);
    } catch {
      throw new Error('Source URL must be HTTP or HTTPS.');
    }
    if (!['http:', 'https:'].includes(url.protocol))
      throw new Error('Source URL must be HTTP or HTTPS.');
  }
}

export function validateProject(project) {
  object(
    project,
    [
      'format',
      'id',
      'title',
      'brief',
      'actors',
      'constraints',
      'sources',
      'questions',
      'records',
      'variants',
    ],
    'project',
  );
  if (project.format !== 1) throw new Error('Project format must be 1.');
  identifier(project.id, 'project id');
  text(project.title, 'project title', 160);
  text(project.brief, 'project brief', 10000);
  labels(project.actors, 'actors', 1, 8);
  constraints(project.constraints);
  sources(project.sources);
  list(project.questions, 'questions', 0, 32);
  project.questions.forEach((value) => text(value, 'question'));
  list(project.variants, 'variants', 2, 4);
  const actors = new Set(project.actors.map((actor) => actor.id));
  project.variants.forEach((variant) => {
    validateVariant(variant, actors);
    validateRecords(project.records, actors, new Set(variant.states.map((state) => state.id)));
  });
  unique(
    project.variants.map((variant) => variant.id),
    'variants',
  );
  return structuredClone(project);
}

export function intent(input, shared = false) {
  object(input, ['variantId', 'actionId', 'actorId', 'recordId', 'title'], 'action input');
  for (const field of ['actionId', 'actorId', 'recordId']) identifier(input[field], field);
  if (Object.hasOwn(input, 'variantId')) {
    identifier(input.variantId, 'variantId');
    if (shared) throw new Error('A shared situation cannot target only one variant.');
  }
  if (Object.hasOwn(input, 'title')) text(input.title, 'action title', 10000, true);
  return structuredClone(input);
}

export function copySession(session) {
  object(
    session,
    ['format', 'revision', 'project', 'lanes', 'situation', 'decision', 'history', 'requests'],
    'session',
  );
  if (session.format !== 1 || !Number.isSafeInteger(session.revision) || session.revision < 1)
    throw new Error('Session format/revision is invalid.');
  validateProject(session.project);
  const variantIds = session.project.variants.map((variant) => variant.id);
  object(session.lanes, variantIds, 'session lanes');
  const actors = new Set(session.project.actors.map((actor) => actor.id));
  for (const variant of session.project.variants) {
    const lane = session.lanes[variant.id];
    object(lane, ['records', 'events'], `lane ${variant.id}`);
    validateRecords(
      lane.records,
      actors,
      new Set(variant.states.map((state) => state.id)),
      `lane ${variant.id} records`,
    );
    list(lane.events, `lane ${variant.id} events`, 0, 500);
  }
  list(session.situation, 'situation', 0, 500);
  session.situation.forEach((step) => intent(step, true));
  list(session.history, 'decision history', 0, 200);
  list(session.requests, 'proposal history', 0, 200);
  if (session.decision !== null && (!session.decision || typeof session.decision !== 'object'))
    throw new Error('Session decision must be an object or null.');
  try {
    return structuredClone(session);
  } catch {
    throw new Error('Session must contain data only.');
  }
}
