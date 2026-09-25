import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createSession } from './domain.mjs';
import { copySession } from './schema.mjs';

export function createStore(workspace, project) {
  fs.mkdirSync(workspace, { recursive: true });
  const root = fs.realpathSync(workspace);
  const lock = path.join(root, '.atelier-lock');
  try {
    fs.writeFileSync(lock, String(process.pid), { flag: 'wx' });
  } catch {
    throw new Error('Cet atelier est déjà ouvert ou son arrêt reste à vérifier : ' + lock);
  }
  const file = path.join(root, 'session.json');
  let current;
  const persist = (value) => {
    const temporary = path.join(root, '.session-' + randomUUID() + '.json');
    try {
      fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
      fs.renameSync(temporary, file);
    } finally {
      fs.rmSync(temporary, { force: true });
    }
  };
  try {
    if (fs.existsSync(file)) {
      if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Session symbolique refusée.');
      current = JSON.parse(fs.readFileSync(file, 'utf8'));
      copySession(current.session);
      if (!Number.isSafeInteger(current.storageVersion) || current.storageVersion < 1)
        throw new Error('Version de session invalide.');
      if (current.session.project.id !== project.id)
        throw new Error('Un autre projet occupe cet atelier. Choisissez un nouveau dossier.');
    } else {
      current = { storageVersion: 1, session: createSession(project) };
      persist(current);
    }
  } catch (error) {
    fs.rmSync(lock, { force: true });
    throw error;
  }
  return {
    root,
    read: () => structuredClone(current),
    commit(version, session) {
      if (version !== current.storageVersion) {
        const error = new Error(
          'Le projet a changé dans un autre onglet. Rechargez avant de réessayer.',
        );
        error.status = 409;
        throw error;
      }
      const next = { storageVersion: current.storageVersion + 1, session };
      persist(next);
      current = next;
      return this.read();
    },
    close: () => fs.rmSync(lock, { force: true }),
  };
}
