import { useI18n } from '../../../i18n';
import { useDecisionAction } from '../hooks/useDecisionAction';
import { approvalLabel } from '../model/contracts';
import type { DecisionCardProps, ProposalOption } from '../model/contracts';

function Option({
  option,
  selected,
  recommended,
  disabled,
  onSelect,
}: {
  option: ProposalOption;
  selected: boolean;
  recommended: boolean;
  disabled: boolean;
  onSelect(): void;
}) {
  const { t } = useI18n();
  return (
    <label className={'decision-option' + (selected ? ' selected' : '')}>
      <span className="decision-option-heading">
        <input
          type="radio"
          name="pending-proposal-option"
          value={option.id}
          checked={selected}
          disabled={disabled}
          onChange={onSelect}
        />
        <strong>{option.title}</strong>
        {recommended ? (
          <small className="decision-recommended">{t('Recommandé', 'Recommended')}</small>
        ) : null}
      </span>
      <ul className="decision-consequences">
        {option.consequences.map((text, index) => (
          <li key={index}>{text}</li>
        ))}
      </ul>
      {option.preview?.status !== 'implemented' ? (
        <small className="decision-preview-kind">
          {option.preview
            ? t('Simulation visuelle', 'Visual simulation')
            : t('Aperçu non fourni', 'No preview provided')}
        </small>
      ) : null}
    </label>
  );
}

function DecisionContent({
  proposal,
  activeRevision,
  execution,
  actions,
  draftScope,
}: DecisionCardProps) {
  const { locale, t } = useI18n();
  const { status, error, run, reason, setReason, storageWarning } = useDecisionAction({
    draftScope,
    proposalId: proposal.id,
    baseRevision: proposal.baseRevision,
  });
  const obsolete = proposal.baseRevision !== activeRevision;
  const saving = status === 'saving';
  return (
    <article className="active-decision-card">
      <p className="decision-phase">
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M12 3v4m-6 1h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2ZM8 12h1m6 0h1m-7 4h6M1 12v4m22-4v4" />
        </svg>
        {proposal.stage === 'implementation'
          ? t('Décision avant réalisation', 'Decision before implementation')
          : t('Validation visuelle', 'Visual approval')}{' '}
        {t('· En attente', '· Pending')}{' '}
      </p>
      <h2 className="decision-question">{proposal.question}</h2>
      <p className="decision-summary">
        {t(
          'Comparez les options dans l’aperçu, sans les appliquer.',
          'Compare options in the preview without applying them.',
        )}
      </p>
      {obsolete ? (
        <p className="inline-error" role="alert">
          {' '}
          {t(
            'La version actuelle a changé. Demandez à l’agent de réexaminer cette proposition.',
            'The current version has changed. Ask the agent to review this proposal again.',
          )}{' '}
        </p>
      ) : null}
      <fieldset className="decision-options" disabled={saving || obsolete}>
        <legend className="sr-only">
          {t('Options pour', 'Options for')} {proposal.topic}
        </legend>
        {proposal.options.map((option) => (
          <Option
            key={option.id}
            option={option}
            selected={option.id === proposal.selectedOptionId}
            recommended={option.id === proposal.recommendation?.optionId}
            disabled={saving || obsolete}
            onSelect={() => {
              void run(() => actions.select(proposal.id, option.id));
            }}
          />
        ))}
      </fieldset>
      {proposal.recommendation ? (
        <p className="decision-recommendation">
          <span aria-hidden="true">ⓘ</span> {proposal.recommendation.reason}
        </p>
      ) : null}
      <form
        className="decision-approval"
        onSubmit={(event) => {
          event.preventDefault();
          const selected = proposal.selectedOptionId;
          if (selected && !obsolete)
            void run(() => actions.approve(proposal.id, selected, reason), true);
        }}
      >
        <details className="decision-reason">
          <summary>{t('Ajouter une raison', 'Add a reason')}</summary>
          <label htmlFor={'decision-reason-' + proposal.id}>
            {' '}
            {t('Votre raison', 'Your reason')}{' '}
            <span className="muted">{t('(facultatif)', '(optional)')}</span>
          </label>
          <textarea
            id={'decision-reason-' + proposal.id}
            name="decision-reason"
            autoComplete="off"
            rows={2}
            maxLength={4000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('Ce qui motive votre choix…', 'What motivates your choice…')}
          />
        </details>
        {storageWarning ? (
          <p className="muted" role="status">
            {storageWarning}
          </p>
        ) : null}
        {error ? (
          <p className="inline-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="primary"
          disabled={saving || obsolete || !proposal.selectedOptionId}
        >
          <span>
            {saving ? t('Enregistrement…', 'Saving…') : approvalLabel(proposal, execution, locale)}
          </span>
          <svg
            className="decision-submit-icon"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 12h16m-6-6 6 6-6 6" />
          </svg>
        </button>
        <p className="muted">
          {proposal.stage === 'implementation'
            ? execution === 'automatic'
              ? t(
                  'Une demande sera lancée. Son résultat restera à vérifier.',
                  'A request will be started. Its result will still need verification.',
                )
              : t(
                  'Une demande sera créée pour votre agent hôte. Aucun agent automatique n’est actif.',
                  'A request will be created for your host agent. No automatic agent is active.',
                )
            : t(
                'Rendu uniquement · version et contrôles inchangés.',
                'Visuals only · version and checks unchanged.',
              )}
        </p>
      </form>
    </article>
  );
}

export function DecisionCard(props: DecisionCardProps) {
  // Changing project or proposal base must remount its private draft state.
  const identity = JSON.stringify([
    props.draftScope,
    props.proposal.id,
    props.proposal.baseRevision,
  ]);
  return <DecisionContent key={identity} {...props} />;
}
