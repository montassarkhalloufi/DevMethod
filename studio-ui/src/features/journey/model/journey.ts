import type { JourneyState, StageSummary } from './contracts';

const count = (value: number, singular: string, plural: string) =>
  `${value} ${value === 1 ? singular : plural}`;

function foundation(state: JourneyState): StageSummary {
  return {
    id: 'foundation',
    title: 'Comprendre le projet',
    purpose: 'Retrouver l’intention, les acquis et ce que vous déléguez.',
    status: state.import
      ? 'Référence importée · contexte à examiner'
      : state.project.idea
        ? 'Intention enregistrée'
        : 'À préciser',
    facts: [
      state.project.idea ||
        (state.import
          ? 'Précisez l’objectif de la prochaine évolution dans la discussion.'
          : 'Décrivez votre idée dans la discussion.'),
      ...state.project.constraints,
    ],
    request:
      'Reprends le contexte et les acquis du projet, ses références et les décisions déléguées. Signale seulement les informations qui manquent pour avancer, sans répéter les questions déjà résolues.',
  };
}
function exploration(state: JourneyState): StageSummary {
  const records = state.decisions.filter(
    (decision) =>
      decision.status === 'hypothesis' ||
      (decision.status === 'active' && /explor/i.test(decision.topic)),
  );
  return {
    id: 'exploration',
    title: 'Explorer les possibilités',
    purpose: 'Comparer les usages, alternatives et incertitudes utiles avant de choisir.',
    status: records.length
      ? count(records.length, 'piste enregistrée', 'pistes enregistrées')
      : 'Exploration à documenter',
    facts: records.length
      ? records.map(
          (item) =>
            `${item.status === 'hypothesis' ? 'Hypothèse' : 'Choix actif'} : ${item.topic} — ${item.choice}${item.reason ? `. ${item.reason}` : ''}`,
        )
      : [
          'Aucune hypothèse ou décision d’exploration enregistrée. Cela ne prouve pas qu’une exploration a été menée.',
        ],
    request:
      'Explore les besoins, usages et alternatives réellement différents pour ce projet. Appuie les possibilités sur des observations et propose une expérience bornée pour les incertitudes importantes.',
  };
}
function frame(state: JourneyState): StageSummary {
  return {
    id: 'frame',
    title: 'Cadrer le résultat',
    purpose: 'Exprimer le résultat attendu, le périmètre et les critères pour le juger.',
    status: state.brief.outcome ? 'Cadrage disponible à examiner' : 'À cadrer',
    facts: [
      state.brief.outcome || 'Le résultat attendu reste à préciser.',
      ...state.brief.criteria.map((criterion) => criterion.text),
    ],
    request:
      'Précise le résultat attendu, le périmètre, les exclusions et les critères observables. Relie-les aux acquis de l’exploration et aux contraintes, sans marquer comme validé ce qui n’a pas été décidé.',
  };
}
function architecture(state: JourneyState): StageSummary {
  const decisions = state.decisions.filter(
    (decision) =>
      decision.status === 'active' &&
      /architect|techni|stockage|données|sécurité/i.test(decision.topic),
  );
  return {
    id: 'architecture',
    title: 'Choisir une architecture',
    purpose: 'Rendre les compromis techniques compréhensibles et éprouver les risques.',
    status: decisions.length ? 'Choix techniques repérés' : 'Choix techniques à expliciter',
    facts: decisions.length
      ? decisions.map((item) => `${item.topic} — ${item.choice}. ${item.reason}`)
      : [
          'Aucune décision active repérée par son thème technique. Le code seul ne décrit pas ses compromis.',
        ],
    request:
      'Propose une architecture proportionnée au projet, explicite les alternatives et compromis, puis éprouve les hypothèses risquées. Préserve les choix de design retenus et les données existantes.',
  };
}
function delivery(state: JourneyState): StageSummary {
  const current = state.revisions.find((revision) => revision.id === state.activeRevision);
  const checks = current ? state.checks.filter((check) => check.revisionId === current.id) : [];
  return {
    id: 'delivery',
    title: 'Réaliser et vérifier',
    purpose:
      'Livrer une tranche utilisable, confronter le résultat aux critères et pouvoir reprendre.',
    status: state.revisions.length
      ? count(state.revisions.length, 'version enregistrée', 'versions enregistrées')
      : 'Application à réaliser',
    facts: current
      ? [
          `Version active : ${current.title}.`,
          `${checks.length} contrôle(s) enregistré(s) sur cette version. Leur présence ne prouve pas la couverture de tous les critères.`,
        ]
      : ['Aucune version active. Une direction visuelle ne remplace pas une application exécutée.'],
    request:
      'Réalise une tranche utilisable à partir des choix autorisés. Exécute les contrôles pertinents, conserve les preuves liées à la version, et vérifie une interruption, une reprise et une évolution du besoin.',
  };
}
export function journeyStages(state: JourneyState): StageSummary[] {
  return [
    foundation(state),
    exploration(state),
    frame(state),
    {
      id: 'design',
      title: 'Concevoir l’expérience',
      purpose:
        'Passer de directions distinctes à une référence détaillée, puis aux écrans et au prototype.',
      status: state.designs.length
        ? count(state.designs.length, 'direction disponible', 'directions disponibles')
        : 'Directions à créer',
      facts: [],
      request:
        'Crée trois directions visuelles réellement distinctes du même écran à partir des références. Présente leurs différences pour choisir avant de produire le master détaillé, les écrans dérivés et le prototype interactif.',
    },
    architecture(state),
    delivery(state),
  ];
}

/** Display projection only. Approval and transition rules remain on the server. */
export function designRecords(state: JourneyState) {
  const journey = state.designJourney;
  const master = journey?.masters.find((item) => item.id === journey.activeMasterId);
  const stale = Boolean(master && master.designId !== state.selectedDesignId);
  const approvalInsufficient = Boolean(
    master?.approvedBy === 'agent' && state.project.delegation?.visual === 'user',
  );
  const screens = master
    ? (journey?.screens.filter((item) => item.masterId === master.id) ?? [])
    : [];
  const prototype = master
    ? journey?.prototypes.filter((item) => item.masterId === master.id).at(-1)
    : undefined;
  const revision = state.revisions.find((item) => item.id === prototype?.revisionId);
  return { master, stale, approvalInsufficient, screens, prototype, revision };
}
