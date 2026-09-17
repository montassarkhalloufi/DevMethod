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

export const starterCategories = [
  { id: 'all', label: 'Tout' },
  { id: 'website', label: 'Sites web' },
  { id: 'app', label: 'Applications' },
  { id: 'prototype', label: 'Prototypes' },
  { id: 'slides', label: 'Présentations' },
] as const;

export type StarterCategory = (typeof starterCategories)[number]['id'];

export const starters: readonly Starter[] = [
  {
    id: 'atelier',
    title: 'Atelier — Portfolio',
    description: 'Un regard singulier, des projets qui parlent.',
    category: 'website',
    interaction: 'Filtrez les projets de ce studio fictif.',
    seed: {
      projectType: 'website',
      idea: 'Créer un portfolio éditorial pour un studio créatif. Présenter une sélection de projets filtrables par discipline, des études de cas avec intention et résultat, une présentation du studio et un moyen de contact. Adapter les contenus et l’identité à mon activité ; prévoir les états vides et une navigation mobile accessible.',
      design:
        'Direction Atelier : fond crème, typographie éditoriale à empattements, accents corail et composition asymétrique. Grandes respirations, numérotation discrète et illustrations géométriques originales. Préserver une forte lisibilité sur mobile.',
    },
  },
  {
    id: 'pulse',
    title: 'Pulse — Tableau de bord',
    description: 'Les chiffres utiles, au premier regard.',
    category: 'app',
    interaction: 'Changez la période pour comparer les données de démonstration.',
    seed: {
      projectType: 'app',
      idea: 'Créer un tableau de bord SaaS pour suivre l’activité d’une équipe. Prévoir des indicateurs définis, un filtre de période, des tendances et une liste détaillée. Identifier les sources de données et les droits nécessaires avant connexion ; distinguer données de démonstration, chargement, absence de données et erreurs.',
      design:
        'Direction Pulse : interface bleu nuit, graphiques menthe et lilas, typographie sans empattements, chiffres tabulaires. Hiérarchie calme, panneaux fins et contrastes accessibles ; une version mobile recentrée sur les indicateurs essentiels.',
    },
  },
  {
    id: 'rivage',
    title: 'Rivage — Boutique',
    description: 'Une collection soignée, une sélection simple.',
    category: 'website',
    interaction: 'Ajoutez un objet à une sélection locale, sans commande.',
    seed: {
      projectType: 'website',
      idea: 'Créer une boutique pour une petite collection d’objets. Prévoir catalogue, fiches produit, filtres et sélection modifiable. Préciser les besoins de stock, livraison et paiement avant toute intégration ; aucun achat ne doit être simulé comme réussi. Partir de produits fictifs clairement identifiés puis remplacer par les données autorisées.',
      design:
        'Direction Rivage : palette sauge, ivoire et terre cuite, formes organiques, titres fins à empattements. Présentation généreuse des objets, prix lisibles, parcours tactile sobre et accessible.',
    },
  },
  {
    id: 'pause',
    title: 'Pause — Rendez-vous',
    description: 'Choisir un moment, en toute simplicité.',
    category: 'prototype',
    interaction: 'Choisissez un jour et un créneau ; aucune réservation n’est envoyée.',
    seed: {
      projectType: 'prototype',
      idea: 'Prototyper un parcours de prise de rendez-vous : choisir une prestation, un jour et un créneau, puis revoir le récapitulatif. Tester la compréhension des disponibilités, les états complets et l’annulation. Garder le prototype local avec données fictives ; définir ensuite les règles de disponibilité, les données personnelles et le service de réservation avant implémentation.',
      design:
        'Direction Pause : lavande douce, crème et violet profond, cartes arrondies, calendrier aéré. Boutons de créneaux généreux, sélection explicite et récapitulatif toujours visible sur mobile.',
    },
  },
  {
    id: 'collectif',
    title: 'Collectif — Kanban',
    description: 'Moins de dispersion, plus de mouvement.',
    category: 'app',
    interaction: 'Faites avancer une tâche dans le tableau de démonstration.',
    seed: {
      projectType: 'app',
      idea: 'Créer un tableau kanban pour une petite équipe avec colonnes À faire, En cours et Terminé. Prévoir création, édition, déplacement au clavier et filtres de tâches. Clarifier la persistance, les rôles et les conflits de modifications avant d’ajouter la collaboration ; conserver un historique compréhensible et un état vide utile.',
      design:
        'Direction Collectif : surfaces ivoire, texte encre, accents prune et pastels par statut. Cartes compactes, libellés clairs, actions de déplacement accessibles sans glisser-déposer obligatoire.',
    },
  },
  {
    id: 'perspective',
    title: 'Perspective — Slides',
    description: 'Une histoire claire, un écran à la fois.',
    category: 'slides',
    interaction: 'Parcourez les trois diapositives de cet exemple.',
    seed: {
      projectType: 'slides',
      idea: 'Créer une présentation web pour exposer une idée : contexte, proposition, bénéfices et prochaine étape. Prévoir navigation précédente/suivante au clavier, indicateur de progression et affichage responsive. Construire le récit avec mon contenu et signaler toute donnée illustrative ; permettre de revoir les slides sans animation obligatoire.',
      design:
        'Direction Perspective : orange solaire, fond encre et ivoire, typographie monumentale. Une idée par écran, mise en page graphique, numérotation discrète et transitions respectant la réduction des mouvements.',
    },
  },
];

function searchable(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr');
}

export function filterStarters(query: string, category: StarterCategory) {
  const words = searchable(query.trim()).split(/\s+/);
  return starters.filter((starter) => {
    const haystack = searchable(`${starter.title} ${starter.description} ${starter.seed.idea}`);
    return (
      (category === 'all' || starter.category === category) &&
      words.every((word) => haystack.includes(word))
    );
  });
}
