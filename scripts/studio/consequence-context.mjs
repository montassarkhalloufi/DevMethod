import fs from 'node:fs';
import { digest, safeFile } from './files.mjs';
import { qualitySnapshot } from './quality-storage.mjs';
import { readBrowserConfiguration } from './browser-configuration.mjs';
import { readProjectConnectors } from './connectors.mjs';
import { readMcpSelection } from './mcp-selection.mjs';
import { effectiveDelegation, planApprovalKey } from './domain.mjs';

const protocol = 'studio-consequences-v1';
const maxDataBytes = 8 * 1024 * 1024;
const limits = [
  'Signaux textuels positifs uniquement ; commentaires et chaînes peuvent produire des faux positifs.',
  'L’absence de signal ne prouve ni absence de persistance ni compatibilité des contrats, notamment pour source-only et les fichiers non textuels.',
  'Contrats : fetch, routes/endpoints et exports dans les fichiers ajoutés, modifiés ou supprimés ; aucune analyse exhaustive ni exécution.',
  'Sources limitées par qualitySnapshot ; données limitées à 8 Mio et signaux à 200 entrées. Aucune valeur de données n’est exposée.',
];

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  return value;
}

const fingerprint = (value) => digest(JSON.stringify(stable(value)));

function readData(store) {
  let bytes = 0,
    hash = null;
  try {
    const file = safeFile(store.root, '.devmethod/data.json');
    if (!fs.existsSync(file))
      return {
        summary: { status: 'missing', version: null, nonEmpty: null, bytes },
        hash,
        issue: null,
      };
    const stat = fs.lstatSync(file);
    bytes = stat.size;
    if (!stat.isFile() || bytes > maxDataBytes) throw new Error('bounded');
    const content = fs.readFileSync(file);
    bytes = content.length;
    if (bytes > maxDataBytes) throw new Error('bounded');
    hash = digest(content);
    const value = JSON.parse(content.toString('utf8'));
    if (
      !Number.isSafeInteger(value?.version) ||
      value.version < 1 ||
      !value.data ||
      typeof value.data !== 'object' ||
      Array.isArray(value.data)
    )
      throw new Error('invalid');
    return {
      summary: {
        status: 'available',
        version: value.version,
        nonEmpty: Object.keys(value.data).length > 0,
        bytes,
      },
      hash,
      issue: null,
    };
  } catch {
    return {
      summary: { status: 'unavailable', version: null, nonEmpty: null, bytes },
      hash,
      issue: 'Données locales indisponibles ou hors limites ; conséquences inconnues.',
    };
  }
}

function snapshot(store, state, id) {
  const revision = state.revisions.find((item) => item.id === id);
  return revision
    ? qualitySnapshot(store, revision)
    : { fingerprint: null, sources: [], issue: 'Version ou base introuvable.' };
}

function changesBetween(candidate, base) {
  const current = new Map(
    (candidate?.revision?.files ?? []).map((entry) => [entry.path, entry.sha256]),
  );
  const previous = new Map(
    (base?.revision?.files ?? []).map((entry) => [entry.path, entry.sha256]),
  );
  return [...new Set([...current.keys(), ...previous.keys()])].sort().flatMap((path) => {
    if (current.get(path) === previous.get(path)) return [];
    return [
      { path, kind: !current.has(path) ? 'removed' : previous.has(path) ? 'modified' : 'added' },
    ];
  });
}

function* sourceSignals(source, changed) {
  let start = 0,
    lineNumber = 1;
  while (start < source.content.length) {
    const newline = source.content.indexOf('\n', start);
    const end = newline < 0 ? source.content.length : newline;
    const line = source.content.slice(start, end);
    if (/\/api\/data\b|\blocalStorage\b|\bindexedDB\b/.test(line))
      yield { kind: 'persistent-data', path: source.path, line: lineNumber };
    if (
      changed &&
      /\bfetch\s*\(|\b(?:endpoint|routes?)\b|\bexport\s+(?:default|type|interface|function|const|class|\{)/i.test(
        line,
      )
    )
      yield { kind: 'contract-changed', path: source.path, line: lineNumber };
    start = end + 1;
    lineNumber++;
  }
}

function signalsFrom(candidate, base, changes) {
  const changed = new Set(changes.map((entry) => entry.path)),
    signals = new Map();
  let truncated = false;
  scan: for (const source of [...(candidate.sources ?? []), ...(base?.sources ?? [])]) {
    for (const entry of sourceSignals(source, changed.has(source.path))) {
      const key = JSON.stringify(entry);
      if (signals.has(key)) continue;
      if (signals.size === 200) {
        truncated = true;
        break scan;
      }
      signals.set(key, entry);
    }
  }
  return {
    truncated,
    entries: [...signals.values()].sort(
      (a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.kind.localeCompare(b.kind),
    ),
  };
}

function configuration(store, revisionId) {
  try {
    return {
      hash: fingerprint({
        browser: readBrowserConfiguration(store),
        connectors: readProjectConnectors(store, revisionId),
        selection: readMcpSelection(store),
      }),
      issue: null,
    };
  } catch {
    return { hash: null, issue: 'Configuration locale illisible ; conséquences à réévaluer.' };
  }
}

/** Local observation only. A stable context is not a compatibility or safety verdict. */
export function readConsequenceContext(
  store,
  state,
  revisionId,
  { evidence = [], tools = {} } = {},
) {
  const candidate = snapshot(store, state, revisionId);
  const job = state.jobs.find((item) => item.id === candidate.revision?.jobId);
  const baseRevisionId = job?.baseRevision ?? null;
  const base = baseRevisionId ? snapshot(store, state, baseRevisionId) : null;
  const data = readData(store),
    config = configuration(store, revisionId);
  const changes = changesBetween(candidate, base),
    allSignals = signalsFrom(candidate, base, changes);
  let workspace = null,
    workspaceIssue = null;
  try {
    workspace = digest(fs.realpathSync(store.root));
  } catch {
    workspaceIssue = 'Workspace indisponible.';
  }
  const issues = [
    candidate.issue,
    base?.issue,
    data.issue,
    config.issue,
    workspaceIssue,
    allSignals.truncated
      ? 'Liste de signaux tronquée ; examen incomplet, conséquences à réévaluer.'
      : null,
  ].filter(Boolean);
  const result = {
    protocol,
    revisionId,
    baseRevisionId,
    fingerprint: candidate.fingerprint,
    baseFingerprint: base?.fingerprint ?? null,
    changes,
    signals: allSignals.entries,
    data: data.summary,
    issue: issues.length ? issues.join(' ') : null,
    limits: [
      ...limits,
      ...(allSignals.truncated
        ? ['Liste de signaux tronquée ; inspection complémentaire requise.']
        : []),
    ],
  };
  return {
    ...result,
    contextFingerprint: fingerprint({
      ...result,
      workspace,
      dataHash: data.hash,
      configuration: config.hash,
      criteria: state.brief?.criteria ?? [],
      project: state.project,
      planApprovalKey: planApprovalKey(state),
      delegation: effectiveDelegation(state),
      activeRevision: state.activeRevision === revisionId ? baseRevisionId : state.activeRevision,
      evidence,
      tools,
    }),
  };
}
