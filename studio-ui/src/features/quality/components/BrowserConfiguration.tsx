import { localizeMessage } from '../model/ui-messages';
import { translate, useI18n } from '../../../i18n';
import { useBrowserConfiguration } from '../hooks/useBrowserConfiguration';
import type { BrowserConfiguration as Configuration } from '../model/contracts';

function driverLabel(configuration: Configuration, locale: 'en' | 'fr') {
  if (!configuration.driverAvailable)
    return translate('indisponible', 'unavailable', undefined, locale);
  return (
    translate('disponible', 'available', undefined, locale) +
    (configuration.driverVersion ? ` · ${configuration.driverVersion}` : '')
  );
}

export function BrowserConfiguration({ onSaved }: { onSaved: () => void }) {
  const { t, locale } = useI18n();
  const state = useBrowserConfiguration();
  return (
    <section
      className="quality-workspace quality-browser"
      aria-label={t('Réglage navigateur', 'Browser settings')}
    >
      <h3>{t('Contrôle navigateur optionnel', 'Optional browser check')}</h3>
      <p>
        {t(
          'Utilise une copie du candidat avec des données vides et Chrome ou Edge déjà installé. Aucun téléchargement. Enregistrer ne lance pas le navigateur.',
          'Uses a copy of the candidate with empty data and an existing Chrome or Edge installation. No download. Saving does not launch the browser.',
        )}
      </p>
      {state.configuration ? (
        <p>
          {t('Configuration enregistrée :', 'Saved configuration:')}{' '}
          {state.configuration.enabled ? t('activée', 'enabled') : t('désactivée', 'disabled')} ·{' '}
          {state.configuration.channel === 'chrome' ? 'Chrome' : 'Edge'}.{' '}
          {localizeMessage(state.configuration.reason, locale)} {t('Pilote', 'Driver')}{' '}
          {driverLabel(state.configuration, locale)}
          {t('. Automatique :', '. Automatic:')}{' '}
          {state.configuration.automatic
            ? t('autorisé', 'allowed')
            : t('non autorisé', 'not allowed')}
          .
        </p>
      ) : (
        <p role="status">
          {state.busy
            ? t('Lecture du réglage navigateur…', 'Reading browser settings…')
            : t('Configuration non chargée.', 'Configuration not loaded.')}
        </p>
      )}
      <form
        className="quality-filters"
        onSubmit={(event) => {
          event.preventDefault();
          void state.save(onSaved);
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={state.draft.enabled}
            disabled={state.busy || !state.configuration}
            onChange={(event) =>
              state.setDraft({
                ...state.draft,
                enabled: event.target.checked,
                automatic: event.target.checked && state.draft.automatic,
              })
            }
          />{' '}
          {t('Activer le contrôle navigateur', 'Enable browser check')}
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.draft.automatic}
            disabled={state.busy || !state.configuration || !state.draft.enabled}
            onChange={(event) =>
              state.setDraft({ ...state.draft, automatic: event.target.checked })
            }
          />{' '}
          {t(
            'Exécuter automatiquement après chaque candidat de l’agent',
            'Run automatically after each agent candidate',
          )}
        </label>
        <label>
          {t('Navigateur installé', 'Installed browser')}{' '}
          <select
            value={state.draft.channel}
            disabled={state.busy || !state.configuration}
            onChange={(event) =>
              state.setDraft({ ...state.draft, channel: event.target.value as 'chrome' | 'msedge' })
            }
          >
            <option value="chrome">Chrome</option>
            <option value="msedge">Edge</option>
          </select>
        </label>
        <button type="submit" disabled={state.busy || !state.configuration || state.needsRead}>
          {t('Enregistrer le réglage', 'Save settings')}
        </button>
        <button type="button" disabled={state.busy} onClick={() => void state.read()}>
          {t('Relire la configuration', 'Reload configuration')}
        </button>
      </form>
      <p>
        {t(
          'Autorise uniquement les scénarios navigateur locaux des prochains candidats de l’agent. Ne lance pas de demande à l’agent et n’adopte aucune version. Aucun rattrapage automatique des candidats existants.',
          'Only allows local browser scenarios for future agent candidates. Does not submit an agent request or adopt a version. Existing candidates are not checked retroactively.',
        )}
      </p>
      {state.error ? (
        <p role="alert" className="quality-error">
          {state.error}
        </p>
      ) : null}
      {state.message ? <p role="status">{state.message}</p> : null}
    </section>
  );
}
