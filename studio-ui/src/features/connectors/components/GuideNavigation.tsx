import { useI18n } from '../../../i18n';
import { connectorText, connectorMessage } from '../model/i18n';
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
  const { locale } = useI18n();
  return (
    <nav
      className="connector-guide-steps"
      aria-label={connectorText('Étapes de préparation', locale)}
    >
      {[
        connectorText('Usage', locale),
        connectorText('Configuration', locale),
        connectorText('Vérification', locale),
      ].map((label, index) => (
        <button
          key={connectorText(label, locale)}
          type="button"
          aria-current={step === index ? 'step' : undefined}
          disabled={locked || (index > 0 && !hasFlow) || (index === 2 && !prepared)}
          onClick={() => onStep(index)}
        >
          <span aria-hidden="true">{index + 1}</span>
          {connectorText(label, locale)}
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
  const { locale } = useI18n();
  if (props.step === 0)
    return (
      <button
        type="button"
        className="primary"
        disabled={props.locked || !props.hasFlow}
        onClick={() => props.onStep(1)}
      >
        {connectorText('Préciser la configuration →', locale)}
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
        {connectorText('Vérifier la préparation →', locale)}
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
        {props.error
          ? connectorText('Réessayer la préparation', locale)
          : connectorText('Vérifier la préparation', locale)}
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
  const { locale } = useI18n();
  return (
    <footer className="connector-guide-actions">
      {props.step > 0 ? (
        <button type="button" disabled={props.locked} onClick={() => props.onStep(props.step - 1)}>
          {connectorMessage('← Retour', '← Back', locale)}
        </button>
      ) : props.onBack ? (
        <button type="button" disabled={props.locked} onClick={props.onBack}>
          {connectorMessage('← Retour au catalogue', '← Back to catalog', locale)}
        </button>
      ) : (
        <span />
      )}
      <PrimaryAction {...props} />
    </footer>
  );
}
