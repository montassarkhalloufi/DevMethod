import { useI18n } from '../../../i18n';
import type { JourneyOptions, JourneyState } from '../model/contracts';
import { designRecords } from '../model/journey';
import { designSteps } from '../model/navigation';
import type { useJourneyNavigation } from '../hooks/useJourneyNavigation';

interface Props {
  state: JourneyState;
  pending: string | null;
  choosing: string | null;
  canApprove: boolean;
  canChoose: boolean;
  canPrepare: boolean;
  approve(id: string): Promise<void>;
  chooseDirection(id: string): Promise<void>;
  prepare: JourneyOptions['onRequest'];
  openPrototype?: JourneyOptions['onOpenPrototype'];
  navigation: ReturnType<typeof useJourneyNavigation>;
}

function ReferenceImage({ state, id, title }: { state: JourneyState; id: string; title: string }) {
  const { t } = useI18n();
  const reference = state.references.find(
    (item) => item.id === id && item.mime.startsWith('image/'),
  );
  if (!reference)
    return (
      <p className="journey-gap">
        {t(
          'Image de référence indisponible dans ce projet.',
          'Reference image unavailable in this project.',
        )}
      </p>
    );
  return (
    <a
      href={`/references/${encodeURIComponent(reference.id)}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src={`/references/${encodeURIComponent(reference.id)}`}
        alt={title}
        width={600}
        height={400}
        loading="lazy"
      />
      <span className="sr-only">
        {t('Ouvrir la référence', 'Open reference')} {title}
      </span>
    </a>
  );
}
function MasterRecovery({ prepare, canPrepare }: Pick<Props, 'prepare' | 'canPrepare'>) {
  const { t } = useI18n();
  return (
    <>
      <p className="journey-gap">
        {' '}
        {t(
          'Cet accord historique ne suffit plus : vous avez repris la validation visuelle. Préparez un nouveau master à valider ; l’accord précédent reste conservé.',
          'This historical approval is no longer sufficient: you have taken back visual approval. Prepare a new master for approval; the previous approval is preserved.',
        )}{' '}
      </p>
      {canPrepare ? (
        <button
          type="button"
          onClick={() =>
            prepare(
              'design',
              t(
                'Prépare un nouveau master à partir de la direction courante pour ma validation visuelle explicite avant réalisation. Conserve l’ancien master et son accord historique sans les réécrire.',
                'Prepare a new master from the current direction for my explicit visual approval before implementation. Preserve the previous master and its historical approval without rewriting them.',
              ),
            )
          }
        >
          {' '}
          {t('Préparer un nouveau master', 'Prepare a new master')}{' '}
        </button>
      ) : (
        <p>
          {' '}
          {t(
            'La préparation n’est pas connectée dans cet hôte. Demandez un nouveau master à votre agent.',
            'Preparation is not connected in this host. Ask your agent for a new master.',
          )}{' '}
        </p>
      )}
    </>
  );
}

function MasterReference({
  state,
  pending,
  choosing,
  canApprove,
  canPrepare,
  approve,
  prepare,
}: Props) {
  const { t } = useI18n();
  const { master, stale, approvalInsufficient } = designRecords(state);
  if (!master)
    return (
      <div className="journey-step">
        <h4>{t('2. Une référence détaillée', '2. A detailed reference')}</h4>
        <p>
          {' '}
          {t(
            'Le master n’est pas encore enregistré. Sélectionner une direction ne valide pas un écran détaillé.',
            'The master has not been saved yet. Selecting a direction does not approve a detailed screen.',
          )}{' '}
        </p>
        <button
          type="button"
          onClick={() =>
            prepare(
              'design',
              t(
                'À partir de la direction visuelle choisie, produis un master détaillé du même écran. Conserve la composition, les contenus utiles et les états clés ; présente-le pour validation avant le code UI.',
                'Create a detailed master of the same screen from the selected visual direction. Preserve the composition, useful content, and key states; present it for approval before writing UI code.',
              ),
            )
          }
        >
          {' '}
          {t('Préparer le master', 'Prepare master')}{' '}
        </button>
      </div>
    );
  const status = approvalInsufficient
    ? t('Accord antérieur de l’agent — à réexaminer', 'Previous agent approval — review required')
    : master.approvedBy === 'user'
      ? t('Master validé par vous', 'Master approved by you')
      : master.approvedBy === 'agent'
        ? t('Master retenu par délégation', 'Master selected under delegation')
        : t('Master proposé — à valider', 'Proposed master — awaiting approval');
  return (
    <div className="journey-step">
      <h4>{t('2. Une référence détaillée', '2. A detailed reference')}</h4>
      <p className="journey-record-status">{status}</p>
      {approvalInsufficient ? <MasterRecovery prepare={prepare} canPrepare={canPrepare} /> : null}
      {stale && (
        <p className="journey-gap">
          {' '}
          {t(
            'Ce master correspond à une autre direction. Réexaminez-le avant de poursuivre.',
            'This master belongs to another direction. Review it before continuing.',
          )}{' '}
        </p>
      )}
      <ReferenceImage
        state={state}
        id={master.referenceId}
        title={t('Master détaillé de la direction', 'Detailed master of the direction')}
      />
      {master.approvalReason && <p>{master.approvalReason}</p>}
      {!master.approvedBy && !stale && (
        <button
          type="button"
          className="primary"
          disabled={!canApprove || pending !== null || choosing !== null}
          onClick={() => void approve(master.id)}
        >
          {pending === master.id
            ? t('Validation en cours…', 'Approving…')
            : t('Valider ce master', 'Approve this master')}
        </button>
      )}
      {!master.approvedBy && !canApprove && (
        <p>
          {t(
            'La validation du master n’est pas disponible dans cet hôte.',
            'Master approval is unavailable in this host.',
          )}
        </p>
      )}
    </div>
  );
}
function DerivedScreens({ state, prepare }: Pick<Props, 'state' | 'prepare'>) {
  const { t } = useI18n();
  const { screens, stale } = designRecords(state);
  return (
    <div className="journey-step">
      <h4>{t('3. Les écrans et leurs états', '3. Screens and their states')}</h4>
      <p>
        {' '}
        {t(
          'Décliner la référence retenue pour les autres écrans, le mobile, le chargement et les erreurs.',
          'Extend the selected reference to other screens, mobile, loading, and errors.',
        )}{' '}
      </p>
      {stale && (
        <p className="journey-gap">
          {' '}
          {t(
            'La direction a changé : ces enregistrements doivent être réexaminés.',
            'The direction has changed: these records need review.',
          )}{' '}
        </p>
      )}
      {screens.length ? (
        <div className="journey-image-grid">
          {screens.map((screen) => (
            <figure key={screen.id}>
              <ReferenceImage state={state} id={screen.referenceId} title={screen.title} />
              <figcaption>{screen.title}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="journey-gap">
          {t(
            'Aucun écran dérivé lié au master courant.',
            'No derived screens are linked to the current master.',
          )}
        </p>
      )}
      <button
        type="button"
        onClick={() =>
          prepare(
            'design',
            t(
              'À partir du master approuvé, décline les écrans et états nécessaires : mobile, chargement, vide, erreur et reprise. Enregistre leurs références et leurs liens au master ; ne remplace pas ces images par une simple description.',
              'From the approved master, create the required screens and states: mobile, loading, empty, error, and recovery. Save their references and links to the master; do not replace these images with a description alone.',
            ),
          )
        }
      >
        {' '}
        {t('Préparer les déclinaisons', 'Prepare derived screens')}{' '}
      </button>
    </div>
  );
}
function Prototype({
  state,
  prepare,
  openPrototype,
}: Pick<Props, 'state' | 'prepare' | 'openPrototype'>) {
  const { t } = useI18n();
  const { prototype, revision, stale, approvalInsufficient, master } = designRecords(state);
  const needsReview = stale || approvalInsufficient || !master?.approvedBy;
  return (
    <div className="journey-step">
      <h4>{t('4. Le prototype interactif', '4. The interactive prototype')}</h4>
      {prototype && needsReview ? (
        <p className="journey-gap">
          {' '}
          {t(
            'Ce prototype est conservé pour examen. Son master est à réexaminer ou à valider avant toute nouvelle réalisation ; l’ouverture ne vaut pas accord.',
            'This prototype is kept for review. Its master needs review or approval before further implementation; opening it does not imply approval.',
          )}{' '}
        </p>
      ) : null}
      <p>
        {prototype && revision
          ? t(
              'Prototype relié à « {title} ». Les interactions et la fidélité restent à vérifier.',
              'Prototype linked to “{title}”. Interactions and fidelity still need verification.',
              { title: revision.title },
            )
          : t(
              'Aucun prototype exécutable n’est relié au master courant. Une image ne prouve pas une interaction.',
              'No runnable prototype is linked to the current master. An image does not prove an interaction.',
            )}
      </p>
      <p>
        {' '}
        {t(
          'Ce prototype éprouve le parcours d’usage. Un POC technique peut être mené séparément pour une hypothèse d’architecture risquée.',
          'This prototype tests the user journey. A technical proof of concept can separately test a risky architecture assumption.',
        )}{' '}
      </p>
      {prototype && revision && openPrototype ? (
        <button type="button" className="primary" onClick={() => openPrototype(revision.id)}>
          {' '}
          {t('Essayer ce prototype', 'Try this prototype')}{' '}
        </button>
      ) : null}
      {prototype && revision ? (
        <p>
          {t(
            'Ouvrir cette version ne l’active pas et ne valide pas ses interactions.',
            'Opening this version does not activate it or validate its interactions.',
          )}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() =>
          prepare(
            'design',
            t(
              'Réalise un prototype interactif à partir du master approuvé et de ses écrans dérivés. Relie la version au master et vérifie dans le navigateur les interactions et la fidélité visuelle. Distingue les données simulées des fonctions exécutées.',
              'Build an interactive prototype from the approved master and its derived screens. Link the version to the master and verify interactions and visual fidelity in the browser. Distinguish simulated data from executed features.',
            ),
          )
        }
      >
        {' '}
        {t('Préparer le prototype', 'Prepare prototype')}{' '}
      </button>
    </div>
  );
}
export function DesignJourney(props: Props) {
  const { locale, t } = useI18n();
  const selected = props.state.designs.find((item) => item.id === props.state.selectedDesignId);
  const navigation = props.navigation;
  return (
    <div className="design-journey">
      <nav
        className="design-step-navigation"
        aria-label={t('Jalons du design', 'Design milestones')}
      >
        {Object.entries(designSteps(locale)).map(([id, label], index) => (
          <a
            key={id}
            href={`#journey-design-${id}`}
            onClick={navigation.navigate}
            aria-current={id === navigation.step ? 'step' : undefined}
          >
            <span>{index + 1}</span> {label}
          </a>
        ))}
      </nav>
      {navigation.step === 'directions' ? (
        <div className="journey-step">
          <h4>
            {t(
              '1. Comparer les directions du même écran',
              '1. Compare directions for the same screen',
            )}
          </h4>
          <p>
            {' '}
            {t(
              'Pour une nouvelle identité : trois compositions distinctes du même contenu, sauf autre format convenu. Une direction déjà approuvée peut être conservée.',
              'For a new identity: three distinct compositions of the same content, unless another format is agreed. An already approved direction may be kept.',
            )}{' '}
          </p>
          <div className="journey-image-grid">
            {props.state.designs.map((design) => (
              <figure key={design.id} data-selected={design.id === selected?.id}>
                <ReferenceImage state={props.state} id={design.file} title={design.title} />
                <figcaption>
                  <strong>{design.title}</strong>
                  {design.id === selected?.id && (
                    <span>{t('Direction retenue', 'Selected direction')}</span>
                  )}
                  <p>{design.description}</p>
                </figcaption>
                <button
                  type="button"
                  aria-label={t('Choisir la direction {title}', 'Choose direction {title}', {
                    title: design.title,
                  })}
                  aria-pressed={design.id === selected?.id}
                  disabled={
                    !props.canChoose ||
                    props.pending !== null ||
                    props.choosing !== null ||
                    design.id === selected?.id
                  }
                  onClick={() => void props.chooseDirection(design.id)}
                >
                  {props.choosing === design.id
                    ? t('Enregistrement…', 'Saving…')
                    : design.id === selected?.id
                      ? t('Direction retenue', 'Selected direction')
                      : t('Choisir cette direction', 'Choose this direction')}
                </button>
              </figure>
            ))}
          </div>
          {!props.canChoose && (
            <p className="journey-gap">
              {' '}
              {t(
                'Le choix d’une direction n’est pas connecté dans cet hôte.',
                'Direction selection is not connected in this host.',
              )}{' '}
            </p>
          )}
          {props.state.designs.length < 3 && (
            <p className="journey-gap">
              {props.state.designs.length}{' '}
              {t(
                'direction(s) disponible(s). Pour une nouvelle identité sans exception convenue, réunissez trois propositions comparables.',
                'direction(s) available. For a new identity without an agreed exception, prepare three comparable proposals.',
              )}{' '}
            </p>
          )}
          {selected && (
            <p>
              {t(
                'La direction « {title} » est retenue. Les étapes suivantes restent distinctes.',
                'Direction “{title}” is selected. The following steps remain separate.',
                { title: selected.title },
              )}
            </p>
          )}
          <button
            type="button"
            onClick={() =>
              props.prepare(
                'design',
                t(
                  'Crée trois directions visuelles réellement distinctes du même écran, à partir des références et de l’intention. Présente leurs différences pour choisir avant de développer le code UI.',
                  'Create three distinct visual directions for the same screen from the references and intent. Present their differences to choose a direction before developing UI code.',
                ),
              )
            }
          >
            {t('Préparer les directions', 'Prepare directions')}
          </button>
        </div>
      ) : null}
      {navigation.step === 'master' ? <MasterReference {...props} /> : null}
      {navigation.step === 'screens' ? (
        <DerivedScreens state={props.state} prepare={props.prepare} />
      ) : null}
      {navigation.step === 'prototype' ? (
        <Prototype
          state={props.state}
          prepare={props.prepare}
          openPrototype={props.openPrototype}
        />
      ) : null}
      <p className="journey-action-note">
        {' '}
        {t(
          '« Préparer » rédige une demande dans la conversation. Cela ne génère aucune image et ne lance aucune réalisation.',
          '“Prepare” drafts a request in the conversation. It does not generate images or start implementation.',
        )}{' '}
      </p>
    </div>
  );
}
