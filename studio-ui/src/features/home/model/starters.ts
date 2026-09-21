import { translate, type StudioLocale } from '../../../i18n';
export interface StarterSeed {
  idea: string;
  projectType: 'website' | 'app' | 'prototype' | 'slides';
  design?: string;
}

export type StarterId = 'atelier' | 'pulse' | 'rivage' | 'pause' | 'collectif' | 'perspective';

export interface Starter {
  id: StarterId;
  title: string;
  description: string;
  category: StarterSeed['projectType'];
  interaction: string;
  seed: StarterSeed;
}

export function starterCategories(locale: StudioLocale = 'en') {
  return [
    { id: 'all', label: translate('Tout', 'All', undefined, locale) },
    { id: 'website', label: translate('Sites web', 'Websites', undefined, locale) },
    { id: 'app', label: translate('Applications', 'Apps', undefined, locale) },
    { id: 'prototype', label: 'Prototypes' },
    { id: 'slides', label: translate('Présentations', 'Presentations', undefined, locale) },
  ] as const;
}

export type StarterCategory = ReturnType<typeof starterCategories>[number]['id'];

export function starters(locale: StudioLocale = 'en'): readonly Starter[] {
  return [
    {
      id: 'atelier',
      title: translate('Atelier — Portfolio', 'Atelier — Portfolio', undefined, locale),
      description: translate(
        'Un regard singulier, des projets qui parlent.',
        'A distinctive perspective, projects that speak for themselves.',
        undefined,
        locale,
      ),
      category: 'website',
      interaction: translate(
        'Filtrez les projets de ce studio fictif.',
        'Filter this fictional studio’s projects.',
        undefined,
        locale,
      ),
      seed: {
        projectType: 'website',
        idea: translate(
          'Créer un portfolio éditorial pour un studio créatif. Présenter une sélection de projets filtrables par discipline, des études de cas avec intention et résultat, une présentation du studio et un moyen de contact. Adapter les contenus et l’identité à mon activité ; prévoir les états vides et une navigation mobile accessible.',
          'Create an editorial portfolio for a creative studio. Include selected projects filterable by discipline, case studies with intentions and outcomes, a studio introduction, and a contact method. Adapt the content and identity to my business; include empty states and accessible mobile navigation.',
          undefined,
          locale,
        ),
        design: translate(
          'Direction Atelier : fond crème, typographie éditoriale à empattements, accents corail et composition asymétrique. Grandes respirations, numérotation discrète et illustrations géométriques originales. Préserver une forte lisibilité sur mobile.',
          'Atelier direction: cream background, editorial serif typography, coral accents, and asymmetric composition. Generous spacing, subtle numbering, and original geometric illustrations. Preserve strong readability on mobile.',
          undefined,
          locale,
        ),
      },
    },
    {
      id: 'pulse',
      title: translate('Pulse — Tableau de bord', 'Pulse — Dashboard', undefined, locale),
      description: translate(
        'Les chiffres utiles, au premier regard.',
        'The figures that matter, at a glance.',
        undefined,
        locale,
      ),
      category: 'app',
      interaction: translate(
        'Changez la période pour comparer les données de démonstration.',
        'Change the period to compare the sample data.',
        undefined,
        locale,
      ),
      seed: {
        projectType: 'app',
        idea: translate(
          'Créer un tableau de bord SaaS pour suivre l’activité d’une équipe. Prévoir des indicateurs définis, un filtre de période, des tendances et une liste détaillée. Identifier les sources de données et les droits nécessaires avant connexion ; distinguer données de démonstration, chargement, absence de données et erreurs.',
          'Create a SaaS dashboard to track a team’s activity. Include defined metrics, a period filter, trends, and a detailed list. Identify data sources and required permissions before connecting; distinguish sample data, loading, empty states, and errors.',
          undefined,
          locale,
        ),
        design: translate(
          'Direction Pulse : interface bleu nuit, graphiques menthe et lilas, typographie sans empattements, chiffres tabulaires. Hiérarchie calme, panneaux fins et contrastes accessibles ; une version mobile recentrée sur les indicateurs essentiels.',
          'Pulse direction: midnight-blue interface, mint and lilac charts, sans-serif typography, and tabular figures. Calm hierarchy, subtle panels, and accessible contrast; a mobile version focused on essential metrics.',
          undefined,
          locale,
        ),
      },
    },
    {
      id: 'rivage',
      title: translate('Rivage — Boutique', 'Rivage — Shop', undefined, locale),
      description: translate(
        'Une collection soignée, une sélection simple.',
        'A considered collection, a simple selection.',
        undefined,
        locale,
      ),
      category: 'website',
      interaction: translate(
        'Ajoutez un objet à une sélection locale, sans commande.',
        'Add an item to a local selection without placing an order.',
        undefined,
        locale,
      ),
      seed: {
        projectType: 'website',
        idea: translate(
          'Créer une boutique pour une petite collection d’objets. Prévoir catalogue, fiches produit, filtres et sélection modifiable. Préciser les besoins de stock, livraison et paiement avant toute intégration ; aucun achat ne doit être simulé comme réussi. Partir de produits fictifs clairement identifiés puis remplacer par les données autorisées.',
          'Create a shop for a small collection of objects. Include a catalog, product pages, filters, and an editable selection. Clarify inventory, delivery, and payment needs before any integration; never present a simulated purchase as successful. Start with clearly labeled fictional products, then replace them with authorized data.',
          undefined,
          locale,
        ),
        design: translate(
          'Direction Rivage : palette sauge, ivoire et terre cuite, formes organiques, titres fins à empattements. Présentation généreuse des objets, prix lisibles, parcours tactile sobre et accessible.',
          'Rivage direction: sage, ivory, and terracotta palette, organic shapes, and fine serif headings. Generous product presentation, readable prices, and a restrained, accessible touch journey.',
          undefined,
          locale,
        ),
      },
    },
    {
      id: 'pause',
      title: translate('Pause — Rendez-vous', 'Pause — Appointments', undefined, locale),
      description: translate(
        'Choisir un moment, en toute simplicité.',
        'Choose a moment, with ease.',
        undefined,
        locale,
      ),
      category: 'prototype',
      interaction: translate(
        'Choisissez un jour et un créneau ; aucune réservation n’est envoyée.',
        'Choose a day and time slot; no booking is submitted.',
        undefined,
        locale,
      ),
      seed: {
        projectType: 'prototype',
        idea: translate(
          'Prototyper un parcours de prise de rendez-vous : choisir une prestation, un jour et un créneau, puis revoir le récapitulatif. Tester la compréhension des disponibilités, les états complets et l’annulation. Garder le prototype local avec données fictives ; définir ensuite les règles de disponibilité, les données personnelles et le service de réservation avant implémentation.',
          'Prototype an appointment journey: choose a service, day, and time slot, then review the summary. Test how availability, fully booked states, and cancellation are understood. Keep the prototype local with fictional data; define availability rules, personal data, and the booking service before implementation.',
          undefined,
          locale,
        ),
        design: translate(
          'Direction Pause : lavande douce, crème et violet profond, cartes arrondies, calendrier aéré. Boutons de créneaux généreux, sélection explicite et récapitulatif toujours visible sur mobile.',
          'Pause direction: soft lavender, cream, and deep purple, rounded cards, and a spacious calendar. Generous time-slot buttons, explicit selection, and a summary that stays visible on mobile.',
          undefined,
          locale,
        ),
      },
    },
    {
      id: 'collectif',
      title: translate('Collectif — Kanban', 'Collectif — Kanban', undefined, locale),
      description: translate(
        'Moins de dispersion, plus de mouvement.',
        'Less distraction, more progress.',
        undefined,
        locale,
      ),
      category: 'app',
      interaction: translate(
        'Faites avancer une tâche dans le tableau de démonstration.',
        'Move a task forward on the demo board.',
        undefined,
        locale,
      ),
      seed: {
        projectType: 'app',
        idea: translate(
          'Créer un tableau kanban pour une petite équipe avec colonnes À faire, En cours et Terminé. Prévoir création, édition, déplacement au clavier et filtres de tâches. Clarifier la persistance, les rôles et les conflits de modifications avant d’ajouter la collaboration ; conserver un historique compréhensible et un état vide utile.',
          'Create a kanban board for a small team with To do, In progress, and Done columns. Include task creation, editing, keyboard movement, and filters. Clarify persistence, roles, and editing conflicts before adding collaboration; keep an understandable history and useful empty state.',
          undefined,
          locale,
        ),
        design: translate(
          'Direction Collectif : surfaces ivoire, texte encre, accents prune et pastels par statut. Cartes compactes, libellés clairs, actions de déplacement accessibles sans glisser-déposer obligatoire.',
          'Collectif direction: ivory surfaces, ink text, plum accents, and status-specific pastels. Compact cards, clear labels, and accessible movement actions that do not require drag-and-drop.',
          undefined,
          locale,
        ),
      },
    },
    {
      id: 'perspective',
      title: translate('Perspective — Slides', 'Perspective — Slides', undefined, locale),
      description: translate(
        'Une histoire claire, un écran à la fois.',
        'A clear story, one screen at a time.',
        undefined,
        locale,
      ),
      category: 'slides',
      interaction: translate(
        'Parcourez les trois diapositives de cet exemple.',
        'Browse this example’s three slides.',
        undefined,
        locale,
      ),
      seed: {
        projectType: 'slides',
        idea: translate(
          'Créer une présentation web pour exposer une idée : contexte, proposition, bénéfices et prochaine étape. Prévoir navigation précédente/suivante au clavier, indicateur de progression et affichage responsive. Construire le récit avec mon contenu et signaler toute donnée illustrative ; permettre de revoir les slides sans animation obligatoire.',
          'Create a web presentation to explain an idea: context, proposal, benefits, and next step. Include previous/next keyboard navigation, a progress indicator, and responsive display. Build the story around my content and label illustrative data; allow slides to be revisited without mandatory animation.',
          undefined,
          locale,
        ),
        design: translate(
          'Direction Perspective : orange solaire, fond encre et ivoire, typographie monumentale. Une idée par écran, mise en page graphique, numérotation discrète et transitions respectant la réduction des mouvements.',
          'Perspective direction: sunny orange, ink and ivory backgrounds, and monumental typography. One idea per screen, graphic layouts, subtle numbering, and transitions that respect reduced motion.',
          undefined,
          locale,
        ),
      },
    },
  ];
}

function searchable(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function filterStarters(
  query: string,
  category: StarterCategory,
  locale: StudioLocale = 'en',
) {
  const words = searchable(query.trim()).split(/\s+/);
  return starters(locale).filter((starter) => {
    const haystack = searchable(`${starter.title} ${starter.description} ${starter.seed.idea}`);
    return (
      (category === 'all' || starter.category === category) &&
      words.every((word) => haystack.includes(word))
    );
  });
}
