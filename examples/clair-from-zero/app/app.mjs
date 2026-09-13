import {createTask,toggleTask,removeTask,restoreTask,filterTasks} from './domain.mjs';
import {readTasks,writeTasks} from './storage.mjs';
const $ = selector => document.querySelector(selector);
let tasks = [], filter = 'all', removed = null, readBlocked = false;
const announce = message => { $('#announcement').textContent = message; };
function showStorageError(message, blocked = false) {
  $('#storage-alert').hidden = false; $('#storage-message').textContent = message;
  $('#retry-storage').hidden = blocked; $('#reset-storage').hidden = !blocked;
}
try { tasks = readTasks(window.localStorage); }
catch { readBlocked = true; showStorageError('Les données enregistrées ne peuvent pas être lues. Vos changements restent uniquement en mémoire. Pour protéger les données existantes, la sauvegarde est suspendue. Vous pouvez les effacer explicitement pour repartir avec cette liste.', true); }
function save() {
  if (readBlocked) return;
  try { writeTasks(window.localStorage, tasks); $('#storage-alert').hidden = true; }
  catch { showStorageError('La sauvegarde a échoué. Vos changements restent uniquement en mémoire et peuvent être perdus à la fermeture ou au rechargement. Libérez de l’espace ou autorisez le stockage, puis réessayez.'); }
}
function commit(message) { save(); render(); announce(message); }
function setFilter(value) { filter = value; render(); }
function render() {
  const done = tasks.filter(task => task.done).length;
  $('#total-count').textContent = String(tasks.length).padStart(2,'0');
  $('#all-count').textContent = tasks.length; $('#active-count').textContent = tasks.length-done; $('#done-count').textContent = done;
  $('#progress-label').textContent = tasks.length ? `${done} sur ${tasks.length} terminée${tasks.length > 1 ? 's' : ''}` : 'Un nouveau départ';
  $('#progress-bar').style.width = `${tasks.length ? done/tasks.length*100 : 0}%`;
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
  const visible = filterTasks(tasks, filter), list = $('#task-list'); list.replaceChildren();
  for (const task of visible) {
    const row = document.createElement('li'); row.className = `task${task.done?' done':''}`; row.dataset.id = task.id;
    const check = document.createElement('button'); check.type = 'button'; check.className = 'task-check'; check.setAttribute('role','checkbox'); check.setAttribute('aria-checked', String(task.done)); check.setAttribute('aria-label', `${task.done?'Marquer à faire':'Terminer'} : ${task.title}`); check.textContent = task.done ? '✓' : '';
    check.addEventListener('click', () => {
      const position = visible.findIndex(item => item.id === task.id);
      tasks = toggleTask(tasks, task.id); commit(task.done ? 'Priorité marquée à faire.' : 'Priorité terminée.');
      const newRows = [...list.children], same = newRows.find(item => item.dataset.id === task.id);
      (same?.querySelector('.task-check') || newRows[Math.min(position,newRows.length-1)]?.querySelector('.task-check') || $('#empty-add')).focus();
    });
    const content = document.createElement('div'), title = document.createElement('h3'); title.textContent = task.title; content.append(title);
    if (task.note) { const note = document.createElement('p'); note.textContent = task.note; content.append(note); }
    if (task.done) { const state = document.createElement('span'); state.className = 'task-state'; state.textContent = 'TERMINÉE'; content.append(state); }
    const del = document.createElement('button'); del.type = 'button'; del.className = 'task-delete'; del.setAttribute('aria-label', `Supprimer : ${task.title}`);
    del.innerHTML = '<svg viewBox="0 0 20 22" aria-hidden="true"><path d="M3 6h14M7 6V3h6v3M5 6l1 14h8l1-14M8 9v8M12 9v8"/></svg>';
    del.addEventListener('click', () => { const result = removeTask(tasks, task.id); tasks = result.tasks; removed = result.removed; commit('Priorité supprimée. Vous pouvez annuler.'); $('#undo-button').focus(); });
    row.append(check,content,del); list.append(row);
  }
  $('#empty-state').hidden = visible.length > 0;
  if (!tasks.length) { $('#empty-title').textContent = 'Tout commence par une chose.'; $('#empty-copy').textContent = 'Qu’aimeriez-vous faire avancer aujourd’hui ? Ajoutez votre première priorité, même petite.'; $('#empty-add').textContent = 'Écrire ma première priorité ↗'; }
  else if (filter === 'done') { $('#empty-title').textContent = 'Chaque chose en son temps.'; $('#empty-copy').textContent = 'Vos priorités terminées apparaîtront ici. Un petit pas suffit pour commencer.'; $('#empty-add').textContent = 'Voir les priorités à faire ↗'; }
  else { $('#empty-title').textContent = 'De la place pour souffler.'; $('#empty-copy').textContent = 'Toutes vos priorités sont terminées. Savourez ce que vous avez fait aujourd’hui.'; $('#empty-add').textContent = 'Ajouter une nouvelle priorité ↗'; }
  $('#undo-bar').hidden = !removed;
}
$('#task-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const task = createTask($('#task-title').value, $('#task-note').value, crypto.randomUUID());
    tasks = [...tasks,task]; filter = 'all'; $('#task-form').reset(); $('#form-error').hidden = true; $('#task-title').removeAttribute('aria-invalid'); commit('Priorité ajoutée.'); $('#task-title').focus();
  } catch (error) { $('#form-error').textContent = error.message; $('#form-error').hidden = false; $('#task-title').setAttribute('aria-invalid','true'); $('#task-title').focus(); }
});
$('#task-title').addEventListener('input', () => { if ($('#task-title').value.trim()) { $('#form-error').hidden = true; $('#task-title').removeAttribute('aria-invalid'); } });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { setFilter(button.dataset.filter); announce(`${filterTasks(tasks,filter).length} priorité(s) affichée(s).`); }));
$('#empty-add').addEventListener('click', () => { if (tasks.length && filter === 'done') { setFilter('active'); $('[data-filter="active"]').focus(); } else { $('#task-title').focus(); $('#task-title').scrollIntoView({block:'center',behavior:'auto'}); } });
$('#undo-button').addEventListener('click', () => { const id = removed?.task.id; tasks = restoreTask(tasks,removed); removed = null; filter = 'all'; commit('Suppression annulée.'); [...$('#task-list').children].find(row => row.dataset.id === id)?.querySelector('.task-check').focus(); });
$('#dismiss-undo').addEventListener('click', () => { removed = null; render(); $('#priorities').focus(); });
$('#demo-button').addEventListener('click', () => {
  const examples = [['Lire quelques pages','Démo fictive · Un chapitre, un thé et le téléphone de côté.'],['Faire une promenade','Démo fictive · Vingt minutes sans itinéraire.'],['Écrire à une personne chère','Démo fictive · Juste quelques mots pour prendre des nouvelles.']];
  tasks = [...tasks,...examples.map(([title,note]) => createTask(title,note,crypto.randomUUID()))]; filter = 'all'; commit('Trois priorités fictives ajoutées à la liste.');
});
$('#retry-storage').addEventListener('click', () => { save(); if ($('#storage-alert').hidden) { announce('Liste sauvegardée dans ce navigateur.'); $('#task-title').focus(); } });
$('#reset-storage').addEventListener('click', () => { readBlocked = false; save(); if ($('#storage-alert').hidden) { announce('Les anciennes données ont été remplacées par la liste actuelle.'); $('#task-title').focus(); } });
$('#today').textContent = new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long'}).format(new Date()).toLocaleUpperCase('fr-FR');
render();
