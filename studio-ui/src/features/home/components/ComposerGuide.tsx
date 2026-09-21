import { useI18n } from '../../../i18n';
import { ConnectorGuide } from '../../connectors';
import { ComposerGuideConnection } from './ComposerGuideConnection';
import type { IdeaComposerController } from '../hooks/useIdeaComposer';

export function ComposerGuide({ composer }: { composer: IdeaComposerController }) {
  const { t } = useI18n();
  const guide = composer.guides;
  if (!guide.definition)
    return (
      <section aria-label={t('Guide du service', 'Service guide')}>
        <button type="button" onClick={guide.back}>
          {' '}
          {t('Retour aux outils', 'Back to tools')}{' '}
        </button>
        <p role={guide.error ? 'alert' : 'status'}>
          {guide.error ||
            (guide.loading
              ? t('Chargement du guide…', 'Loading guide…')
              : t(
                  'Ce guide est indisponible. Réessayez son chargement.',
                  'This guide is unavailable. Try loading it again.',
                ))}
        </p>
        <button
          type="button"
          disabled={guide.loading || composer.busy}
          onClick={() => void guide.refresh()}
        >
          {' '}
          {t('Réessayer le guide', 'Retry guide')}{' '}
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
        applyLabel={t('Ajouter à ma demande', 'Add to my request')}
        onBack={guide.back}
        disabled={composer.busy}
        step={guide.step}
        onStepChange={guide.setStep}
      />
      {guide.persistence.error ? (
        <p role="alert">
          {guide.persistence.error}{' '}
          <button type="button" onClick={() => void guide.persistence.retry()}>
            {' '}
            {t('Réessayer l’enregistrement', 'Retry saving')}{' '}
          </button>
        </p>
      ) : null}
      {guide.persistence.saving ? (
        <p role="status">{t('Enregistrement des réponses…', 'Saving answers…')}</p>
      ) : null}
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
