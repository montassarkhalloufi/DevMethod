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
  if (!controller.enabled) return null;
  const { catalog, request, definition, confirmed } = controller;
  return (
    <div className="connector-project-guide">
      {catalog.loading ? <p role="status">Lecture du guide fournisseur…</p> : null}
      {catalog.error ? (
        <div>
          <p role="alert" className="connector-error">
            {catalog.error}
          </p>
          <button type="button" onClick={catalog.refresh}>
            Réessayer le guide
          </button>
        </div>
      ) : null}
      {definition ? (
        <ConnectorGuide
          definition={definition}
          draft={input}
          preparation={confirmed}
          preparing={request.loading}
          error={request.error}
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
          {persistence.error}{' '}
          <button type="button" onClick={() => void persistence.retry()}>
            Réessayer l’enregistrement
          </button>
        </p>
      ) : null}
      {input && !confirmed ? (
        <p className="connector-note">
          Vérifiez la préparation avant d’enregistrer ces réponses avec les réglages.
        </p>
      ) : null}
    </div>
  );
}
