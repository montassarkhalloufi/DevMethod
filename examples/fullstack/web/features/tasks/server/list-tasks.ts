import 'server-only';
import { parseTasks } from '../model/tasks';
export async function listTasks() {
  const base = process.env.TASKS_API_URL ?? 'http://127.0.0.1:3101';
  const response = await fetch(new URL('/tasks', base), {
    cache: 'no-store',
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error('Tasks API unavailable.');
  return parseTasks(await response.json());
}
