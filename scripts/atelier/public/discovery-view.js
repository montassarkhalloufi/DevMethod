import { el, button, paragraph, heading } from './views.js';

function actionLabel(project, action) {
  const actor = project.actors.find((item) => item.id === action.actorId)?.label ?? action.actorId;
  const operation =
    project.variants.flatMap((item) => item.actions).find((item) => item.id === action.actionId)
      ?.label ?? action.actionId;
  const record = project.records.find((item) => item.id === action.recordId)?.title;
  return `${actor} · ${operation} · ${record ?? action.title ?? action.recordId}`;
}

function observationsView(project, observations) {
  return el(
    'div',
    { className: 'discovery-outcomes' },
    observations.map((observation) => {
      const variant = project.variants.find((item) => item.id === observation.variantId);
      return el('section', {}, [
        heading(4, variant?.title ?? observation.variantId),
        paragraph(observation.value.allowed ? 'Action acceptée' : 'Action refusée'),
        el(
          'ul',
          {},
          observation.value.records.map((record) => {
            const state =
              variant?.states.find((item) => item.id === record.state)?.label ?? record.state;
            return el('li', { text: `${record.title} · ${state}` });
          }),
        ),
        el('details', {}, [
          el('summary', { text: 'Examiner les données comparées' }),
          paragraph(
            'Les identifiants permettent de distinguer deux états qui portent le même nom. Leur sens pour votre projet reste à examiner.',
          ),
          el('pre', { text: JSON.stringify(observation.value, null, 2) }),
        ]),
      ]);
    }),
  );
}

export function discoveryView(project, result, seeking, { search, replay, reconsider }) {
  const section = el(
    'section',
    { className: 'discovery-panel', 'aria-label': 'Trouver une différence' },
    [
      paragraph('EXPLORER CE QUI CHANGE VRAIMENT', 'eyebrow'),
      heading(2, 'Quel essai pourrait changer votre choix ?'),
      paragraph(
        'Faites chercher une situation où les prototypes réagissent différemment. Vous décidez ensuite si cette différence compte pour votre projet.',
      ),
      button(seeking ? 'Recherche en cours…' : 'Chercher une situation révélatrice', search, {
        id: 'discover-situation',
        className: 'primary',
        disabled: seeking,
      }),
      paragraph('La même recherche peut aussi comparer des calculs de durée et de montant.'),
      el('a', { href: '/transfer', text: 'Essayer le cas d’un équipement partagé →' }),
    ],
  );
  if (!result) return section;
  const found = result.status === 'witness';
  const title = found
    ? 'Un premier écart à examiner'
    : 'Aucune différence trouvée dans cette recherche';
  section.append(heading(3, title));
  if (found) {
    section.append(
      paragraph(
        'Cet aperçu part des données initiales. Vos essais actuels n’ont pas changé. Une différence n’est pas une recommandation.',
      ),
    );
    section.append(
      el(
        'ol',
        { className: 'discovery-steps' },
        result.trace.map((step) =>
          el('li', {}, [
            paragraph(actionLabel(project, step.action)),
            observationsView(project, step.observations),
          ]),
        ),
      ),
    );
    section.append(
      el('div', { className: 'head-actions' }, [
        button('Jouer cette situation', replay, { id: 'play-discovery', className: 'primary' }),
        button('Cette situation manque mon besoin', reconsider, { id: 'reconsider-discovery' }),
      ]),
    );
  } else
    section.append(
      paragraph(
        'Cela ne démontre pas que les produits sont équivalents. D’autres actions, données ou critères peuvent les distinguer.',
      ),
    );
  section.append(
    el('details', {}, [
      el('summary', { text: 'Ce que cette recherche couvre' }),
      paragraph(
        'Comparaison des actions acceptées et des données obtenues, depuis les enregistrements initiaux, avec au plus un nouvel élément fictif. Les effets de production et la pertinence pour votre travail restent à examiner.',
      ),
      paragraph(
        `${result.stats.transitions} transitions examinées · limite de ${result.limits.maxDepth} actions par suite. ${result.status === 'bounded' ? 'Une limite de recherche a été atteinte.' : ''}`,
      ),
    ]),
  );
  return section;
}
