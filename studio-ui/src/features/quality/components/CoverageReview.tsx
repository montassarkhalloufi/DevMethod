import { translate } from '../../../i18n';
import { useI18n } from '../../../i18n';
import { useCoverageReview } from '../hooks/useCoverageReview';
import {
  canSubmitCoverage,
  coverageConclusions,
  allowsSufficientCoverage,
} from '../model/coverage';
import type { CoverageConclusion, CoverageReview as Review } from '../model/coverage';
import { freshnessLabels } from '../model/selectors';

const actionLabels = (locale: 'en' | 'fr' = 'en'): Record<string, string> => ({
  fill: translate('Saisir', 'Fill', undefined, locale),
  click: translate('Cliquer', 'Click', undefined, locale),
  expectText: translate('Vérifier le texte', 'Check text', undefined, locale),
  expectValue: translate('Vérifier la valeur', 'Check value', undefined, locale),
  expectVisible: translate('Vérifier la visibilité', 'Check visibility', undefined, locale),
  expectData: translate('Vérifier les données', 'Check data', undefined, locale),
  reload: translate('Recharger', 'Reload', undefined, locale),
  restart: translate('Redémarrer', 'Restart', undefined, locale),
});
const resultLabels = (locale: 'en' | 'fr' = 'en'): Record<string, string> => ({
  passed: translate('Satisfait', 'Satisfied', undefined, locale),
  failed: translate('En échec', 'Failed', undefined, locale),
  blocked: translate('Bloqué', 'Blocked', undefined, locale),
  running: translate('En cours', 'Running', undefined, locale),
  'not-run': translate('Non exécuté', 'Not run', undefined, locale),
});
function DeclaredValue({ value }: { value: unknown }) {
  if (value && typeof value === 'object')
    return (
      <ul>
        {Object.entries(value).map(([key, item]) => (
          <li key={key}>
            {key} : <DeclaredValue value={item} />
          </li>
        ))}
      </ul>
    );
  return <span>{value === null ? 'null' : String(value)}</span>;
}
function ScenarioSteps({ scenario }: { scenario: Review['scenarios'][number] }) {
  const { t, locale } = useI18n();
  return (
    <details>
      <summary>
        {t('Étapes et résultats ·', 'Steps and results ·')} {scenario.executedSteps}{' '}
        {t('étape(s) exécutée(s)', 'step(s) executed')}
      </summary>
      <ol>
        {scenario.steps.map((step, index) => {
          const assertion = scenario.assertions.find((entry) => entry.step === index + 1);
          return (
            <li key={index}>
              <strong>{actionLabels(locale)[step.action] ?? step.action}</strong>
              {' · '}
              {assertion
                ? (resultLabels(locale)[assertion.status] ?? assertion.status)
                : index < scenario.executedSteps
                  ? t('Exécutée', 'Executed')
                  : t('Exécution non confirmée', 'Execution not confirmed')}
              {step.target ? (
                <p>
                  {t('Cible :', 'Target:')} {step.target.role} {step.target.name}
                  {step.target.testId
                    ? t('identifiant de test {id}', 'test ID {id}', { id: step.target.testId })
                    : ''}
                </p>
              ) : null}
              {step.path ? (
                <p>
                  {t('Chemin des données :', 'Data path:')}{' '}
                  {step.path.join(' → ') || t('racine', 'root')}
                </p>
              ) : null}
              {step.value !== undefined ? (
                <div>
                  {t('Valeur déclarée :', 'Declared value:')} <DeclaredValue value={step.value} />
                </div>
              ) : null}
              {step.text !== undefined ? (
                <p>
                  {t('Texte attendu déclaré :', 'Declared expected text:')} {step.text}
                </p>
              ) : null}
              {step.expected !== undefined ? (
                <div>
                  {t('Données attendues déclarées :', 'Declared expected data:')}{' '}
                  <DeclaredValue value={step.expected} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </details>
  );
}
function ExistingReviews({ review }: { review: Review }) {
  const { t, locale } = useI18n();
  return (
    <details>
      <summary>
        {t('Appréciations enregistrées (', 'Recorded assessments (')}
        {review.reviews.length})
      </summary>
      {review.reviews.map((entry) => (
        <article key={entry.decisionId}>
          <h4>
            {entry.criterionText ??
              review.criteria.find((criterion) => criterion.id === entry.criterionId)?.text ??
              entry.criterionId}
          </h4>
          <p>
            {coverageConclusions(locale)[entry.conclusion]} ·{' '}
            {freshnessLabels(locale)[entry.freshness]}
          </p>
          <p>
            {t('Périmètre :', 'Scope:')} {entry.scope}
          </p>
          <p>
            {t('Justification :', 'Reason:')} {entry.reason}
          </p>
          <p>
            {t('Scénarios :', 'Scenarios:')} {entry.scenarioIds.join(', ')}{' '}
            {t('· Décision', '· Decision')} {entry.decisionId}
          </p>
        </article>
      ))}
    </details>
  );
}
function ScenarioSelection({
  review,
  draft,
  setDraft,
}: { review: Review } & Pick<ReturnType<typeof useCoverageReview>, 'draft' | 'setDraft'>) {
  const { t, locale } = useI18n();
  return (
    <fieldset>
      <legend>
        {t('Scénarios à apprécier (au moins un)', 'Scenarios to assess (at least one)')}
      </legend>
      {review.scenarios.map((scenario) => (
        <article key={scenario.id}>
          <label>
            <input
              type="checkbox"
              checked={draft.scenarioIds.includes(scenario.id)}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  scenarioIds: event.target.checked
                    ? [...draft.scenarioIds, scenario.id]
                    : draft.scenarioIds.filter((id) => id !== scenario.id),
                })
              }
            />
            {scenario.title}
          </label>
          <p>
            {resultLabels(locale)[scenario.status] ?? scenario.status}{' '}
            {t('· Liens déclarés aux critères :', '· Declared criterion links:')}{' '}
            {scenario.criterionIds.join(', ') || t('aucun', 'none')}.{' '}
            {scenario.canCover
              ? ''
              : t(
                  'Ne permet pas de conclure à une couverture suffisante.',
                  'Cannot support sufficient coverage.',
                )}
          </p>
          <ScenarioSteps scenario={scenario} />
        </article>
      ))}
      {draft.scenarioIds
        .filter((id) => !review.scenarios.some((scenario) => scenario.id === id))
        .map((id) => (
          <label key={id}>
            <input
              type="checkbox"
              checked
              onChange={() =>
                setDraft({
                  ...draft,
                  scenarioIds: draft.scenarioIds.filter((entry) => entry !== id),
                })
              }
            />
            {t('Scénario devenu indisponible :', 'Scenario no longer available:')} {id}
            {t('. Décochez-le pour poursuivre.', '. Deselect it to continue.')}
          </label>
        ))}
    </fieldset>
  );
}

function ReviewIdentity({ review }: { review: Review }) {
  const { t, locale } = useI18n();
  return (
    <>
      <p>
        {review.revision.title} · {review.revision.id} {t('· Reçu', '· Receipt')}{' '}
        {review.receipt.id} · {resultLabels(locale)[review.receipt.status] ?? review.receipt.status}{' '}
        · {freshnessLabels(locale)[review.receipt.freshness]}
      </p>
      <p>
        {t('Protocole', 'Protocol')} {review.receipt.protocol ?? t('non recueilli', 'not captured')}{' '}
        {t('· pilote', '· driver')}{' '}
        {review.receipt.driverVersion ?? t('non recueilli', 'not captured')}{' '}
        {t('· navigateur', '· browser')}{' '}
        {review.receipt.browserVersion ?? t('non recueilli', 'not captured')}.
      </p>
      {!review.canReview ? (
        <p role="status">
          {t('Examen indisponible :', 'Review unavailable:')} {review.reason}
        </p>
      ) : null}
    </>
  );
}

export function CoverageReview({
  revisionId,
  receiptId,
  onSaved,
}: {
  revisionId: string;
  receiptId: string;
  onSaved: () => void;
}) {
  const { t, locale } = useI18n();
  const state = useCoverageReview(revisionId, receiptId, onSaved);
  const { review, draft } = state;
  const selectedCriterion = review?.criteria.find((entry) => entry.id === draft.criterionId);
  const sufficientAllowed = allowsSufficientCoverage(review, draft.scenarioIds);
  const feedback = (
    <>
      {state.error ? (
        <p role="alert" className="quality-error">
          {state.error}
        </p>
      ) : null}
      {state.message ? <p role="status">{state.message}</p> : null}
    </>
  );
  return (
    <section
      className="quality-coverage-review"
      aria-label={t('Examen de couverture métier', 'Business coverage review')}
    >
      {!state.opened ? (
        <button type="button" onClick={() => void state.read()}>
          {t('Examiner la couverture métier', 'Review business coverage')}
        </button>
      ) : (
        <>
          <h4>{t('Examiner la couverture métier', 'Review business coverage')}</h4>
          <p>
            {t(
              'Appréciez la pertinence des scénarios pour un critère et un périmètre précis. Cette décision ne relance aucun contrôle et n’adopte aucune version.',
              'Assess how relevant the scenarios are to a specific criterion and scope. This decision does not rerun checks or adopt a version.',
            )}
          </p>
          <button type="button" disabled={state.busy !== null} onClick={() => void state.read()}>
            {t('Actualiser l’examen', 'Refresh review')}
          </button>
          {!review ? feedback : null}
          {state.busy ? (
            <p role="status">
              {state.busy === 'read'
                ? t('Lecture de l’examen…', 'Loading review…')
                : t('Enregistrement de l’appréciation…', 'Saving assessment…')}
            </p>
          ) : null}
          {review ? (
            <>
              <ReviewIdentity review={review} />
              <ExistingReviews review={review} />
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void state.save();
                }}
              >
                <fieldset disabled={state.busy !== null || !review.canReview}>
                  <legend>
                    {t('Votre appréciation de couverture', 'Your coverage assessment')}
                  </legend>
                  <label>
                    {t('Critère à examiner', 'Criterion to review')}
                    <select
                      required
                      value={draft.criterionId}
                      onChange={(event) =>
                        state.setDraft({ ...draft, criterionId: event.target.value })
                      }
                    >
                      <option value="">{t('Choisir un critère', 'Choose a criterion')}</option>
                      {review.criteria.map((criterion) => (
                        <option key={criterion.id} value={criterion.id}>
                          {criterion.text}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedCriterion ? (
                    <p>
                      {t('Critère exact :', 'Exact criterion:')} {selectedCriterion.text}
                    </p>
                  ) : null}
                  <ScenarioSelection review={review} draft={draft} setDraft={state.setDraft} />
                  <p>
                    {t(
                      'Les étapes montrent le manifeste déclaré.',
                      'The steps show the declared manifest.',
                    )}{' '}
                    {'{{nonce}}'}{' '}
                    {t(
                      'reste un modèle ; aucune valeur privée observée n’est récupérée.',
                      'remains a template; no observed private value is retrieved.',
                    )}
                  </p>
                  <fieldset>
                    <legend>Conclusion</legend>
                    <p>
                      {t(
                        'Une couverture suffisante nécessite un reçu réussi et uniquement des scénarios éligibles.',
                        'Sufficient coverage requires a successful receipt and only eligible scenarios.',
                      )}
                    </p>
                    {Object.entries(coverageConclusions(locale)).map(([value, label]) => (
                      <label key={value}>
                        <input
                          type="radio"
                          name="coverage-conclusion"
                          value={value}
                          checked={draft.conclusion === value}
                          disabled={value === 'sufficient' && !sufficientAllowed}
                          onChange={() =>
                            state.setDraft({ ...draft, conclusion: value as CoverageConclusion })
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                  <label>
                    {t('Périmètre de cette appréciation', 'Scope of this assessment')}
                    <textarea
                      required
                      maxLength={2000}
                      value={draft.scope}
                      onChange={(event) => state.setDraft({ ...draft, scope: event.target.value })}
                    />
                  </label>
                  <label>
                    {t('Justification', 'Reason')}
                    <textarea
                      required
                      maxLength={4000}
                      value={draft.reason}
                      onChange={(event) => state.setDraft({ ...draft, reason: event.target.value })}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={state.needsRead || !canSubmitCoverage(review, draft)}
                  >
                    {t('Enregistrer l’appréciation', 'Save assessment')}
                  </button>
                </fieldset>
              </form>
              {feedback}
              <details className="quality-limits" open>
                <summary>{t('Limites de cet examen', 'Limitations of this review')}</summary>
                <ul>
                  {review.limits.map((limit) => (
                    <li key={limit}>{limit}</li>
                  ))}
                </ul>
              </details>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
