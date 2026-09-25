(function () {
  'use strict';
  const D = SeanceDomain, R = SeanceRender, S = SeanceStorage;
  let documentState, loadError = false, volatile = false, selectedVersion = null;
  const root = document.getElementById('app'), status = document.getElementById('storage');
  try { documentState = S.load() || D.initial(); }
  catch (e) { loadError = true; status.textContent = `Stockage illisible : ${e.message} Les données existantes ne sont pas écrasées. Le prototype s’arrête pour éviter une perte.`; return; }
  function save() {
    if (loadError) return;
    try { S.save(documentState); volatile = false; status.textContent = 'Enregistré sur cet appareil. Les exports HTML restent consultables sans cet outil.'; }
    catch (e) { volatile = true; status.textContent = `Enregistrement impossible : ${e.message} Session en mémoire seulement ; exportez les programmes et la sauvegarde JSON avant de fermer.`; }
  }
  function mutate(action) { action(documentState.draft); documentState.draft.decision = 'Ajustement manuel du brouillon : vérifier les horaires et les changements avant publication.'; save(); render(); }
  function download(name, body, type) {
    const url = URL.createObjectURL(new Blob([body], { type })), a = document.createElement('a');
    a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function render() {
    const draft = documentState.draft, result = D.schedule(draft), latest = documentState.publications.at(-1);
    const options = D.proposals(draft);
    const published = documentState.publications.find(p => p.version === selectedVersion) || latest;
    root.innerHTML = `<div class="note">Début 19:00 · salle vide au plus tard à 21:10 · sortie 5 min · entracte 10 min.<br>Les durées des films sont fixes. F6 en dernier est une préférence, pas une obligation.</div>
      <div class="layout"><section class="panel editor"><h2>1. Préparer le brouillon</h2><label for="title">Titre du programme</label><input id="title" value="${R.escape(draft.title)}" maxlength="150">
      ${draft.order.map((id, i) => { const r = D.catalog[id]; return `<div class="row"><span class="name">${R.escape(r.title)}<small>${r.duration} min${r.kind === 'call' ? ' · doit commencer à 20:05' : ''}</small></span><button data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Monter ${R.escape(r.title)}">↑</button><button data-down="${i}" ${i === draft.order.length - 1 ? 'disabled' : ''} aria-label="Descendre ${R.escape(r.title)}">↓</button>${id !== 'break' ? `<button data-remove="${id}" aria-label="Retirer ${R.escape(r.title)}">×</button>` : ''}</div>`; }).join('')}
      <h3>Ajouter au brouillon</h3><div class="toolbar">${Object.entries(D.catalog).filter(([id, r]) => !draft.order.includes(id) && id !== 'break' && !(r.kind === 'discussion' && draft.order.some(x => D.catalog[x].kind === 'discussion')) && (id !== 'call' || draft.callRequired)).map(([id, r]) => `<button data-add="${id}">${R.escape(r.title)} · ${r.duration} min</button>`).join('') || '<span class="muted">Toutes les activités sont présentes.</span>'}</div>
      ${draft.order.some(x => D.catalog[x].kind === 'discussion') ? `<p><label>Durée de la discussion <select id="discussion-duration"><option value="discussion" ${draft.order.includes('discussion') ? 'selected' : ''}>15 min</option><option value="shortDiscussion" ${draft.order.includes('shortDiscussion') ? 'selected' : ''}>10 min</option></select></label></p>` : ''}</section>
      <section class="panel"><h2>Horaires réels du brouillon</h2>${R.timetable(result)}<p class="metric">${result.filmCount}/6 films · marge de sortie : ${result.margin} min</p>${result.errors.length ? `<div class="error" role="alert">${R.list(result.errors)}</div>` : '<p class="success">Les contraintes horaires sont respectées.</p>'}${!result.lastFilmPreferred ? '<p class="note">La préférence « Le dernier bus en dernier film » n’est pas respectée. Ce choix reste possible.</p>' : ''}</section></div>
      <section class="panel event"><h2>2. Un appel à intégrer à 20:05</h2><p>L’invitée est disponible exactement de 20:05 à 20:20. L’appel est une activité entière ; aucun film ne peut être coupé. Les deux ajustements ci-dessous sont des propositions, pas une décision prise pour vous.</p>${!draft.callRequired ? '<button id="event">Prendre en compte ce changement</button>' : `<div class="options">${options.map((o, i) => { const s = D.schedule(o.draft); return `<article class="option"><h3>${R.escape(o.title)}</h3><p>${R.escape(o.tradeoff)}</p><p><strong>${s.filmCount} films · fin ${D.time(s.end)} · salle vide ${D.time(s.emptyAt)}</strong></p><details><summary>Voir les horaires proposés</summary>${R.timetable(s)}</details><button class="primary" data-option="${i}">Choisir ce compromis pour le brouillon</button></article>`; }).join('')}</div><p>Vous pouvez aussi construire votre propre ajustement avec les flèches. Une arrivée anticipée avant l’appel produit une attente visible ; une arrivée tardive empêche la publication.</p>`}</section>
      <section class="panel"><h2>3. Relire les annonces et publier une nouvelle version</h2><p>${latest ? `Comparaison avec la version ${latest.version}, conservée ci-dessous.` : 'Aucune version n’a encore été publiée. La première publication sera une décision explicite.'}</p>${R.list(D.changes(latest, draft))}${draft.decision ? `<p class="note">${R.escape(draft.decision)}</p>` : ''}<p>Publier enregistre une copie distincte. Cela n’envoie rien au public. Exportez le fichier HTML puis transmettez-le par votre moyen habituel.</p><button id="publish" class="primary" ${result.valid ? '' : 'disabled'}>Publier la version ${documentState.publications.length + 1}</button>${volatile ? '<p class="error">Stockage indisponible : exportez avant de fermer.</p>' : ''}</section>
      <section class="panel"><h2>Versions publiées · lecture seule</h2>${published ? `<p><label>Ouvrir <select id="version">${documentState.publications.map(p => `<option value="${p.version}" ${published.version === p.version ? 'selected' : ''}>Version ${p.version} · ${R.escape(p.publishedAt)}</option>`).join('')}</select></label></p><h3>${R.escape(published.title)}</h3>${R.timetable(published.schedule)}<details><summary>Annonce enregistrée avec cette version</summary>${R.list(published.changes)}<p>${R.escape(published.decision || 'Aucun compromis supplémentaire enregistré.')}</p></details><button id="export">Exporter la version ${published.version} en HTML hors connexion</button>` : '<p>Aucune publication. Le brouillon reste modifiable.</p>'}<hr><button id="backup">Télécharger la sauvegarde JSON</button><p class="muted">La sauvegarde contient brouillon et versions. Ce prototype ne propose pas encore sa réimportation.</p></section>`;
    root.querySelector('#title').onchange = e => mutate(d => { d.title = e.target.value.trim() || 'La séance collective'; });
    root.querySelectorAll('[data-up]').forEach(b => b.onclick = () => mutate(d => { const i = Number(b.dataset.up); [d.order[i - 1], d.order[i]] = [d.order[i], d.order[i - 1]]; }));
    root.querySelectorAll('[data-down]').forEach(b => b.onclick = () => mutate(d => { const i = Number(b.dataset.down); [d.order[i], d.order[i + 1]] = [d.order[i + 1], d.order[i]]; }));
    root.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => mutate(d => { d.order = d.order.filter(x => x !== b.dataset.remove); }));
    root.querySelectorAll('[data-add]').forEach(b => b.onclick = () => mutate(d => { d.order.push(b.dataset.add); }));
    const duration = root.querySelector('#discussion-duration'); if (duration) duration.onchange = e => mutate(d => { d.order = d.order.map(x => D.catalog[x].kind === 'discussion' ? e.target.value : x); });
    const event = root.querySelector('#event'); if (event) event.onclick = () => mutate(d => { d.callRequired = true; });
    root.querySelectorAll('[data-option]').forEach(b => b.onclick = () => { documentState.draft = D.clone(options[Number(b.dataset.option)].draft); save(); render(); });
    root.querySelector('#publish').onclick = () => { documentState = D.publish(documentState, new Date().toISOString()); selectedVersion = documentState.publications.at(-1).version; save(); render(); };
    const version = root.querySelector('#version'); if (version) version.onchange = e => { selectedVersion = Number(e.target.value); render(); };
    const exportButton = root.querySelector('#export'); if (exportButton) exportButton.onclick = () => download(`seance-v${published.version}.html`, R.offline(published), 'text/html;charset=utf-8');
    root.querySelector('#backup').onclick = () => download('seance-sauvegarde.json', JSON.stringify(documentState, null, 2), 'application/json');
  }
  save(); render();
})();
