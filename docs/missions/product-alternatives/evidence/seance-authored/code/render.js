(function (root) {
  'use strict';
  const D = typeof module !== 'undefined' && module.exports ? require('./domain.js') : root.SeanceDomain;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function timetable(result) {
    return `<table><thead><tr><th>Horaire</th><th>Activité</th><th>Durée</th></tr></thead><tbody>${result.rows.map(r => `<tr><td>${D.time(r.start)}–${D.time(r.end)}</td><td>${escape(r.title)}</td><td>${r.duration} min</td></tr>`).join('')}</tbody></table><p><strong>Fin des activités : ${D.time(result.end)} · salle vide : ${D.time(result.emptyAt)}</strong><br>5 minutes réservées à la sortie.</p>`;
  }
  function list(items) { return `<ul>${items.map(x => `<li>${escape(x)}</li>`).join('')}</ul>`; }
  function offline(snapshot) {
    return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(snapshot.title)} — v${snapshot.version}</title><style>body{font:18px/1.5 system-ui,sans-serif;max-width:850px;margin:2rem auto;padding:0 1rem;color:#142d2c}table{width:100%;border-collapse:collapse}th,td{text-align:left;border-bottom:1px solid #aaa;padding:.6rem .3rem}h1{line-height:1.2}small{color:#485b5a}@media print{body{font-size:12pt}}</style><main><small>Programme publié · version ${snapshot.version} · ${escape(snapshot.publishedAt)}</small><h1>${escape(snapshot.title)}</h1>${timetable(snapshot.schedule)}<h2>Pour les bénévoles : changements à annoncer</h2>${list(snapshot.changes)}${snapshot.decision ? `<p><strong>Choix retenu :</strong> ${escape(snapshot.decision)}</p>` : ''}<p>Cette copie est autonome, consultable hors connexion et distincte du brouillon. Aucun envoi automatique n’a été effectué.</p></main></html>`;
  }
  const api = { escape, timetable, list, offline };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SeanceRender = api;
})(globalThis);
