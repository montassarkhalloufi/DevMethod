const START = 19 * 60,
  CALL = 20 * 60 + 5,
  DEADLINE = 21 * 60 + 10;
const catalog = Object.freeze({
  F1: { title: 'Fenêtres', duration: 12, kind: 'film' },
  F2: { title: 'Les mains', duration: 18, kind: 'film' },
  F3: { title: 'Traversée', duration: 23, kind: 'film' },
  F4: { title: 'Le banc bleu', duration: 9, kind: 'film' },
  F5: { title: 'À demain', duration: 16, kind: 'film' },
  F6: { title: 'Le dernier bus', duration: 14, kind: 'film' },
  break: { title: 'Entracte', duration: 10, kind: 'break' },
  discussion: { title: 'Discussion', duration: 15, kind: 'discussion' },
  shortDiscussion: { title: 'Discussion', duration: 10, kind: 'discussion' },
  call: { title: 'Appel avec l’invitée', duration: 15, kind: 'call' },
});
Object.values(catalog).forEach(Object.freeze);
const clone = (value) => JSON.parse(JSON.stringify(value));
const time = (n) =>
  `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
function initial() {
  return {
    schemaVersion: 1,
    draft: {
      title: 'La séance collective',
      order: ['F1', 'F2', 'F3', 'break', 'F4', 'F5', 'F6', 'discussion'],
      callRequired: false,
      decision: '',
    },
    publications: [],
  };
}
function placeCall(cursor, rows, errors) {
  if (cursor < CALL) {
    rows.push({
      id: 'waiting',
      title: 'Attente avant l’appel',
      kind: 'waiting',
      duration: CALL - cursor,
      start: cursor,
      end: CALL,
    });
    return CALL;
  }
  if (cursor > CALL)
    errors.push(
      `L’appel commencerait à ${time(cursor)}, au lieu de 20:05. Déplacer ou retirer une activité avant l’appel.`,
    );
  return cursor;
}

function timeline(order) {
  let cursor = START;
  const rows = [],
    errors = [],
    seen = new Set();
  for (const id of order) {
    const item = catalog[id];
    if (!item) {
      errors.push(`Activité inconnue : ${id}`);
      continue;
    }
    if (seen.has(id)) {
      errors.push(`Activité répétée : ${item.title}`);
      continue;
    }
    seen.add(id);
    if (id === 'call') cursor = placeCall(cursor, rows, errors);
    rows.push({ id, ...item, start: cursor, end: cursor + item.duration });
    cursor += item.duration;
  }
  return { rows, errors, seen, end: cursor };
}

function schedule(draft) {
  if (!draft || !Array.isArray(draft.order)) throw new Error('Brouillon invalide.');
  const { rows, errors, seen, end } = timeline(draft.order);
  if (!seen.has('break')) errors.push('L’entracte de 10 minutes est obligatoire.');
  if (!rows.some((r) => r.kind === 'film')) errors.push('Choisir au moins un film.');
  if (seen.has('discussion') && seen.has('shortDiscussion'))
    errors.push('Une seule discussion peut être retenue.');
  if (draft.callRequired && !seen.has('call'))
    errors.push('L’appel de 20:05 à 20:20 reste à intégrer.');
  const emptyAt = end + 5;
  if (emptyAt > DEADLINE)
    errors.push(`La salle serait vide à ${time(emptyAt)} : ${emptyAt - DEADLINE} min après 21:10.`);
  const films = rows.filter((r) => r.kind === 'film');
  return {
    rows,
    end,
    emptyAt,
    margin: DEADLINE - emptyAt,
    errors,
    valid: errors.length === 0,
    filmCount: films.length,
    lastFilmPreferred: films.at(-1)?.id === 'F6',
  };
}

function changes(previous, draft) {
  const next = schedule(draft);
  if (!previous) return ['Première publication : aucun programme antérieur déclaré comme diffusé.'];
  const list = [],
    old = previous.schedule;
  if (previous.title !== draft.title)
    list.push(`Titre : « ${previous.title} » devient « ${draft.title} ».`);
  const before = new Map(old.rows.map((r) => [r.id, r]));
  const after = new Map(next.rows.map((r) => [r.id, r]));
  for (const row of old.rows) {
    const current = after.get(row.id);
    if (!current)
      list.push(
        `Retiré : ${row.title} (${row.duration} min), auparavant ${time(row.start)}–${time(row.end)}.`,
      );
    else if (current.start !== row.start || current.end !== row.end)
      list.push(
        `${row.title} : ${time(row.start)}–${time(row.end)} → ${time(current.start)}–${time(current.end)}.`,
      );
  }
  for (const row of next.rows)
    if (!before.has(row.id))
      list.push(
        `Ajouté : ${row.title}, ${time(row.start)}–${time(row.end)} (${row.duration} min).`,
      );
  if (old.emptyAt !== next.emptyAt)
    list.push(`Salle vide : ${time(old.emptyAt)} → ${time(next.emptyAt)}.`);
  return list.length ? list : ['Aucun changement de titre ni d’horaire.'];
}
function proposals(draft) {
  return [
    {
      id: 'six-films',
      title: 'Six films · l’appel remplace la discussion',
      tradeoff:
        'Les six films et Le dernier bus en dernier sont conservés. L’ordre change ; la discussion libre disparaît au profit de l’appel. Ce remplacement demande votre choix explicite.',
      draft: {
        ...clone(draft),
        callRequired: true,
        order: ['F1', 'F2', 'F4', 'F5', 'break', 'call', 'F3', 'F6'],
        decision:
          'Choix explicite : conserver les six films ; remplacer la discussion par l’appel de 15 minutes.',
      },
    },
    {
      id: 'discussion',
      title: 'Discussion conservée · un film retiré',
      tradeoff:
        'La discussion de 15 minutes reste distincte de l’appel. Le banc bleu (9 min) est retiré ; deux minutes d’attente précèdent l’appel. Le dernier bus conclut. Aucune marge de sortie.',
      draft: {
        ...clone(draft),
        callRequired: true,
        order: ['F1', 'F2', 'F3', 'break', 'call', 'F5', 'discussion', 'F6'],
        decision:
          'Choix explicite : conserver la discussion de 15 minutes ; retirer Le banc bleu ; accepter 2 minutes d’attente et aucune marge après les 5 minutes de sortie.',
      },
    },
  ];
}
function publish(document, publishedAt) {
  const result = schedule(document.draft);
  if (!result.valid) throw new Error(result.errors.join(' '));
  const copy = clone(document);
  const snapshot = {
    version: copy.publications.length + 1,
    publishedAt,
    title: copy.draft.title,
    decision: copy.draft.decision,
    draft: clone(copy.draft),
    schedule: result,
    changes: changes(copy.publications.at(-1), copy.draft),
  };
  copy.publications.push(clone(snapshot));
  return copy;
}
function validateDocument(value) {
  if (
    value?.schemaVersion !== 1 ||
    typeof value.draft?.title !== 'string' ||
    !Array.isArray(value.publications)
  )
    throw new Error('Données locales incompatibles.');
  if (
    !Array.isArray(value.draft.order) ||
    value.draft.order.some((id) => !Object.hasOwn(catalog, id)) ||
    new Set(value.draft.order).size !== value.draft.order.length
  )
    throw new Error('Ordre local invalide.');
  schedule(value.draft);
  for (const p of value.publications)
    if (!p.draft || JSON.stringify(schedule(p.draft)) !== JSON.stringify(p.schedule))
      throw new Error('Une publication locale est incohérente.');
  return clone(value);
}

export {
  START,
  CALL,
  DEADLINE,
  catalog,
  clone,
  time,
  initial,
  schedule,
  changes,
  proposals,
  publish,
  validateDocument,
};
