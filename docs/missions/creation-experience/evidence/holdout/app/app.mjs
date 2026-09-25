import { ledger, currentLoan, addObject, lendObject, returnObject } from './model.mjs';

const $ = selector => document.querySelector(selector);
let data, version, busy = false, filter = 'all', selectedObject = null;
const status = (text, failed = false) => { $('#status').textContent = text; $('#status').classList.toggle('error', failed); };
const node = (tag, text, className) => { const element = document.createElement(tag); if (text !== undefined) element.textContent = text; if (className) element.className = className; return element; };
const date = value => new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

function controls() {
  document.querySelectorAll('button, input').forEach(element => { element.disabled = busy || !data; });
}

async function read() {
  const response = await fetch('/api/data', { cache: 'no-store' });
  if (!response.ok) throw Error('Impossible de lire le carnet. Réessayez lorsque le serveur répond.');
  const result = await response.json();
  if (!Number.isSafeInteger(result.version)) throw Error('Version des données illisible.');
  const next = ledger(result.data);
  data = next; version = result.version;
}

async function change(apply, success) {
  if (busy || !data) return false;
  busy = true; controls();
  try {
    const next = structuredClone(data);
    apply(next);
    ledger(next);
    const response = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version, data: next }) });
    if (response.status === 409) {
      await read(); render();
      throw Error('Le carnet a changé dans un autre onglet. Vos saisies sont conservées. Vérifiez le carnet actualisé puis réessayez.');
    }
    if (!response.ok) throw Error('L’enregistrement a échoué. Vos saisies sont conservées ; vous pouvez réessayer.');
    const result = await response.json();
    data = ledger(result.data); version = result.version;
    render(); status(success); $('#loan-status').textContent = '';
    return true;
  } catch (error) {
    status(error.message, true);
    if ($('#loan-dialog').open) $('#loan-status').textContent = error.message;
    return false;
  } finally { busy = false; controls(); }
}

function openLoan(object) {
  selectedObject = object.id;
  $('#loan-object').textContent = object.label + ' · ' + object.number;
  $('#loan-status').textContent = '';
  $('#loan-dialog').showModal(); $('#borrower').focus();
}

function renderObjects() {
  const list = $('#objects'); list.replaceChildren();
  const items = data.objects.filter(object => filter === 'all' || (filter === 'loaned') === !!currentLoan(data, object.id));
  $('#count').textContent = `${items.length} sur ${data.objects.length}`;
  if (!items.length) list.append(node('p', data.objects.length ? 'Aucun objet dans ce filtre.' : 'Votre carnet est prêt. Ajoutez votre premier objet pour commencer.', 'empty'));
  for (const object of items) {
    const card = node('article', undefined, 'object-card');
    const identity = node('div');
    identity.append(node('p', object.number, 'number'), node('h3', object.label));
    const loan = currentLoan(data, object.id);
    identity.append(node('p', loan ? `Prêté à ${loan.borrower}` : 'Disponible', loan ? 'badge loaned' : 'badge'));
    if (loan) identity.append(node('p', 'Depuis le ' + date(loan.loanedAt), 'hint'));
    const button = node('button', loan ? 'Enregistrer le retour' : 'Prêter cet objet', loan ? 'secondary' : 'primary');
    button.type = 'button';
    button.addEventListener('click', () => loan ? change(next => returnObject(next, { loanId: loan.id }, new Date().toISOString()), 'Retour enregistré. L’exemplaire est disponible et son historique est conservé.') : openLoan(object));
    card.append(identity, button); list.append(card);
  }
}

function renderHistory() {
  const target = $('#history'); target.replaceChildren();
  if (!data.loans.length) { target.append(node('p', 'Les prêts apparaîtront ici. Un retour complète l’histoire, il ne l’efface pas.', 'empty')); return; }
  const table = node('table'), head = node('thead'), heading = node('tr');
  for (const text of ['Objet et numéro', 'Personne', 'Prêté le', 'Retour']) { const th = node('th', text); th.scope = 'col'; heading.append(th); }
  head.append(heading); table.append(head); const body = node('tbody');
  for (const loan of [...data.loans].reverse()) {
    const object = data.objects.find(entry => entry.id === loan.objectId), row = node('tr');
    for (const text of [object.label + ' · ' + object.number, loan.borrower, date(loan.loanedAt), loan.returnedAt ? date(loan.returnedAt) : 'En cours']) row.append(node('td', text));
    body.append(row);
  }
  table.append(body); target.append(table);
}
function render() { renderObjects(); renderHistory(); }

$('#add-form').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget;
  const input = { id: crypto.randomUUID(), label: form.elements.label.value, number: form.elements.number.value };
  if (await change(next => addObject(next, input, new Date().toISOString()), 'Objet ajouté au carnet.')) { form.reset(); $('#label').focus(); }
});
$('#loan-form').addEventListener('submit', async event => {
  event.preventDefault();
  const input = { id: crypto.randomUUID(), objectId: selectedObject, borrower: $('#borrower').value };
  if (await change(next => lendObject(next, input, new Date().toISOString()), 'Prêt enregistré.')) { $('#loan-dialog').close(); event.target.reset(); }
});
$('#cancel-loan').addEventListener('click', () => $('#loan-dialog').close());
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  renderObjects();
}));
$('#export').addEventListener('click', () => {
  if (!data) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify({ version, data }, null, 2)], { type: 'application/json' }));
  const link = node('a'); link.href = url; link.download = 'carnet-de-prets.json'; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); status('Fichier de données préparé pour le téléchargement. Le code et les décisions peuvent être exportés depuis Studio.');
});
controls();
try { await read(); render(); status('Carnet local chargé. Les modifications sont enregistrées sur ce serveur.'); }
catch (error) { data = null; status(error.message, true); }
controls();
