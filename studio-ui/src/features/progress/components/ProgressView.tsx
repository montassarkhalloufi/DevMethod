import { useState } from 'react';
import { useJobProgress } from '../hooks/useJobProgress';
import type {
  JobStatus,
  ProgressAction,
  ProgressJob,
  ProgressSnapshot,
  ProgressWidgetProps,
} from '../model/contracts';

const jobLabels: Record<JobStatus, string> = {
  queued: 'En attente de prise en charge',
  running: 'Prise en charge confirmée',
  ready: 'Résultat disponible',
  failed: 'Échec de la demande',
  cancelled: 'Demande annulée',
  interrupted: 'Demande interrompue',
};
const kindLabels = {
  read: 'Lecture',
  write: 'Modification',
  command: 'Commande',
  search: 'Recherche',
  check: 'Contrôle',
  message: 'Information',
};
const timeFormat = new Intl.DateTimeFormat('fr', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function stamp(at: string) {
  const date = new Date(at);
  return Number.isNaN(date.getTime()) ? 'Date inconnue' : timeFormat.format(date);
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
  const [expanded, setExpanded] = useState(status === 'running');
  const plan = snapshot.plan;
  if (!plan)
    return (
      <p className="progress-empty">
        Aucun plan transmis. Les étapes apparaîtront quand l’agent les publiera.
      </p>
    );
  const complete = plan.steps.filter((step) => step.status === 'completed').length;
  const stepLabels = {
    pending: 'À faire',
    running: status === 'running' ? 'En cours' : 'Non terminée',
    completed: 'Terminée',
    blocked: 'Bloquée',
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
          {complete}/{plan.steps.length} terminées
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
        Avancement déclaré par l’agent. Les preuves restent dans Vérifications.
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
  const label =
    action.status === 'failed'
      ? 'Échec'
      : action.status === 'completed'
        ? 'Terminée'
        : status === 'running'
          ? 'En cours'
          : 'Sans résultat final';
  return (
    <li className="progress-action">
      <StateIcon
        status={action.status === 'running' && status !== 'running' ? 'pending' : action.status}
      />
      <div>
        <span className="progress-action-kind">
          {kindLabels[action.kind]} · {label}
        </span>
        <span className="progress-action-label">{action.label}</span>
        {action.path ? <code title={action.path}>{action.path}</code> : null}
        <div className="progress-action-meta">
          <time dateTime={action.at}>{stamp(action.at)}</time>
          {canOpen ? (
            <button type="button" onClick={onOpen} title="Voir ce fichier dans la version livrée">
              Ouvrir le fichier ↗
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
  const [limit, setLimit] = useState(12);
  const actions = snapshot.actions.slice(-limit);
  const revision = revisions
    .slice()
    .reverse()
    .find((entry) => entry.jobId === job.id);
  return (
    <details className="progress-actions">
      <summary>
        <span>Journal des actions</span>
        <span className="progress-count">
          {snapshot.truncated ? 'Dernières ' : ''}
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
              Voir les actions précédentes
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
            <p className="progress-note">Le journal est limité aux 200 dernières actions.</p>
          ) : null}
        </>
      ) : (
        <p className="progress-empty">Aucune action transmise pour cette demande.</p>
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
        {jobLabels[status]}
      </div>
      {job.worker ? <p className="progress-worker">Agent · {job.worker}</p> : null}
      {status === 'queued' ? (
        <p className="progress-empty">La demande attend un agent. Aucune exécution n’a commencé.</p>
      ) : null}
      {error ? (
        <div className="progress-error" role="status">
          <p>{error}</p>
          <button type="button" onClick={retry}>
            Réessayer
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
                Dernier événement : <time dateTime={live.updatedAt}>{stamp(live.updatedAt)}</time>
              </>
            ) : (
              'Aucun événement reçu.'
            )}
            {!error && status === 'running' ? ' · Actualisation automatique' : ''}
          </p>
        </>
      ) : !error ? (
        <p className="progress-empty">Lecture de l’avancement…</p>
      ) : null}
    </div>
  );
}
export function ProgressView(props: ProgressWidgetProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const job =
    props.jobs.find((entry) => entry.id === chosen) ??
    props.jobs.find((entry) => entry.status === 'running') ??
    props.jobs.find((entry) => entry.status === 'queued') ??
    props.jobs.at(-1);
  if (!job) return null;
  return (
    <section className="job-progress-card" aria-label="Plan et avancement">
      <div className="progress-heading">
        <h2>Plan et avancement</h2>
        <span className="progress-agent-badge">Agent</span>
      </div>
      {props.jobs.length > 1 ? (
        <label className="progress-job-picker">
          Demande suivie
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
