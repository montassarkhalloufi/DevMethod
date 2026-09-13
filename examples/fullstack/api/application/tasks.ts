import { randomUUID } from 'node:crypto';
import { Task, taskTitle } from '../domain/task';
export interface TaskStore {
  list(): Promise<Task[]>;
  insert(task: Task): Promise<Task>;
}
export class Tasks {
  constructor(private readonly store: TaskStore) {}
  list(): Promise<Task[]> { return this.store.list(); }
  create(title: unknown): Promise<Task> {
    return this.store.insert({ id: randomUUID(), title: taskTitle(title) });
  }
}
