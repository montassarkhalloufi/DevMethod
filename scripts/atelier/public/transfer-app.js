import { findWitness } from '/discovery/search.mjs';
import { rentalMachine } from '/transfer/machine.mjs';
import {
  POLICIES,
  RENTAL,
  initialRental,
  rentalActions,
  executeRental,
  rentalInvoice,
} from '/transfer/domain.mjs';
import { el, paragraph, heading, button } from './views.js';

let current = initialRental();
let steps = [];
let found;
const titles = ['Arrondir chaque séance', 'Cumuler la journée'];
const money = (cents) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
const actionTitle = (action) =>
  `${action.kind === 'rent' ? 'Location' : 'Pause'} de ${action.minutes} minutes`;
const dialog = document.querySelector('#rental-reset');

function renderRental() {
  const focusId = document.activeElement?.id;
  const wasAction = document.activeElement?.parentElement?.id === 'rental-actions';
  document.querySelector('#rental-actions').replaceChildren(
    ...rentalActions(current).map((action) =>
      button(
        actionTitle(action),
        () => {
          current = executeRental(current, action);
          steps.push(action);
          renderRental();
        },
        { id: `rental-${action.kind}-${action.minutes}` },
      ),
    ),
  );
  document.querySelector('#rental-progress').textContent =
    `${current.elapsedMinutes} / ${RENTAL.horizonMinutes} minutes écoulées · ${current.usedMinutes} minutes d’utilisation réelle.`;
  document
    .querySelector('#rental-history')
    .replaceChildren(...steps.map((action) => el('li', { text: actionTitle(action) })));
  document.querySelector('#rental-invoices').replaceChildren(
    ...POLICIES.map((policy, index) => {
      const invoice = rentalInvoice(current, policy);
      return el('section', {}, [
        heading(2, titles[index]),
        paragraph(money(invoice.priceCents), 'rental-price'),
        paragraph(
          `${invoice.chargedMinutes} minutes facturées pour ${invoice.usedMinutes} minutes utilisées.`,
        ),
      ]);
    }),
  );
  const focus =
    document.getElementById(focusId) ??
    (wasAction ? document.querySelector('#clear-rental') : null);
  focus?.focus({ preventScroll: true });
}

function showDiscovery() {
  found = findWitness(rentalMachine());
  const output = document.querySelector('#rental-discovery');
  if (found.status !== 'witness') {
    output.replaceChildren(
      paragraph(
        'Aucun écart trouvé dans cette recherche bornée. Cela ne démontre pas une équivalence générale.',
      ),
    );
    return;
  }
  output.replaceChildren(
    heading(3, 'Un essai trouvé, à examiner'),
    paragraph(
      'Cet aperçu part de zéro utilisation. Jouer la situation remplace votre essai après confirmation.',
    ),
    el(
      'ol',
      {},
      found.trace.map((step) =>
        el('li', {}, [
          paragraph(actionTitle(step.action)),
          ...step.observations.map((observation, index) =>
            paragraph(
              `${titles[index]} : ${money(observation.value.priceCents)} · ${observation.value.chargedMinutes} minutes facturées.`,
            ),
          ),
        ]),
      ),
    ),
    button('Jouer cet essai', () => dialog.showModal(), {
      id: 'play-rental',
      className: 'primary',
    }),
    paragraph(
      `${found.stats.transitions} transitions examinées ; recherche limitée à ${found.limits.maxDepth} actions par suite. Le premier écart trouvé n’est pas un tarif recommandé.`,
      'muted',
    ),
  );
}

document.querySelector('#find-rental').addEventListener('click', showDiscovery);
document.querySelector('#clear-rental').addEventListener('click', () => {
  current = initialRental();
  steps = [];
  renderRental();
});
document.querySelector('#cancel-rental-reset').addEventListener('click', () => dialog.close());
document.querySelector('#confirm-rental-reset').addEventListener('click', () => {
  current = initialRental();
  steps = found.trace.map((step) => step.action);
  for (const action of steps) current = executeRental(current, action);
  dialog.close();
  renderRental();
});
dialog.addEventListener('close', () => document.querySelector('#play-rental')?.focus());
renderRental();
