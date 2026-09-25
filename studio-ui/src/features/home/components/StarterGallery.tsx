import { useEffect, useId, useRef, useState } from 'react';
import {
  filterStarters,
  starterCategories,
  type Starter,
  type StarterCategory,
  type StarterId,
  type StarterSeed,
} from '../model/starters';

function PortfolioPreview() {
  const [filter, setFilter] = useState('Tous');
  const projects = [
    { name: 'Formes libres', category: 'Identité', tone: 'coral' },
    { name: 'Objets sensibles', category: 'Édition', tone: 'blue' },
    { name: 'Nouveaux regards', category: 'Identité', tone: 'lime' },
  ];
  return (
    <div className="sg-preview sg-atelier">
      <div className="sg-mini-nav">
        <b>atelier.</b>
        <span>STUDIO INDÉPENDANT · DÉMO</span>
      </div>
      <div className="sg-editorial-hero">
        <h3>
          Des idées
          <br />
          qui prennent <em>forme.</em>
        </h3>
        <div className="sg-sculpture" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="sg-mini-controls" aria-label="Discipline des projets">
        {['Tous', 'Identité', 'Édition'].map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <ul className="sg-portfolio-list" aria-label="Projets démo">
        {projects
          .filter((project) => filter === 'Tous' || project.category === filter)
          .map((project) => (
            <li key={project.name}>
              <span className={`sg-project-art sg-art-${project.tone}`} aria-hidden="true" />
              <b>{project.name}</b>
              <small>{project.category}</small>
            </li>
          ))}
      </ul>
    </div>
  );
}

const activity = {
  week: { label: '7 jours', total: '1 284', change: '+12 %', bars: [34, 48, 40, 65, 54, 79, 92] },
  month: { label: '30 jours', total: '5 460', change: '+18 %', bars: [46, 68, 52, 86, 66, 74, 98] },
};

function DashboardPreview() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const data = activity[period];
  return (
    <div className="sg-preview sg-pulse">
      <div className="sg-mini-nav">
        <b>
          <span aria-hidden="true">◈</span> pulse
        </b>
        <span>ESPACE DÉMO</span>
      </div>
      <div className="sg-dashboard-heading">
        <div>
          <small>VUE D’ENSEMBLE</small>
          <h3>Chaque signal compte.</h3>
        </div>
        <div className="sg-mini-controls" aria-label="Période des données démo">
          {(['week', 'month'] as const).map((key) => (
            <button
              type="button"
              key={key}
              aria-pressed={period === key}
              onClick={() => setPeriod(key)}
            >
              {activity[key].label}
            </button>
          ))}
        </div>
      </div>
      <div className="sg-metrics">
        <div>
          <span>Visites · {data.label}</span>
          <strong aria-live="polite">{data.total}</strong>
          <small>{data.change} · données fictives</small>
        </div>
        <div>
          <span>Objectif de la démo</span>
          <strong>
            78<small> %</small>
          </strong>
          <span className="sg-meter" aria-hidden="true" />
        </div>
      </div>
      <div
        className="sg-chart"
        role="img"
        aria-label={`Tendance illustrative sur ${data.label}, ${data.total} visites fictives`}
      >
        {data.bars.map((height, index) => (
          <span key={index} style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="sg-chart-caption">
        <span>Début de période</span>
        <span>Aujourd’hui · démo</span>
      </div>
    </div>
  );
}

function CommercePreview() {
  const [quantity, setQuantity] = useState(0);
  return (
    <div className="sg-preview sg-rivage">
      <div className="sg-mini-nav">
        <b>RIVAGE</b>
        <span>OBJETS DU QUOTIDIEN · DÉMO</span>
      </div>
      <div className="sg-commerce-hero">
        <div>
          <small>LA COLLECTION CALME</small>
          <h3>
            Faire place
            <br />à l’essentiel.
          </h3>
          <p>
            Des formes simples.
            <br />
            Des jours plus doux.
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
          <strong>Vase Sillage</strong>
          <span>Grès naturel · objet fictif</span>
        </div>
        <b>48 €</b>
        <button
          type="button"
          onClick={() => setQuantity((current) => Math.min(9, current + 1))}
          disabled={quantity === 9}
        >
          Ajouter à la sélection
        </button>
      </div>
      <div className="sg-selection">
        <p role="status">
          Sélection démo : {quantity} {quantity === 1 ? 'objet' : 'objets'} · aucune commande
        </p>
        <button
          type="button"
          disabled={quantity === 0}
          onClick={() => setQuantity((current) => Math.max(0, current - 1))}
        >
          Retirer un objet
        </button>
      </div>
    </div>
  );
}

function BookingPreview() {
  const [day, setDay] = useState('Mardi');
  const [slot, setSlot] = useState<string | null>(null);
  return (
    <div className="sg-preview sg-pause">
      <div className="sg-mini-nav">
        <b>
          pause<span aria-hidden="true"> ✳</span>
        </b>
        <span>STUDIO BIEN-ÊTRE · DÉMO</span>
      </div>
      <div className="sg-booking-layout">
        <div>
          <span className="sg-booking-flower" aria-hidden="true">
            ✳
          </span>
          <h3>
            Un moment.
            <br />
            Juste pour vous.
          </h3>
          <p>
            Séance découverte
            <br />
            <strong>45 minutes</strong>
          </p>
        </div>
        <div className="sg-booking-picker">
          <h4>Votre prochain rendez-vous</h4>
          <div className="sg-mini-controls" aria-label="Jour de démonstration">
            {['Mardi', 'Mercredi', 'Jeudi'].map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={day === value}
                onClick={() => {
                  setDay(value);
                  setSlot(null);
                }}
              >
                {value}
              </button>
            ))}
          </div>
          <p>Créneaux fictifs · {day}</p>
          <div className="sg-slots" aria-label="Créneau de démonstration">
            {['10:00', '11:30', '14:00', '16:30'].map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={slot === value}
                onClick={() => setSlot(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="sg-booking-result" role="status">
            {slot
              ? `${day} à ${slot} sélectionné dans la démo.`
              : 'Choisissez un créneau pour essayer.'}
          </p>
          <small>Aucune réservation envoyée.</small>
        </div>
      </div>
    </div>
  );
}

function KanbanPreview() {
  const [stage, setStage] = useState(0);
  const columns = ['À faire', 'En cours', 'Terminé'];
  return (
    <div className="sg-preview sg-collectif">
      <div className="sg-mini-nav">
        <b>
          collectif<span aria-hidden="true"> ▪</span>
        </b>
        <span>TABLEAU DÉMO</span>
      </div>
      <div className="sg-board-heading">
        <div>
          <small>NOTRE PROCHAIN CHAPITRE</small>
          <h3>Lancement du studio</h3>
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
                <strong>Esquisser la page d’accueil</strong>
                <p>Clarifier le premier regard.</p>
                {stage < 2 ? (
                  <button type="button" onClick={() => setStage((current) => current + 1)}>
                    {stage === 0 ? 'Commencer' : 'Terminer'}
                  </button>
                ) : (
                  <span>Terminé dans la démo</span>
                )}
              </div>
            ) : (
              <p className="sg-column-empty">Place aux idées</p>
            )}
          </section>
        ))}
      </div>
      <div className="sg-board-footer">
        <p role="status">Tâche démo : {columns[stage]}</p>
        <button type="button" onClick={() => setStage(0)} disabled={stage === 0}>
          Réinitialiser
        </button>
      </div>
    </div>
  );
}

const slides = [
  {
    eyebrow: '01 / L’INTENTION',
    title: (
      <>
        Moins de bruit.
        <br />
        <em>Plus d’idées.</em>
      </>
    ),
    note: 'Une autre façon de raconter ce qui compte.',
  },
  {
    eyebrow: '02 / LE CHEMIN',
    title: (
      <>
        Voir plus clair.
        <br />
        <em>Faire ensemble.</em>
      </>
    ),
    note: 'Observer. Choisir. Donner forme.',
  },
  {
    eyebrow: '03 / LA SUITE',
    title: (
      <>
        Une idée suffit.
        <br />
        <em>À vous la suite.</em>
      </>
    ),
    note: 'Quel changement voulez-vous rendre possible ?',
  },
];

function SlidesPreview() {
  const [index, setIndex] = useState(0);
  const slide = slides[index]!;
  return (
    <div className="sg-preview sg-perspective">
      <div className="sg-mini-nav">
        <b>perspective /</b>
        <span>PRÉSENTATION DÉMO</span>
      </div>
      <div className="sg-slide-body" aria-live="polite">
        <small>{slide.eyebrow}</small>
        <h3>{slide.title}</h3>
        <p>{slide.note}</p>
        <span className="sg-slide-orbit" aria-hidden="true" />
      </div>
      <div className="sg-slide-controls">
        <span>
          Diapositive {index + 1} sur {slides.length}
        </span>
        <div>
          <button
            type="button"
            aria-label="Diapositive précédente"
            disabled={index === 0}
            onClick={() => setIndex((current) => current - 1)}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Diapositive suivante"
            disabled={index === slides.length - 1}
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
  const Preview = previews[starter.id];
  return (
    <article className="sg-card">
      <div className="sg-thumbnail" aria-hidden="true" inert>
        <Preview />
      </div>
      <button
        type="button"
        className="sg-card-open"
        aria-label={`Explorer ${starter.title}`}
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
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<StarterCategory>('all');
  const [selected, setSelected] = useState<Starter | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const choice = useRef<StarterSeed | null>(null);
  const headingId = useId();
  const dialogTitleId = useId();
  const descriptionId = useId();
  const visible = filterStarters(query, category);
  const Preview = selected ? previews[selected.id] : null;
  useEffect(() => {
    if (!selected || !dialog.current) return;
    const node = dialog.current;
    if (!node.open) node.showModal();
    node.querySelector<HTMLButtonElement>('.sg-close')?.focus();
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [selected]);
  function open(starter: Starter, origin: HTMLButtonElement) {
    trigger.current = origin;
    choice.current = null;
    setSelected(starter);
  }
  function closed() {
    const seed = choice.current;
    choice.current = null;
    setSelected(null);
    trigger.current?.focus();
    if (seed) onChoose(seed);
  }
  return (
    <section className="starter-gallery" aria-labelledby={headingId}>
      <div className="sg-heading">
        <div>
          <span className="sg-eyebrow">POINTS DE DÉPART</span>
          <h2 id={headingId}>Une inspiration, votre interprétation.</h2>
          <p>Explorez une idée en action, puis faites-en la vôtre.</p>
        </div>
        <label className="sg-search">
          <span className="sg-sr">Rechercher une inspiration</span>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            name="starter-search"
            autoComplete="off"
            placeholder="Portfolio, boutique…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="sg-toolbar">
        <div className="sg-filters" aria-label="Catégories d’inspiration">
          {starterCategories.map((item) => (
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
          <h3>Aucune inspiration trouvée</h3>
          <p>Essayez un autre mot ou explorez toutes les catégories.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('all');
            }}
          >
            Voir toutes les inspirations
          </button>
        </div>
      ) : null}
      <p className="sg-note">
        Aperçus interactifs avec données de démonstration. Votre choix prépare une idée à adapter,
        pas une application déjà construite.
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
            <span className="sg-eyebrow">EXPLORER UNE INSPIRATION</span>
            <h2 id={dialogTitleId}>{selected?.title}</h2>
          </div>
          <button
            className="sg-close"
            type="button"
            aria-label="Fermer l’aperçu"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </header>
        <div className="sg-demo-note" id={descriptionId}>
          <span>Démo interactive</span>
          <p>{selected?.interaction} Les changements restent dans cet aperçu.</p>
        </div>
        <div className="sg-live-preview">{Preview ? <Preview key={selected?.id} /> : null}</div>
        <footer className="sg-dialog-footer">
          <p>
            Cette inspiration prépare votre brief et sa direction visuelle.
            <br />
            Aucun modèle source n’est importé.
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
            Utiliser cette idée <span aria-hidden="true">↗</span>
          </button>
        </footer>
      </dialog>
    </section>
  );
}
