import { asc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { TaskStore } from '../application/tasks';
import { Task } from '../domain/task';
import { tasks } from './schema';
export class PostgresTasks implements TaskStore {
  private readonly db;
  constructor(pool: Pool) { this.db = drizzle(pool); }
  list(): Promise<Task[]> {
    return this.db.select().from(tasks).orderBy(asc(tasks.title), asc(tasks.id)).limit(100);
  }
  async insert(task: Task): Promise<Task> {
    const [created] = await this.db.insert(tasks).values(task).returning();
    if (!created) throw new Error('Insert returned no task.');
    return created;
  }
}
