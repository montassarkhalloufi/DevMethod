import type { useProjectGuide } from '../hooks/useProjectGuide';
import type { GuideInput } from '../model/guides';
import { ConnectorGuide } from './ConnectorGuide';

export function ProjectConnectorGuide({
  controller,
  input,
  busy,
  onChange,
}: {
  controller: ReturnType<typeof useProjectGuide>;
  input: GuideInput | null;
  busy: boolean;
  onChange(input: GuideInput): void;
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
        />
      ) : null}
      {input && !confirmed ? (
        <p className="connector-note">
          Vérifiez la préparation avant d’enregistrer ces réponses avec les réglages.
        </p>
      ) : null}
    </div>
  );
}
