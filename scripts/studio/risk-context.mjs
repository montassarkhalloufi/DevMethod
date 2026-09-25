import { digest, fileManifest, safeFile } from './files.mjs';
import { readSource } from './source.mjs';
import { profileChanges } from './risk-profile.mjs';

export const riskProtocol = 'hybrid-risk-1';

function sources(store, state, revision, remaining, limits) {
  if (!revision) return [];
  const actual = fileManifest(safeFile(store.root, `revisions/${revision.id}/app`));
  if (JSON.stringify(actual) !== JSON.stringify(revision.files))
    throw new Error('Intégrité des sources invalide ; aucune analyse transmise.');
  return revision.files.map((file) => {
    const source = readSource(store.root, state, revision.id, file.path);
    const omit = source.binary || source.truncated || source.bytes > remaining.bytes;
    if (omit)
      limits.push(`${file.path} (${revision.id}) : contenu omis, binaire ou limite de contexte.`);
    else remaining.bytes -= source.bytes;
    return { path: file.path, sha256: file.sha256, content: omit ? null : source.content };
  });
}

export function buildRiskContext(store, revisionId) {
  const state = store.read(),
    revision = state.revisions.find((item) => item.id === revisionId);
  if (!revision) throw new Error('Version inconnue pour l’analyse.');
  const job = state.jobs.find((item) => item.id === revision.jobId);
  const base = state.revisions.find((item) => item.id === job?.baseRevision);
  const limits = [],
    remaining = { bytes: 96000 };
  const after = sources(store, state, revision, remaining, limits);
  const before = sources(store, state, base, remaining, limits);
  const paths = [...new Set([...before, ...after].map((file) => file.path))];
  const changes = paths.flatMap((name) => {
    const old = before.find((file) => file.path === name),
      current = after.find((file) => file.path === name);
    return old?.sha256 === current?.sha256
      ? []
      : [{ path: name, before: old?.content ?? null, after: current?.content ?? null }];
  });
  const profile = profileChanges(changes);
  const context = {
    protocol: riskProtocol,
    revisionId,
    baseRevisionId: base?.id ?? null,
    intention: state.brief.outcome || state.project.idea,
    criteria: state.brief.criteria,
    decisions: state.decisions
      .filter((item) => item.status !== 'superseded')
      .map(({ topic, choice, reason }) => ({ topic, choice, reason })),
    before,
    after,
    changedFiles: changes.map((change) => change.path),
    profile,
    limits,
  };
  if (Buffer.byteLength(JSON.stringify(context)) > 160000)
    throw new Error('Contexte trop volumineux : réduire la tranche avant l’analyse.');
  return { ...context, contextKey: digest(JSON.stringify(context)) };
}
