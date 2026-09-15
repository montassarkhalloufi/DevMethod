export class TaskError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export function title(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 120) {
    throw new TaskError('Title must contain 1–120 characters.');
  }
  return value.trim();
}
export function validateBody(body, patch = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new TaskError('Expected a JSON object.');
  const result = {};
  if (Object.hasOwn(body, 'title')) result.title = title(body.title);
  if (patch && Object.hasOwn(body, 'done')) {
    if (typeof body.done !== 'boolean') throw new TaskError('Done must be a boolean.');
    result.done = body.done;
  }
  if (!patch && !Object.hasOwn(result, 'title')) throw new TaskError('A title is required.');
  if (patch && !Object.keys(result).length) throw new TaskError('Provide title or done.');
  return result;
}
export function validateStoredTasks(tasks) {
  if (!Array.isArray(tasks)) throw new Error('Invalid stored task list');
  const ids = new Set();
  for (const task of tasks) {
    if (
      !task ||
      typeof task.id !== 'string' ||
      !task.id ||
      ids.has(task.id) ||
      typeof task.done !== 'boolean' ||
      typeof task.title !== 'string' ||
      !task.title ||
      task.title.length > 120 ||
      task.title.trim() !== task.title
    )
      throw new Error('Invalid stored task');
    ids.add(task.id);
  }
  return tasks;
}
