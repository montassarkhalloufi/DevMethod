import { ConnectorGuide } from '../../connectors';
import { ComposerGuideConnection } from './ComposerGuideConnection';
import type { IdeaComposerController } from '../hooks/useIdeaComposer';

export function ComposerGuide({ composer }: { composer: IdeaComposerController }) {
  const guide = composer.guides;
  if (!guide.definition)
    return (
      <section aria-label="Guide du service">
        <button type="button" onClick={guide.back}>
          Retour aux outils
        </button>
        <p role={guide.error ? 'alert' : 'status'}>
          {guide.error ||
            (guide.loading
              ? 'Chargement du guide…'
              : 'Ce guide est indisponible. Réessayez son chargement.')}
        </p>
        <button
          type="button"
          disabled={guide.loading || composer.busy}
          onClick={() => void guide.refresh()}
        >
          Réessayer le guide
        </button>
      </section>
    );
  return (
    <div className="composer-service-guide">
      <ConnectorGuide
        key={guide.definition.optionId}
        definition={guide.definition}
        draft={guide.input}
        preparation={guide.preparation}
        preparing={guide.preparing}
        error={guide.preparationError}
        onChange={guide.change}
        onPrepare={(input) => void guide.prepare(input)}
        onApply={guide.apply}
        applyLabel="Ajouter à ma demande"
        onBack={guide.back}
        disabled={composer.busy}
      />
      {guide.preparation?.nativeConnection ? (
        <ComposerGuideConnection
          key={guide.preparation.setupFingerprint}
          composer={composer}
          preparation={guide.preparation}
          title={guide.definition.title}
        />
      ) : null}
    </div>
  );
}
