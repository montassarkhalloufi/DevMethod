import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFiles, safeFile } from './files.mjs';
import { validateStudioState } from './domain.mjs';
import { exportProject } from './bundle.mjs';
import { restoreArchive } from './archive.mjs';

// A recorded example, not a generator or an application-specific Studio engine.
export function initializeExample(workspace) {
  const example = fileURLToPath(new URL('../../examples/studio-ateliers/', import.meta.url));
  const designs = fileURLToPath(
    new URL('../../docs/missions/creation-experience/design/', import.meta.url),
  );
  const state = validateStudioState(
    JSON.parse(fs.readFileSync(path.join(example, 'state/studio.json'), 'utf8')),
  );
  const staging = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'dm-example-'));
  try {
    fs.mkdirSync(path.join(staging, '.devmethod'));
    for (const name of ['studio.json', 'data.json', 'agent.json'])
      fs.copyFileSync(path.join(example, 'state', name), path.join(staging, '.devmethod', name));
    for (const revision of state.revisions)
      copyFiles(
        path.join(example, 'revisions', revision.id, 'app'),
        path.join(staging, 'revisions', revision.id, 'app'),
        revision.files,
      );
    fs.mkdirSync(path.join(staging, 'references'));
    for (const reference of state.references)
      fs.copyFileSync(safeFile(designs, reference.name), safeFile(staging, reference.file));
    return restoreArchive(exportProject(staging, state), workspace);
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}
