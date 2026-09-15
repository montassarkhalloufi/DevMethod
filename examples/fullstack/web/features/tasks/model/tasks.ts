export interface Task {
  id: string;
  title: string;
}
export function filterTasks(tasks: readonly Task[], query: string): Task[] {
  const search = query.trim().toLowerCase();
  return tasks.filter((task) => task.title.toLowerCase().includes(search));
}
export function parseTasks(value: unknown): Task[] {
  if (
    !Array.isArray(value) ||
    value.length > 100 ||
    value.some(
      (task) =>
        !task ||
        typeof task !== 'object' ||
        typeof task.id !== 'string' ||
        typeof task.title !== 'string',
    )
  ) {
    throw new Error('Unexpected tasks response.');
  }
  return value.map(({ id, title }) => ({ id, title }));
}
