import type { GuidePreparation } from '../model/guides';

export function GuideSteps({
  step,
  locked,
  hasFlow,
  prepared,
  onStep,
}: {
  step: number;
  locked: boolean;
  hasFlow: boolean;
  prepared: boolean;
  onStep(step: number): void;
}) {
  return (
    <nav className="connector-guide-steps" aria-label="Étapes de préparation">
      {['Usage', 'Configuration', 'Vérification'].map((label, index) => (
        <button
          key={label}
          type="button"
          aria-current={step === index ? 'step' : undefined}
          disabled={locked || (index > 0 && !hasFlow) || (index === 2 && !prepared)}
          onClick={() => onStep(index)}
        >
          <span aria-hidden="true">{index + 1}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}

interface ActionProps {
  step: number;
  locked: boolean;
  hasFlow: boolean;
  complete: boolean;
  error?: string;
  confirmed: GuidePreparation | null;
  applyLabel: string;
  onStep(step: number): void;
  onPreview(): void;
  onApply?(value: GuidePreparation): void;
  onBack?(): void;
}

function PrimaryAction(props: ActionProps) {
  if (props.step === 0)
    return (
      <button
        type="button"
        className="primary"
        disabled={props.locked || !props.hasFlow}
        onClick={() => props.onStep(1)}
      >
        Préciser la configuration →
      </button>
    );
  if (props.step === 1)
    return (
      <button
        type="button"
        className="primary"
        disabled={props.locked || !props.complete}
        onClick={props.onPreview}
      >
        Vérifier la préparation →
      </button>
    );
  if (!props.confirmed)
    return (
      <button
        type="button"
        className="primary"
        disabled={props.locked || !props.complete}
        onClick={props.onPreview}
      >
        {props.error ? 'Réessayer la préparation' : 'Vérifier la préparation'}
      </button>
    );
  if (!props.onApply) return null;
  const value = props.confirmed,
    apply = props.onApply;
  return (
    <button type="button" className="primary" disabled={props.locked} onClick={() => apply(value)}>
      {props.applyLabel}
    </button>
  );
}

export function GuideActions(props: ActionProps) {
  return (
    <footer className="connector-guide-actions">
      {props.step > 0 ? (
        <button type="button" disabled={props.locked} onClick={() => props.onStep(props.step - 1)}>
          ← Retour
        </button>
      ) : props.onBack ? (
        <button type="button" disabled={props.locked} onClick={props.onBack}>
          ← Retour au catalogue
        </button>
      ) : (
        <span />
      )}
      <PrimaryAction {...props} />
    </footer>
  );
}
