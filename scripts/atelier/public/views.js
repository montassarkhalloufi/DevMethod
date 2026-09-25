export function el(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'text') node.textContent = value;
    else if (key === 'className') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (['value', 'checked', 'disabled', 'required'].includes(key)) node[key] = value;
    else node.setAttribute(key, value);
  }
  node.append(...children.filter(Boolean));
  return node;
}

export const button = (label, action, attributes = {}) =>
  el('button', { type: 'button', text: label, onClick: action, ...attributes });
export const paragraph = (text, className = '') => el('p', { text, className });
export const heading = (level, text) => el('h' + level, { text });

export function workspaceNavigation() {
  const links = [
    ['01', 'Le projet', '#project'],
    ['02', 'Comparer', '#prototypes'],
    ['03', 'Essayer', '#situation'],
    ['04', 'Décider', '#decision'],
  ];
  return el('nav', { className: 'workspace-nav', 'aria-label': 'Dans cet atelier' }, [
    paragraph('VOTRE ATELIER', 'eyebrow'),
    ...links.map(([number, label, href]) =>
      el('a', { href }, [
        el('span', { className: 'nav-number', text: number, 'aria-hidden': 'true' }),
        el('span', { text: label }),
      ]),
    ),
    paragraph('Comprendre.\nEssayer.\nChoisir.', 'nav-note'),
  ]);
}

export function projectIntent(project, edit) {
  const disclosure = (label, content, open = false) =>
    el('details', { ...(open ? { open: '' } : {}) }, [el('summary', { text: label }), content]);
  return el('aside', { className: 'intent-panel', 'aria-label': 'Intentions du projet' }, [
    heading(2, 'Intentions'),
    disclosure('Le besoin à comprendre', paragraph(project.brief), true),
    disclosure(
      'Contraintes à garder',
      el(
        'ul',
        {},
        project.constraints.map((item) => el('li', { text: item.text })),
      ),
    ),
    disclosure(
      'Questions ouvertes',
      el(
        'ul',
        {},
        project.questions.map((text) => el('li', { text })),
      ),
    ),
    button('Ouvrir le contexte', edit, { id: 'open-intent-context' }),
    paragraph('Un choix se construit à partir de ce que vous avez essayé.', 'intent-note'),
  ]);
}

export function field(label, id, control) {
  control.id = id;
  return el('div', { className: 'field' }, [el('label', { for: id, text: label }), control]);
}

export function select(items, value, onChange, attributes = {}) {
  const node = el(
    'select',
    { onChange: (event) => onChange(event.target.value), ...attributes },
    items.map((item) => el('option', { value: item.id, text: item.label ?? item.title })),
  );
  node.value = value;
  return node;
}

function architecture(variant) {
  const details = el('details', { className: 'architecture' }, [
    el('summary', { text: 'Design et architecture' }),
    paragraph(variant.tradeoff, 'tradeoff'),
  ]);
  details.append(
    heading(4, 'Organisation du produit'),
    paragraph(variant.premise),
    heading(4, 'Choix envisagés'),
    paragraph(variant.architecture.data),
  );
  details.append(
    el(
      'ul',
      {},
      [...variant.architecture.boundaries, ...variant.architecture.tradeoffs].map((text) =>
        el('li', { text }),
      ),
    ),
  );
  details.append(
    paragraph(
      'Les essais utilisent le moteur local de l’atelier. Ils ne vérifient pas une architecture de production.',
      'muted',
    ),
  );
  return details;
}

function recordCard(record, variant, actorId, act, actors) {
  const owner = actors.find((actor) => actor.id === record.owner)?.label ?? record.owner;
  const actions = variant.actions.filter(
    (action) => action.kind === 'transition' && action.from.includes(record.state),
  );
  return el('article', { className: 'record', 'data-record': record.id }, [
    heading(4, record.title),
    paragraph('Créé par ' + owner, 'muted'),
    el(
      'div',
      { className: 'record-actions' },
      actions.map((action) =>
        button(
          action.label,
          () => act({ variantId: variant.id, actionId: action.id, actorId, recordId: record.id }),
          { 'aria-label': action.label + ' — ' + record.title + ' — ' + variant.title },
        ),
      ),
    ),
  ]);
}

export function laneView(variant, lane, index, actorId, act, actors) {
  const panel = el(
    'section',
    { className: 'lane ' + variant.design.layout, 'aria-label': variant.title },
    [
      el('div', { className: 'lane-heading' }, [
        el('span', { className: 'letter', text: String.fromCharCode(65 + index) }),
        el('div', {}, [
          paragraph('FONCTIONNEMENT ' + (index + 1), 'eyebrow'),
          heading(2, variant.title),
        ]),
      ]),
      paragraph(variant.premise, 'premise'),
    ],
  );
  const product = el('div', {
    className: 'product',
    tabindex: '0',
    role: 'region',
    'aria-label': 'Données et actions — ' + variant.title,
  });
  for (const state of variant.states) {
    const records = lane.records.filter((record) => record.state === state.id);
    product.append(
      el('section', { className: 'state-group' }, [
        el('div', { className: 'state-label' }, [
          el('span', { text: state.label }),
          el('span', { className: 'count', text: String(records.length) }),
        ]),
        ...(records.length
          ? records.map((record) => recordCard(record, variant, actorId, act, actors))
          : [paragraph('Aucun élément', 'empty')]),
      ]),
    );
  }
  panel.append(product);
  const last = lane.events.at(-1);
  if (last)
    panel.append(
      el(
        'div',
        { className: 'outcome ' + (last.allowed ? 'allowed' : 'refused'), 'aria-live': 'polite' },
        [
          el('strong', { text: last.allowed ? 'Action effectuée' : 'Action refusée' }),
          paragraph(last.reason),
          paragraph(
            'État : ' +
              (variant.states.find((state) => state.id === last.after)?.label ?? 'inchangé'),
            'muted',
          ),
        ],
      ),
    );
  panel.append(architecture(variant));
  return panel;
}

export function contextView(project, save) {
  const form = el(
    'form',
    {
      onSubmit: (event) => {
        event.preventDefault();
        const brief = form.querySelector('#brief').value;
        const texts = form
          .querySelector('#constraints')
          .value.split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        const constraints = texts.map((text, index) => ({
          id: project.constraints[index]?.id ?? 'constraint-' + index,
          text,
        }));
        save({ brief, constraints });
      },
    },
    [
      paragraph(
        'Reformuler le besoin ne réécrit ni vos essais ni vos données. Le choix précédent sera signalé comme à reconsidérer.',
      ),
      field(
        'Intention et contexte',
        'brief',
        el('textarea', { rows: '6', required: true, value: project.brief }),
      ),
      field(
        'Contraintes à conserver — une par ligne',
        'constraints',
        el('textarea', {
          rows: '5',
          value: project.constraints.map((item) => item.text).join('\n'),
        }),
      ),
      el('button', { className: 'primary', type: 'submit', text: 'Enregistrer le nouveau besoin' }),
    ],
  );
  const references = project.sources.map((source) =>
    el('li', {}, [
      el('a', {
        href: source.url,
        target: '_blank',
        rel: 'noopener noreferrer',
        text: source.title,
      }),
      paragraph(source.note),
    ]),
  );
  return el('div', {}, [
    form,
    heading(3, 'Questions encore ouvertes'),
    el(
      'ul',
      {},
      project.questions.map((text) => el('li', { text })),
    ),
    heading(3, 'Sources de l’exploration'),
    references.length
      ? el('ul', {}, references)
      : paragraph(
          'Aucune observation de terrain jointe à ce cas fictif. Les hypothèses restent à vérifier.',
          'muted',
        ),
  ]);
}
