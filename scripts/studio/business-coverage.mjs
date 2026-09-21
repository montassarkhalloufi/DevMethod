import { browserProtocol } from './browser-scenarios.mjs';
import { businessCriteriaFingerprint } from './quality-criteria.mjs';
import { coverageReceiptFingerprint, coverageTopic } from './coverage-record.mjs';

export function coverageBindings(state, run, manifest) {
  return {
    revisionId: run.revisionId,
    fingerprint: run.fingerprint,
    receiptId: run.id,
    receiptFingerprint: coverageReceiptFingerprint(run),
    manifestFingerprint: manifest.manifestFingerprint,
    criteriaFingerprint: businessCriteriaFingerprint(state),
    protocol: run.browser.protocol,
    driverVersion: run.browser.driverVersion,
    browserVersion: run.browser.browserVersion,
  };
}

function completedReceipt(run) {
  const finished = Date.parse(run.finishedAt);
  return Number.isFinite(finished) && finished >= Date.parse(run.startedAt);
}

export function browserReviewProblem(state, run, manifest) {
  if (!manifest) return 'Sources ou manifeste indisponibles ; couverture à réévaluer.';
  if (run.checkId !== 'business-browser' || run.source?.kind !== 'studio-adapter' || run.provider)
    return 'Un reçu exécuté par le navigateur local Studio est requis.';
  if (
    run.freshness !== 'current' ||
    !['passed', 'failed'].includes(run.status) ||
    !completedReceipt(run)
  )
    return 'Le reçu doit être terminé et actuel pour cette version.';
  const browser = run.browser;
  if (
    !browser ||
    browser.protocol !== browserProtocol ||
    browser.sourceFingerprint !== run.fingerprint ||
    browser.manifestFingerprint !== manifest.manifestFingerprint ||
    typeof browser.driverVersion !== 'string' ||
    !browser.driverVersion ||
    typeof browser.browserVersion !== 'string' ||
    !browser.browserVersion ||
    browser.driverVersion !== run.browserDriverVersion ||
    !Array.isArray(browser.scenarios) ||
    run.businessCriteria?.fingerprint !== businessCriteriaFingerprint(state)
  )
    return 'Le reçu ne lie pas exactement les sources, critères et versions d’exécution.';
  return null;
}

export function scenarioCanCover(run, scenario) {
  const record = run.browser?.scenarios?.find((item) => item.id === scenario.id);
  if (
    run.status !== 'passed' ||
    record?.status !== 'passed' ||
    record.executedSteps !== scenario.steps.length ||
    !Array.isArray(record.assertions)
  )
    return false;
  const expected = scenario.steps.flatMap((step, index) =>
    step.action.startsWith('expect') ? [{ step: index + 1, action: step.action }] : [],
  );
  return (
    expected.length > 0 &&
    record.assertions.length === expected.length &&
    expected.every(
      (assertion, index) =>
        record.assertions[index].step === assertion.step &&
        record.assertions[index].action === assertion.action &&
        record.assertions[index].status === 'passed',
    )
  );
}

export function projectBrowserCoverage(state, run, manifest) {
  const problem = browserReviewProblem(state, run, manifest);
  const bindings = problem ? null : coverageBindings(state, run, manifest);
  return state.decisions
    .filter((decision) => decision.coverage?.receiptId === run.id && decision.source === 'user')
    .map((decision) => {
      const record = decision.coverage;
      const criterion = state.brief.criteria.find((item) => item.id === record.criterion.id);
      const current =
        decision.status === 'active' &&
        bindings &&
        decision.topic === coverageTopic(run.revisionId, record.criterion.id) &&
        criterion?.text === record.criterion.text &&
        Object.entries(bindings).every(([key, value]) => record[key] === value);
      const complete =
        current &&
        record.scenarioIds.length > 0 &&
        record.scenarioIds.every((id) => {
          const scenario = manifest.scenarios.find((item) => item.id === id);
          return scenario && scenarioCanCover(run, scenario);
        });
      return {
        decisionId: decision.id,
        criterionId: record.criterion.id,
        criterionText: record.criterion.text,
        conclusion: record.conclusion,
        scope: record.scope,
        reason: decision.reason,
        scenarioIds: record.scenarioIds,
        freshness:
          decision.status !== 'active' || run.freshness === 'obsolete'
            ? 'obsolete'
            : current
              ? 'current'
              : 'reevaluate',
        contributes: Boolean(complete && record.conclusion === 'sufficient'),
      };
    });
}
