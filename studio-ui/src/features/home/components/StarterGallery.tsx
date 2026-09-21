import { useI18n, translate, type StudioLocale } from '../../../i18n';
import { useEffect, useId, useRef, useState } from 'react';
import {
  filterStarters,
  starters,
  starterCategories,
  type Starter,
  type StarterCategory,
  type StarterId,
  type StarterSeed,
} from '../model/starters';

function PortfolioPreview() {
  const { t } = useI18n();
  const [filter, setFilter] = useState('all');
  const categoryLabels: Record<string, string> = {
    all: t('Tous', 'All'),
    identity: t('Identité', 'Identity'),
    editorial: t('Édition', 'Editorial'),
  };
  const projects = [
    { name: t('Formes libres', 'Free forms'), category: 'identity', tone: 'coral' },
    { name: t('Objets sensibles', 'Sensitive objects'), category: 'editorial', tone: 'blue' },
    { name: t('Nouveaux regards', 'New perspectives'), category: 'identity', tone: 'lime' },
  ];
  return (
    <div className="sg-preview sg-atelier">
      <div className="sg-mini-nav">
        <b>atelier.</b>
        <span>{t('STUDIO INDÉPENDANT · DÉMO', 'INDEPENDENT STUDIO · DEMO')}</span>
      </div>
      <div className="sg-editorial-hero">
        <h3>
          {' '}
          {t('Des idées', 'Ideas')} <br /> {t('qui prennent', 'taking')}{' '}
          <em>{t('forme.', 'shape.')}</em>
        </h3>
        <div className="sg-sculpture" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
      <div
        className="sg-mini-controls"
        aria-label={t('Discipline des projets', 'Project discipline')}
      >
        {['all', 'identity', 'editorial'].map((value) => (
          <button
            type="button"
            key={categoryLabels[value]}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {categoryLabels[value]}
          </button>
        ))}
      </div>
      <ul className="sg-portfolio-list" aria-label={t('Projets démo', 'Demo projects')}>
        {projects
          .filter((project) => filter === 'all' || project.category === filter)
          .map((project) => (
            <li key={project.name}>
              <span className={`sg-project-art sg-art-${project.tone}`} aria-hidden="true" />
              <b>{project.name}</b>
              <small>{categoryLabels[project.category]}</small>
            </li>
          ))}
      </ul>
    </div>
  );
}

function activity(locale: StudioLocale = 'en') {
  return {
    week: {
      label: translate('7 jours', '7 days', undefined, locale),
      total: new Intl.NumberFormat(locale).format(1284),
      change: new Intl.NumberFormat(locale, { style: 'percent', signDisplay: 'always' }).format(
        0.12,
      ),
      bars: [34, 48, 40, 65, 54, 79, 92],
    },
    month: {
      label: translate('30 jours', '30 days', undefined, locale),
      total: new Intl.NumberFormat(locale).format(5460),
      change: new Intl.NumberFormat(locale, { style: 'percent', signDisplay: 'always' }).format(
        0.18,
      ),
      bars: [46, 68, 52, 86, 66, 74, 98],
    },
  };
}

function DashboardPreview() {
  const { locale, t } = useI18n();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const data = activity(locale)[period];
  return (
    <div className="sg-preview sg-pulse">
      <div className="sg-mini-nav">
        <b>
          <span aria-hidden="true">◈</span> pulse
        </b>
        <span>{t('ESPACE DÉMO', 'DEMO WORKSPACE')}</span>
      </div>
      <div className="sg-dashboard-heading">
        <div>
          <small>{t('VUE D’ENSEMBLE', 'OVERVIEW')}</small>
          <h3>{t('Chaque signal compte.', 'Every signal matters.')}</h3>
        </div>
        <div
          className="sg-mini-controls"
          aria-label={t('Période des données démo', 'Demo data period')}
        >
          {(['week', 'month'] as const).map((key) => (
            <button
              type="button"
              key={key}
              aria-pressed={period === key}
              onClick={() => setPeriod(key)}
            >
              {activity(locale)[key].label}
            </button>
          ))}
        </div>
      </div>
      <div className="sg-metrics">
        <div>
          <span>
            {t('Visites ·', 'Visits ·')} {data.label}
          </span>
          <strong aria-live="polite">{data.total}</strong>
          <small>
            {data.change} {t('· données fictives', '· sample data')}
          </small>
        </div>
        <div>
          <span>{t('Objectif de la démo', 'Demo target')}</span>
          <strong>
            78<small> %</small>
          </strong>
          <span className="sg-meter" aria-hidden="true" />
        </div>
      </div>
      <div
        className="sg-chart"
        role="img"
        aria-label={t(
          'Tendance illustrative sur {period}, {total} visites fictives',
          'Illustrative trend over {period}, {total} sample visits',
          { period: data.label, total: data.total },
        )}
      >
        {data.bars.map((height, index) => (
          <span key={index} style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="sg-chart-caption">
        <span>{t('Début de période', 'Start of period')}</span>
        <span>{t('Aujourd’hui · démo', 'Today · demo')}</span>
      </div>
    </div>
  );
}

function CommercePreview() {
  const { locale, t } = useI18n();
  const [quantity, setQuantity] = useState(0);
  return (
    <div className="sg-preview sg-rivage">
      <div className="sg-mini-nav">
        <b>RIVAGE</b>
        <span>{t('OBJETS DU QUOTIDIEN · DÉMO', 'EVERYDAY OBJECTS · DEMO')}</span>
      </div>
      <div className="sg-commerce-hero">
        <div>
          <small>{t('LA COLLECTION CALME', 'THE QUIET COLLECTION')}</small>
          <h3>
            {' '}
            {t('Faire place', 'Make room')} <br />
            {t('à l’essentiel.', 'for what matters.')}{' '}
          </h3>
          <p>
            {' '}
            {t('Des formes simples.', 'Simple forms.')} <br />{' '}
            {t('Des jours plus doux.', 'Gentler days.')}{' '}
          </p>
        </div>
        <div className="sg-vase-scene" aria-hidden="true">
          <i className="sg-vase" />
          <i className="sg-branch" />
          <i className="sg-sun" />
        </div>
      </div>
      <div className="sg-product">
        <div>
          <strong>{t('Vase Sillage', 'Sillage vase')}</strong>
          <span>{t('Grès naturel · objet fictif', 'Natural stoneware · sample item')}</span>
        </div>
        <b>
          {new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(48)}
        </b>
        <button
          type="button"
          onClick={() => setQuantity((current) => Math.min(9, current + 1))}
          disabled={quantity === 9}
        >
          {' '}
          {t('Ajouter à la sélection', 'Add to selection')}{' '}
        </button>
      </div>
      <div className="sg-selection">
        <p role="status">
          {' '}
          {t('Sélection démo :', 'Demo selection:')} {quantity}{' '}
          {quantity === 1 ? t('objet', 'item') : t('objets', 'items')}{' '}
          {t('· aucune commande', '· no order placed')}{' '}
        </p>
        <button
          type="button"
          disabled={quantity === 0}
          onClick={() => setQuantity((current) => Math.max(0, current - 1))}
        >
          {' '}
          {t('Retirer un objet', 'Remove an item')}{' '}
        </button>
      </div>
    </div>
  );
}

function BookingPreview() {
  const { t } = useI18n();
  const [day, setDay] = useState('Mardi');
  const dayLabels: Record<string, string> = {
    Mardi: t('Mardi', 'Tuesday'),
    Mercredi: t('Mercredi', 'Wednesday'),
    Jeudi: t('Jeudi', 'Thursday'),
  };
  const [slot, setSlot] = useState<string | null>(null);
  return (
    <div className="sg-preview sg-pause">
      <div className="sg-mini-nav">
        <b>
          pause<span aria-hidden="true"> ✳</span>
        </b>
        <span>{t('STUDIO BIEN-ÊTRE · DÉMO', 'WELLNESS STUDIO · DEMO')}</span>
      </div>
      <div className="sg-booking-layout">
        <div>
          <span className="sg-booking-flower" aria-hidden="true">
            ✳
          </span>
          <h3>
            {' '}
            {t('Un moment.', 'A moment.')} <br /> {t('Juste pour vous.', 'Just for you.')}{' '}
          </h3>
          <p>
            {' '}
            {t('Séance découverte', 'Introductory session')} <br />
            <strong>45 minutes</strong>
          </p>
        </div>
        <div className="sg-booking-picker">
          <h4>{t('Votre prochain rendez-vous', 'Your next appointment')}</h4>
          <div className="sg-mini-controls" aria-label={t('Jour de démonstration', 'Demo day')}>
            {['Mardi', 'Mercredi', 'Jeudi'].map((value) => (
              <button
                type="button"
                key={dayLabels[value] ?? value}
                aria-pressed={day === value}
                onClick={() => {
                  setDay(value);
                  setSlot(null);
                }}
              >
                {dayLabels[value] ?? value}
              </button>
            ))}
          </div>
          <p>
            {t('Créneaux fictifs ·', 'Sample time slots ·')} {dayLabels[day]}
          </p>
          <div className="sg-slots" aria-label={t('Créneau de démonstration', 'Demo time slot')}>
            {['10:00', '11:30', '14:00', '16:30'].map((value) => (
              <button
                type="button"
                key={dayLabels[value] ?? value}
                aria-pressed={slot === value}
                onClick={() => setSlot(value)}
              >
                {dayLabels[value] ?? value}
              </button>
            ))}
          </div>
          <p className="sg-booking-result" role="status">
            {slot
              ? t(
                  '{day} à {time} sélectionné dans la démo.',
                  '{day} at {time} selected in the demo.',
                  { day: dayLabels[day]!, time: slot },
                )
              : t('Choisissez un créneau pour essayer.', 'Choose a time slot to try it.')}
          </p>
          <small>{t('Aucune réservation envoyée.', 'No booking submitted.')}</small>
        </div>
      </div>
    </div>
  );
}

function KanbanPreview() {
  const { t } = useI18n();
  const [stage, setStage] = useState(0);
  const columns = [t('À faire', 'To do'), t('En cours', 'In progress'), t('Terminé', 'Done')];
  return (
    <div className="sg-preview sg-collectif">
      <div className="sg-mini-nav">
        <b>
          collectif<span aria-hidden="true"> ▪</span>
        </b>
        <span>{t('TABLEAU DÉMO', 'DEMO BOARD')}</span>
      </div>
      <div className="sg-board-heading">
        <div>
          <small>{t('NOTRE PROCHAIN CHAPITRE', 'OUR NEXT CHAPTER')}</small>
          <h3>{t('Lancement du studio', 'Studio launch')}</h3>
        </div>
        <span className="sg-avatars" aria-hidden="true">
          <i>AM</i>
          <i>JL</i>
          <i>SO</i>
        </span>
      </div>
      <div className="sg-board">
        {columns.map((column, index) => (
          <section key={column} aria-label={column}>
            <h4>
              <span aria-hidden="true">●</span> {column}
            </h4>
            {stage === index ? (
              <div className="sg-task">
                <small>DESIGN</small>
                <strong>{t('Esquisser la page d’accueil', 'Sketch the homepage')}</strong>
                <p>{t('Clarifier le premier regard.', 'Clarify the first impression.')}</p>
                {stage < 2 ? (
                  <button type="button" onClick={() => setStage((current) => current + 1)}>
                    {stage === 0 ? t('Commencer', 'Start') : t('Terminer', 'Finish')}
                  </button>
                ) : (
                  <span>{t('Terminé dans la démo', 'Completed in the demo')}</span>
                )}
              </div>
            ) : (
              <p className="sg-column-empty">{t('Place aux idées', 'Room for ideas')}</p>
            )}
          </section>
        ))}
      </div>
      <div className="sg-board-footer">
        <p role="status">
          {t('Tâche démo :', 'Demo task:')} {columns[stage]}
        </p>
        <button type="button" onClick={() => setStage(0)} disabled={stage === 0}>
          {' '}
          {t('Réinitialiser', 'Reset')}{' '}
        </button>
      </div>
    </div>
  );
}

function slides(locale: StudioLocale = 'en') {
  return [
    {
      eyebrow: translate('01 / L’INTENTION', '01 / THE INTENTION', undefined, locale),
      title: (
        <>
          {' '}
          {translate('Moins de bruit.', 'Less noise.', undefined, locale)} <br />
          <em>{translate('Plus d’idées.', 'More ideas.', undefined, locale)}</em>
        </>
      ),
      note: translate(
        'Une autre façon de raconter ce qui compte.',
        'Another way to tell the stories that matter.',
        undefined,
        locale,
      ),
    },
    {
      eyebrow: translate('02 / LE CHEMIN', '02 / THE PATH', undefined, locale),
      title: (
        <>
          {' '}
          {translate('Voir plus clair.', 'See more clearly.', undefined, locale)} <br />
          <em>{translate('Faire ensemble.', 'Create together.', undefined, locale)}</em>
        </>
      ),
      note: translate(
        'Observer. Choisir. Donner forme.',
        'Observe. Choose. Shape.',
        undefined,
        locale,
      ),
    },
    {
      eyebrow: translate('03 / LA SUITE', '03 / WHAT’S NEXT', undefined, locale),
      title: (
        <>
          {' '}
          {translate('Une idée suffit.', 'One idea is enough.', undefined, locale)} <br />
          <em>{translate('À vous la suite.', 'Your turn to continue.', undefined, locale)}</em>
        </>
      ),
      note: translate(
        'Quel changement voulez-vous rendre possible ?',
        'What change do you want to make possible?',
        undefined,
        locale,
      ),
    },
  ];
}

function SlidesPreview() {
  const { locale, t } = useI18n();
  const [index, setIndex] = useState(0);
  const slide = slides(locale)[index]!;
  return (
    <div className="sg-preview sg-perspective">
      <div className="sg-mini-nav">
        <b>perspective /</b>
        <span>{t('PRÉSENTATION DÉMO', 'DEMO PRESENTATION')}</span>
      </div>
      <div className="sg-slide-body" aria-live="polite">
        <small>{slide.eyebrow}</small>
        <h3>{slide.title}</h3>
        <p>{slide.note}</p>
        <span className="sg-slide-orbit" aria-hidden="true" />
      </div>
      <div className="sg-slide-controls">
        <span>
          {' '}
          {t('Diapositive', 'Slide')} {index + 1} {t('sur', 'of')} {slides(locale).length}
        </span>
        <div>
          <button
            type="button"
            aria-label={t('Diapositive précédente', 'Previous slide')}
            disabled={index === 0}
            onClick={() => setIndex((current) => current - 1)}
          >
            ←
          </button>
          <button
            type="button"
            aria-label={t('Diapositive suivante', 'Next slide')}
            disabled={index === slides(locale).length - 1}
            onClick={() => setIndex((current) => current + 1)}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

const previews = {
  atelier: PortfolioPreview,
  pulse: DashboardPreview,
  rivage: CommercePreview,
  pause: BookingPreview,
  collectif: KanbanPreview,
  perspective: SlidesPreview,
} satisfies Record<StarterId, () => React.JSX.Element>;

function StarterCard({
  starter,
  onOpen,
}: {
  starter: Starter;
  onOpen(starter: Starter, trigger: HTMLButtonElement): void;
}) {
  const { t } = useI18n();
  const Preview = previews[starter.id];
  return (
    <article className="sg-card">
      <div className="sg-thumbnail" aria-hidden="true" inert>
        <Preview />
      </div>
      <button
        type="button"
        className="sg-card-open"
        aria-label={t('Explorer {title}', 'Explore {title}', { title: starter.title })}
        onClick={(event) => onOpen(starter, event.currentTarget)}
      >
        <span>
          <strong>{starter.title}</strong>
          <small>{starter.description}</small>
        </span>
        <span className="sg-card-arrow" aria-hidden="true">
          ↗
        </span>
      </button>
    </article>
  );
}

export function StarterGallery({ onChoose }: { onChoose(seed: StarterSeed): void }) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<StarterCategory>('all');
  const [selectedId, setSelectedId] = useState<StarterId | null>(null);
  const selected = starters(locale).find((starter) => starter.id === selectedId) ?? null;
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const choice = useRef<StarterSeed | null>(null);
  const headingId = useId();
  const dialogTitleId = useId();
  const descriptionId = useId();
  const visible = filterStarters(query, category, locale);
  const Preview = selected ? previews[selected.id] : null;
  useEffect(() => {
    if (!selectedId || !dialog.current) return;
    const node = dialog.current;
    if (!node.open) node.showModal();
    node.querySelector<HTMLButtonElement>('.sg-close')?.focus();
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [selectedId]);
  function open(starter: Starter, origin: HTMLButtonElement) {
    trigger.current = origin;
    choice.current = null;
    setSelectedId(starter.id);
  }
  function closed() {
    const seed = choice.current;
    choice.current = null;
    setSelectedId(null);
    trigger.current?.focus();
    if (seed) onChoose(seed);
  }
  return (
    <section className="starter-gallery" aria-labelledby={headingId}>
      <div className="sg-heading">
        <div>
          <span className="sg-eyebrow">{t('POINTS DE DÉPART', 'STARTING POINTS')}</span>
          <h2 id={headingId}>
            {t('Une inspiration, votre interprétation.', 'An inspiration, your interpretation.')}
          </h2>
          <p>
            {t(
              'Explorez une idée en action, puis faites-en la vôtre.',
              'Explore an idea in action, then make it yours.',
            )}
          </p>
        </div>
        <label className="sg-search">
          <span className="sg-sr">{t('Rechercher une inspiration', 'Search for inspiration')}</span>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            name="starter-search"
            autoComplete="off"
            placeholder={t('Portfolio, boutique…', 'Portfolio, shop…')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="sg-toolbar">
        <div
          className="sg-filters"
          aria-label={t('Catégories d’inspiration', 'Inspiration categories')}
        >
          {starterCategories(locale).map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p role="status">
          {visible.length} {visible.length === 1 ? 'inspiration' : 'inspirations'}
        </p>
      </div>
      <div className="sg-grid">
        {visible.map((starter) => (
          <StarterCard key={starter.id} starter={starter} onOpen={open} />
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="sg-empty">
          <h3>{t('Aucune inspiration trouvée', 'No inspiration found')}</h3>
          <p>
            {t(
              'Essayez un autre mot ou explorez toutes les catégories.',
              'Try another word or explore all categories.',
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('all');
            }}
          >
            {' '}
            {t('Voir toutes les inspirations', 'See all inspirations')}{' '}
          </button>
        </div>
      ) : null}
      <p className="sg-note">
        {' '}
        {t(
          'Aperçus interactifs avec données de démonstration. Votre choix prépare une idée à adapter, pas une application déjà construite.',
          'Interactive previews with sample data. Your choice prepares an idea to adapt, not a finished application.',
        )}{' '}
      </p>
      <dialog
        ref={dialog}
        className="sg-dialog"
        aria-labelledby={dialogTitleId}
        aria-describedby={descriptionId}
        onClose={closed}
        onCancel={(event) => {
          event.preventDefault();
          dialog.current?.close();
        }}
      >
        <header className="sg-dialog-heading">
          <div>
            <span className="sg-eyebrow">
              {t('EXPLORER UNE INSPIRATION', 'EXPLORE AN INSPIRATION')}
            </span>
            <h2 id={dialogTitleId}>{selected?.title}</h2>
          </div>
          <button
            className="sg-close"
            type="button"
            aria-label={t('Fermer l’aperçu', 'Close preview')}
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </header>
        <div className="sg-demo-note" id={descriptionId}>
          <span>{t('Démo interactive', 'Interactive demo')}</span>
          <p>
            {selected?.interaction}{' '}
            {t('Les changements restent dans cet aperçu.', 'Changes stay within this preview.')}
          </p>
        </div>
        <div className="sg-live-preview">{Preview ? <Preview key={selected?.id} /> : null}</div>
        <footer className="sg-dialog-footer">
          <p>
            {' '}
            {t(
              'Cette inspiration prépare votre brief et sa direction visuelle.',
              'This inspiration prepares your brief and visual direction.',
            )}{' '}
            <br /> {t('Aucun modèle source n’est importé.', 'No source template is imported.')}{' '}
          </p>
          <button
            type="button"
            className="sg-use"
            onClick={() => {
              if (!selected || choice.current) return;
              choice.current = { ...selected.seed };
              dialog.current?.close();
            }}
          >
            {' '}
            {t('Utiliser cette idée', 'Use this idea')} <span aria-hidden="true">↗</span>
          </button>
        </footer>
      </dialog>
    </section>
  );
}
