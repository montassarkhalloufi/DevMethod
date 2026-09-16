import type { JourneyOptions, JourneyState } from '../model/contracts';
import { designRecords } from '../model/journey';

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
}

function ReferenceImage({ state, id, title }: { state: JourneyState; id: string; title: string }) {
  const reference = state.references.find(
    (item) => item.id === id && item.mime.startsWith('image/'),
  );
  if (!reference)
    return <p className="journey-gap">Image de référence indisponible dans ce projet.</p>;
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
      <span className="sr-only">Ouvrir la référence {title}</span>
    </a>
  );
}
function MasterRecovery({ prepare, canPrepare }: Pick<Props, 'prepare' | 'canPrepare'>) {
  return (
    <>
      <p className="journey-gap">
        Cet accord historique ne suffit plus : vous avez repris la validation visuelle. Préparez un
        nouveau master à valider ; l’accord précédent reste conservé.
      </p>
      {canPrepare ? (
        <button
          type="button"
          onClick={() =>
            prepare(
              'design',
              'Prépare un nouveau master à partir de la direction courante pour ma validation visuelle explicite avant réalisation. Conserve l’ancien master et son accord historique sans les réécrire.',
            )
          }
        >
          Préparer un nouveau master
        </button>
      ) : (
        <p>
          La préparation n’est pas connectée dans cet hôte. Demandez un nouveau master à votre
          agent.
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
  const { master, stale, approvalInsufficient } = designRecords(state);
  if (!master)
    return (
      <div className="journey-step">
        <h4>2. Une référence détaillée</h4>
        <p>
          Le master n’est pas encore enregistré. Sélectionner une direction ne valide pas un écran
          détaillé.
        </p>
        <button
          type="button"
          onClick={() =>
            prepare(
              'design',
              'À partir de la direction visuelle choisie, produis un master détaillé du même écran. Conserve la composition, les contenus utiles et les états clés ; présente-le pour validation avant le code UI.',
            )
          }
        >
          Préparer le master
        </button>
      </div>
    );
  const status = approvalInsufficient
    ? 'Accord antérieur de l’agent — à réexaminer'
    : master.approvedBy === 'user'
      ? 'Master validé par vous'
      : master.approvedBy === 'agent'
        ? 'Master retenu par délégation'
        : 'Master proposé — à valider';
  return (
    <div className="journey-step">
      <h4>2. Une référence détaillée</h4>
      <p className="journey-record-status">{status}</p>
      {approvalInsufficient ? <MasterRecovery prepare={prepare} canPrepare={canPrepare} /> : null}
      {stale && (
        <p className="journey-gap">
          Ce master correspond à une autre direction. Réexaminez-le avant de poursuivre.
        </p>
      )}
      <ReferenceImage
        state={state}
        id={master.referenceId}
        title="Master détaillé de la direction"
      />
      {master.approvalReason && <p>{master.approvalReason}</p>}
      {!master.approvedBy && !stale && (
        <button
          type="button"
          className="primary"
          disabled={!canApprove || pending !== null || choosing !== null}
          onClick={() => void approve(master.id)}
        >
          {pending === master.id ? 'Validation en cours…' : 'Valider ce master'}
        </button>
      )}
      {!master.approvedBy && !canApprove && (
        <p>La validation du master n’est pas disponible dans cet hôte.</p>
      )}
    </div>
  );
}
function DerivedScreens({ state, prepare }: Pick<Props, 'state' | 'prepare'>) {
  const { screens, prototype, revision, stale } = designRecords(state);
  return (
    <>
      <div className="journey-step">
        <h4>3. Les écrans et leurs états</h4>
        <p>
          Décliner la référence retenue pour les autres écrans, le mobile, le chargement et les
          erreurs.
        </p>
        {stale && (
          <p className="journey-gap">
            La direction a changé : ces enregistrements doivent être réexaminés.
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
          <p className="journey-gap">Aucun écran dérivé lié au master courant.</p>
        )}
        <button
          type="button"
          onClick={() =>
            prepare(
              'design',
              'À partir du master approuvé, décline les écrans et états nécessaires : mobile, chargement, vide, erreur et reprise. Enregistre leurs références et leurs liens au master ; ne remplace pas ces images par une simple description.',
            )
          }
        >
          Préparer les déclinaisons
        </button>
      </div>
      <div className="journey-step">
        <h4>4. Le prototype interactif</h4>
        <p>
          {prototype && revision
            ? `Prototype relié à « ${revision.title} ». Les interactions et la fidélité restent à vérifier.`
            : 'Aucun prototype exécutable n’est relié au master courant. Une image ne prouve pas une interaction.'}
        </p>
        <button
          type="button"
          onClick={() =>
            prepare(
              'design',
              'Réalise un prototype interactif à partir du master approuvé et de ses écrans dérivés. Relie la version au master et vérifie dans le navigateur les interactions et la fidélité visuelle. Distingue les données simulées des fonctions exécutées.',
            )
          }
        >
          Préparer le prototype
        </button>
      </div>
    </>
  );
}
export function DesignJourney(props: Props) {
  const selected = props.state.designs.find((item) => item.id === props.state.selectedDesignId);
  return (
    <div className="design-journey">
      <div className="journey-step">
        <h4>1. Trois directions du même écran</h4>
        <p>Comparer des compositions distinctes avant de choisir une référence.</p>
        <div className="journey-image-grid">
          {props.state.designs.map((design) => (
            <figure key={design.id} data-selected={design.id === selected?.id}>
              <ReferenceImage state={props.state} id={design.file} title={design.title} />
              <figcaption>
                <strong>{design.title}</strong>
                {design.id === selected?.id && <span>Direction retenue</span>}
                <p>{design.description}</p>
              </figcaption>
              <button
                type="button"
                aria-label={`Choisir la direction ${design.title}`}
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
                  ? 'Enregistrement…'
                  : design.id === selected?.id
                    ? 'Direction retenue'
                    : 'Choisir cette direction'}
              </button>
            </figure>
          ))}
        </div>
        {!props.canChoose && (
          <p className="journey-gap">Le choix d’une direction n’est pas connecté dans cet hôte.</p>
        )}
        {props.state.designs.length < 3 && (
          <p className="journey-gap">
            {props.state.designs.length} direction(s) disponible(s) ; trois propositions comparables
            restent à réunir.
          </p>
        )}
        {selected && (
          <p>
            La direction « {selected.title} » est retenue. Les étapes suivantes restent distinctes.
          </p>
        )}
        <button
          type="button"
          onClick={() =>
            props.prepare(
              'design',
              'Crée trois directions visuelles réellement distinctes du même écran, à partir des références et de l’intention. Présente leurs différences pour choisir avant de développer le code UI.',
            )
          }
        >
          Préparer les directions
        </button>
      </div>
      <MasterReference {...props} />
      <DerivedScreens state={props.state} prepare={props.prepare} />
    </div>
  );
}
