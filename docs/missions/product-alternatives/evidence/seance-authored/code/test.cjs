'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const D = require('./domain.js');
const R = require('./render.js');

test('durées exactes, initial 20:57 et sortie 21:02', () => {
  const s = D.schedule(D.initial().draft);
  assert.equal(s.rows.filter(x => x.kind === 'film').reduce((n, x) => n + x.duration, 0), 92);
  assert.equal(s.end, 1257); assert.equal(s.emptyAt, 1262); assert.equal(s.valid, true);
});
test('choix 1 : six films, remplacement explicite, appel exact, F6 dernier', () => {
  const proposal = D.proposals(D.initial().draft)[0], s = D.schedule(proposal.draft);
  assert.equal(s.valid, true); assert.equal(s.filmCount, 6); assert.equal(s.emptyAt, 1262);
  assert.deepEqual(s.rows.find(x => x.id === 'call'), { id: 'call', title: 'Appel avec l’invitée', kind: 'call', duration: 15, start: 1205, end: 1220 });
  assert.equal(s.rows.at(-1).id, 'F6'); assert.equal(s.rows.some(x => x.kind === 'discussion'), false);
  assert.match(proposal.draft.decision, /remplacer la discussion/);
});
test('choix 2 : retrait F4, discussion15, attente2, sortie limite exacte', () => {
  const s = D.schedule(D.proposals(D.initial().draft)[1].draft);
  assert.equal(s.valid, true); assert.equal(s.filmCount, 5); assert.equal(s.emptyAt, 1270);
  assert.equal(s.rows.find(x => x.id === 'waiting').duration, 2);
  assert.equal(s.rows.find(x => x.id === 'discussion').duration, 15);
  assert.equal(s.rows.some(x => x.id === 'F4'), false); assert.equal(s.rows.at(-1).id, 'F6');
});
test('garder six films et discussion10 après appel dépasse de2 ; publication bloquée', () => {
  const state = D.initial(); state.draft = D.proposals(state.draft)[0].draft;
  state.draft.order.push('shortDiscussion');
  const s = D.schedule(state.draft); assert.equal(s.emptyAt, 1272); assert.equal(s.valid, false);
  assert.throws(() => D.publish(state, 'test'), /2 min après/);
});
test('appel en retard : conflit explicite sans film coupé ni chevauchement', () => {
  const d = D.initial().draft; d.callRequired = true; d.order.push('call');
  const s = D.schedule(d); assert.equal(s.valid, false); assert.match(s.errors.join(), /au lieu de 20:05/);
  s.rows.forEach((r, i) => { assert.equal(r.duration, D.catalog[r.id].duration); if (i) assert.equal(r.start, s.rows[i - 1].end); });
});
test('événement ne choisit pas implicitement une option, ni ne modifie le brouillon', () => {
  const d = D.initial().draft, bytes = JSON.stringify(d); D.proposals(d);
  assert.equal(JSON.stringify(d), bytes); d.callRequired = true;
  assert.equal(D.schedule(d).valid, false); assert.match(D.schedule(d).errors.join(), /reste à intégrer/);
});
test('publication transactionnelle conserve v1 et son HTML après choix, édition et v2', () => {
  const a = D.publish(D.initial(), '2026-09-16T09:00:00Z');
  const oldBytes = JSON.stringify(a.publications[0]), oldHTML = R.offline(a.publications[0]);
  const b = D.clone(a); b.draft = D.proposals(b.draft)[0].draft; b.draft.title = 'Nouveau titre';
  const c = D.publish(b, '2026-09-16T10:00:00Z');
  assert.equal(a.publications.length, 1); assert.equal(c.publications.length, 2);
  assert.equal(JSON.stringify(c.publications[0]), oldBytes); assert.equal(R.offline(c.publications[0]), oldHTML);
  assert.match(c.publications[1].changes.join(), /Retiré : Discussion/);
  assert.match(c.publications[1].changes.join(), /Ajouté : Appel/);
  assert.match(c.publications[1].changes.join(), /Traversée : 19:30–19:53 → 20:20–20:43/);
});
test('export autonome : contenu échappé et aucune ressource distante ni script', () => {
  const doc = D.initial(); doc.draft.title = '<script>alert(1)</script>';
  const html = R.offline(D.publish(doc, 'test').publications[0]);
  assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script|src=|https?:/);
  assert.match(html, /21:02/); assert.match(html, /5 minutes/);
});
test('stockage local séparé : roundtrip de brouillon + versions, corruption signalée', () => {
  const memory = new Map(), sandbox = { SeanceDomain: D, localStorage: { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) } };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/storage.js`, 'utf8'), sandbox);
  const state = D.publish(D.initial(), 'test'); state.draft = D.proposals(state.draft)[1].draft;
  sandbox.SeanceStorage.save(state); assert.deepEqual(sandbox.SeanceStorage.load(), state);
  memory.set(sandbox.SeanceStorage.key, '{broken'); assert.throws(() => sandbox.SeanceStorage.load());
  const unknown = D.initial(); unknown.draft.order.push('inconnu');
  memory.set(sandbox.SeanceStorage.key, JSON.stringify(unknown)); assert.throws(() => sandbox.SeanceStorage.load(), /Ordre local invalide/);
});
test('catalogue ne permet pas de falsifier les durées', () => {
  assert.throws(() => { D.catalog.F1.duration = 1; });
  assert.equal(D.catalog.F1.duration, 12);
});

// Examples are deliberately labelled generated data, not user publications.
const state = D.publish(D.initial(), 'Exemple généré pour contrôle technique');
fs.writeFileSync(`${__dirname}/../evidence/example-v1.html`, R.offline(state.publications[0]));
state.draft = D.proposals(state.draft)[0].draft;
const later = D.publish(state, 'Exemple généré pour contrôle technique');
fs.writeFileSync(`${__dirname}/../evidence/example-v2.html`, R.offline(later.publications[1]));
fs.writeFileSync(`${__dirname}/../evidence/calculated-options.json`, JSON.stringify(D.proposals(D.initial().draft).map(p => ({ id: p.id, tradeoff: p.tradeoff, draft: p.draft, schedule: D.schedule(p.draft) })), null, 2));
