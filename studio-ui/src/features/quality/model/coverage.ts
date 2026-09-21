import { translate } from '../../../i18n';
export type CoverageConclusion = 'sufficient' | 'partial' | 'irrelevant';
export interface CoverageReview {
  version: number;
  revision: { id: string; title: string };
  receipt: {
    id: string;
    status: string;
    freshness: 'current' | 'reevaluate' | 'obsolete';
    protocol: string | null;
    driverVersion: string | null;
    browserVersion: string | null;
  };
  reviewKey: string;
  canReview: boolean;
  reason: string | null;
  criteria: { id: string; text: string }[];
  scenarios: {
    id: string;
    title: string;
    criterionIds: string[];
    steps: {
      action: string;
      target?: { role?: string; name?: string; testId?: string };
      value?: unknown;
      text?: string;
      expected?: unknown;
      path?: (string | number)[];
    }[];
    status: string;
    executedSteps: number;
    assertions: { step: number; action: string; status: string }[];
    canCover: boolean;
  }[];
  reviews: {
    decisionId: string;
    criterionId: string;
    criterionText?: string;
    conclusion: CoverageConclusion;
    scope: string;
    reason: string;
    freshness: 'current' | 'reevaluate' | 'obsolete';
    scenarioIds: string[];
  }[];
  limits: string[];
}
export interface CoverageDraft {
  criterionId: string;
  scenarioIds: string[];
  conclusion: CoverageConclusion | '';
  scope: string;
  reason: string;
}
export const coverageConclusions = (locale: 'en' | 'fr' = 'en') => ({
  sufficient: translate(
    'Suffisante pour ce critère dans ce périmètre',
    'Sufficient for this criterion within this scope',
    undefined,
    locale,
  ),
  partial: translate('Pertinente mais partielle', 'Relevant but partial', undefined, locale),
  irrelevant: translate('Non pertinente', 'Not relevant', undefined, locale),
});
export function canSubmitCoverage(review: CoverageReview | null, draft: CoverageDraft) {
  if (
    !review?.canReview ||
    !draft.conclusion ||
    !draft.scope.trim() ||
    !draft.reason.trim() ||
    !draft.scenarioIds.length ||
    draft.scenarioIds.length > 6 ||
    draft.scope.trim().length > 2000 ||
    draft.reason.trim().length > 4000
  )
    return false;
  if (!review.criteria.some((criterion) => criterion.id === draft.criterionId)) return false;
  return draft.scenarioIds.every((id) => {
    const scenario = review.scenarios.find((entry) => entry.id === id);
    return (
      scenario &&
      (draft.conclusion !== 'sufficient' ||
        (review.receipt.status === 'passed' && scenario.canCover))
    );
  });
}

export function allowsSufficientCoverage(review: CoverageReview | null, scenarioIds: string[]) {
  return Boolean(
    review?.receipt.status === 'passed' &&
    scenarioIds.length &&
    scenarioIds.every((id) =>
      review.scenarios.some((scenario) => scenario.id === id && scenario.canCover),
    ),
  );
}
