import fs from 'node:fs';
import path from 'node:path';
import { atomicJSON, digest, safeFile } from './files.mjs';

export const progressLimits = Object.freeze({
  steps: 40,
  actions: 200,
  events: 2000,
  inputBytes: 32768,
});
const maximumJournalBytes = 1024 * 1024;
const stepStatuses = ['pending', 'running', 'completed', 'blocked'];
const actionStatuses = ['running', 'completed', 'failed'];
const actionKinds = ['read', 'write', 'command', 'search', 'check', 'message'];

function reject(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}

function object(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    reject(`${label} doit être un objet.`);
  if (Object.keys(value).some((key) => !keys.includes(key)))
    reject(`${label} contient un champ inconnu.`);
}

function text(value, maximum, label) {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > maximum ||
    /[\p{Cc}]/u.test(value)
  )
    reject(`${label} invalide ou trop long.`);
  return value;
}

function identifier(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value))
    reject('Identifiant de progression invalide.');
  return value;
}

function member(value, values, label) {
  if (!values.includes(value)) reject(`${label} invalide.`);
  return value;
}

function plan(value) {
  object(value, ['title', 'steps'], 'Plan');
  if (!Array.isArray(value.steps) || value.steps.length > progressLimits.steps)
    reject('Le plan dépasse 40 étapes ou est invalide.');
  const ids = new Set();
  const steps = value.steps.map((step) => {
    object(step, ['id', 'title', 'status'], 'Étape');
    const id = identifier(step.id);
    if (ids.has(id)) reject('Identifiant d’étape répété.');
    ids.add(id);
    return {
      id,
      title: text(step.title, 200, 'Titre d’étape'),
      status: member(step.status, stepStatuses, 'Statut d’étape'),
    };
  });
  return { title: text(value.title, 200, 'Titre du plan'), steps };
}

function action(value, appRoot) {
  object(value, ['id', 'kind', 'label', 'status', 'path'], 'Action');
  const result = {
    id: identifier(value.id),
    kind: member(value.kind, actionKinds, 'Type d’action'),
    label: text(value.label, 400, 'Libellé d’action'),
    status: member(value.status, actionStatuses, 'Statut d’action'),
  };
  if (value.path !== undefined) {
    result.path = text(value.path, 300, 'Chemin d’application');
    safeFile(appRoot, result.path);
  }
  return result;
}

function event(value, appRoot) {
  object(value, ['type', 'title', 'steps', 'id', 'kind', 'label', 'status', 'path'], 'Événement');
  const { type, ...content } = value;
  if (type === 'plan') return { type, ...plan(content) };
  if (type === 'action') return { type, ...action(content, appRoot) };
  reject('Type d’événement inconnu.');
}

function timestamp(value) {
  if (
    typeof value !== 'string' ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  )
    reject('Date de progression invalide.');
}

function receipt(value) {
  object(value, ['id', 'fingerprint'], 'Accusé de progression');
  identifier(value.id);
  if (typeof value.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(value.fingerprint))
    reject('Empreinte de progression invalide.');
}

function uniqueEntries(values, maximum, validate, label) {
  if (!Array.isArray(values) || values.length > maximum) reject(`${label} invalide ou trop long.`);
  const ids = new Set();
  for (const value of values) {
    validate(value);
    if (ids.has(value.id)) reject(`${label} contient un identifiant répété.`);
    ids.add(value.id);
  }
}

function validateJournal(value, job, appRoot) {
  object(
    value,
    [
      'format',
      'jobId',
      'baseRevision',
      'sequence',
      'updatedAt',
      'plan',
      'actions',
      'truncated',
      'source',
      'receipts',
    ],
    'Journal',
  );
  if (value.format !== 1 || value.jobId !== job.id || value.baseRevision !== job.baseRevision)
    reject('Journal lié à une autre demande ou révision.');
  uniqueEntries(value.receipts, progressLimits.events, receipt, 'Accusés');
  if (
    !Number.isSafeInteger(value.sequence) ||
    value.sequence < 1 ||
    value.sequence !== value.receipts.length
  )
    reject('Séquence de progression invalide.');
  timestamp(value.updatedAt);
  if (value.plan !== null) plan(value.plan);
  uniqueEntries(
    value.actions,
    progressLimits.actions,
    (entry) => {
      const { at, ...content } = entry;
      timestamp(at);
      action(content, appRoot);
    },
    'Actions',
  );
  if (typeof value.truncated !== 'boolean') reject('Indicateur de troncature invalide.');
  member(value.source, ['host', 'runner'], 'Source');
  return value;
}

function journalFile(store, job) {
  return safeFile(store.root, `.devmethod/progress/${job.id}.json`);
}

function load(store, job, appRoot) {
  const file = journalFile(store, job);
  let info;
  try {
    info = fs.lstatSync(file);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  if (!info.isFile() || info.size > maximumJournalBytes)
    reject('Journal de progression invalide ou supérieur à 1 Mio ; aucun remplacement effectué.');
  try {
    return validateJournal(JSON.parse(fs.readFileSync(file, 'utf8')), job, appRoot);
  } catch (error) {
    reject(`Journal de progression illisible ; aucun remplacement effectué : ${error.message}`);
  }
}

function snapshot(job, journal) {
  return {
    jobId: job.id,
    baseRevision: job.baseRevision,
    status: job.status,
    worker: job.worker,
    sequence: journal?.sequence ?? 0,
    updatedAt: journal?.updatedAt ?? null,
    plan: journal?.plan ?? null,
    actions: journal?.actions ?? [],
    truncated: journal?.truncated ?? false,
    source: journal?.source ?? null,
  };
}

function applyEvent(journal, reported, at) {
  const { type, ...content } = reported;
  if (type === 'plan') {
    journal.plan = content;
    return;
  }
  const index = journal.actions.findIndex((entry) => entry.id === content.id);
  if (index >= 0) journal.actions.splice(index, 1);
  journal.actions.push({ ...content, at });
  if (journal.actions.length > progressLimits.actions) {
    journal.actions.shift();
    journal.truncated = true;
  }
}

export function createJobProgress(store) {
  function current(jobId) {
    identifier(jobId);
    const state = store.read();
    const job = state.jobs.find((entry) => entry.id === jobId);
    if (!job) reject('Demande absente.', 404);
    const appRoot = safeFile(store.root, `work/${job.id}/app`);
    return { state, job, appRoot, journal: load(store, job, appRoot) };
  }

  function report(input, source = 'host') {
    object(input, ['jobId', 'eventId', 'event'], 'Rapport de progression');
    if (Buffer.byteLength(JSON.stringify(input)) > progressLimits.inputBytes)
      reject('Rapport de progression supérieur à 32 Kio.', 413);
    member(source, ['host', 'runner'], 'Source');
    const eventId = identifier(input.eventId);
    const { state, job, appRoot, journal: previous } = current(input.jobId);
    const reported = event(input.event, appRoot);
    const fingerprint = digest(JSON.stringify({ source, event: reported }));
    const recorded = previous?.receipts.find((entry) => entry.id === eventId);
    if (recorded) {
      if (recorded.fingerprint !== fingerprint)
        reject('Identifiant déjà utilisé pour un autre événement.', 409);
      return snapshot(job, previous);
    }
    if (job.status !== 'running' || job.baseRevision !== state.activeRevision)
      reject(
        'Demande terminée, interrompue ou devenue obsolète ; progression tardive refusée.',
        409,
      );
    if (previous?.receipts.length >= progressLimits.events)
      reject(
        'Limite de 2000 événements atteinte ; journal conservé, nouveaux événements refusés.',
        429,
      );
    const at = new Date().toISOString();
    const journal = previous ?? {
      format: 1,
      jobId: job.id,
      baseRevision: job.baseRevision,
      sequence: 0,
      updatedAt: at,
      plan: null,
      actions: [],
      truncated: false,
      source,
      receipts: [],
    };
    applyEvent(journal, reported, at);
    journal.sequence++;
    journal.updatedAt = at;
    journal.source = source;
    journal.receipts.push({ id: eventId, fingerprint });
    if (Buffer.byteLength(JSON.stringify(journal)) > maximumJournalBytes)
      reject('Journal de progression supérieur à 1 Mio.', 413);
    const file = journalFile(store, job);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    atomicJSON(file, journal);
    return snapshot(job, journal);
  }

  return {
    read: (jobId) => {
      const { job, journal } = current(jobId);
      return snapshot(job, journal);
    },
    report,
  };
}
