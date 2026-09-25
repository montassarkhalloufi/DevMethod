import {
  decisionLabels,
  modeLabels,
  riskLabels,
  openItems,
  type ControlReport,
  type ControlView,
} from './model';
import { Icon } from './Icon';

export function Overview({
  report,
  navigate,
  run,
  busy,
}: {
  report: ControlReport;
  navigate: (view: ControlView, missing?: boolean) => void;
  run: () => void;
  busy: boolean;
}) {
  const { snapshot } = report,
    { decision, risk, evidence } = snapshot;
  const attention = openItems(report).filter((item) => item.expectedAction !== 'renew').length;
  const cards = [
    {
      view: 'graph' as const,
      title: 'Evidence Graph',
      icon: 'graph',
      color: 'cyan',
      description: 'Relie exigences, code, tests et preuves.',
      value: `${evidence.current} / ${evidence.required}`,
      detail: 'preuves actuelles',
      link: 'Voir le graphe',
    },
    {
      view: 'risks' as const,
      title: 'Risk Engine',
      icon: 'risk',
      color: 'violet',
      description: 'Évalue l’impact et la sécurité.',
      value: `Risque ${riskLabels[risk.level].toLowerCase()}`,
      detail: `${risk.signals.length} signaux à examiner`,
      link: 'Voir l’analyse',
    },
    {
      view: 'attention' as const,
      title: 'Attention humaine',
      icon: 'person',
      color: 'amber',
      description: 'Concentre l’attention sur ce qui compte.',
      value: `${attention} décision${attention > 1 ? 's' : ''} requise${attention > 1 ? 's' : ''}`,
      detail: '',
      link: 'Voir la file d’attente',
    },
    {
      view: 'autonomy' as const,
      title: 'Autonomie adaptative',
      icon: 'settings',
      color: 'green',
      description: 'Ajuste automatiquement le niveau d’autonomie.',
      value: decision.effective,
      detail: decisionLabels[decision.effective],
      link: 'Voir les paramètres',
    },
  ];
  const canRun = snapshot.nodes.some((node) => node.canRun);
  return (
    <>
      <header className="cp-heading cp-overview-heading">
        <h1>Control Plane</h1>
        <p>Vue d’ensemble du système d’autonomie</p>
      </header>
      <div className="cp-metrics">
        <div className="cp-green">
          <Icon name="play" />
          <span>
            Demandée<strong>{modeLabels[decision.requested]}</strong>
          </span>
        </div>
        <div className="cp-cyan">
          <Icon name="search" />
          <span>
            Effective<strong>{decision.effective}</strong>
          </span>
        </div>
        <div className="cp-amber">
          <Icon name="risk" />
          <span>
            Risque<strong>{riskLabels[risk.level]}</strong>
          </span>
        </div>
        <div className="cp-cyan">
          <Icon name="document" />
          <span>
            Preuves
            <strong>
              {evidence.current}/{evidence.required} actuelles
            </strong>
          </span>
        </div>
        <div className="cp-green">
          <Icon name="shield" />
          <span>
            Décision<strong className="cp-small">{decisionLabels[decision.effective]}</strong>
          </span>
        </div>
      </div>
      <div className="cp-explanation">
        <Icon name="info" />
        <div>
          <h2>Pourquoi l’autonomie a changé</h2>
          <p>
            {evidence.missing
              ? `${evidence.missing} preuve(s) requise(s) sont à compléter sur cette version.`
              : decision.justification}
          </p>
        </div>
        <button onClick={() => navigate('graph', true)}>
          Voir les preuves manquantes <span aria-hidden="true">→</span>
        </button>
      </div>
      <div className="cp-cards">
        {cards.map((card) => (
          <button
            key={card.view}
            className={`cp-card cp-${card.color}`}
            onClick={() => navigate(card.view)}
          >
            <Icon name={card.icon} />
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <strong>{card.value}</strong>
            <small>{card.detail || '\u00a0'}</small>
            <span className="cp-card-link">
              {card.link} <span aria-hidden="true">→</span>
            </span>
          </button>
        ))}
      </div>
      <section className="cp-path">
        <h2>Chemin de décision</h2>
        <p>De l’évaluation à l’action, avec un niveau d’autonomie adapté.</p>
        <div>
          {(['Auto-Continue', 'Verify', 'Human Decision', 'Bounded Stop'] as const).map(
            (step, index) => (
              <div
                key={step}
                className={`cp-step cp-${['green', 'violet', 'amber', 'red'][index]} ${decision.effective === step ? 'is-current' : ''}`}
                aria-current={decision.effective === step ? 'step' : undefined}
              >
                <Icon name={['play', 'search', 'person', 'stop'][index]!} />
                <div>
                  <strong>{step === 'Human Decision' ? 'Décision humaine' : step}</strong>
                  <span>
                    {['Risque faible', 'Risque moyen', 'Risque élevé', 'Non-convergence'][index]}
                  </span>
                  <small>
                    {
                      [
                        'Preuves suffisantes',
                        'Vérifications renforcées',
                        'Intervention requise',
                        'ou risque critique',
                      ][index]
                    }
                  </small>
                </div>
              </div>
            ),
          )}
        </div>
      </section>
      <div className="cp-main-actions">
        <button className="cp-primary" disabled={busy || !canRun} onClick={run}>
          <Icon name="play" />
          {busy ? 'Vérifications en cours…' : 'Lancer les vérifications'}
        </button>
        <button onClick={() => navigate('graph', true)}>
          <Icon name="search" />
          Voir les preuves manquantes
        </button>
      </div>
      {!canRun && (
        <p className="cp-note">
          Aucun contrôle local disponible pour cette version. Consultez les procédures dans
          Vérifications.
        </p>
      )}
    </>
  );
}
