import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../examples/seance/code/domain.js';
import * as R from '../examples/seance/code/render.js';
import * as S from '../examples/seance/code/storage.js';

test('durées exactes, initial 20:57 et sortie 21:02', () => {
  const s = D.schedule(D.initial().draft);
  assert.equal(
    s.rows.filter((x) => x.kind === 'film').reduce((n, x) => n + x.duration, 0),
    92,
  );
  assert.equal(s.end, 1257);
  assert.equal(s.emptyAt, 1262);
  assert.equal(s.valid, true);
});
test('choix 1 : six films, remplacement explicite, appel exact, F6 dernier', () => {
  const proposal = D.proposals(D.initial().draft)[0],
    s = D.schedule(proposal.draft);
  assert.equal(s.valid, true);
  assert.equal(s.filmCount, 6);
  assert.equal(s.emptyAt, 1262);
  assert.deepEqual(
    s.rows.find((x) => x.id === 'call'),
    {
      id: 'call',
      title: 'Appel avec l’invitée',
      kind: 'call',
      duration: 15,
      start: 1205,
      end: 1220,
    },
  );
  assert.equal(s.rows.at(-1).id, 'F6');
  assert.equal(
    s.rows.some((x) => x.kind === 'discussion'),
    false,
  );
  assert.match(proposal.draft.decision, /remplacer la discussion/);
});
test('choix 2 : retrait F4, discussion15, attente2, sortie limite exacte', () => {
  const s = D.schedule(D.proposals(D.initial().draft)[1].draft);
  assert.equal(s.valid, true);
  assert.equal(s.filmCount, 5);
  assert.equal(s.emptyAt, 1270);
  assert.equal(s.rows.find((x) => x.id === 'waiting').duration, 2);
  assert.equal(s.rows.find((x) => x.id === 'discussion').duration, 15);
  assert.equal(
    s.rows.some((x) => x.id === 'F4'),
    false,
  );
  assert.equal(s.rows.at(-1).id, 'F6');
});
test('garder six films et discussion10 après appel dépasse de2 ; publication bloquée', () => {
  const state = D.initial();
  state.draft = D.proposals(state.draft)[0].draft;
  state.draft.order.push('shortDiscussion');
  const s = D.schedule(state.draft);
  assert.equal(s.emptyAt, 1272);
  assert.equal(s.valid, false);
  assert.throws(() => D.publish(state, 'test'), /2 min après/);
});
test('appel en retard : conflit explicite sans film coupé ni chevauchement', () => {
  const d = D.initial().draft;
  d.callRequired = true;
  d.order.push('call');
  const s = D.schedule(d);
  assert.equal(s.valid, false);
  assert.match(s.errors.join(), /au lieu de 20:05/);
  s.rows.forEach((r, i) => {
    assert.equal(r.duration, D.catalog[r.id].duration);
    if (i) assert.equal(r.start, s.rows[i - 1].end);
  });
});
test('événement ne choisit pas implicitement une option, ni ne modifie le brouillon', () => {
  const d = D.initial().draft,
    bytes = JSON.stringify(d);
  D.proposals(d);
  assert.equal(JSON.stringify(d), bytes);
  d.callRequired = true;
  assert.equal(D.schedule(d).valid, false);
  assert.match(D.schedule(d).errors.join(), /reste à intégrer/);
});
test('publication transactionnelle conserve v1 et son HTML après choix, édition et v2', () => {
  const a = D.publish(D.initial(), '2026-09-16T09:00:00Z');
  const oldBytes = JSON.stringify(a.publications[0]),
    oldHTML = R.offline(a.publications[0]);
  const b = D.clone(a);
  b.draft = D.proposals(b.draft)[0].draft;
  b.draft.title = 'Nouveau titre';
  const c = D.publish(b, '2026-09-16T10:00:00Z');
  assert.equal(a.publications.length, 1);
  assert.equal(c.publications.length, 2);
  assert.equal(JSON.stringify(c.publications[0]), oldBytes);
  assert.equal(R.offline(c.publications[0]), oldHTML);
  assert.match(c.publications[1].changes.join(), /Retiré : Discussion/);
  assert.match(c.publications[1].changes.join(), /Ajouté : Appel/);
  assert.match(c.publications[1].changes.join(), /Traversée : 19:30–19:53 → 20:20–20:43/);
});
test('export autonome : contenu échappé et aucune ressource distante ni script', () => {
  const doc = D.initial();
  doc.draft.title = '<script>alert(1)</script>';
  const html = R.offline(D.publish(doc, 'test').publications[0]);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script|src=|https?:/);
  assert.match(html, /21:02/);
  assert.match(html, /5 minutes/);
});
test('stockage local séparé : roundtrip de brouillon + versions, corruption signalée', () => {
  const memory = new Map(),
    storage = { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) };
  const state = D.publish(D.initial(), 'test');
  state.draft = D.proposals(state.draft)[1].draft;
  S.save(state, storage);
  assert.deepEqual(S.load(storage), state);
  memory.set(S.key, '{broken');
  assert.throws(() => S.load(storage));
  const unknown = D.initial();
  unknown.draft.order.push('inconnu');
  memory.set(S.key, JSON.stringify(unknown));
  assert.throws(() => S.load(storage), /Ordre local invalide/);
});
test('catalogue ne permet pas de falsifier les durées', () => {
  assert.throws(() => {
    D.catalog.F1.duration = 1;
  });
  assert.equal(D.catalog.F1.duration, 12);
});

test('le chargement refuse un identifiant inconnu sans effacer un brouillon horaire à corriger', () => {
  const invalid = D.initial();
  invalid.draft.order.push('unknown-film');
  assert.throws(() => D.validateDocument(invalid), /Ordre local invalide/);
  const conflict = D.initial();
  conflict.draft.callRequired = true;
  assert.equal(D.schedule(conflict.draft).valid, false);
  assert.deepEqual(D.validateDocument(conflict), conflict);
});

test('les liaisons DOM conservent le titre, les ajustements et les versions après réouverture', async () => {
  const { JSDOM } = await import('jsdom');
  const { start } = await import('../examples/seance/code/app.js');
  const open = (bytes) => {
    const dom = new JSDOM('<p id="storage"></p><div id="app"></div>', { url: 'http://localhost' });
    const local = dom.window.localStorage;
    if (bytes) local.setItem(S.key, bytes);
    start(dom.window.document, {
      load: () => S.load(local),
      save: (value) => S.save(value, local),
    });
    return dom;
  };
  const dom = open();
  try {
    const page = dom.window.document;
    const change = (selector, value) => {
      const element = page.querySelector(selector);
      element.value = value;
      element.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    };
    const read = () => S.load(dom.window.localStorage);
    change('#title', 'Les voisins font leur cinéma');
    page.querySelector('[data-down="0"]').click();
    assert.deepEqual(read().draft.order.slice(0, 2), ['F2', 'F1']);
    page.querySelector('[data-up="1"]').click();
    assert.deepEqual(read().draft.order.slice(0, 2), ['F1', 'F2']);
    page.querySelector('[data-remove="F4"]').click();
    assert.equal(read().draft.order.includes('F4'), false);
    page.querySelector('[data-add="F4"]').click();
    assert.equal(read().draft.order.at(-1), 'F4');
    change('#discussion-duration', 'shortDiscussion');
    assert.equal(read().draft.order.includes('shortDiscussion'), true);
    page.querySelector('#publish').click();
    const first = JSON.stringify(read().publications[0]);
    assert.equal(read().publications[0].title, 'Les voisins font leur cinéma');
    page.querySelector('#event').click();
    assert.equal(page.querySelector('#publish').disabled, true);
    page.querySelector('[data-option="0"]').click();
    assert.equal(page.querySelector('#publish').disabled, false);
    page.querySelector('#publish').click();
    assert.equal(read().publications.length, 2);
    assert.equal(JSON.stringify(read().publications[0]), first);
    change('#version', '1');
    assert.match(page.querySelector('#export').textContent, /version 1/);
    const reopened = open(dom.window.localStorage.getItem(S.key));
    try {
      const restored = S.load(reopened.window.localStorage);
      assert.equal(restored.draft.title, 'Les voisins font leur cinéma');
      assert.equal(restored.publications.length, 2);
      assert.equal(JSON.stringify(restored.publications[0]), first);
      assert.equal(reopened.window.document.querySelector('#title').value, restored.draft.title);
    } finally {
      reopened.window.close();
    }
  } finally {
    dom.window.close();
  }
});

test('une reprise corrompue signale le refus et ne remplace pas la sauvegarde', async () => {
  const { JSDOM } = await import('jsdom');
  const { start } = await import('../examples/seance/code/app.js');
  const dom = new JSDOM('<p id="storage"></p><div id="app"></div>', { url: 'http://localhost' });
  try {
    const invalid = D.initial();
    invalid.draft.order.push('unknown-film');
    const bytes = JSON.stringify(invalid);
    const local = dom.window.localStorage;
    local.setItem(S.key, bytes);
    start(dom.window.document, {
      load: () => S.load(local),
      save: (value) => S.save(value, local),
    });
    assert.equal(local.getItem(S.key), bytes);
    assert.match(dom.window.document.querySelector('#storage').textContent, /Stockage illisible/);
    assert.equal(dom.window.document.querySelector('#app').children.length, 0);
  } finally {
    dom.window.close();
  }
});

test('annuler l’appel conserve les éditions indépendantes sans deviner les activités à restaurer', () => {
  const state = D.initial();
  state.draft = D.proposals(state.draft)[1].draft;
  state.draft.title = 'Titre courant';
  state.draft.order = ['F2', 'F1', 'F3', 'break', 'call', 'shortDiscussion', 'F6'];
  const before = JSON.stringify(state.draft);
  const preview = D.cancelCall(state.draft);
  assert.equal(JSON.stringify(state.draft), before);
  assert.equal(preview.title, 'Titre courant');
  assert.deepEqual(preview.order, ['F2', 'F1', 'F3', 'break', 'shortDiscussion', 'F6']);
  assert.equal(preview.callRequired, false);
  assert.equal(preview.order.includes('F4'), false);
  assert.equal(preview.order.includes('F5'), false);
  assert.equal(
    D.schedule(preview).rows.some((row) => row.id === 'waiting'),
    false,
  );
  assert.equal(D.schedule(preview).valid, true);
});

test('les deux compromis peuvent être retirés sans modifier les anciennes publications ou leur HTML', () => {
  for (const option of [0, 1]) {
    let state = D.publish(D.initial(), 'avant');
    state.draft = D.proposals(state.draft)[option].draft;
    state = D.publish(state, 'compromis');
    const publications = JSON.stringify(state.publications);
    const html = state.publications.map(R.offline);
    state.draft.title = 'Un nouveau titre';
    state.draft.order = state.draft.order.filter((id) => id !== 'F5');
    state.draft.order.reverse();
    const expected = state.draft.order.filter((id) => id !== 'call');
    state.draft = D.cancelCall(state.draft);
    assert.deepEqual(state.draft.order, expected);
    assert.equal(state.draft.title, 'Un nouveau titre');
    assert.equal(JSON.stringify(state.publications), publications);
    assert.deepEqual(state.publications.map(R.offline), html);
    assert.deepEqual(D.validateDocument(state), state);
    assert.deepEqual(D.cancelCall(state.draft), state.draft);
  }
});

async function cancellationPage(seed) {
  const { JSDOM } = await import('jsdom');
  const { start } = await import('../examples/seance/code/app.js');
  const dom = new JSDOM('<p id="storage"></p><div id="app"></div>', { url: 'http://localhost' });
  const local = dom.window.localStorage;
  local.setItem(S.key, JSON.stringify(seed));
  let writes = 0;
  start(dom.window.document, {
    load: () => S.load(local),
    save: (value) => {
      writes += 1;
      S.save(value, local);
    },
  });
  return {
    dom,
    page: dom.window.document,
    read: () => S.load(local),
    bytes: () => local.getItem(S.key),
    writes: () => writes,
  };
}

test('aperçu DOM : annulation sans écriture, ajout explicite, application puis reprise inchangée des versions', async () => {
  let seed = D.publish(D.initial(), 'première');
  seed.draft = D.proposals(seed.draft)[1].draft;
  seed = D.publish(seed, 'appel');
  seed.draft.title = 'La soirée continue';
  seed.draft.order = ['F2', 'F1', 'F3', 'break', 'call', 'shortDiscussion', 'F6'];
  const current = await cancellationPage(seed);
  try {
    const { page, read } = current;
    const before = current.bytes();
    const writes = current.writes();
    page.querySelector('#cancel-call').click();
    const preview = page.querySelector('#cancellation-preview');
    assert.equal(page.activeElement, preview);
    assert.match(preview.textContent, /raisons des anciennes éditions ne sont pas conservées/);
    assert.match(preview.textContent, /Retiré : Appel/);
    assert.match(preview.textContent, /Retiré : Attente/);
    assert.match(preview.textContent, /20:27/);
    page.querySelector('[data-preview-add="F4"]').click();
    assert.match(page.querySelector('#cancellation-preview').textContent, /Ajouté : Le banc bleu/);
    assert.equal(current.bytes(), before);
    assert.equal(current.writes(), writes);
    page.querySelector('#dismiss-cancellation').click();
    assert.equal(page.querySelector('#cancellation-preview'), null);
    assert.equal(current.bytes(), before);
    assert.equal(current.writes(), writes);

    page.querySelector('#cancel-call').click();
    page.querySelector('[data-preview-add="F4"]').click();
    page.querySelector('#apply-cancellation').click();
    const applied = read();
    assert.equal(current.writes(), writes + 1);
    assert.equal(applied.draft.title, seed.draft.title);
    assert.equal(applied.draft.callRequired, false);
    assert.deepEqual(applied.draft.order, [
      'F2',
      'F1',
      'F3',
      'break',
      'shortDiscussion',
      'F6',
      'F4',
    ]);
    assert.deepEqual(applied.publications, seed.publications);
    assert.deepEqual(applied.publications.map(R.offline), seed.publications.map(R.offline));
    const reopened = await cancellationPage(applied);
    try {
      assert.deepEqual(reopened.read(), applied);
      assert.equal(reopened.page.querySelector('#cancel-call'), null);
      reopened.page.querySelector('[data-add="F5"]').click();
      assert.equal(reopened.read().draft.order.at(-1), 'F5');
      assert.equal(reopened.read().publications.length, 2);
    } finally {
      reopened.dom.window.close();
    }
  } finally {
    current.dom.window.close();
  }
});

test('une édition ordinaire ferme un aperçu devenu périmé ; discussion restaurée uniquement par choix explicite', async () => {
  const seed = D.initial();
  seed.draft = D.proposals(seed.draft)[0].draft;
  const current = await cancellationPage(seed);
  try {
    const { page, dom, read } = current;
    page.querySelector('#cancel-call').click();
    assert.equal(
      page.querySelector('#cancellation-preview tbody').textContent.includes('Discussion'),
      false,
    );
    page.querySelector('[data-preview-add="shortDiscussion"]').click();
    assert.equal(read().draft.order.includes('shortDiscussion'), false);
    assert.equal(page.querySelector('[data-preview-add="discussion"]'), null);
    page.querySelector('#title').value = 'Titre encore modifié';
    page.querySelector('#title').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    assert.equal(page.querySelector('#apply-cancellation'), null);
    assert.equal(read().draft.callRequired, true);
    page.querySelector('#cancel-call').click();
    page.querySelector('[data-preview-add="shortDiscussion"]').click();
    page.querySelector('#apply-cancellation').click();
    assert.equal(read().draft.title, 'Titre encore modifié');
    assert.equal(read().draft.order.at(-1), 'shortDiscussion');
    assert.equal(read().draft.order.includes('discussion'), false);
    assert.equal(read().publications.length, 0);
  } finally {
    current.dom.window.close();
  }
});
