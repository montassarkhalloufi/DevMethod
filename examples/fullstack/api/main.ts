import { Pool } from 'pg';
import { createApp } from './http';
import { PostgresTasks } from './infrastructure/postgres';
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
  try {
    await pool.query('select 1');
    const app = await createApp(new PostgresTasks(pool));
    try { await app.listen(Number(process.env.PORT ?? 3101), '127.0.0.1'); }
    catch (error) { await app.close(); throw error; }
    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
      process.once(signal, () => { void app.close().finally(() => pool.end()); });
    }
  } catch (error) { await pool.end(); throw error; }
}
main().catch(() => { console.error('API startup failed. Check local database configuration.'); process.exitCode = 1; });
