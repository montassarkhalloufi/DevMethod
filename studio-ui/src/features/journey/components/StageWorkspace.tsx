import { useI18n } from '../../../i18n';
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
  const { t } = useI18n();
  return (
    <div className="journey-brief">
      <section className="journey-brief-section journey-outcome">
        <h4>{t('Le résultat attendu', 'Expected outcome')}</h4>
        <p>
          {brief.outcome ||
            t(
              'Le résultat attendu reste à préciser.',
              'The expected outcome still needs clarification.',
            )}
        </p>
      </section>
      <div className="journey-brief-columns">
        <BriefList
          title={t('Dans le périmètre', 'In scope')}
          items={brief.scope}
          empty={t('Le périmètre reste à préciser.', 'The scope still needs clarification.')}
        />
        <BriefList
          title={t('Hors périmètre', 'Out of scope')}
          items={brief.excluded}
          empty={t(
            'Les exclusions restent à préciser.',
            'The exclusions still need clarification.',
          )}
        />
      </div>
      <BriefList
        title={t('Comment juger le résultat', 'How to assess the outcome')}
        items={brief.criteria.map((item) => item.text)}
        empty={t('Aucun critère observable enregistré.', 'No observable criteria recorded.')}
      />
      <p className="journey-action-note">
        {' '}
        {t(
          'Ce cadrage est enregistré. Sa présence ne vaut pas approbation ni réussite des critères.',
          'This brief is saved. Its presence does not imply approval or that criteria have been met.',
        )}{' '}
      </p>
    </div>
  );
}
function ProjectReferences({ references }: Pick<JourneyState, 'references'>) {
  const { t } = useI18n();
  return (
    <section className="journey-brief-section">
      <h4>{t('Références conservées', 'Preserved references')}</h4>
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
        <p className="journey-gap">
          {t('Aucune référence jointe à ce projet.', 'No references attached to this project.')}
        </p>
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
  const { t } = useI18n();
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
          {' '}
          {t(
            'Un choix actif n’est pas une preuve ; les hypothèses restent à éprouver. Les sources, observations et résultats d’expériences ne disposent pas encore d’un espace structuré ici.',
            'An active decision is not evidence; assumptions still need testing. Sources, observations, and experiment results do not yet have a structured workspace here.',
          )}{' '}
        </p>
      ) : null}
      <div className="journey-stage-action">
        <button type="button" className="primary" onClick={() => prepare(stage.id, stage.request)}>
          {' '}
          {t('Préparer une demande', 'Prepare a request')}{' '}
        </button>
        <p>
          {' '}
          {t(
            'La demande sera placée dans la conversation. Vous pourrez la modifier avant de l’envoyer.',
            'The request will be placed in the conversation. You can edit it before sending.',
          )}{' '}
        </p>
      </div>
    </>
  );
}
