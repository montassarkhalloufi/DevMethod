import { check, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey(),
    title: varchar('title', { length: 120 }).notNull(),
  },
  (table) => [check('tasks_title_nonempty', sql`length(trim(${table.title})) > 0`)],
);
