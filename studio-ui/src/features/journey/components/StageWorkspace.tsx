import type { JourneyOptions, JourneyState, StageSummary } from '../model/contracts';
import { ProjectOrigin } from './ProjectOrigin';

function BriefList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <section className="journey-brief-section">
      <h4>{title}</h4>
      {items.length > 0 ? (
        <ul className="journey-facts">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="journey-gap">{empty}</p>
      )}
    </section>
  );
}
function FrameWorkspace({ brief }: { brief: JourneyState['brief'] }) {
  return (
    <div className="journey-brief">
      <section className="journey-brief-section journey-outcome">
        <h4>Le résultat attendu</h4>
        <p>{brief.outcome || 'Le résultat attendu reste à préciser.'}</p>
      </section>
      <div className="journey-brief-columns">
        <BriefList
          title="Dans le périmètre"
          items={brief.scope}
          empty="Le périmètre reste à préciser."
        />
        <BriefList
          title="Hors périmètre"
          items={brief.excluded}
          empty="Les exclusions restent à préciser."
        />
      </div>
      <BriefList
        title="Comment juger le résultat"
        items={brief.criteria.map((item) => item.text)}
        empty="Aucun critère observable enregistré."
      />
      <p className="journey-action-note">
        Ce cadrage est enregistré. Sa présence ne vaut pas approbation ni réussite des critères.
      </p>
    </div>
  );
}
function ProjectReferences({ references }: Pick<JourneyState, 'references'>) {
  return (
    <section className="journey-brief-section">
      <h4>Références conservées</h4>
      {references.length > 0 ? (
        <ul className="journey-facts">
          {references.map((reference) => (
            <li key={reference.id}>
              <a
                href={`/references/${encodeURIComponent(reference.id)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {reference.name}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="journey-gap">Aucune référence jointe à ce projet.</p>
      )}
    </section>
  );
}
export function StageWorkspace({
  stage,
  state,
  prepare,
  onOpenSource,
}: {
  stage: StageSummary;
  state: JourneyState;
  prepare: JourneyOptions['onRequest'];
  onOpenSource?: JourneyOptions['onOpenSource'];
}) {
  return (
    <>
      {stage.id === 'foundation' ? (
        <ProjectOrigin state={state} onOpenSource={onOpenSource} />
      ) : null}
      {stage.id === 'frame' ? (
        <FrameWorkspace brief={state.brief} />
      ) : (
        <ul className="journey-facts">
          {stage.facts.map((fact, index) => (
            <li key={`${stage.id}-${index}`}>{fact}</li>
          ))}
        </ul>
      )}
      {stage.id === 'foundation' ? <ProjectReferences references={state.references} /> : null}
      {stage.id === 'exploration' ? (
        <p className="journey-action-note">
          Un choix actif n’est pas une preuve ; les hypothèses restent à éprouver. Les sources,
          observations et résultats d’expériences ne disposent pas encore d’un espace structuré ici.
        </p>
      ) : null}
      <div className="journey-stage-action">
        <button type="button" className="primary" onClick={() => prepare(stage.id, stage.request)}>
          Préparer une demande
        </button>
        <p>
          La demande sera placée dans la conversation. Vous pourrez la modifier avant de l’envoyer.
        </p>
      </div>
    </>
  );
}
