import { useI18n } from '../../../i18n';
import { connectorText } from '../model/i18n';
import type { useProjectGuide } from '../hooks/useProjectGuide';
import type { GuideInput } from '../model/guides';
import { ConnectorGuide } from './ConnectorGuide';
import type { useGuideDrafts } from '../hooks/useGuideDrafts';

export function ProjectConnectorGuide({
  controller,
  input,
  busy,
  onChange,
  persistence,
}: {
  controller: ReturnType<typeof useProjectGuide>;
  input: GuideInput | null;
  busy: boolean;
  onChange(input: GuideInput): void;
  persistence: ReturnType<typeof useGuideDrafts>;
}) {
  const { locale } = useI18n();
  if (!controller.enabled) return null;
  const { catalog, request, definition, confirmed } = controller;
  return (
    <div className="connector-project-guide">
      {catalog.loading ? (
        <p role="status">{connectorText('Lecture du guide fournisseur…', locale)}</p>
      ) : null}
      {catalog.error ? (
        <div>
          <p role="alert" className="connector-error">
            {connectorText(catalog.error, locale)}
          </p>
          <button type="button" onClick={catalog.refresh}>
            {connectorText('Réessayer le guide', locale)}
          </button>
        </div>
      ) : null}
      {definition ? (
        <ConnectorGuide
          definition={definition}
          draft={input}
          preparation={confirmed}
          preparing={request.loading}
          error={connectorText(request.error, locale)}
          disabled={busy}
          onChange={(value) => {
            request.reset();
            onChange(value);
          }}
          onPrepare={(value) => void controller.prepare(value)}
          step={persistence.drafts[definition.optionId]?.step}
          onStepChange={(step) => persistence.edit(definition.optionId, input, step)}
        />
      ) : null}
      {persistence.error ? (
        <p role="alert">
          {connectorText(persistence.error, locale)}{' '}
          <button type="button" onClick={() => void persistence.retry()}>
            {connectorText('Réessayer l’enregistrement', locale)}
          </button>
        </p>
      ) : null}
      {input && !confirmed ? (
        <p className="connector-note">
          {connectorText(
            'Vérifiez la préparation avant d’enregistrer ces réponses avec les réglages.',
            locale,
          )}
        </p>
      ) : null}
    </div>
  );
}
