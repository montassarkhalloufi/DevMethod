import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { interruptRunningJobs, validateStudioState } from './domain.mjs';

export { validateStudioState } from './domain.mjs';

export function createInitialStudioState() {
  return {
    format: 1,
    version: 1,
    project: { name: '', idea: '', mode: 'guided', constraints: [] },
    draft: '',
    references: [],
    brief: { outcome: '', scope: [], excluded: [], criteria: [] },
    decisions: [],
    designs: [],
    selectedDesignId: null,
    jobs: [],
    revisions: [],
    activeRevision: null,
    checks: [],
    events: [],
  };
}

function reject(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}

function stat(file) {
  try {
    return fs.lstatSync(file);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

// Reject links at every component; lstat also detects dangling links.
function directory(file) {
  const parsed = path.parse(file);
  let current = parsed.root;
  for (const component of file.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    const info = stat(current);
    if (info && (!info.isDirectory() || info.isSymbolicLink()))
      reject('Le workspace doit utiliser des dossiers réels, sans lien symbolique.');
  }
  fs.mkdirSync(file, { recursive: true });
}

function regular(file) {
  const info = stat(file);
  if (info && (!info.isFile() || info.isSymbolicLink()))
    reject('Le stockage contient un lien symbolique ou un fichier spécial.');
  return info;
}

function persist(file, value) {
  regular(file);
  const temporary = path.join(path.dirname(file), `studio-${randomUUID()}.tmp`);
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, 'wx', 0o600);
    fs.writeFileSync(descriptor, JSON.stringify(value, null, 2) + '\n');
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporary, file);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    fs.rmSync(temporary, { force: true });
  }
}

function load(file) {
  const info = regular(file);
  if (!info) return null;
  if (info.size > 16 * 1024 * 1024) reject('État supérieur à 16 Mio ; lecture refusée.');
  try {
    return validateStudioState(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch (error) {
    reject(`État Studio illisible ou invalide ; aucun remplacement effectué : ${error.message}`);
  }
}

function unchanged(previous, next, label) {
  if (JSON.stringify(previous) !== JSON.stringify(next))
    reject(`${label} déjà enregistré ne peut pas être réécrit.`);
}

function preserved(previous, next, label, inspect = unchanged) {
  if (next.length < previous.length) reject(`${label} ne peut pas être supprimé.`);
  previous.forEach((entry, index) => inspect(entry, next[index], label));
}

const allowedTransitions = {
  queued: ['queued', 'running', 'cancelled'],
  running: ['running', 'ready', 'failed', 'cancelled', 'interrupted'],
  ready: ['ready'],
  failed: ['failed'],
  cancelled: ['cancelled'],
  interrupted: ['interrupted'],
};

function checkJobTransition(previous, next) {
  for (const key of ['id', 'request', 'element', 'baseRevision', 'createdAt'])
    unchanged(previous[key], next[key], `Champ ${key} de demande`);
  if (!allowedTransitions[previous.status].includes(next.status))
    reject('Transition de demande invalide.');
  if (previous.status !== 'queued') unchanged(previous.worker, next.worker, 'Exécutant');
  if (!['queued', 'running'].includes(previous.status))
    unchanged(previous, next, 'Résultat de demande');
}

function checkDecisionTransition(previous, next) {
  const { status: oldStatus, ...oldContent } = previous;
  const { status: newStatus, ...newContent } = next;
  unchanged(oldContent, newContent, 'Décision');
  if (oldStatus !== newStatus && !(oldStatus === 'active' && newStatus === 'superseded'))
    reject('Une décision existante peut seulement être remplacée.');
}

function validateTransition(previous, next) {
  for (const key of ['references', 'designs', 'revisions', 'checks', 'events'])
    preserved(previous[key], next[key], key);
  preserved(previous.decisions, next.decisions, 'Décisions', checkDecisionTransition);
  preserved(previous.jobs, next.jobs, 'Demandes', checkJobTransition);
  for (const job of next.jobs.slice(previous.jobs.length)) {
    if (job.status !== 'queued') reject('Une nouvelle demande doit commencer en attente.');
  }
}

function acquireLock(file) {
  regular(file);
  let descriptor;
  try {
    descriptor = fs.openSync(file, 'wx', 0o600);
  } catch (error) {
    if (error.code === 'EEXIST')
      reject(
        'Workspace verrouillé. Fermez l’autre serveur ; après un arrêt brutal, inspectez le verrou avant de le retirer.',
        409,
      );
    throw error;
  }
  const token = randomUUID();
  try {
    fs.writeFileSync(
      descriptor,
      JSON.stringify({ pid: process.pid, token, createdAt: new Date().toISOString() }) + '\n',
    );
    fs.fsyncSync(descriptor);
  } catch (error) {
    fs.closeSync(descriptor);
    fs.rmSync(file, { force: true });
    throw error;
  }
  fs.closeSync(descriptor);
  return () => {
    const info = regular(file);
    if (!info) return;
    const lock = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (lock.token !== token) reject('Le verrou a été remplacé ; suppression refusée.', 409);
    fs.unlinkSync(file);
  };
}

export function createStudioStore(workspace) {
  if (typeof workspace !== 'string' || !path.isAbsolute(workspace))
    reject('Le workspace doit être un chemin absolu.');
  const root = path.resolve(workspace);
  const storage = path.join(root, '.devmethod');
  directory(storage);
  const file = path.join(storage, 'studio.json');
  const release = acquireLock(path.join(storage, 'studio.lock'));
  let state;
  let closed = false;
  try {
    state = load(file);
    if (state === null) {
      state = createInitialStudioState();
      persist(file, state);
    } else if (interruptRunningJobs(state)) {
      state.version++;
      validateStudioState(state);
      persist(file, state);
    }
  } catch (error) {
    release();
    throw error;
  }

  function ensureOpen() {
    if (closed) reject('Ce stockage est fermé.', 409);
    directory(storage);
  }

  return {
    root,
    read() {
      ensureOpen();
      return structuredClone(state);
    },
    commit(expectedVersion, mutator) {
      ensureOpen();
      if (!Number.isSafeInteger(expectedVersion) || expectedVersion !== state.version)
        reject(
          'L’état a changé. Vos saisies restent disponibles ; rechargez avant de réessayer.',
          409,
        );
      if (typeof mutator !== 'function') reject('Modification invalide.');
      const draft = structuredClone(state);
      const result = mutator(draft);
      if (result && typeof result.then === 'function')
        reject('La modification du stockage doit être synchrone.');
      if (draft.version !== state.version) reject('La version est gérée par le stockage.');
      validateStudioState(draft);
      validateTransition(state, draft);
      draft.version++;
      if (Buffer.byteLength(JSON.stringify(draft)) > 16 * 1024 * 1024)
        reject('État supérieur à 16 Mio.');
      persist(file, draft);
      state = structuredClone(draft);
      return structuredClone(state);
    },
    close() {
      if (closed) return;
      release();
      closed = true;
    },
  };
}
