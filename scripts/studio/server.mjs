import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createStudioStore } from './store.mjs';
import * as domain from './domain.mjs';
import { createJobs } from './jobs.mjs';
import { createPreview } from './preview.mjs';
import { safeFile, mimeType, atomicJSON } from './files.mjs';
import { body, send, sameOrigin, errorResponse } from './http.mjs';
import { exportProject } from './bundle.mjs';
import { readSource, readRuntimeSource, readProjectServices } from './source.mjs';
import { getRuntimeServices } from './backend-runtime.mjs';
import { createEditor } from './editor.mjs';
import { progressLimits } from './progress.mjs';
import { readConnectorsRoute, writeConnectorsRoute } from './connector-routes.mjs';

const widgetRoot = fileURLToPath(new URL('../../dist/studio-ui', import.meta.url));
const publicRoot = fileURLToPath(new URL('./public', import.meta.url));
const browserActions = {
  '/api/project': domain.updateProject,
  '/api/draft': domain.setDraft,
  '/api/requests': domain.queueRequest,
  '/api/jobs/cancel': domain.cancelJob,
  '/api/design': domain.chooseDesign,
  '/api/activate': domain.activateRevision,
  '/api/approve': domain.approvePlan,
  '/api/proposals/select': domain.selectProposalOption,
  '/api/proposals/approve': approveAndPrepare,
  '/api/design/master/approve': (state, input) =>
    domain.approveDesignMaster(state, input, { actor: 'user' }),
};

function approveAndPrepare(state, input, actor = 'user') {
  const proposal = domain.approveProposal(state, input, { actor });
  if (proposal.stage !== 'implementation') return;

  const option = proposal.options.find((entry) => entry.id === input.optionId);
  const draft = state.draft;
  const job = domain.queueRequest(state, {
    request: `Réaliser le choix approuvé : ${proposal.topic}.\n${option.title}\n${option.consequences.join('\n')}\nRaison : ${input.reason || 'Choix explicite.'}\nPréserver les décisions actives et vérifier le résultat. La proposition visuelle ne constitue pas une implémentation.`,
    element: option.preview?.element || null,
  });
  state.draft = draft;
  return job;
}

const extensions = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'text/plain': 'txt',
  'text/markdown': 'md',
};

function authorized(request, token) {
  const supplied = Buffer.from(request.headers.authorization ?? ''),
    expected = Buffer.from('Bearer ' + token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function upload(store, input) {
  const extension = extensions[input.mime];
  if (
    !extension ||
    typeof input.base64 !== 'string' ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(input.base64)
  )
    throw new Error('Format de référence invalide.');
  const bytes = Buffer.from(input.base64, 'base64');
  if (!bytes.length || bytes.length > 8 * 1024 * 1024)
    throw new Error('Référence vide ou supérieure à 8 Mio.');
  const id = randomUUID(),
    file = `references/${id}.${extension}`;
  const reference = { id, name: input.name, file, mime: input.mime },
    target = safeFile(store.root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes, { flag: 'wx' });
  try {
    return {
      state: store.commit(input.version, (draft) => draft.references.push(reference)),
      reference,
    };
  } catch (error) {
    fs.rmSync(target);
    throw error;
  }
}

async function loadAnalysisModule(module) {
  try {
    return await import(module);
  } catch (error) {
    if (
      error.code === 'ERR_MODULE_NOT_FOUND' &&
      /Cannot find package 'typescript'/.test(error.message)
    )
      throw Object.assign(
        new Error(
          'Cette capacité nécessite TypeScript. Installez les dépendances du paquet DevMethod puis redémarrez le Studio.',
          { cause: error },
        ),
        { status: 503 },
      );
    throw error;
  }
}

function projectTools(store, editor) {
  let intelligence, quality;
  return {
    intelligence() {
      intelligence ??= loadAnalysisModule('./intelligence.mjs').then(
        ({ createProjectIntelligence }) => createProjectIntelligence({ store, editor }),
      );
      return intelligence;
    },
    quality() {
      quality ??= loadAnalysisModule('./quality.mjs');
      return quality;
    },
  };
}

async function projectQuality(context, revisionId) {
  const quality = await context.tools.quality();
  const intelligence = await context.tools.intelligence();
  // Quality must still show obsolete evidence when immutable source integrity fails.
  const report = quality.readProjectQuality(context.store, revisionId);
  try {
    const analysis = intelligence.read({ revisionId }).analysis;
    return quality.readProjectQuality(context.store, revisionId, analysis);
  } catch {
    report.limits.push(
      'Parcours indisponibles : l’intégrité ou l’analyse des sources doit être réexaminée.',
    );
    return report;
  }
}

async function getRoute(url, response, context) {
  const { store, runtime, editor } = context;
  const directReads = {
    '/api/state': () => store.read(),
    '/api/jobs/progress': () => context.jobs.progress(url.searchParams.get('jobId')),
  };
  if (directReads[url.pathname]) return send(response, 200, directReads[url.pathname]());
  if (url.pathname === '/api/project/model')
    return send(
      response,
      200,
      (await context.tools.intelligence()).read({
        revisionId: url.searchParams.get('revision'),
        baseRevisionId: url.searchParams.get('base'),
        draft: url.searchParams.get('draft') === '1',
      }),
    );
  if (url.pathname === '/api/project/checks') {
    const revisionId = url.searchParams.get('revision') || store.read().activeRevision;
    return send(response, 200, await projectQuality(context, revisionId));
  }
  if (url.pathname === '/api/editor')
    return send(response, 200, editor.read(url.searchParams.get('baseRevision')));
  if (url.pathname === '/api/source')
    return send(
      response,
      200,
      url.searchParams.get('scope') === 'runtime'
        ? readRuntimeSource(url.searchParams.get('path'))
        : readSource(
            store.root,
            store.read(),
            url.searchParams.get('revision'),
            url.searchParams.get('path'),
          ),
    );
  if (url.pathname === '/api/runtime/services') {
    const state = store.read();
    return send(response, 200, {
      ...(await getRuntimeServices(runtime())),
      project: readProjectServices(
        store.root,
        state,
        url.searchParams.get('revision') || state.activeRevision,
      ),
    });
  }
  if (url.pathname === '/api/runtime')
    return send(response, 200, { ...runtime(), token: undefined });
  if (url.pathname === '/api/export') {
    response.setHeader('Content-Disposition', 'attachment; filename="devmethod-project.tar"');
    return send(response, 200, exportProject(store.root, store.read()), 'application/x-tar');
  }
  if (url.pathname.startsWith('/references/')) {
    const reference = store.read().references.find((r) => r.id === url.pathname.slice(12));
    if (!reference) return send(response, 404, { error: 'Référence absente.' });
    return send(
      response,
      200,
      fs.readFileSync(safeFile(store.root, reference.file)),
      reference.mime,
    );
  }
  const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
  const file = relative.startsWith('studio-ui/')
    ? safeFile(widgetRoot, relative.slice('studio-ui/'.length))
    : safeFile(publicRoot, relative);
  response.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; font-src 'self' data:; img-src 'self' data:; frame-src http://127.0.0.1:*; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  );
  return send(response, 200, fs.readFileSync(file), mimeType(file));
}

async function postRoute(url, request, response, context) {
  const { store, jobs, runtime, wake, editor } = context,
    current = runtime();
  const worker = authorized(request, current.token);
  if (url.pathname === '/api/jobs/progress') {
    if (!worker)
      return send(response, 403, { error: 'Cette action appartient à l’agent connecté.' });
    return send(response, 200, jobs.reportProgress(await body(request, progressLimits.inputBytes)));
  }
  if (
    worker &&
    [
      '/api/project',
      '/api/proposals/approve',
      '/api/design/master/approve',
      '/api/design',
      '/api/approve',
      '/api/activate',
    ].includes(url.pathname)
  )
    return send(response, 403, {
      error: 'Le jeton agent ne peut pas enregistrer un accord attribué à la personne.',
    });
  if (!worker) sameOrigin(request, current.url);
  const input = await body(
    request,
    url.pathname.startsWith('/api/editor/') ? 40 * 1024 * 1024 : undefined,
  );
  const editorAction = {
    '/api/editor/save': 'save',
    '/api/editor/build': 'build',
    '/api/editor/apply': 'apply',
    '/api/editor/reset': 'reset',
  }[url.pathname];
  if (editorAction) {
    sameOrigin(request, current.url);
    return send(response, 200, await editor[editorAction](input));
  }
  if (url.pathname === '/api/project/checks/run') {
    sameOrigin(request, current.url);
    return send(
      response,
      200,
      await (
        await context.tools.quality()
      ).runProjectQuality(store, input.revisionId, input.checkId),
    );
  }
  const workerRoutes = {
    '/api/proposals/delegate-approval': () => {
      const approval = { ...input };
      delete approval.version;
      let job;
      const state = store.commit(input.version, (draft) => {
        job = approveAndPrepare(draft, approval, 'agent');
      });
      wake();
      return { state, ...(job ? { job } : {}) };
    },
    '/api/design/master/delegate-approval': () => {
      const approval = { ...input };
      delete approval.version;
      const state = store.commit(input.version, (draft) =>
        domain.approveDesignMaster(draft, approval, { actor: 'agent' }),
      );
      wake();
      return { state };
    },
    '/api/proposals': () => ({
      state: store.commit(input.version, (draft) => {
        const proposal = { ...input };
        delete proposal.version;
        domain.proposeDecision(draft, proposal, { actor: 'agent' });
      }),
    }),
    '/api/design/master': () => ({
      state: store.commit(input.version, (draft) => {
        const master = { ...input };
        delete master.version;
        domain.setDesignMaster(draft, master, { actor: 'agent' });
      }),
    }),
    '/api/design/screen': () => ({
      state: store.commit(input.version, (draft) => {
        const screen = { ...input };
        delete screen.version;
        domain.addDesignScreen(draft, screen, { actor: 'agent' });
      }),
    }),
    '/api/design/prototype': () => ({
      state: store.commit(input.version, (draft) => {
        const prototype = { ...input };
        delete prototype.version;
        domain.linkDesignPrototype(draft, prototype, { actor: 'agent' });
      }),
    }),
    '/api/jobs/claim': () => jobs.claim(input.worker),
    '/api/jobs/finish': () => jobs.finish(input),
    '/api/jobs/fail': () => ({ state: jobs.fail(input) }),
    '/api/checks': () => ({
      state: store.commit(store.read().version, (draft) => domain.recordCheck(draft, input)),
    }),
  };
  if (workerRoutes[url.pathname]) {
    if (!worker)
      return send(response, 403, { error: 'Cette action appartient à l’agent connecté.' });
    return send(response, 200, await workerRoutes[url.pathname]());
  }
  if (url.pathname === '/api/references') return send(response, 200, upload(store, input));
  const action = browserActions[url.pathname];
  if (!action) return send(response, 404, { error: 'Action inconnue.' });
  let result;
  const state = store.commit(input.version, (draft) => {
    const payload = { ...input };
    delete payload.version;
    result = action(draft, payload);
  });
  send(response, 200, { state, ...(url.pathname === '/api/requests' ? { job: result } : {}) });
  wake();
}

const listen = (server, port) =>
  new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
const closeServer = (server) =>
  new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  });

export async function startStudio({ workspace, port = 4330, previewPort = 0, agent = null }) {
  const packageRoot = fileURLToPath(new URL('../../', import.meta.url));
  if (path.resolve(workspace) === path.resolve(packageRoot))
    throw new Error('Choisissez un dossier dédié au produit, distinct du dépôt DevMethod.');
  const store = createStudioStore(workspace),
    jobs = createJobs(store),
    token = randomUUID();
  let url, previewOrigin, editorPreviewOrigin, comparisonPreviewOrigin, runner;
  let editor;
  const runtime = () => {
    const state = store.read(),
      approval = domain.planApprovalStatus(state);
    return {
      url,
      previewOrigin,
      editorPreviewOrigin,
      comparisonPreviewOrigin,
      token,
      workspace: store.root,
      agent: runner?.status() ?? { kind: 'host-bridge', automatic: false },
      delegation: domain.effectiveDelegation(state),
      approval,
      planApproved: approval.planApproved,
      capabilities: {
        staticApps: true,
        reactTypeScript: true,
        projectPreview:
          Boolean(state.activeRevision) &&
          state.revisions.find((revision) => revision.id === state.activeRevision)?.profile !==
            'source-only',
        localImport: true,
        connectorBridge: true,
        directConnectors: false,
        localData: true,
        auth: false,
        deployment: false,
      },
    };
  };
  let preview, editorPreview, comparisonPreview;
  try {
    editor = createEditor({ store, jobs, getPreviewOrigin: () => editorPreviewOrigin });
    preview = createPreview({
      workspace: store.root,
      getState: store.read,
      getStudioOrigin: () => url,
    });
    editorPreview = createPreview({
      workspace: editor.previewWorkspace,
      getState: editor.previewState,
      getStudioOrigin: () => url,
      revisionPrefix: 'builds',
      reportRuntimeErrors: true,
    });
    comparisonPreview = createPreview({
      workspace: store.root,
      getState: store.read,
      getStudioOrigin: () => url,
      readOnlyData: true,
    });
  } catch (error) {
    await Promise.all([preview, editorPreview, comparisonPreview].filter(Boolean).map(closeServer));
    store.close();
    throw error;
  }
  const context = {
    store,
    jobs,
    runtime,
    editor,
    tools: projectTools(store, editor),
    wake: () => runner?.wake(),
  };
  const server = http.createServer(async (request, response) => {
    try {
      if (request.headers.host !== new URL(url).host)
        return send(response, 403, { error: 'Hôte non autorisé.' });
      const requestUrl = new URL(request.url, url);
      if (request.method === 'GET' && readConnectorsRoute(requestUrl, response, store)) return;
      if (
        request.method === 'POST' &&
        (await writeConnectorsRoute(
          requestUrl,
          request,
          response,
          context,
          authorized(request, runtime().token),
        ))
      )
        return;
      if (request.method === 'GET') return await getRoute(requestUrl, response, context);
      if (request.method === 'POST') return await postRoute(requestUrl, request, response, context);
      send(response, 405, { error: 'Méthode non autorisée.' });
    } catch (error) {
      errorResponse(response, error);
    }
  });
  try {
    await listen(preview, previewPort);
    previewOrigin = 'http://127.0.0.1:' + preview.address().port;
    await listen(editorPreview, 0);
    editorPreviewOrigin = 'http://127.0.0.1:' + editorPreview.address().port;
    await listen(comparisonPreview, 0);
    comparisonPreviewOrigin = 'http://127.0.0.1:' + comparisonPreview.address().port;
    await listen(server, port);
    url = 'http://127.0.0.1:' + server.address().port;
    if (agent) {
      const { createAgentRunner } = await import('./runner.mjs');
      runner = createAgentRunner({ store, jobs, options: agent });
    }
    atomicJSON(safeFile(store.root, '.devmethod/runtime.json'), runtime());
    runner?.wake();
  } catch (error) {
    await Promise.all([server, preview, editorPreview, comparisonPreview].map(closeServer));
    store.close();
    throw error;
  }
  return {
    store,
    jobs,
    runtime,
    async close() {
      await runner?.close();
      await Promise.all([server, preview, editorPreview, comparisonPreview].map(closeServer));
      fs.rmSync(safeFile(store.root, '.devmethod/runtime.json'), { force: true });
      store.close();
    },
  };
}
