import { randomUUID } from 'node:crypto';

const emptyJourney = () => ({ activeMasterId: null, masters: [], screens: [], prototypes: [] });

function requireValue(condition, message, status = 400) {
  if (!condition) throw Object.assign(new Error(message), { status });
}

function shape(value, keys, label) {
  requireValue(value && typeof value === 'object' && !Array.isArray(value), `${label} invalide.`);
  requireValue(
    Object.keys(value).every((key) => keys.includes(key)),
    `Champ inconnu dans ${label}.`,
  );
}

function identifier(value) {
  requireValue(
    typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value),
    'Identifiant de parcours invalide.',
  );
}

function text(value, label) {
  requireValue(
    typeof value === 'string' && value.trim().length > 0 && value.length <= 4000,
    `${label} invalide.`,
  );
}

function actor(value) {
  requireValue(['agent', 'user'].includes(value), 'Source du parcours invalide.');
}

function date(value) {
  requireValue(
    typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T/.test(value) &&
      Number.isFinite(Date.parse(value)),
    'Date du parcours invalide.',
  );
}

function image(state, referenceId) {
  identifier(referenceId);
  requireValue(
    state.references.some((ref) => ref.id === referenceId && ref.mime.startsWith('image/')),
    'Référence image du parcours absente.',
  );
}

function metadata(entry) {
  identifier(entry.id);
  actor(entry.source);
  date(entry.createdAt);
}

function records(entries, label) {
  requireValue(
    Array.isArray(entries) && entries.length <= 100,
    `Maximum 100 ${label}, sans supprimer l’historique.`,
  );
  requireValue(
    new Set(entries.map((entry) => entry?.id)).size === entries.length,
    `${label} dupliqués.`,
  );
}

function approval(master) {
  if (master.approvedBy === null) {
    requireValue(
      master.approvedAt === null && master.approvalReason === null,
      'Master non approuvé avec trace d’approbation.',
    );
  } else {
    actor(master.approvedBy);
    date(master.approvedAt);
    text(master.approvalReason, 'Raison de validation');
  }
}

function masterRecord(state, master) {
  shape(
    master,
    [
      'id',
      'designId',
      'referenceId',
      'source',
      'createdAt',
      'approvedBy',
      'approvedAt',
      'approvalReason',
    ],
    'Master',
  );
  metadata(master);
  image(state, master.referenceId);
  approval(master);
  requireValue(
    state.designs.some((design) => design.id === master.designId),
    'Direction du master absente.',
  );
}

function derivedRecord(state, journey, entry, kind) {
  const keys = kind === 'screens' ? ['title', 'referenceId'] : ['revisionId'];
  shape(entry, ['id', 'masterId', 'source', 'createdAt', ...keys], 'Élément dérivé');
  metadata(entry);
  requireValue(
    journey.masters.some((master) => master.id === entry.masterId && master.approvedBy !== null),
    'Élément dérivé sans master approuvé.',
  );
  if (kind === 'screens') {
    text(entry.title, 'Titre d’écran');
    image(state, entry.referenceId);
  } else
    requireValue(
      state.revisions.some((revision) => revision.id === entry.revisionId),
      'Révision du prototype absente.',
    );
}

export function validateDesignJourney(state) {
  if (state.designJourney === undefined) return;
  const journey = state.designJourney;
  shape(journey, ['activeMasterId', 'masters', 'screens', 'prototypes'], 'Parcours design');
  for (const key of ['masters', 'screens', 'prototypes']) records(journey[key], key);
  for (const master of journey.masters) masterRecord(state, master);
  requireValue(
    journey.activeMasterId === null ||
      journey.masters.some((master) => master.id === journey.activeMasterId),
    'Master actif absent.',
  );
  for (const key of ['screens', 'prototypes'])
    for (const entry of journey[key]) derivedRecord(state, journey, entry, key);
}

function trace(state, type, message) {
  state.events.push({ id: randomUUID(), type, text: message, createdAt: new Date().toISOString() });
}

function appendRecord(state, key, record) {
  const journey = structuredClone(state.designJourney ?? emptyJourney());
  journey[key].push(record);
  if (key === 'masters') journey.activeMasterId = record.id;
  validateDesignJourney({ ...state, designJourney: journey });
  state.designJourney = journey;
  trace(
    state,
    'design-journey',
    'Parcours design complété ; validation, réalisation et adoption restent distinctes.',
  );
  return record;
}

function authored(input, source) {
  actor(source);
  return {
    ...structuredClone(input),
    id: input.id ?? randomUUID(),
    source,
    createdAt: new Date().toISOString(),
  };
}

function currentMaster(state, masterId) {
  const master = state.designJourney?.masters.find((entry) => entry.id === masterId);
  requireValue(master, 'Master introuvable.', 404);
  requireValue(
    state.designJourney.activeMasterId === master.id && state.selectedDesignId === master.designId,
    'Ce master ne correspond plus à la direction courante ; préparez un nouveau master.',
    409,
  );
  return master;
}

function approvedMaster(state, masterId) {
  const master = currentMaster(state, masterId);
  requireValue(
    master.approvedBy === 'user' ||
      (master.approvedBy === 'agent' && (state.project.delegation?.visual ?? 'agent') === 'agent'),
    'Le master courant doit être approuvé avant ses écrans ou son prototype.',
    409,
  );
  return master;
}

export function setDesignMaster(state, input, { actor: source = 'agent' } = {}) {
  shape(input, ['id', 'designId', 'referenceId'], 'Nouveau master');
  requireValue(
    input.designId === state.selectedDesignId,
    'Choisissez cette direction avant de préparer son master.',
    409,
  );
  const master = {
    ...authored(input, source),
    approvedBy: null,
    approvedAt: null,
    approvalReason: null,
  };
  return appendRecord(state, 'masters', master);
}

export function approveDesignMaster(state, input, { actor: source = 'user' } = {}) {
  shape(input, ['masterId', 'reason'], 'Validation du master');
  actor(source);
  text(input.reason, 'Raison de validation');
  const master = currentMaster(state, input.masterId);
  requireValue(
    source === 'user' || (state.project.delegation?.visual ?? 'agent') === 'agent',
    'La validation visuelle est réservée à l’utilisateur.',
    409,
  );
  requireValue(
    master.approvedBy === null,
    'Ce master est déjà approuvé ; créez un nouveau master pour rouvrir ce choix.',
    409,
  );
  master.approvedBy = source;
  master.approvedAt = new Date().toISOString();
  master.approvalReason = input.reason;
  trace(state, 'master-approved', 'Master exact approuvé ; aucune version de code activée.');
  return master;
}

export function addDesignScreen(state, input, { actor: source = 'agent' } = {}) {
  shape(input, ['id', 'title', 'referenceId', 'masterId'], 'Nouvel écran');
  approvedMaster(state, input.masterId);
  return appendRecord(state, 'screens', authored(input, source));
}

export function linkDesignPrototype(state, input, { actor: source = 'agent' } = {}) {
  shape(input, ['id', 'masterId', 'revisionId'], 'Nouveau prototype');
  approvedMaster(state, input.masterId);
  return appendRecord(state, 'prototypes', authored(input, source));
}

function unchanged(before, after, message) {
  requireValue(JSON.stringify(before) === JSON.stringify(after), message);
}

function masterTransition(before, after) {
  const { approvedBy, approvedAt, approvalReason, ...content } = before;
  const {
    approvedBy: nextBy,
    approvedAt: nextAt,
    approvalReason: nextReason,
    ...nextContent
  } = after;
  unchanged(content, nextContent, 'Un master historique ne peut pas être réécrit.');
  if (approvedBy !== null)
    unchanged(
      [approvedBy, approvedAt, approvalReason],
      [nextBy, nextAt, nextReason],
      'Une validation de master ne peut pas être réécrite.',
    );
}

export function validateDesignJourneyTransition(previous, next) {
  const before = previous.designJourney ?? emptyJourney(),
    after = next.designJourney ?? emptyJourney();
  for (const key of ['masters', 'screens', 'prototypes']) {
    requireValue(
      after[key].length >= before[key].length,
      'Le parcours historique ne peut pas être supprimé.',
    );
    before[key].forEach((entry, index) => {
      if (key === 'masters') masterTransition(entry, after[key][index]);
      else
        unchanged(
          entry,
          after[key][index],
          'Un élément dérivé historique ne peut pas être réécrit.',
        );
    });
  }
  for (const master of after.masters.slice(before.masters.length))
    requireValue(
      master.approvedBy === null,
      'Un nouveau master doit attendre sa propre validation.',
    );
  if (before.activeMasterId !== after.activeMasterId)
    requireValue(
      after.masters
        .slice(before.masters.length)
        .some((master) => master.id === after.activeMasterId),
      'Le master actif doit être une nouvelle proposition historisée.',
    );
}

export function designJourneyView(state) {
  const journey = state.designJourney ?? emptyJourney();
  const master = journey.masters.find((entry) => entry.id === journey.activeMasterId) ?? null;
  const stale = Boolean(master && master.designId !== state.selectedDesignId);
  const approved = Boolean(
    master &&
    !stale &&
    (master.approvedBy === 'user' ||
      (master.approvedBy === 'agent' && (state.project.delegation?.visual ?? 'agent') === 'agent')),
  );
  const screens = journey.screens.filter((screen) => screen.masterId === master?.id);
  const prototype = journey.prototypes.findLast((entry) => entry.masterId === master?.id) ?? null;
  const stage = !state.selectedDesignId
    ? 'directions'
    : !approved
      ? 'master'
      : !prototype
        ? 'screens'
        : 'prototype';
  return structuredClone({ master, screens, prototype, stale, approved, stage });
}
