import { localizeMessage } from '../model/ui-messages';
import { useI18n } from '../../../i18n';
import { useAgentConfiguration } from '../hooks/useAgentConfiguration';
import { accessLabel } from '../model/contracts';
import type { AgentWidgetProps } from '../model/contracts';
import './agent.css';

function AgentAvailability({
  availability,
}: {
  availability: AgentWidgetProps['agent']['availability'];
}) {
  const { t, locale } = useI18n();
  return (
    <>
      <p>
        <strong>{t('Codex local', 'Local Codex')}</strong> ·{' '}
        {availability.available === null
          ? t('À vérifier', 'To check')
          : availability.available
            ? t('Installé', 'Installed')
            : t('Indisponible', 'Unavailable')}
        {' · '}
        {availability.connected
          ? t('Connecté', 'Connected')
          : t('Connexion non établie', 'Connection not established')}
      </p>
      <p>
        {accessLabel(availability.access, locale)}
        {availability.version ? ' · ' + availability.version : ''}
      </p>
      {availability.checkedAt ? (
        <p>
          {t('Vérifié le', 'Checked on')} {new Date(availability.checkedAt).toLocaleString(locale)}
        </p>
      ) : null}
      {availability.message ? <p>{localizeMessage(availability.message, locale)}</p> : null}
    </>
  );
}

function numericValue(value: number) {
  return Number.isFinite(value) ? value : '';
}

export function AgentConfiguration(props: AgentWidgetProps) {
  const { t, locale } = useI18n();
  const { agent } = props;
  const action = useAgentConfiguration(props);
  const busy = action.pending !== null || agent.configuring;
  const availability = agent.availability;
  const canEnable =
    availability.available === true && availability.connected && availability.access !== 'unknown';
  return (
    <section
      className="agent-settings"
      aria-label={t('Configuration de Codex', 'Codex configuration')}
    >
      <AgentAvailability availability={availability} />
      <button type="button" disabled={busy} onClick={() => void action.probe()}>
        {action.pending === 'probe'
          ? t('Vérification…', 'Checking…')
          : t('Vérifier l’installation et la connexion', 'Check installation and connection')}
      </button>
      <p id="agent-access-help">
        {t(
          'Studio réutilise votre accès Codex existant, sans quota supplémentaire. Une connexion ChatGPT ne nécessite pas de clé API. Aucun changement automatique de type d’accès.',
          'Studio reuses your existing Codex access with no additional quota. A ChatGPT connection needs no API key. Access type never changes automatically.',
        )}
      </p>
      {agent.historicalBudget ? (
        <p role="status">
          {t(
            'Cette campagne possède des limites historiques. Son budget ne peut pas être rouvert ici.',
            'This campaign has historical limits. Its budget cannot be reopened here.',
          )}
        </p>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void action.configure();
        }}
        aria-describedby="agent-limits-help agent-access-help"
      >
        <fieldset disabled={busy || agent.running || agent.historicalBudget}>
          <legend>
            {t('Limites de cette exécution locale', 'Limits for this local execution')}
          </legend>
          <div className="agent-settings-fields">
            <label>
              {t('Nombre maximal de jobs', 'Maximum jobs')}
              <input
                name="maxJobs"
                type="number"
                min="1"
                step="1"
                required
                autoComplete="off"
                value={numericValue(action.settings.maxJobs)}
                onChange={(event) => action.edit('maxJobs', event.target.valueAsNumber)}
              />
            </label>
            <label>
              {t('Seuil d’admission en tokens', 'Token admission threshold')}
              <input
                name="maxTokens"
                type="number"
                min="1"
                step="1"
                required
                autoComplete="off"
                value={numericValue(action.settings.maxTokens)}
                onChange={(event) => action.edit('maxTokens', event.target.valueAsNumber)}
              />
            </label>
            <label>
              {t('Durée maximale par job (secondes)', 'Maximum job duration (seconds)')}
              <input
                name="timeoutSeconds"
                type="number"
                min="1"
                step="1"
                required
                autoComplete="off"
                value={numericValue(action.settings.timeoutMs / 1000)}
                onChange={(event) => action.edit('timeoutMs', event.target.valueAsNumber * 1000)}
              />
            </label>
          </div>
          <p id="agent-limits-help">
            {t(
              'Le seuil en tokens bloque les appels suivants selon l’usage connu ; il ne constitue pas un plafond dur imposé au fournisseur. Les limites du compte Codex restent applicables.',
              'The token threshold blocks subsequent calls based on known usage; it is not a hard provider-enforced ceiling. Codex account limits still apply.',
            )}
          </p>
          {action.stale ? (
            <p role="alert">
              {t(
                'Les limites ont changé ailleurs. Votre saisie est conservée. Rechargez les limites enregistrées avant de continuer.',
                'Limits changed elsewhere. Your entries are retained. Reload saved limits before continuing.',
              )}
            </p>
          ) : null}
          <p>
            {t('Accès à autoriser :', 'Access to authorize:')}{' '}
            <strong>{accessLabel(availability.access, locale)}</strong>.
          </p>
          <div className="agent-settings-actions">
            <button type="submit" className="primary" disabled={!canEnable || action.stale}>
              {action.pending === 'configure'
                ? t('Enregistrement…', 'Saving…')
                : agent.settings.enabled
                  ? t('Enregistrer les limites', 'Save limits')
                  : t('Activer Codex avec ces limites', 'Enable Codex with these limits')}
            </button>
            <button type="button" onClick={action.reload}>
              {t('Recharger les limites enregistrées', 'Reload saved limits')}
            </button>
          </div>
        </fieldset>
      </form>
      {agent.settings.enabled || agent.running ? (
        <button type="button" disabled={busy} onClick={() => void action.stop()}>
          {agent.running
            ? t('Arrêter l’agent et suspendre les appels', 'Stop the agent and suspend calls')
            : t('Désactiver les appels automatiques', 'Disable automatic calls')}
        </button>
      ) : null}
      {agent.running ? (
        <p>
          {t(
            'Un job est en cours. Arrêtez-le avant de modifier les limites ; son travail reste conservé.',
            'A job is running. Stop it before changing limits; its work is retained.',
          )}
        </p>
      ) : null}
      <p role="status" aria-live="polite">
        {action.error ||
          (busy
            ? t('Action en cours…', 'Action in progress…')
            : localizeMessage(agent.message, locale) || '')}
      </p>
    </section>
  );
}
