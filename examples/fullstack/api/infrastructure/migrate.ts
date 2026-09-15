import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
export async function migrateDatabase(pool: Pool): Promise<void> {
  await migrate(drizzle(pool), { migrationsFolder: resolve(__dirname, '../../migrations') });
}
if (require.main === module) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  migrateDatabase(pool)
    .finally(() => pool.end())
    .catch(() => {
      console.error(
        'Migration failed. Inspect the database locally; connection details are not logged.',
      );
      process.exitCode = 1;
    });
}
