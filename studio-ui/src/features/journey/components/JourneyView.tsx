import { journeyStages } from '../model/journey';
import { useJourneyActions } from '../hooks/useJourneyActions';
import type { JourneyOptions, StageSummary } from '../model/contracts';
import { DesignJourney } from './DesignJourney';

function StageCard({
  stage,
  prepare,
}: {
  stage: StageSummary;
  prepare: JourneyOptions['onRequest'];
}) {
  return (
    <section
      className="journey-stage"
      id={`journey-${stage.id}`}
      aria-labelledby={`journey-title-${stage.id}`}
    >
      <div className="journey-stage-heading">
        <h3 id={`journey-title-${stage.id}`}>{stage.title}</h3>
        <span className="journey-record-status">{stage.status}</span>
      </div>
      <p className="journey-purpose">{stage.purpose}</p>
      <ul className="journey-facts">
        {stage.facts.map((fact, index) => (
          <li key={`${stage.id}-${index}`}>{fact}</li>
        ))}
      </ul>
      <button type="button" onClick={() => prepare(stage.id, stage.request)}>
        Préparer la demande
      </button>
    </section>
  );
}
export function JourneyView(options: JourneyOptions) {
  const stages = journeyStages(options.state);
  const actions = useJourneyActions(options);
  return (
    <div className="journey-view">
      <header className="journey-heading">
        <p className="eyebrow">DE L’INTENTION AU PRODUIT</p>
        <h2>Le parcours de votre projet</h2>
        <p>
          Retrouvez les acquis, les choix et les étapes à approfondir. Une trace disponible ne
          signifie pas que l’étape est validée.
        </p>
      </header>
      <nav className="journey-navigation" aria-label="Étapes du projet">
        <ol>
          {stages.map((stage, index) => (
            <li key={stage.id}>
              <a href={`#journey-${stage.id}`}>
                <span aria-hidden="true">{index + 1}</span>
                {stage.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <p className="journey-action-note">
        « Préparer » rédige une demande dans la discussion. Cela ne lance pas une génération ni une
        validation.
      </p>
      {actions.error && (
        <p className="inline-error" role="alert">
          {actions.error}
        </p>
      )}
      <div className="journey-stages">
        {stages.map((stage) =>
          stage.id === 'design' ? (
            <section
              key={stage.id}
              className="journey-stage journey-design"
              id="journey-design"
              aria-labelledby="journey-title-design"
            >
              <div className="journey-stage-heading">
                <h3 id="journey-title-design">{stage.title}</h3>
                <span className="journey-record-status">{stage.status}</span>
              </div>
              <p className="journey-purpose">{stage.purpose}</p>
              <DesignJourney
                state={options.state}
                pending={actions.pending}
                choosing={actions.choosing}
                canApprove={Boolean(options.onApproveMaster)}
                canChoose={Boolean(options.onChooseDirection)}
                canPrepare={typeof options.onRequest === 'function'}
                approve={actions.approve}
                chooseDirection={actions.chooseDirection}
                prepare={actions.prepare}
              />
            </section>
          ) : (
            <StageCard key={stage.id} stage={stage} prepare={actions.prepare} />
          ),
        )}
      </div>
    </div>
  );
}
