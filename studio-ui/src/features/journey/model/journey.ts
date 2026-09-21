import { translate, type StudioLocale } from '../../../i18n';
import type { JourneyState, StageSummary } from './contracts';

const count = (value: number, singular: string, plural: string, locale: StudioLocale) =>
  `${value.toLocaleString(locale)} ${value === 1 ? singular : plural}`;

function foundation(state: JourneyState, locale: StudioLocale = 'en'): StageSummary {
  return {
    id: 'foundation',
    title: translate('Comprendre le projet', 'Understand the project', undefined, locale),
    purpose: translate(
      'Retrouver l’intention, les acquis et ce que vous déléguez.',
      'Review the intent, established facts, and what you delegate.',
      undefined,
      locale,
    ),
    status: state.import
      ? translate(
          'Référence importée · contexte à examiner',
          'Imported reference · context needs review',
          undefined,
          locale,
        )
      : state.project.idea
        ? translate('Intention enregistrée', 'Intent recorded', undefined, locale)
        : translate('À préciser', 'To clarify', undefined, locale),
    facts: [
      state.project.idea ||
        (state.import
          ? translate(
              'Précisez l’objectif de la prochaine évolution dans la discussion.',
              'Clarify the goal of the next change in the conversation.',
              undefined,
              locale,
            )
          : translate(
              'Décrivez votre idée dans la discussion.',
              'Describe your idea in the conversation.',
              undefined,
              locale,
            ),
        locale),
      ...state.project.constraints,
    ],
    request: translate(
      'Reprends le contexte et les acquis du projet, ses références et les décisions déléguées. Signale seulement les informations qui manquent pour avancer, sans répéter les questions déjà résolues.',
      'Review the project context, established facts, references, and delegated decisions. Identify only information needed to proceed, without repeating questions already resolved.',
      undefined,
      locale,
    ),
  };
}
function exploration(state: JourneyState, locale: StudioLocale = 'en'): StageSummary {
  const records = state.decisions.filter(
    (decision) =>
      decision.status === 'hypothesis' ||
      (decision.status === 'active' && /explor/i.test(decision.topic)),
  );
  return {
    id: 'exploration',
    title: translate('Explorer les possibilités', 'Explore possibilities', undefined, locale),
    purpose: translate(
      'Comparer les usages, alternatives et incertitudes utiles avant de choisir.',
      'Compare relevant uses, alternatives, and uncertainties before choosing.',
      undefined,
      locale,
    ),
    status: records.length
      ? count(
          records.length,
          translate('piste enregistrée', 'recorded direction', undefined, locale),
          translate('pistes enregistrées', 'recorded directions', undefined, locale),
          locale,
        )
      : translate('Exploration à documenter', 'Exploration to document', undefined, locale),
    facts: records.length
      ? records.map(
          (item) =>
            `${item.status === 'hypothesis' ? translate('Hypothèse', 'Assumption', undefined, locale) : translate('Choix actif', 'Active decision', undefined, locale)} : ${item.topic} — ${item.choice}${item.reason ? `. ${item.reason}` : ''}`,
        )
      : [
          translate(
            'Aucune hypothèse ou décision d’exploration enregistrée. Cela ne prouve pas qu’une exploration a été menée.',
            'No exploration assumptions or decisions are recorded. This does not establish that exploration has taken place.',
            undefined,
            locale,
          ),
        ],
    request: translate(
      'Explore les besoins, usages et alternatives réellement différents pour ce projet. Appuie les possibilités sur des observations et propose une expérience bornée pour les incertitudes importantes.',
      'Explore needs, uses, and genuinely different alternatives for this project. Support the possibilities with observations and propose a bounded experiment for important uncertainties.',
      undefined,
      locale,
    ),
  };
}
function frame(state: JourneyState, locale: StudioLocale = 'en'): StageSummary {
  return {
    id: 'frame',
    title: translate('Cadrer le résultat', 'Frame the outcome', undefined, locale),
    purpose: translate(
      'Exprimer le résultat attendu, le périmètre et les critères pour le juger.',
      'Describe the expected outcome, scope, and criteria for assessing it.',
      undefined,
      locale,
    ),
    status: state.brief.outcome
      ? translate('Cadrage disponible à examiner', 'Brief available for review', undefined, locale)
      : translate('À cadrer', 'To frame', undefined, locale),
    facts: [
      state.brief.outcome ||
        translate(
          'Le résultat attendu reste à préciser.',
          'The expected outcome still needs clarification.',
          undefined,
          locale,
        ),
      ...state.brief.criteria.map((criterion) => criterion.text),
    ],
    request: translate(
      'Précise le résultat attendu, le périmètre, les exclusions et les critères observables. Relie-les aux acquis de l’exploration et aux contraintes, sans marquer comme validé ce qui n’a pas été décidé.',
      'Clarify the expected outcome, scope, exclusions, and observable criteria. Connect them to exploration findings and constraints without treating undecided matters as approved.',
      undefined,
      locale,
    ),
  };
}
function architecture(state: JourneyState, locale: StudioLocale = 'en'): StageSummary {
  const decisions = state.decisions.filter(
    (decision) =>
      decision.status === 'active' &&
      /architect|techni|stockage|données|sécurité/i.test(decision.topic),
  );
  return {
    id: 'architecture',
    title: translate('Choisir une architecture', 'Choose an architecture', undefined, locale),
    purpose: translate(
      'Rendre les compromis techniques compréhensibles et éprouver les risques.',
      'Explain technical trade-offs and test risks.',
      undefined,
      locale,
    ),
    status: decisions.length
      ? translate('Choix techniques repérés', 'Technical decisions identified', undefined, locale)
      : translate(
          'Choix techniques à expliciter',
          'Technical decisions to clarify',
          undefined,
          locale,
        ),
    facts: decisions.length
      ? decisions.map((item) => `${item.topic} — ${item.choice}. ${item.reason}`)
      : [
          translate(
            'Aucune décision active repérée par son thème technique. Le code seul ne décrit pas ses compromis.',
            'No active decision was identified by its technical topic. Code alone does not explain its trade-offs.',
            undefined,
            locale,
          ),
        ],
    request: translate(
      'Propose une architecture proportionnée au projet, explicite les alternatives et compromis, puis éprouve les hypothèses risquées. Préserve les choix de design retenus et les données existantes.',
      'Propose an architecture proportionate to the project, explain alternatives and trade-offs, then test risky assumptions. Preserve the selected design decisions and existing data.',
      undefined,
      locale,
    ),
  };
}
function delivery(state: JourneyState, locale: StudioLocale = 'en'): StageSummary {
  const current = state.revisions.find((revision) => revision.id === state.activeRevision);
  const checks = current ? state.checks.filter((check) => check.revisionId === current.id) : [];
  return {
    id: 'delivery',
    title: translate('Réaliser et vérifier', 'Build and verify', undefined, locale),
    purpose: translate(
      'Livrer une tranche utilisable, confronter le résultat aux critères et pouvoir reprendre.',
      'Deliver a usable increment, assess it against the criteria, and keep work resumable.',
      undefined,
      locale,
    ),
    status: state.revisions.length
      ? count(
          state.revisions.length,
          translate('version enregistrée', 'saved version', undefined, locale),
          translate('versions enregistrées', 'saved versions', undefined, locale),
          locale,
        )
      : translate('Application à réaliser', 'Application to build', undefined, locale),
    facts: current
      ? [
          translate(
            'Version active : {title}.',
            'Active version: {title}.',
            { title: current.title },
            locale,
          ),
          translate(
            '{count} contrôle(s) enregistré(s) sur cette version. Leur présence ne prouve pas la couverture de tous les critères.',
            '{count} check(s) recorded for this version. Their presence does not prove coverage of every criterion.',
            { count: checks.length.toLocaleString(locale) },
            locale,
          ),
        ]
      : [
          translate(
            'Aucune version active. Une direction visuelle ne remplace pas une application exécutée.',
            'No active version. A visual direction does not replace a running application.',
            undefined,
            locale,
          ),
        ],
    request: translate(
      'Réalise une tranche utilisable à partir des choix autorisés. Exécute les contrôles pertinents, conserve les preuves liées à la version, et vérifie une interruption, une reprise et une évolution du besoin.',
      'Build a usable increment from the authorized decisions. Run relevant checks, preserve version-linked evidence, and verify interruption, recovery, and a change in requirements.',
      undefined,
      locale,
    ),
  };
}
export function journeyStages(state: JourneyState, locale: StudioLocale = 'en'): StageSummary[] {
  return [
    foundation(state, locale),
    exploration(state, locale),
    frame(state, locale),
    {
      id: 'design',
      title: translate('Concevoir l’expérience', 'Design the experience', undefined, locale),
      purpose: translate(
        'Passer de directions distinctes à une référence détaillée, puis aux écrans et au prototype.',
        'Move from distinct directions to a detailed reference, then screens and a prototype.',
        undefined,
        locale,
      ),
      status: state.designs.length
        ? count(
            state.designs.length,
            translate('direction disponible', 'available direction', undefined, locale),
            translate('directions disponibles', 'available directions', undefined, locale),
            locale,
          )
        : translate('Directions à créer', 'Directions to create', undefined, locale),
      facts: [],
      request: translate(
        'Crée trois directions visuelles réellement distinctes du même écran à partir des références. Présente leurs différences pour choisir avant de produire le master détaillé, les écrans dérivés et le prototype interactif.',
        'Create three distinct visual directions for the same screen from the references. Present their differences for selection before creating the detailed master, derived screens, and interactive prototype.',
        undefined,
        locale,
      ),
    },
    architecture(state, locale),
    delivery(state, locale),
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
