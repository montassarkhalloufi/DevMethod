import type {
  HybridRiskReport,
  RiskFinding,
  SemanticFinding,
} from '../../../../src/control-plane/hybrid-contracts';
import type { SourceLink } from '../../../../src/control-plane/contracts';

const categories = {
  visual: 'Présentation',
  interaction: 'Interactions',
  network: 'Échanges réseau',
  concurrency: 'Concurrence et état partagé',
  permissions: 'Autorisations',
  logic: 'Logique',
};
const statuses = {
  running: 'Analyse en cours',
  completed: 'Analyse terminée',
  failed: 'Analyse échouée',
  cancelled: 'Analyse annulée',
  interrupted: 'Analyse interrompue',
};
const checks: Record<string, string> = {
  'visual-comparison': 'Comparaison visuelle',
  'end-to-end': 'Parcours de bout en bout',
  keyboard: 'Clavier et focus',
  'network-recovery': 'Délais, erreurs et ordre des réponses',
  concurrency: 'Concurrence et idempotence',
  authorization: 'Autorisations et isolation',
  'unit-tests': 'Tests des invariants',
};

function Finding({
  finding,
  report,
  open,
}: {
  finding: RiskFinding | SemanticFinding;
  report: HybridRiskReport;
  open: (link: SourceLink) => void;
}) {
  const revisionId = finding.side === 'before' ? report.baseRevisionId : report.revisionId;
  return (
    <li>
      <strong>{categories[finding.category]}</strong> — {finding.reason}
      <p>
        <button
          onClick={() =>
            open({ panel: 'code', path: finding.path, revisionId: revisionId ?? undefined })
          }
        >
          {finding.path}:{finding.line} · {finding.side === 'before' ? 'Avant' : 'Après'}
        </button>
      </p>
      {'scenario' in finding && (
        <>
          <p>
            <strong>À préserver :</strong> {finding.invariant}
          </p>
          <p>
            <strong>À vérifier :</strong> {finding.scenario}
          </p>
          <p>
            <strong>Incertitude :</strong> {finding.uncertainty}
          </p>
        </>
      )}
    </li>
  );
}

export function RiskAnalysis({
  report,
  busy,
  mutate,
  open,
}: {
  report: HybridRiskReport;
  busy: boolean;
  mutate: (action: string, input: object) => Promise<void>;
  open: (link: SourceLink) => void;
}) {
  const run = report.analysis;
  return (
    <section className="cp-detail-card cp-risk-analysis" aria-label="Analyse du changement">
      <h2>Comprendre ce qui change</h2>
      <p>
        {report.changedFiles.length} fichier(s) modifié(s) ·{' '}
        {report.categories.map((category) => categories[category]).join(' · ') ||
          'Périmètre à examiner'}
      </p>
      <p>
        Le contenu du changement détermine les vérifications. Une hypothèse IA peut en ajouter ;
        elle ne valide aucun test et n’accorde aucune permission.
      </p>
      <h3>Vérifications ciblées</h3>
      <ul className="cp-risk-checks">
        {report.checks.map((check) => (
          <li key={check}>
            <button
              onClick={() =>
                open({ panel: 'checks', checkId: check, revisionId: report.revisionId })
              }
            >
              {checks[check] ?? check}
            </button>
          </li>
        ))}
      </ul>
      <details>
        <summary>Constats de l’analyse syntaxique · {report.findings.length}</summary>
        <ul>
          {report.findings.map((finding, index) => (
            <Finding key={index} finding={finding} report={report} open={open} />
          ))}
        </ul>
      </details>
      <h3>Analyse contextuelle IA</h3>
      <p role="status">{run ? statuses[run.status] : 'Pas encore exécutée sur ce contexte'}</p>
      {!run && (
        <>
          <p>
            Transmet au modèle du runner local le code de cette version et de sa base, les critères
            et les décisions. Utilise le budget partagé du runner. Aucun accès aux outils du projet.
          </p>
          <button
            className="cp-primary"
            disabled={busy || !report.available}
            onClick={() =>
              void mutate('analyze', {
                revisionId: report.revisionId,
                contextKey: report.contextKey,
              })
            }
          >
            Analyser le changement avec l’IA
          </button>
          {!report.available && <p>{report.availability}</p>}
        </>
      )}
      {run?.status === 'running' && (
        <button disabled={busy} onClick={() => void mutate('cancel-analysis', { id: run.id })}>
          Annuler l’analyse
        </button>
      )}
      {run?.error && <p>{run.error}</p>}
      {run?.output && (
        <>
          <p>{run.output.summary}</p>
          <p className="cp-note">Hypothèses inférées, à confronter aux vérifications réelles.</p>
          <ul className="cp-risk-findings">
            {run.output.findings.map((finding, index) => (
              <Finding key={index} finding={finding} report={report} open={open} />
            ))}
          </ul>
          <ul>
            {run.output.limits.map((limit, index) => (
              <li key={index}>{limit}</li>
            ))}
          </ul>
        </>
      )}
      {run && (
        <p className="cp-note">
          {run.provider} ·{' '}
          {run.usage
            ? `${run.usage.inputTokens + run.usage.outputTokens} jetons mesurés`
            : 'Consommation non connue'}{' '}
          · coût monétaire non disponible. Une nouvelle version ou un nouveau contexte exige sa
          propre analyse.
        </p>
      )}
      {report.limits.length > 0 && (
        <details open>
          <summary>Limites de couverture</summary>
          <ul>
            {report.limits.map((limit, index) => (
              <li key={index}>{limit}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
