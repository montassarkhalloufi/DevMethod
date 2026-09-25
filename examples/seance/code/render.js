import * as D from './domain.js';
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
function timetable(result) {
  return `<table><thead><tr><th>Horaire</th><th>Activité</th><th>Durée</th></tr></thead><tbody>${result.rows.map((r) => `<tr><td>${D.time(r.start)}–${D.time(r.end)}</td><td>${escape(r.title)}</td><td>${r.duration} min</td></tr>`).join('')}</tbody></table><p><strong>Fin des activités : ${D.time(result.end)} · salle vide : ${D.time(result.emptyAt)}</strong><br>5 minutes réservées à la sortie.</p>`;
}
function list(items) {
  return `<ul>${items.map((x) => `<li>${escape(x)}</li>`).join('')}</ul>`;
}
function offline(snapshot) {
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(snapshot.title)} — v${snapshot.version}</title><style>body{font:18px/1.5 system-ui,sans-serif;max-width:850px;margin:2rem auto;padding:0 1rem;color:#142d2c}table{width:100%;border-collapse:collapse}th,td{text-align:left;border-bottom:1px solid #aaa;padding:.6rem .3rem}h1{line-height:1.2}small{color:#485b5a}@media print{body{font-size:12pt}}</style><main><small>Programme publié · version ${snapshot.version} · ${escape(snapshot.publishedAt)}</small><h1>${escape(snapshot.title)}</h1>${timetable(snapshot.schedule)}<h2>Pour les bénévoles : changements à annoncer</h2>${list(snapshot.changes)}${snapshot.decision ? `<p><strong>Choix retenu :</strong> ${escape(snapshot.decision)}</p>` : ''}<p>Cette copie est autonome, consultable hors connexion et distincte du brouillon. Aucun envoi automatique n’a été effectué.</p></main></html>`;
}

export { escape, timetable, list, offline };

function activityRow(id, index, count) {
  const activity = D.catalog[id];
  return `<div class="row"><span class="name">${escape(activity.title)}<small>${activity.duration} min${activity.kind === 'call' ? ' · doit commencer à 20:05' : ''}</small></span><button data-up="${index}" ${index === 0 ? 'disabled' : ''} aria-label="Monter ${escape(activity.title)}">↑</button><button data-down="${index}" ${index === count - 1 ? 'disabled' : ''} aria-label="Descendre ${escape(activity.title)}">↓</button>${id !== 'break' ? `<button data-remove="${id}" aria-label="Retirer ${escape(activity.title)}">×</button>` : ''}</div>`;
}

function availableActivities(draft) {
  const hasDiscussion = draft.order.some((id) => D.catalog[id].kind === 'discussion');
  return Object.entries(D.catalog).filter(
    ([id, activity]) =>
      !draft.order.includes(id) &&
      id !== 'break' &&
      !(activity.kind === 'discussion' && hasDiscussion) &&
      (id !== 'call' || draft.callRequired),
  );
}

function discussionControl(draft) {
  if (!draft.order.some((id) => D.catalog[id].kind === 'discussion')) return '';
  return `<p><label>Durée de la discussion <select id="discussion-duration"><option value="discussion" ${draft.order.includes('discussion') ? 'selected' : ''}>15 min</option><option value="shortDiscussion" ${draft.order.includes('shortDiscussion') ? 'selected' : ''}>10 min</option></select></label></p>`;
}

function editor(draft) {
  const additions = availableActivities(draft)
    .map(
      ([id, activity]) =>
        `<button data-add="${id}">${escape(activity.title)} · ${activity.duration} min</button>`,
    )
    .join('');
  return `<section class="panel editor"><h2>1. Préparer le brouillon</h2><label for="title">Titre du programme</label><input id="title" value="${escape(draft.title)}" maxlength="150">
    ${draft.order.map((id, index) => activityRow(id, index, draft.order.length)).join('')}
    <h3>Ajouter au brouillon</h3><div class="toolbar">${additions || '<span class="muted">Toutes les activités sont présentes.</span>'}</div>${discussionControl(draft)}</section>`;
}

function schedulePanel(result) {
  return `<section class="panel"><h2>Horaires réels du brouillon</h2>${timetable(result)}<p class="metric">${result.filmCount}/6 films · marge de sortie : ${result.margin} min</p>${result.errors.length ? `<div class="error" role="alert">${list(result.errors)}</div>` : '<p class="success">Les contraintes horaires sont respectées.</p>'}${!result.lastFilmPreferred ? '<p class="note">La préférence « Le dernier bus en dernier film » n’est pas respectée. Ce choix reste possible.</p>' : ''}</section>`;
}

function proposalCard(option, index) {
  const result = D.schedule(option.draft);
  return `<article class="option"><h3>${escape(option.title)}</h3><p>${escape(option.tradeoff)}</p><p><strong>${result.filmCount} films · fin ${D.time(result.end)} · salle vide ${D.time(result.emptyAt)}</strong></p><details><summary>Voir les horaires proposés</summary>${timetable(result)}</details><button class="primary" data-option="${index}">Choisir ce compromis pour le brouillon</button></article>`;
}

function eventPanel(draft, options) {
  return `<section class="panel event"><h2>2. Intégrer ou réintroduire un appel à 20:05</h2><p>Si l’appel est confirmé, l’invitée est disponible exactement de 20:05 à 20:20. L’appel est une activité entière ; aucun film ne peut être coupé. Les deux ajustements ci-dessous sont des propositions, pas une décision prise pour vous.</p>${!draft.callRequired ? '<button id="event">Prendre en compte ce changement</button>' : `<div class="options">${options.map(proposalCard).join('')}</div><p>Vous pouvez aussi construire votre propre ajustement avec les flèches. Une arrivée anticipée avant l’appel produit une attente visible ; une arrivée tardive empêche la publication.</p>`}</section>`;
}

function cancellationPanel(draft, preview) {
  if (!draft.callRequired && !draft.order.includes('call')) return '';
  if (!preview)
    return `<section class="panel"><h2>L’appel est annulé ?</h2><p>Préparez son retrait à partir du brouillon courant, puis relisez les horaires avant d’appliquer.</p><button id="cancel-call">Prévisualiser le retrait de l’appel</button></section>`;
  const result = D.schedule(preview);
  const additions = availableActivities(preview)
    .map(
      ([id, item]) =>
        `<button data-preview-add="${id}">Ajouter ${escape(item.title)} · ${item.duration} min à la fin</button>`,
    )
    .join('');
  return `<section class="panel" id="cancellation-preview" tabindex="-1" aria-label="Aperçu du retrait de l’appel"><h2>Aperçu · appel annulé</h2><p>Le titre, l’ordre relatif, les durées et les autres activités du brouillon courant sont conservés. L’appel, son obligation et son attente disparaissent. Rien n’est encore enregistré ni publié.</p><p class="note">Les raisons des anciennes éditions ne sont pas conservées. Nous ne pouvons pas savoir si un film absent ou une discussion doivent revenir, ni retrouver leur ancienne place. Souhaitez-vous en ajouter explicitement ? Les ajouts ci-dessous vont à la fin ; vous pourrez ensuite les déplacer avec les flèches habituelles.</p><div class="toolbar">${additions || '<span>Toutes les autres activités sont déjà présentes.</span>'}</div>${timetable(result)}${result.errors.length ? `<div class="error" role="alert">${list(result.errors)}<p>Vous pourrez appliquer ce brouillon pour le corriger ; sa publication restera bloquée.</p></div>` : '<p class="success">Les contraintes horaires sont respectées.</p>'}${!result.lastFilmPreferred ? '<p class="note">Le dernier bus n’est pas le dernier film.</p>' : ''}<h3>Différences avec le brouillon courant</h3>${list(D.changes({ title: draft.title, schedule: D.schedule(draft) }, preview))}<p>L’obligation de l’appel est levée. Les anciennes publications restent identiques. Une édition du brouillon ferme cet aperçu ; ouvrez-le à nouveau pour vérifier vos nouveaux horaires.</p><div class="toolbar"><button id="apply-cancellation" class="primary">Appliquer au brouillon sans publier</button><button id="dismiss-cancellation">Annuler l’aperçu sans modification</button></div></section>`;
}

function publicationPanel(state, result, volatile) {
  const latest = state.publications.at(-1);
  return `<section class="panel"><h2>3. Relire les annonces et publier une nouvelle version</h2><p>${latest ? `Comparaison avec la version ${latest.version}, conservée ci-dessous.` : 'Aucune version n’a encore été publiée. La première publication sera une décision explicite.'}</p>${list(D.changes(latest, state.draft))}${state.draft.decision ? `<p class="note">${escape(state.draft.decision)}</p>` : ''}<p>Publier enregistre une copie distincte. Cela n’envoie rien au public. Exportez le fichier HTML puis transmettez-le par votre moyen habituel.</p><button id="publish" class="primary" ${result.valid ? '' : 'disabled'}>Publier la version ${state.publications.length + 1}</button>${volatile ? '<p class="error">Stockage indisponible : exportez avant de fermer.</p>' : ''}</section>`;
}

function publishedProgram(publications, published) {
  if (!published) return '<p>Aucune publication. Le brouillon reste modifiable.</p>';
  const versions = publications
    .map(
      (p) =>
        `<option value="${p.version}" ${published.version === p.version ? 'selected' : ''}>Version ${p.version} · ${escape(p.publishedAt)}</option>`,
    )
    .join('');
  return `<p><label>Ouvrir <select id="version">${versions}</select></label></p><h3>${escape(published.title)}</h3>${timetable(published.schedule)}<details><summary>Annonce enregistrée avec cette version</summary>${list(published.changes)}<p>${escape(published.decision || 'Aucun compromis supplémentaire enregistré.')}</p></details><button id="export">Exporter la version ${published.version} en HTML hors connexion</button>`;
}

export function workspace(state, { result, options, published, volatile, cancellationPreview }) {
  return `<div class="note">Début 19:00 · salle vide avant 21:10 · sortie 5 min · entracte 10 min.<br>Les durées des films sont fixes. F6 en dernier est une préférence, pas une obligation.</div>
    <div class="layout">${editor(state.draft)}${schedulePanel(result)}</div>
    ${cancellationPanel(state.draft, cancellationPreview)}${eventPanel(state.draft, options)}${publicationPanel(state, result, volatile)}
    <section class="panel"><h2>Versions publiées · lecture seule</h2>${publishedProgram(state.publications, published)}<hr><button id="backup">Télécharger la sauvegarde JSON</button><p class="muted">La sauvegarde contient brouillon et versions. Ce prototype ne propose pas encore sa réimportation.</p></section>`;
}
