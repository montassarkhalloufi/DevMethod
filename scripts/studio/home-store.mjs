import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertRealDirectory, atomicJSON, safeFile, digest } from './files.mjs';
import { createStudioStore, validateStudioState } from './store.mjs';
import { importProject } from './import.mjs';

export const homeLimits = Object.freeze({ projects: 200 });
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const kinds = ['new', 'imported', 'existing'];

export function homeError(message, status = 400) {
  return Object.assign(new Error(message), { status, homeSafe: true });
}

function requireValue(value, message, status) {
  if (!value) throw homeError(message, status);
}

function shape(value, keys) {
  requireValue(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).every((key) => keys.includes(key)),
    'Demande ou registre invalide.',
  );
}

function text(value, maximum, multiline = false) {
  const inspected = typeof value === 'string' && multiline ? value.replace(/[\n\r\t]/g, '') : value;
  requireValue(
    typeof value === 'string' &&
      value.trim() &&
      value.length <= maximum &&
      !/[\p{Cc}]/u.test(inspected),
    'Texte absent, invalide ou trop long.',
  );
  return value.trim();
}

function workspacePath(value) {
  text(value, 4096);
  requireValue(path.isAbsolute(value), 'Un chemin de dossier absolu est requis.');
  return path.resolve(value);
}

function regularJSON(file, maximum) {
  const stat = fs.lstatSync(file);
  requireValue(
    stat.isFile() && !stat.isSymbolicLink() && stat.size <= maximum,
    'Fichier de registre absent, non régulier ou trop volumineux.',
  );
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function inspectExisting(workspace) {
  const root = assertRealDirectory(workspace);
  const file = safeFile(root, '.devmethod/studio.json');
  requireValue(
    fs.existsSync(file),
    'Ce dossier ne contient pas de projet Studio. Utilisez Importer pour des sources existantes.',
  );
  return validateStudioState(regularJSON(file, 16 * 1024 * 1024));
}

function date(value) {
  return (
    typeof value === 'string' &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function validateRegistry(value) {
  shape(value, ['format', 'projects', 'receipts']);
  requireValue(
    value.format === 1 &&
      Array.isArray(value.projects) &&
      value.projects.length <= homeLimits.projects &&
      Array.isArray(value.receipts) &&
      value.receipts.length === value.projects.length,
    'Registre de projets invalide ; aucun remplacement effectué.',
  );
  for (const project of value.projects) {
    shape(project, ['id', 'name', 'kind', 'workspace', 'createdAt', 'lastOpenedAt']);
    requireValue(
      uuid.test(project.id) &&
        kinds.includes(project.kind) &&
        date(project.createdAt) &&
        (project.lastOpenedAt === null || date(project.lastOpenedAt)),
      'Projet du registre invalide.',
    );
    text(project.name, 200);
    requireValue(
      workspacePath(project.workspace) === project.workspace,
      'Chemin du registre non canonique.',
    );
  }
  for (const receipt of value.receipts) {
    shape(receipt, ['requestId', 'fingerprint', 'projectId']);
    requireValue(
      uuid.test(receipt.requestId) &&
        /^[a-f0-9]{64}$/.test(receipt.fingerprint) &&
        value.projects.some((project) => project.id === receipt.projectId),
      'Reçu de création invalide.',
    );
  }
  for (const [items, key] of [
    [value.projects, 'id'],
    [value.projects, 'workspace'],
    [value.receipts, 'requestId'],
    [value.receipts, 'projectId'],
  ])
    requireValue(
      new Set(items.map((item) => item[key])).size === items.length,
      'Doublon dans le registre.',
    );
  return value;
}

function requestFields(input) {
  shape(input, ['requestId', 'kind', 'name', 'idea', 'source', 'workspace']);
  requireValue(
    typeof input.requestId === 'string' && uuid.test(input.requestId) && kinds.includes(input.kind),
    'Identifiant de demande ou type de projet invalide.',
  );
  const result = { requestId: input.requestId, kind: input.kind };
  if (input.name !== undefined) result.name = text(input.name, 200);
  if (input.idea !== undefined) {
    requireValue(input.kind === 'new', 'L’idée initiale concerne uniquement un nouveau projet.');
    result.idea = text(input.idea, 20000, true);
  }
  requireValue(
    (input.kind === 'imported') === (input.source !== undefined) &&
      (input.kind === 'existing') === (input.workspace !== undefined),
    'Le type de projet ne correspond pas aux chemins fournis.',
  );
  if (input.source !== undefined) result.source = workspacePath(input.source);
  if (input.workspace !== undefined) result.workspace = workspacePath(input.workspace);
  return result;
}

export function createHomeStore(directory) {
  const root = assertRealDirectory(directory);
  fs.mkdirSync(root, { recursive: true });
  const file = safeFile(root, 'home.json'),
    lockFile = safeFile(root, 'home.lock');
  const token = randomUUID();
  let descriptor;
  try {
    descriptor = fs.openSync(lockFile, 'wx', 0o600);
  } catch (error) {
    if (error.code === 'EEXIST')
      throw homeError(
        'Cet accueil est déjà ouvert. Fermez son autre session ; un verrou résiduel doit être inspecté sans le supprimer automatiquement.',
        409,
      );
    throw error;
  }
  try {
    fs.writeFileSync(descriptor, JSON.stringify({ token, pid: process.pid }));
    fs.fsyncSync(descriptor);
  } catch (error) {
    fs.closeSync(descriptor);
    fs.rmSync(lockFile, { force: true });
    throw error;
  }
  fs.closeSync(descriptor);
  let data,
    closed = false,
    closing = false,
    closingTask,
    queue = Promise.resolve();
  try {
    data = fs.existsSync(file)
      ? validateRegistry(regularJSON(file, 4 * 1024 * 1024))
      : { format: 1, projects: [], receipts: [] };
    if (!fs.existsSync(file)) atomicJSON(file, data);
  } catch (error) {
    fs.unlinkSync(lockFile);
    throw error;
  }
  const ensureOpen = () => requireValue(!closed && !closing, 'Cet accueil est fermé.', 409);
  const save = (next) => {
    validateRegistry(next);
    atomicJSON(file, next);
    data = next;
  };
  const serialize = (action) => {
    ensureOpen();
    const task = queue.then(action);
    queue = task.catch(() => {});
    return task;
  };

  async function create(input) {
    const fields = requestFields(input),
      fingerprint = digest(JSON.stringify(fields));
    return serialize(async () => {
      const receipt = data.receipts.find((entry) => entry.requestId === fields.requestId);
      if (receipt) {
        requireValue(
          receipt.fingerprint === fingerprint,
          'Cette demande a déjà été utilisée avec un autre contenu.',
          409,
        );
        return structuredClone(data.projects.find((entry) => entry.id === receipt.projectId));
      }
      requireValue(
        data.projects.length < homeLimits.projects,
        'Le registre contient déjà 200 projets.',
        429,
      );
      const id = randomUUID();
      const workspace = fields.workspace ?? safeFile(root, `projects/${id}`);
      requireValue(
        !data.projects.some((entry) => entry.workspace === workspace),
        'Ce projet est déjà présent dans l’accueil ; utilisez Reprendre.',
        409,
      );
      let name = fields.name;
      let created = false;
      try {
        if (fields.kind === 'existing') {
          const state = inspectExisting(workspace);
          name ??= state.project.name || path.basename(workspace);
        } else if (fields.kind === 'imported') {
          await importProject({ source: fields.source, workspace });
          created = true;
          if (fields.name !== undefined) {
            const store = createStudioStore(workspace);
            try {
              store.commit(store.read().version, (state) => {
                state.project.name = fields.name;
              });
            } finally {
              store.close();
            }
          }
          name ??= inspectExisting(workspace).project.name;
        } else {
          fs.mkdirSync(path.dirname(workspace), { recursive: true });
          fs.mkdirSync(workspace);
          created = true;
          const store = createStudioStore(workspace);
          try {
            store.commit(store.read().version, (state) => {
              state.project.name = name || 'Nouveau projet';
              state.project.idea = fields.idea || '';
            });
          } finally {
            store.close();
          }
          name ??= 'Nouveau projet';
        }
        const project = {
          id,
          name: text(name, 200),
          kind: fields.kind,
          workspace,
          createdAt: new Date().toISOString(),
          lastOpenedAt: null,
        };
        save({
          format: 1,
          projects: [...data.projects, project],
          receipts: [...data.receipts, { requestId: fields.requestId, fingerprint, projectId: id }],
        });
        return structuredClone(project);
      } catch (error) {
        if (created) fs.rmSync(workspace, { recursive: true, force: true });
        throw error;
      }
    });
  }

  return {
    root,
    read() {
      ensureOpen();
      return { projects: structuredClone(data.projects), limits: homeLimits };
    },
    create,
    project(id) {
      ensureOpen();
      requireValue(typeof id === 'string' && uuid.test(id), 'Identifiant de projet invalide.');
      const project = data.projects.find((entry) => entry.id === id);
      requireValue(project, 'Projet absent de cet accueil.', 404);
      inspectExisting(project.workspace);
      return structuredClone(project);
    },
    opened(id) {
      return serialize(() => {
        const next = structuredClone(data),
          project = next.projects.find((entry) => entry.id === id);
        requireValue(project, 'Projet absent de cet accueil.', 404);
        project.lastOpenedAt = new Date().toISOString();
        save(next);
        return structuredClone(project);
      });
    },
    close() {
      closingTask ??= (async () => {
        closing = true;
        await queue;
        const lock = regularJSON(lockFile, 4096);
        requireValue(
          lock.token === token,
          'Le verrou de l’accueil a changé ; suppression refusée.',
          409,
        );
        fs.unlinkSync(lockFile);
        closed = true;
      })();
      return closingTask;
    },
  };
}
