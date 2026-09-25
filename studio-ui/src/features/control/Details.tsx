import { modeLabels, riskLabels, type ControlReport } from './model';
import { Icon } from './Icon';

export function Risks({ report }: { report: ControlReport }) {
  const { risk, nodes } = report.snapshot;
  return (
    <>
      <header className="cp-heading">
        <h1>Analyse des risques</h1>
        <p>Les signaux qui contribuent à la décision, avec leurs preuves et leurs limites.</p>
      </header>
      <div className="cp-explanation">
        <Icon name="risk" />
        <div>
          <h2>Risque {riskLabels[risk.level].toLowerCase()}</h2>
          <p>{risk.justification}</p>
        </div>
      </div>
      <div className="cp-risk-list">
        {risk.signals.map((signal) => (
          <article className="cp-detail-card" key={signal.id}>
            <span className={`cp-badge cp-${signal.level}`}>{riskLabels[signal.level]}</span>
            <h2>{signal.reason}</h2>
            <p>
              Facteur : {signal.category} ·{' '}
              {signal.humanResolvable
                ? 'Examen humain possible'
                : 'Observation ou vérification requise'}
            </p>
            <ul>
              {signal.evidenceIds.map((id) => (
                <li key={id}>{nodes.find((node) => node.id === id)?.label ?? id}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <section className="cp-detail-card">
        <h2>Projet et couverture du Studio</h2>
        <p>Projet : seuls les résultats des contrôles exécutés sont connus.</p>
        <p>
          Couverture Studio : {nodes.filter((node) => node.canRun).length} contrôles locaux
          disponibles. Les procédures externes non exécutées restent sans verdict.
        </p>
        <ul>
          {risk.limits.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function Autonomy({
  report,
  probe,
  busy,
  proceed,
}: {
  report: ControlReport;
  probe: () => void;
  busy: boolean;
  proceed: () => void;
}) {
  const { decision } = report.snapshot;
  return (
    <>
      <header className="cp-heading">
        <h1>Autonomie adaptative</h1>
        <p>Une politique explicable, versionnée et inspectable.</p>
      </header>
      <div className="cp-metrics">
        <div>
          <Icon name="person" />
          <span>
            Demandée<strong>{modeLabels[decision.requested]}</strong>
          </span>
        </div>
        <div>
          <Icon name="shield" />
          <span>
            Effective<strong>{decision.effective}</strong>
          </span>
        </div>
        <div>
          <span>
            Politique<strong>{report.policy.id}</strong>
          </span>
        </div>
      </div>
      <section className="cp-detail-card">
        <h2>Ce que l’agent peut faire maintenant</h2>
        <ul>
          {decision.allowedActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
        <p>
          Les permissions MCP et les validations réservées continuent de s’appliquer à chaque
          action.
        </p>
        <button
          className="cp-primary"
          disabled={busy || !report.continuation?.available}
          onClick={proceed}
        >
          Appliquer la version vérifiée
        </button>
        <p>{report.continuation?.reason ?? 'État de continuation indisponible.'}</p>
      </section>
      <section className="cp-detail-card">
        <h2>Conditions pour poursuivre</h2>
        <ul>
          {decision.conditions.map((condition, index) => (
            <li key={index}>{condition}</li>
          ))}
        </ul>
        {!decision.conditions.length && (
          <p>Aucune condition supplémentaire détectée dans le périmètre observé.</p>
        )}
      </section>
      <section className="cp-detail-card">
        <h2>{report.policy.title}</h2>
        <ol>
          {report.policy.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
        <p>
          Calibration automatique : désactivée. Aucune décision humaine ne modifie silencieusement
          cette politique.
        </p>
        <button disabled={busy} onClick={probe}>
          Observer les services locaux
        </button>
        <p className="cp-note">
          Sonde réelle du stockage embarqué ; ne démontre ni les règles métier ni un audit de
          sécurité dynamique.
        </p>
      </section>
    </>
  );
}

export function History({ report }: { report: ControlReport }) {
  return (
    <>
      <header className="cp-heading">
        <h1>Historique du Control Plane</h1>
        <p>Décisions conservées avec leur contexte et leur politique.</p>
      </header>
      <div className="cp-history">
        {[...report.history].reverse().map((entry, index) => (
          <details className="cp-detail-card" key={`${entry.key}:${index}`}>
            <summary>
              <span className={`cp-badge cp-${entry.risk.level}`}>{entry.decision.effective}</span>{' '}
              {entry.input.action.label} ·{' '}
              <time dateTime={entry.input.at}>
                {new Date(entry.input.at).toLocaleString('fr-FR')}
              </time>
            </summary>
            <dl>
              <dt>Version</dt>
              <dd>{entry.input.revisionId ?? 'Aucune'}</dd>
              <dt>Demandée / effective</dt>
              <dd>
                {modeLabels[entry.decision.requested]} / {entry.decision.effective}
              </dd>
              <dt>Risque</dt>
              <dd>{riskLabels[entry.risk.level]}</dd>
              <dt>Politique</dt>
              <dd>{entry.decision.policyId}</dd>
              <dt>Preuves actuelles</dt>
              <dd>
                {entry.evidence.current} / {entry.evidence.required}
              </dd>
              <dt>Interventions humaines</dt>
              <dd>{entry.interventionIds.length}</dd>
            </dl>
            <p>{entry.decision.justification}</p>
            <ul>
              {entry.risk.evidenceIds.map((id) => (
                <li key={id}>{entry.nodes.find((node) => node.id === id)?.label ?? id}</li>
              ))}
            </ul>
            {entry.interventionIds.map((id) => (
              <p key={id}>{report.interventions.find((item) => item.id === id)?.reason}</p>
            ))}
          </details>
        ))}
      </div>
      <details className="cp-detail-card">
        <summary>Transitions et marquages lus · {report.transitions.length}</summary>
        <ol>
          {report.transitions.map((entry) => (
            <li key={entry.id}>
              <time dateTime={entry.at}>{new Date(entry.at).toLocaleString('fr-FR')}</time> ·{' '}
              {entry.explanation}
            </li>
          ))}
        </ol>
      </details>
    </>
  );
}
