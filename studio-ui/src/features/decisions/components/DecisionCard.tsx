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
        {recommended ? <small className="decision-recommended">Recommandé</small> : null}
      </span>
      <ul className="decision-consequences">
        {option.consequences.map((text, index) => (
          <li key={index}>{text}</li>
        ))}
      </ul>
      {option.preview?.status !== 'implemented' ? (
        <small className="decision-preview-kind">
          {option.preview ? 'Simulation visuelle' : 'Aperçu non fourni'}
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
        {proposal.stage === 'implementation' ? 'Décision avant réalisation' : 'Validation visuelle'}{' '}
        · En attente
      </p>
      <h2 className="decision-question">{proposal.question}</h2>
      <p className="decision-summary">Comparez les options dans l’aperçu, sans les appliquer.</p>
      {obsolete ? (
        <p className="inline-error" role="alert">
          La version actuelle a changé. Demandez à l’agent de réexaminer cette proposition.
        </p>
      ) : null}
      <fieldset className="decision-options" disabled={saving || obsolete}>
        <legend className="sr-only">Options pour {proposal.topic}</legend>
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
          <summary>Ajouter une raison</summary>
          <label htmlFor={'decision-reason-' + proposal.id}>
            Votre raison <span className="muted">(facultatif)</span>
          </label>
          <textarea
            id={'decision-reason-' + proposal.id}
            name="decision-reason"
            autoComplete="off"
            rows={2}
            maxLength={4000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ce qui motive votre choix…"
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
          <span>{saving ? 'Enregistrement…' : approvalLabel(proposal, execution)}</span>
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
              ? 'Une demande sera lancée. Son résultat restera à vérifier.'
              : 'Une demande sera créée pour votre agent hôte. Aucun agent automatique n’est actif.'
            : 'Rendu uniquement · version et contrôles inchangés.'}
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
