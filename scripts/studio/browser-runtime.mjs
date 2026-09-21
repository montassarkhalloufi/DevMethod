import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createPreview } from './preview.mjs';
import { atomicJSON, digest, safeFile } from './files.mjs';

export function assertBrowserSnapshot(snapshot) {
  if (snapshot.issue || !snapshot.files?.length)
    throw new Error('Sources indisponibles ou modifiées.');
  for (const file of [...snapshot.files, ...(snapshot.compiled ?? [])]) {
    if (
      !Buffer.isBuffer(file.contents) ||
      digest(file.contents) !== file.sha256 ||
      file.contents.length !== file.bytes
    )
      throw new Error('Les octets capturés ne correspondent plus au manifeste.');
    if (
      !file.absolute ||
      !fs.lstatSync(file.absolute).isFile() ||
      digest(fs.readFileSync(file.absolute)) !== file.sha256
    )
      throw new Error('Les sources ont changé pendant le contrôle.');
  }
  if (
    snapshot.revision.profile === 'source-only' ||
    (snapshot.revision.profile === 'react-ts' && !snapshot.revision.compilation)
  )
    throw new Error('Aucun runtime compilé compatible pour ce candidat.');
}

export function copyBrowserSnapshot(snapshot) {
  assertBrowserSnapshot(snapshot);
  const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-browser-'));
  try {
    for (const [folder, files] of [
      ['app', snapshot.files],
      ['compiled', snapshot.compiled ?? []],
    ]) {
      for (const file of files) {
        const target = safeFile(directory, `revisions/candidate/${folder}/${file.path}`);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, file.contents, { flag: 'wx', mode: 0o600 });
      }
    }
    fs.mkdirSync(path.join(directory, '.devmethod'));
    return directory;
  } catch (error) {
    fs.rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}

export function browserEnvironment(directory) {
  return {
    HOME: directory,
    USERPROFILE: directory,
    TMPDIR: directory,
    TMP: directory,
    TEMP: directory,
    LANG: 'C.UTF-8',
    ...(process.platform === 'win32' && process.env.SystemRoot
      ? { SystemRoot: process.env.SystemRoot }
      : {}),
  };
}

export function createBrowserRuntime({ directory, snapshot, browser, remaining, guard }) {
  let server, context, page, origin;
  const violations = new Set();
  const dataFile = path.join(directory, '.devmethod/data.json');
  const revision = { ...snapshot.revision, id: 'candidate' };

  async function stop() {
    const currentContext = context,
      currentServer = server;
    context = null;
    page = null;
    server = null;
    const closeContext = currentContext?.close().catch(() => {});
    if (currentServer) {
      currentServer.closeAllConnections();
      await new Promise((resolve) => currentServer.close(resolve));
    }
    await closeContext;
  }

  async function start() {
    guard();
    server = createPreview({
      workspace: directory,
      getState: () => ({ activeRevision: 'candidate', revisions: [revision] }),
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    origin = `http://127.0.0.1:${server.address().port}`;
    guard();
    context = await browser.newContext({
      serviceWorkers: 'block',
      acceptDownloads: false,
      permissions: [],
    });
    guard();
    context.setDefaultTimeout(Math.min(5000, remaining()));
    context.setDefaultNavigationTimeout(Math.min(10000, remaining()));
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.origin === origin && ['http:', 'https:'].includes(url.protocol))
        return route.continue();
      violations.add('Une requête hors de l’origine de recette a été refusée.');
      return route.abort();
    });
    await context.routeWebSocket('**/*', (socket) => {
      violations.add('Une connexion WebSocket a été refusée.');
      socket.close();
    });
    let firstPage = true;
    context.on('page', (opened) => {
      if (firstPage) {
        firstPage = false;
        return;
      }
      violations.add('Une fenêtre supplémentaire a été refusée.');
      void opened.close().catch(() => {});
    });
    page = await context.newPage();
    page.on('dialog', (dialog) => void dialog.dismiss().catch(() => {}));
    page.on('download', (download) => {
      violations.add('Un téléchargement a été refusé.');
      void download.cancel().catch(() => {});
    });
    page.on('pageerror', () =>
      violations.add('Une erreur JavaScript a été observée pendant le scénario.'),
    );
    await page.goto(origin + '/', { waitUntil: 'load', timeout: Math.min(10000, remaining()) });
    guard();
  }

  return {
    dataFile,
    violations,
    get page() {
      return page;
    },
    async fresh() {
      await stop();
      violations.clear();
      atomicJSON(dataFile, { version: 1, data: {} });
      await start();
    },
    async restart() {
      await stop();
      await start();
    },
    stop,
  };
}
