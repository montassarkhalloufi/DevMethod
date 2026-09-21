import { useI18n, translate, type StudioLocale } from '../../../i18n';
import { useState } from 'react';
import { useJobProgress } from '../hooks/useJobProgress';
import type {
  JobStatus,
  ProgressAction,
  ProgressJob,
  ProgressSnapshot,
  ProgressWidgetProps,
} from '../model/contracts';

function jobLabels(locale: StudioLocale = 'en'): Record<JobStatus, string> {
  return {
    queued: translate(
      'En attente de prise en charge',
      'Waiting to be picked up',
      undefined,
      locale,
    ),
    running: translate('Prise en charge confirmée', 'Agent has started', undefined, locale),
    ready: translate('Résultat disponible', 'Result available', undefined, locale),
    failed: translate('Échec de la demande', 'Request failed', undefined, locale),
    cancelled: translate('Demande annulée', 'Request cancelled', undefined, locale),
    interrupted: translate('Demande interrompue', 'Request interrupted', undefined, locale),
  };
}
function kindLabels(locale: StudioLocale = 'en') {
  return {
    read: translate('Lecture', 'Reading', undefined, locale),
    write: translate('Modification', 'Editing', undefined, locale),
    command: translate('Commande', 'Command', undefined, locale),
    search: translate('Recherche', 'Search', undefined, locale),
    check: translate('Contrôle', 'Check', undefined, locale),
    message: translate('Information', 'Information', undefined, locale),
  };
}
const timeFormat = (locale: StudioLocale) =>
  new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

function stamp(at: string, locale: StudioLocale = 'en') {
  const date = new Date(at);
  return Number.isNaN(date.getTime())
    ? translate('Date inconnue', 'Unknown date', undefined, locale)
    : timeFormat(locale).format(date);
}
function StateIcon({ status }: { status: string }) {
  return (
    <span className={'progress-state-icon state-' + status} aria-hidden="true">
      {status === 'completed'
        ? '✓'
        : status === 'failed' || status === 'blocked'
          ? '!'
          : status === 'running'
            ? '◷'
            : '○'}
    </span>
  );
}
function Plan({ snapshot, status }: { snapshot: ProgressSnapshot; status: JobStatus }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(status === 'running');
  const plan = snapshot.plan;
  if (!plan)
    return (
      <p className="progress-empty">
        {' '}
        {t(
          'Aucun plan transmis. Les étapes apparaîtront quand l’agent les publiera.',
          'No plan received. Steps will appear when the agent publishes them.',
        )}{' '}
      </p>
    );
  const complete = plan.steps.filter((step) => step.status === 'completed').length;
  const stepLabels = {
    pending: t('À faire', 'To do'),
    running: status === 'running' ? t('En cours', 'In progress') : t('Non terminée', 'Unfinished'),
    completed: t('Terminée', 'Completed'),
    blocked: t('Bloquée', 'Blocked'),
  };
  return (
    <details
      className="progress-plan"
      open={expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>
        <span>Plan</span>
        <span className="progress-count">
          {complete}/{plan.steps.length} {t('terminées', 'completed')}{' '}
        </span>
      </summary>
      <p className="progress-plan-title">{plan.title}</p>
      <ol>
        {plan.steps.map((step) => (
          <li key={step.id} className={'progress-step step-' + step.status}>
            <StateIcon
              status={step.status === 'running' && status !== 'running' ? 'pending' : step.status}
            />
            <span>
              {step.title}
              <small>{stepLabels[step.status]}</small>
            </span>
          </li>
        ))}
      </ol>
      <p className="progress-note">
        {' '}
        {t(
          'Avancement déclaré par l’agent. Les preuves restent dans Vérifications.',
          'Progress reported by the agent. Evidence remains in Checks.',
        )}{' '}
      </p>
    </details>
  );
}
function ActionRow({
  action,
  status,
  canOpen,
  onOpen,
}: {
  action: ProgressAction;
  status: JobStatus;
  canOpen: boolean;
  onOpen(): void;
}) {
  const { locale, t } = useI18n();
  const label =
    action.status === 'failed'
      ? t('Échec', 'Failed')
      : action.status === 'completed'
        ? t('Terminée', 'Completed')
        : status === 'running'
          ? t('En cours', 'In progress')
          : t('Sans résultat final', 'No final result');
  return (
    <li className="progress-action">
      <StateIcon
        status={action.status === 'running' && status !== 'running' ? 'pending' : action.status}
      />
      <div>
        <span className="progress-action-kind">
          {kindLabels(locale)[action.kind]} · {label}
        </span>
        <span className="progress-action-label">{action.label}</span>
        {action.path ? <code title={action.path}>{action.path}</code> : null}
        <div className="progress-action-meta">
          <time dateTime={action.at}>{stamp(action.at, locale)}</time>
          {canOpen ? (
            <button
              type="button"
              onClick={onOpen}
              title={t(
                'Voir ce fichier dans la version livrée',
                'View this file in the delivered version',
              )}
            >
              {' '}
              {t('Ouvrir le fichier ↗', 'Open file ↗')}{' '}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
function ActionLog({
  snapshot,
  job,
  revisions,
  onOpenFile,
}: { snapshot: ProgressSnapshot; job: ProgressJob } & Pick<
  ProgressWidgetProps,
  'revisions' | 'onOpenFile'
>) {
  const { t } = useI18n();
  const [limit, setLimit] = useState(12);
  const actions = snapshot.actions.slice(-limit);
  const revision = revisions
    .slice()
    .reverse()
    .find((entry) => entry.jobId === job.id);
  return (
    <details className="progress-actions">
      <summary>
        <span>{t('Journal des actions', 'Action log')}</span>
        <span className="progress-count">
          {snapshot.truncated ? t('Dernières ', 'Latest ') : ''}
          {snapshot.actions.length}
        </span>
      </summary>
      {snapshot.actions.length ? (
        <>
          {snapshot.actions.length > limit ? (
            <button
              className="progress-earlier"
              type="button"
              onClick={() => setLimit((value) => value + 20)}
            >
              {' '}
              {t('Voir les actions précédentes', 'Show earlier actions')}{' '}
            </button>
          ) : null}
          <ol>
            {actions.map((action) => (
              <ActionRow
                key={action.id}
                action={action}
                status={snapshot.status}
                canOpen={Boolean(
                  action.path && revision?.files.some((file) => file.path === action.path),
                )}
                onOpen={() => action.path && onOpenFile(job.id, action.path)}
              />
            ))}
          </ol>
          {snapshot.truncated ? (
            <p className="progress-note">
              {t(
                'Le journal est limité aux 200 dernières actions.',
                'The log is limited to the latest 200 actions.',
              )}
            </p>
          ) : null}
        </>
      ) : (
        <p className="progress-empty">
          {t(
            'Aucune action transmise pour cette demande.',
            'No actions received for this request.',
          )}
        </p>
      )}
    </details>
  );
}
function currentJobStatus(job: ProgressJob, snapshot: ProgressSnapshot | null): JobStatus {
  // A terminal job always wins over an older progress response.
  if (!['queued', 'running'].includes(job.status)) return job.status;
  return snapshot?.status ?? job.status;
}

function JobProgress({ job, ...props }: ProgressWidgetProps & { job: ProgressJob }) {
  const { locale, t } = useI18n();
  const { snapshot, error, retry } = useJobProgress(job, props.loadProgress, props.pollMs);
  const live = snapshot?.jobId === job.id ? snapshot : null;
  const status = currentJobStatus(job, live);
  const current = live?.plan?.steps.find((step) => step.status === 'running');
  return (
    <div className="progress-job">
      <p className="progress-request" title={job.request}>
        {job.request}
      </p>
      <div className={'progress-job-status status-' + status} role="status">
        {jobLabels(locale)[status]}
      </div>
      {job.worker ? <p className="progress-worker">Agent · {job.worker}</p> : null}
      {status === 'queued' ? (
        <p className="progress-empty">
          {t(
            'La demande attend un agent. Aucune exécution n’a commencé.',
            'The request is waiting for an agent. Execution has not started.',
          )}
        </p>
      ) : null}
      {error ? (
        <div className="progress-error" role="status">
          <p>{error}</p>
          <button type="button" onClick={retry}>
            {' '}
            {t('Réessayer', 'Retry')}{' '}
          </button>
        </div>
      ) : null}
      {live ? (
        <>
          {current && status === 'running' ? (
            <p className="progress-current">
              <StateIcon status="running" />
              <span>{current.title}</span>
            </p>
          ) : null}
          <Plan snapshot={live} status={status} />
          <ActionLog
            snapshot={{ ...live, status }}
            job={job}
            revisions={props.revisions}
            onOpenFile={props.onOpenFile}
          />
          <p className="progress-received">
            {live.updatedAt ? (
              <>
                {' '}
                {t('Dernier événement :', 'Latest event:')}{' '}
                <time dateTime={live.updatedAt}>{stamp(live.updatedAt, locale)}</time>
              </>
            ) : (
              t('Aucun événement reçu.', 'No events received.')
            )}
            {!error && status === 'running'
              ? t(' · Actualisation automatique', ' · Updates automatically')
              : ''}
          </p>
        </>
      ) : !error ? (
        <p className="progress-empty">{t('Lecture de l’avancement…', 'Loading progress…')}</p>
      ) : null}
    </div>
  );
}
export function ProgressView(props: ProgressWidgetProps) {
  const { t } = useI18n();
  const [chosen, setChosen] = useState<string | null>(null);
  const job =
    props.jobs.find((entry) => entry.id === chosen) ??
    props.jobs.find((entry) => entry.status === 'running') ??
    props.jobs.find((entry) => entry.status === 'queued') ??
    props.jobs.at(-1);
  if (!job) return null;
  return (
    <section
      className="job-progress-card"
      aria-label={t('Plan et avancement', 'Plan and progress')}
    >
      <div className="progress-heading">
        <h2>{t('Plan et avancement', 'Plan and progress')}</h2>
        <span className="progress-agent-badge">Agent</span>
      </div>
      {props.jobs.length > 1 ? (
        <label className="progress-job-picker">
          {' '}
          {t('Demande suivie', 'Tracked request')}{' '}
          <select value={job.id} onChange={(event) => setChosen(event.target.value)}>
            {props.jobs
              .slice()
              .reverse()
              .map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.request.length > 65 ? entry.request.slice(0, 65) + '…' : entry.request}
                </option>
              ))}
          </select>
        </label>
      ) : null}
      {props.renderInteractions?.(job)}
      <JobProgress key={job.id} job={job} {...props} />
    </section>
  );
}
