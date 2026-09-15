'use client';
import { Task } from '../model/tasks';
import { useTaskFilter } from '../hooks/use-task-filter';
export function TaskList({ tasks }: { tasks: Task[] }) {
  const { query, setQuery, visibleTasks } = useTaskFilter(tasks);
  return (
    <section aria-label="Tasks">
      <label htmlFor="task-filter">Filter tasks</label>{' '}
      <input id="task-filter" value={query} onChange={(event) => setQuery(event.target.value)} />
      {visibleTasks.length ? (
        <ul>
          {visibleTasks.map((task) => (
            <li key={task.id}>{task.title}</li>
          ))}
        </ul>
      ) : (
        <p>No matching tasks.</p>
      )}
    </section>
  );
}
