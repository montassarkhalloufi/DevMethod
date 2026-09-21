import { digest, fileManifest, safeFile } from './files.mjs';
import { readSource } from './source.mjs';
import { analyzeSnapshot, protocol } from './intelligence/model.mjs';
import { projectImpact } from './intelligence/impact.mjs';

const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

function verifiedSources(store, state, revisionId) {
  const revision = state.revisions.find((entry) => entry.id === revisionId);
  if (!revision) fail('Version du projet absente.', 404);
  const actual = fileManifest(safeFile(store.root, `revisions/${revision.id}/app`));
  if (JSON.stringify(actual) !== JSON.stringify(revision.files))
    fail('Intégrité de la version du projet invalide : son manifeste a changé.', 409);
  return revision.files.map((file) => readSource(store.root, state, revision.id, file.path));
}

function fingerprint(sources) {
  return digest(
    JSON.stringify({
      protocol,
      files: [...sources]
        .sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0))
        .map(({ path, sha256, bytes }) => ({ path, sha256, bytes })),
    }),
  );
}

function immutableSnapshot(store, state, revisionId) {
  const sources = verifiedSources(store, state, revisionId);
  return {
    revisionId,
    baseRevisionId: revisionId,
    sources,
    fingerprint: fingerprint(sources),
    localChanges: false,
  };
}

function draftSnapshot(editor, revisionId) {
  if (!editor) fail('Brouillon éditeur indisponible.', 404);
  const draft = editor.read(null);
  if (draft.baseRevision !== revisionId)
    fail('Le brouillon enregistré appartient à une autre version.', 409);
  for (const file of draft.files) {
    if (
      file.content !== null &&
      !file.truncated &&
      (digest(Buffer.from(file.content)) !== file.sha256 ||
        Buffer.byteLength(file.content) !== file.bytes)
    )
      fail('Intégrité du brouillon invalide.', 409);
  }
  const hash = fingerprint(draft.files);
  return {
    revisionId: `draft:${revisionId}:${draft.version}:${hash.slice(0, 12)}`,
    baseRevisionId: revisionId,
    sources: draft.files,
    fingerprint: hash,
    localChanges: Boolean(draft.changedPaths?.length),
    draft: true,
  };
}

/**
 * Read-only project analysis. read({revisionId?, baseRevisionId?, draft?}) returns
 * ProjectIntelligence. revisionId defaults to the active project revision.
 * draft=true reads an existing persisted editor draft only; no draft is created.
 * Its synthetic revisionId isolates its evidence from the immutable base.
 * Source bytes and the complete manifest are verified before every cache lookup.
 * The cache contains at most eight AST snapshots and never executes project tools.
 */
export function createProjectIntelligence({ store, editor, cacheSize = 8 }) {
  const cache = new Map(),
    maximum = Math.max(1, Math.min(8, cacheSize));
  const analyze = (snapshot) => {
    const key = snapshot.revisionId + ':' + snapshot.fingerprint;
    if (cache.has(key)) {
      const value = cache.get(key);
      cache.delete(key);
      cache.set(key, value);
      return value;
    }
    const result = analyzeSnapshot(snapshot);
    cache.set(key, result);
    if (cache.size > maximum) cache.delete(cache.keys().next().value);
    return result;
  };
  return {
    /** @returns {import('../../studio-ui/src/features/project/model/contracts').ProjectIntelligence} */
    read({ revisionId, baseRevisionId, draft = false } = {}) {
      const state = store.read(),
        id = revisionId || state.activeRevision;
      if (!id) fail('Aucune version du projet à analyser.', 404);
      const immutable = immutableSnapshot(store, state, id);
      const analysis = analyze(draft ? draftSnapshot(editor, id) : immutable);
      const base = baseRevisionId || (draft ? id : null);
      const previous = base
        ? analyze(base === id ? immutable : immutableSnapshot(store, state, base))
        : null;
      return structuredClone({
        analysis,
        previous,
        impact: projectImpact(analysis, previous, state.checks),
      });
    },
  };
}
