import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { atomicJSON, safeFile, fileManifest, copyFiles, digest } from './files.mjs';
import { readSource } from './source.mjs';
import * as domain from './domain.mjs';
import { checkJavaScript } from './verify.mjs';

const maxText = 256 * 1024;
const verificationProtocol = 'node-stdin-v1';
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const diagnostic = (severity, file, message, direction) => ({ severity, file, message, direction });

function revisionSource(store, id) {
  const state = store.read(),
    revision = state.revisions.find((r) => r.id === id);
  if (!revision) fail('Version de départ absente.', 404);
  const root = safeFile(store.root, `revisions/${id}/app`);
  if (JSON.stringify(fileManifest(root)) !== JSON.stringify(revision.files))
    fail('Le manifeste de la version de départ a changé. Aucun brouillon remplacé.');
  return { state, revision, root };
}

function draftFiles(store, draft) {
  const { state, revision } = revisionSource(store, draft.baseRevision);
  const files = new Map(
    revision.files.map((f) => {
      const source = readSource(store.root, state, revision.id, f.path);
      return [
        f.path,
        {
          ...source,
          editable: !source.binary && !source.truncated,
          content: source.truncated ? null : source.content,
        },
      ];
    }),
  );
  for (const change of draft.changes) {
    if (change.content === null) files.delete(change.path);
    else
      files.set(change.path, {
        path: change.path,
        content: change.content,
        editable: true,
        binary: false,
        truncated: false,
        bytes: Buffer.byteLength(change.content),
        sha256: digest(Buffer.from(change.content)),
      });
  }
  return [...files.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function mergeChanges(store, draft, changes) {
  if (!Array.isArray(changes) || changes.length > 256)
    fail('Une liste de 256 modifications maximum est requise.');
  const next = new Map(draft.changes.map((c) => [c.path, c])),
    seen = new Set();
  for (const change of changes) {
    safeFile(store.root, change.path);
    if (seen.has(change.path)) fail('Un fichier est fourni plusieurs fois.');
    seen.add(change.path);
    if (
      change.content !== null &&
      (typeof change.content !== 'string' || Buffer.byteLength(change.content) > maxText)
    )
      fail('Un fichier texte doit contenir au maximum 256 Kio.');
    next.set(change.path, { path: change.path, content: change.content });
  }
  const base = revisionSource(store, draft.baseRevision).revision.files;
  return [...next.values()]
    .filter((c) => {
      const original = base.find((f) => f.path === c.path);
      return c.content === null
        ? Boolean(original)
        : digest(Buffer.from(c.content)) !== original?.sha256;
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function writeChanges(root, changes) {
  for (const change of changes) {
    const target = safeFile(root, change.path);
    if (change.content === null) fs.rmSync(target, { force: true });
    else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, change.content);
    }
  }
}

function referenceWarnings(content, file, paths) {
  const expressions = /\b(?:src|href)\s*=\s*["']([^"']+)["']|\b(?:from|import)\s*["']([^"']+)["']/g;
  const warnings = [];
  for (const match of content.matchAll(expressions)) {
    const value = match[1] ?? match[2];
    if (/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(value) || value.startsWith('/api/')) continue;
    if (match[2] && !value.startsWith('.') && !value.startsWith('/')) {
      warnings.push(
        diagnostic(
          'warning',
          file,
          `Import de package non résolu par cet éditeur : ${value}`,
          'Heuristique : vérifier une éventuelle import map ; aucun bundler ni installation de dépendances exécuté.',
        ),
      );
      continue;
    }
    const relative = path.posix.normalize(
      path.posix.join(
        value.startsWith('/') ? '' : path.posix.dirname(file),
        value.replace(/^\//, '').split(/[?#]/)[0],
      ),
    );
    if (!paths.has(relative))
      warnings.push(
        diagnostic(
          'warning',
          file,
          `Référence locale possiblement absente : ${value}`,
          'Heuristique : vérifier cette ressource dans l’aperçu ; routes dynamiques et commentaires non interprétés.',
        ),
      );
  }
  return warnings;
}

function inspectJSON(target, file) {
  try {
    JSON.parse(fs.readFileSync(target, 'utf8'));
    return [];
  } catch (error) {
    return [diagnostic('error', file, error.message, 'Corriger le JSON.')];
  }
}

async function inspectBuild(root, files) {
  const diagnostics = [],
    deadline = Date.now() + 10000,
    paths = new Set(files.map((f) => f.path));
  if (!paths.has('index.html'))
    diagnostics.push(
      diagnostic(
        'error',
        'index.html',
        'index.html est requis.',
        'Ajouter le point d’entrée de l’application.',
      ),
    );
  for (const file of files) {
    if (Date.now() >= deadline) {
      diagnostics.push(
        diagnostic(
          'error',
          file.path,
          'Vérification interrompue après 10 secondes.',
          'Aucune adoption : les fichiers restants n’ont pas été vérifiés.',
        ),
      );
      break;
    }
    const target = safeFile(root, file.path);
    if (/\.(?:m?js|cjs)$/.test(file.path)) {
      const result = await checkJavaScript(target, deadline - Date.now());
      if (result.code !== 0)
        diagnostics.push({
          ...diagnostic(
            'error',
            file.path,
            result.output.replaceAll(root, 'app').trim() || 'Syntaxe JavaScript invalide.',
            'Corriger puis vérifier à nouveau. Aucun code applicatif exécuté.',
          ),
          line: result.line,
        });
    }
    if (/\.json$/.test(file.path)) diagnostics.push(...inspectJSON(target, file.path));
    if (/\.(?:html|m?js)$/.test(file.path) && file.bytes <= maxText)
      diagnostics.push(...referenceWarnings(fs.readFileSync(target, 'utf8'), file.path, paths));
  }
  diagnostics.push(
    diagnostic(
      'info',
      '',
      'Syntaxe JS et JSON uniquement ; aucun test métier, contrôle CSS, JavaScript inline, compilation TypeScript ni installation exécuté.',
      'Essayer l’aperçu et revoir les critères avant adoption ; les avertissements de références sont heuristiques.',
    ),
  );
  return diagnostics;
}

export function createEditor({ store, jobs, getPreviewOrigin = () => null }) {
  const file = safeFile(store.root, '.devmethod/editor.json');
  const previewWorkspace = safeFile(store.root, '.devmethod/editor-preview');
  fs.mkdirSync(previewWorkspace, { recursive: true });
  let busy = false;

  function load() {
    safeFile(store.root, '.devmethod/editor.json');
    if (!fs.existsSync(file)) return null;
    if (fs.statSync(file).size > 40 * 1024 * 1024)
      fail('Brouillon trop volumineux ; conservé sans remplacement.');
    const draft = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (
      draft.format !== 1 ||
      !Number.isSafeInteger(draft.version) ||
      !Array.isArray(draft.changes) ||
      !Array.isArray(draft.builds)
    )
      fail('Brouillon illisible ; conservé sans remplacement.');
    return draft;
  }

  function assertIdle() {
    if (busy) fail('Une vérification est en cours. Conservez votre saisie et réessayez.', 409);
  }

  function current(input) {
    assertIdle();
    const draft = load();
    if (!draft || draft.version !== input.version || draft.baseRevision !== input.baseRevision)
      fail('Le brouillon a changé. Votre saisie doit être conservée avant rechargement.', 409);
    if (store.read().activeRevision !== draft.baseRevision)
      fail(
        'La version active a changé. Le brouillon est conservé ; comparez avant de repartir.',
        409,
      );
    return draft;
  }

  function view(draft) {
    const previewPath = draft.buildId ? `/builds/${draft.buildId}/` : null;
    return {
      ...draft,
      builtVersion: draft.verificationProtocol === verificationProtocol ? draft.builtVersion : null,
      builds: undefined,
      changes: undefined,
      files: draftFiles(store, draft),
      previewPath,
      previewUrl: previewPath && getPreviewOrigin() ? getPreviewOrigin() + previewPath : null,
      changedPaths: draft.changes.map((c) => c.path),
      criteriaToReview: store.read().brief.criteria,
      limits: [
        'Données d’essai isolées et conservées entre aperçus.',
        'Contrôles statiques seulement ; la fidélité au besoin reste à examiner.',
      ],
    };
  }

  function fresh(baseRevision, version = 1) {
    revisionSource(store, baseRevision);
    if (store.read().activeRevision !== baseRevision)
      fail('Choisissez la version active pour démarrer une édition.', 409);
    return {
      format: 1,
      version,
      baseRevision,
      changes: [],
      diagnostics: [],
      buildId: null,
      builtVersion: null,
      builds: [],
    };
  }

  function read(baseRevision) {
    let draft = load();
    if (!baseRevision) {
      if (!draft) fail('Aucun brouillon enregistré.', 404);
      return view(draft);
    }
    if (!draft) {
      assertIdle();
      draft = fresh(baseRevision);
      atomicJSON(file, draft);
    }
    if (draft.baseRevision !== baseRevision)
      fail(
        'Un brouillon d’une autre version existe. Exportez votre saisie avant une réinitialisation explicite.',
        409,
      );
    return view(draft);
  }

  function save(input) {
    const draft = current(input),
      next = {
        ...draft,
        version: draft.version + 1,
        changes: mergeChanges(store, draft, input.changes),
        diagnostics: [],
      };
    const files = draftFiles(store, next);
    if (files.length > 256 || files.reduce((n, f) => n + f.bytes, 0) > 32 * 1024 * 1024)
      fail('Le projet dépasse 256 fichiers ou 32 Mio.');
    if (Buffer.byteLength(JSON.stringify(next)) > 40 * 1024 * 1024)
      fail('Le brouillon sérialisé dépasse 40 Mio ; aucune modification enregistrée.');
    atomicJSON(file, next);
    return view(next);
  }

  function cloneData() {
    const destination = safeFile(previewWorkspace, '.devmethod/data.json');
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const source = safeFile(store.root, '.devmethod/data.json');
    const data = fs.existsSync(source)
      ? JSON.parse(fs.readFileSync(source, 'utf8'))
      : { version: 1, data: {} };
    atomicJSON(destination, data);
  }

  async function build(input) {
    const draft = current(input),
      source = revisionSource(store, draft.baseRevision),
      id = randomUUID();
    const target = safeFile(previewWorkspace, `revisions/${id}/app`);
    busy = true;
    let retained = false;
    try {
      copyFiles(source.root, target, source.revision.files);
      writeChanges(target, draft.changes);
      const files = fileManifest(target),
        diagnostics = await inspectBuild(target, files);
      if (store.read().activeRevision !== draft.baseRevision)
        fail('La base a changé pendant la vérification ; brouillon conservé.', 409);
      const next = { ...draft, diagnostics };
      if (!diagnostics.some((d) => d.severity === 'error')) {
        if (!draft.builds.length) cloneData();
        next.buildId = id;
        next.builtVersion = draft.version;
        next.verificationProtocol = verificationProtocol;
        next.builds = [...draft.builds, { id, files }];
        retained = true;
      }
      atomicJSON(file, next);
      return view(next);
    } finally {
      busy = false;
      if (!retained) fs.rmSync(path.dirname(target), { recursive: true, force: true });
    }
  }

  function adoption(result, draft) {
    let adoptionError = null;
    try {
      result.state = store.commit(store.read().version, (state) => {
        domain.recordCheck(state, {
          revisionId: result.revision.id,
          label: 'Édition : syntaxe JavaScript et JSON — comportement non évalué',
          status: 'passed',
          kind: 'command',
          command:
            'node --input-type=module --check (stdin: octets exacts de chaque .js/.mjs) ; node --input-type=commonjs --check (stdin: octets exacts de chaque .cjs) ; borne globale 10s ; JSON.parse (fichiers JSON)',
          output: JSON.stringify(draft.diagnostics).slice(0, 16000),
        });
        domain.activateRevision(state, {
          id: result.revision.id,
          reason: 'Adoption explicite du build vérifié dans l’éditeur.',
        });
      });
    } catch (error) {
      adoptionError = error.message;
      result.state = store.read();
    }
    return {
      ...result,
      activated: result.state.activeRevision === result.revision.id,
      adoptionError,
    };
  }

  function apply(input) {
    const draft = current(input),
      state = store.read();
    if (!domain.hasApprovedPlan(state))
      fail('Les choix réservés doivent être approuvés avant adoption du code.', 409);
    if (state.jobs.some((j) => j.status === 'queued' || j.status === 'running'))
      fail('Terminez ou annulez la demande en cours avant adoption manuelle.', 409);
    if (draft.verificationProtocol !== verificationProtocol)
      fail(
        'Ce build précède le vérificateur corrigé. Vérifiez le brouillon à nouveau avant adoption.',
        409,
      );
    if (
      draft.builtVersion !== draft.version ||
      !draft.buildId ||
      !draft.changes.length ||
      draft.diagnostics.some((d) => d.severity === 'error')
    )
      fail('Vérifiez les modifications courantes avant adoption.', 409);
    if (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 200)
      fail('Titre requis, limité à 200 caractères.');
    const build = draft.builds.find((b) => b.id === draft.buildId),
      source = safeFile(previewWorkspace, `revisions/${build.id}/app`);
    if (JSON.stringify(fileManifest(source)) !== JSON.stringify(build.files))
      fail('Le build a changé ; adoption refusée.');
    store.commit(state.version, (s) => {
      const conversationDraft = s.draft;
      domain.queueRequest(s, { request: `Édition manuelle ${build.id} : ${input.title}` });
      s.draft = conversationDraft;
    });
    const claim = jobs.claim('user-editor');
    let result;
    try {
      fs.rmSync(claim.workDirectory, { recursive: true, force: true });
      copyFiles(source, claim.workDirectory, build.files);
      result = jobs.finish({
        jobId: claim.job.id,
        title: input.title,
        summary: `Édition utilisateur ; ${draft.changes.length} fichier(s) modifié(s). Contrôles statiques uniquement.`,
      });
    } catch (error) {
      jobs.fail({ jobId: claim.job.id, error: error.message });
      throw error;
    }
    result = adoption(result, draft);
    const next = {
      ...draft,
      version: draft.version + 1,
      baseRevision: result.revision.id,
      changes: [],
      builtVersion: draft.version + 1,
    };
    try {
      atomicJSON(file, next);
      result.draft = view(next);
    } catch (error) {
      result.draft = view(draft);
      result.adoptionError = [
        result.adoptionError,
        `Version créée ; brouillon non réconcilié : ${error.message}`,
      ]
        .filter(Boolean)
        .join(' ');
    }
    return result;
  }

  function reset(input) {
    assertIdle();
    const previous = load();
    if (!previous || previous.version !== input.version)
      fail('Le brouillon a changé ; réinitialisation refusée.', 409);
    const next = fresh(input.baseRevision, previous.version + 1);
    atomicJSON(file, next);
    return view(next);
  }

  return {
    read,
    save,
    build,
    apply,
    reset,
    previewWorkspace,
    previewState: () => {
      const draft = load();
      return { activeRevision: draft?.buildId ?? null, revisions: draft?.builds ?? [] };
    },
  };
}
