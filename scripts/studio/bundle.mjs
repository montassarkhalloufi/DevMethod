import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { safeFile, digest } from './files.mjs';
import { portableBudget } from './budget.mjs';
import { archiveFiles } from './archive.mjs';

export function exportProject(workspace, state) {
  const entries = [],
    add = (name, value) =>
      entries.push({ name, bytes: Buffer.isBuffer(value) ? value : Buffer.from(value) });
  const budgetFile = safeFile(workspace, '.devmethod/agent.json');
  if (fs.existsSync(budgetFile))
    add('.devmethod/agent.json', JSON.stringify(portableBudget(budgetFile), null, 2));
  add('.devmethod/studio.json', JSON.stringify(state, null, 2) + '\n');
  add('.devmethod/data.json', fs.readFileSync(safeFile(workspace, '.devmethod/data.json')));
  for (const revision of state.revisions)
    for (const file of [
      ...revision.files.map((f) => ({ ...f, folder: 'app' })),
      ...(revision.compilation?.files ?? []).map((f) => ({ ...f, folder: 'compiled' })),
    ]) {
      const relative = 'revisions/' + revision.id + '/' + file.folder + '/' + file.path;
      const bytes = fs.readFileSync(safeFile(workspace, relative));
      if (digest(bytes) !== file.sha256)
        throw new Error('Une version a été modifiée hors de Studio.');
      add(relative, bytes);
    }
  for (const reference of state.references)
    add(reference.file, fs.readFileSync(safeFile(workspace, reference.file)));
  for (const name of [
    'preview.mjs',
    'files.mjs',
    'import-paths.mjs',
    'http.mjs',
    'public/comparison-guard.js',
  ])
    add('runtime/' + name, fs.readFileSync(fileURLToPath(new URL(name, import.meta.url))));
  add(
    'launch.mjs',
    `import fs from 'node:fs';import {fileURLToPath} from 'node:url';import {createPreview} from './runtime/preview.mjs';const workspace=fileURLToPath(new URL('.',import.meta.url));const state=JSON.parse(fs.readFileSync(new URL('./.devmethod/studio.json',import.meta.url)));const port=Number(process.argv[2]??'4399');if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Port invalide');const s=createPreview({workspace,getState:()=>state});s.listen(port,'127.0.0.1',()=>console.log('Application locale : http://127.0.0.1:'+port));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>s.close());\n`,
  );
  add(
    'README.md',
    '# Votre projet local\n\n' +
      (state.revisions.find((revision) => revision.id === state.activeRevision)?.profile ===
      'source-only'
        ? 'Les sources sont exportées pour inspection, modification et reprise dans Studio. Aucun aperçu ni exécution ne sont disponibles pour ce profil dans le runtime Studio. Les scripts du projet n’ont pas été exécutés ; cet export ne constitue pas une validation de leur fonctionnement.\n\n'
        : 'Node.js 22+ suffit. Lancez `node launch.mjs 4399`, puis ouvrez http://127.0.0.1:4399/.\n\n') +
      'Le code est dans revisions/, les décisions et demandes dans .devmethod/studio.json, les données actuelles dans .devmethod/data.json, les références dans references/. Ce runtime local n’a ni authentification ni déploiement public. Aucun accès fournisseur ou secret n’est exporté.\n\nPour reprendre dans DevMethod : `devmethod-studio --workspace /chemin/absolu/vers/ce/dossier`. Revenir à une version de code ne restaure pas d’anciennes données. Les changements de schéma restent à vérifier.\n',
  );
  return archiveFiles(entries);
}
