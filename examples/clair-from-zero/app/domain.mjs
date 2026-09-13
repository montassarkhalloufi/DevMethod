export const TITLE_LIMIT = 160;
export const NOTE_LIMIT = 500;
export function createTask(title, note, id) {
  if (typeof title !== 'string' || !title.trim()) throw new Error('Donnez un titre à votre priorité.');
  if (title.trim().length > TITLE_LIMIT) throw new Error('Le titre est limité à 160 caractères.');
  if (typeof note !== 'string' || note.trim().length > NOTE_LIMIT) throw new Error('La note est limitée à 500 caractères.');
  return { id, title: title.trim(), note: note.trim(), done: false };
}
export function toggleTask(tasks, id) { return tasks.map(task => task.id === id ? {...task, done: !task.done} : task); }
export function removeTask(tasks, id) {
  const index = tasks.findIndex(task => task.id === id);
  return { tasks: tasks.filter(task => task.id !== id), removed: index < 0 ? null : { task: tasks[index], index } };
}
export function restoreTask(tasks, removed) {
  if (!removed || tasks.some(task => task.id === removed.task.id)) return tasks;
  const result = [...tasks]; result.splice(Math.min(removed.index, result.length), 0, removed.task); return result;
}
export function filterTasks(tasks, filter) { return tasks.filter(task => filter === 'done' ? task.done : filter === 'active' ? !task.done : true); }
export function decodeTasks(raw) {
  if (raw === null) return [];
  const data = JSON.parse(raw);
  if (!data || data.version !== 1 || !Array.isArray(data.tasks)) throw new Error('Format de données inconnu.');
  const ids = new Set();
  for (const task of data.tasks) {
    if (!task || typeof task.id !== 'string' || !task.id || ids.has(task.id) || typeof task.title !== 'string' || !task.title.trim() || task.title.length > TITLE_LIMIT || typeof task.note !== 'string' || task.note.length > NOTE_LIMIT || typeof task.done !== 'boolean') throw new Error('Données enregistrées illisibles.');
    ids.add(task.id);
  }
  return data.tasks.map(({id, title, note, done}) => ({id, title, note, done}));
}
export function encodeTasks(tasks) { return JSON.stringify({version: 1, tasks}); }
