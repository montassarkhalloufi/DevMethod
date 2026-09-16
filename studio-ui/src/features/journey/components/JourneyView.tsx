import { journeyStages } from '../model/journey';
import { stageLabels } from '../model/navigation';
import { useJourneyActions } from '../hooks/useJourneyActions';
import { useJourneyNavigation } from '../hooks/useJourneyNavigation';
import type { JourneyOptions } from '../model/contracts';
import { DesignJourney } from './DesignJourney';
import { StageWorkspace } from './StageWorkspace';

export function JourneyView(options: JourneyOptions) {
  const stages = journeyStages(options.state);
  const actions = useJourneyActions(options);
  const navigation = useJourneyNavigation();
  const current = stages.find((stage) => stage.id === navigation.stage)!;
  return (
    <div className="journey-view">
      <header className="journey-heading">
        <p className="eyebrow">CONCEPTION DU PRODUIT</p>
        <h2>De l’idée au premier usage</h2>
        <p>Explorez, cadrez et concevez ici. Retrouvez chaque choix lorsque le produit évolue.</p>
      </header>
      <nav className="journey-navigation" aria-label="Espaces de conception">
        <ol>
          {stages.map((stage, index) => (
            <li key={stage.id}>
              <a
                href={`#journey-${stage.id}`}
                onClick={navigation.navigate}
                aria-current={stage.id === current.id ? 'step' : undefined}
              >
                <span aria-hidden="true">{index + 1}</span>
                {stageLabels[stage.id]}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {actions.error ? (
        <p className="inline-error" role="alert">
          {actions.error}
        </p>
      ) : null}
      <section className="journey-stage" aria-labelledby="journey-stage-title">
        <div className="journey-stage-heading">
          <h3 id="journey-stage-title">{current.title}</h3>
          <span className="journey-record-status">{current.status}</span>
        </div>
        <p className="journey-purpose">{current.purpose}</p>
        {current.id === 'design' ? (
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
            openPrototype={options.onOpenPrototype}
            navigation={navigation}
          />
        ) : (
          <StageWorkspace stage={current} state={options.state} prepare={actions.prepare} />
        )}
      </section>
      <p className="journey-action-note">
        Ces espaces ne sont pas des étapes obligatoires pour chaque changement. Une petite
        correction peut suivre un chemin court. Les traces disponibles ne signifient pas que tout a
        été validé.
      </p>
    </div>
  );
}
