import { readNormalizedQualityRuns } from './quality-evidence.mjs';
import { qualitySnapshot } from './quality-storage.mjs';
import { readBrowserScenarios } from './browser-scenarios.mjs';
import {
  browserReviewProblem,
  coverageBindings,
  projectBrowserCoverage,
  scenarioCanCover,
} from './business-coverage.mjs';
import { coverageDigest } from './coverage-record.mjs';
import { recordCoverageDecision } from './domain.mjs';

const reject = (message, status = 409) => {
  throw Object.assign(new Error(message), { status });
};

function context(store, { revisionId, receiptId }) {
  const state = store.read();
  const revision = state.revisions.find((item) => item.id === revisionId);
  if (!revision) reject('Version inconnue.', 404);
  const snapshot = qualitySnapshot(store, revision);
  const run = readNormalizedQualityRuns(store, revision, snapshot).find(
    (item) => item.id === receiptId && item.revisionId === revisionId,
  );
  if (!run) reject('Reçu inconnu pour cette version.', 404);
  let manifest = null;
  try {
    manifest = readBrowserScenarios(snapshot);
  } catch {
    /* Retain the assessment as stale. */
  }
  const reason = browserReviewProblem(state, run, manifest);
  return { state, revision, snapshot, run, manifest, reason };
}

function reviewView({ state, revision, snapshot, run, manifest, reason }) {
  const reviews = projectBrowserCoverage(state, run, manifest);
  return {
    version: state.version,
    revision: { id: revision.id, title: revision.title },
    receipt: {
      id: run.id,
      status: run.status,
      freshness: run.freshness,
      protocol: run.browser?.protocol ?? null,
      driverVersion: run.browser?.driverVersion ?? null,
      browserVersion: run.browser?.browserVersion ?? null,
    },
    reviewKey: coverageDigest({
      version: state.version,
      revision,
      issue: snapshot.issue,
      run,
      manifest,
      criteria: state.brief.criteria,
      reviews,
    }),
    canReview: reason === null,
    reason,
    criteria: state.brief.criteria,
    scenarios: (manifest?.scenarios ?? []).map((scenario) => {
      const recorded = run.browser?.scenarios?.find((item) => item.id === scenario.id);
      return {
        ...scenario,
        status: recorded?.status ?? 'not-run',
        executedSteps: recorded?.executedSteps ?? 0,
        assertions: recorded?.assertions ?? [],
        canCover: reason === null && scenarioCanCover(run, scenario),
      };
    }),
    reviews,
    limits: [
      ...run.limits,
      'L’appréciation porte sur le critère et les scénarios sélectionnés, dans le périmètre indiqué. Elle ne prouve pas une couverture exhaustive.',
      'Les valeurs affichées sont celles du manifeste ; {{nonce}} représente une valeur synthétique propre à chaque exécution.',
      'Enregistrer ne relance aucun agent et n’adopte aucune version.',
    ],
  };
}

export function readCoverageReview(store, input) {
  return reviewView(context(store, input));
}

function validateInput(input) {
  const fields = [
    'version',
    'revisionId',
    'receiptId',
    'reviewKey',
    'criterionId',
    'scenarioIds',
    'conclusion',
    'scope',
    'reason',
  ];
  const identifier = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !fields.includes(key)) ||
    !Number.isSafeInteger(input.version) ||
    input.version < 1 ||
    !['revisionId', 'receiptId', 'criterionId'].every((key) => identifier(input[key])) ||
    typeof input.reviewKey !== 'string' ||
    !/^[a-f0-9]{64}$/.test(input.reviewKey)
  )
    reject('Demande d’appréciation invalide.', 400);
  if (
    !Array.isArray(input.scenarioIds) ||
    input.scenarioIds.length < 1 ||
    input.scenarioIds.length > 6 ||
    !input.scenarioIds.every(identifier) ||
    new Set(input.scenarioIds).size !== input.scenarioIds.length ||
    !['sufficient', 'partial', 'irrelevant'].includes(input.conclusion)
  )
    reject('Sélection de couverture invalide.', 400);
  for (const [key, max] of [
    ['scope', 2000],
    ['reason', 4000],
  ])
    if (typeof input[key] !== 'string' || !input[key].trim() || input[key].length > max)
      reject('Périmètre et justification explicites requis.', 400);
}

export function recordCoverageReview(store, input) {
  validateInput(input);
  const current = context(store, input),
    view = reviewView(current);
  if (view.version !== input.version || view.reviewKey !== input.reviewKey)
    reject('L’examen a changé ; actualisez les preuves puis confirmez de nouveau.');
  if (!view.canReview) reject(view.reason);
  const criterion = view.criteria.find((item) => item.id === input.criterionId);
  const scenarios = input.scenarioIds.map((id) => view.scenarios.find((item) => item.id === id));
  if (!criterion || scenarios.some((item) => !item)) reject('Critère ou scénario inconnu.', 400);
  if (input.conclusion === 'sufficient' && scenarios.some((item) => !item.canCover))
    reject(
      'Des assertions locales réussies et complètes sont requises pour une couverture suffisante.',
    );
  const coverage = {
    schemaVersion: 1,
    ...coverageBindings(current.state, current.run, current.manifest),
    criterion: { ...criterion },
    scenarioIds: [...input.scenarioIds],
    conclusion: input.conclusion,
    scope: input.scope.trim(),
    reviewKey: view.reviewKey,
    createdAt: new Date().toISOString(),
  };
  let decision;
  const state = store.commit(input.version, (draft) => {
    decision = recordCoverageDecision(draft, { coverage, reason: input.reason.trim() });
  });
  return { state, decision };
}
