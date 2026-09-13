import { listTasks } from '../features/tasks/server/list-tasks';
import { TaskList } from '../features/tasks/components/task-list';
export const dynamic = 'force-dynamic';
export default async function Page() {
  try {
    const tasks = await listTasks();
    return <main><h1>Team tasks</h1><p>Local DevMethod fixture. Showing up to 100 tasks.</p><TaskList tasks={tasks} /></main>;
  } catch {
    return <main><h1>Team tasks</h1><p role="alert">Tasks are unavailable. Start the local API and database, then reload.</p></main>;
  }
}
