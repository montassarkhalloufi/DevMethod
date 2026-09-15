const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const { randomUUID } = require('node:crypto');
const { migrateDatabase } = require('../build/infrastructure/migrate');
const { PostgresTasks } = require('../build/infrastructure/postgres');
// Refuse to silently pass when a database was not configured.
if (!process.env.DATABASE_URL)
  throw new Error('DATABASE_URL is required; use an isolated fixture database.');
test('real PostgreSQL migration replay, durability and constraints', async (t) => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  t.after(async () => {
    try {
      await pool.query('delete from tasks where id = ANY($1::uuid[])', [ids]);
    } catch (error) {
      if (error.code !== '42P01') throw error;
    } finally {
      await pool.end();
    }
  });
  await migrateDatabase(pool);
  await migrateDatabase(pool);
  const task = { id: ids[0], title: 'Verify persistence' };
  await new PostgresTasks(pool).insert(task);
  const secondPool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await secondPool.query('select id, title from tasks where id = $1', [task.id]);
    assert.deepEqual(result.rows, [task]);
  } finally {
    await secondPool.end();
  }
  await assert.rejects(pool.query('insert into tasks (id,title) values ($1,$2)', [ids[1], '  ']), {
    code: '23514',
  });
  await assert.rejects(
    pool.query('insert into tasks (id,title) values ($1,$2)', [ids[2], 'x'.repeat(121)]),
    { code: '22001' },
  );
  await assert.rejects(
    new PostgresTasks(pool).insert(task),
    (error) => error.cause?.code === '23505',
  );
});
test('real PostgreSQL listing orders by title then UUID and returns only the first 100', async (t) => {
  // Keep the temporary table and adapter on one real connection; leave existing rows untouched.
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  t.after(async () => {
    try {
      await pool.query('ROLLBACK');
    } finally {
      await pool.end();
    }
  });
  await migrateDatabase(pool);
  await pool.query('BEGIN');
  await pool.query('CREATE TEMP TABLE tasks (LIKE tasks INCLUDING ALL) ON COMMIT DROP');

  // Expected order follows the contract. Interleaved UUIDs make title ordering indispensable.
  const expected = ['Alpha', 'Middle', 'Zulu'].flatMap((title, group) =>
    Array.from({ length: 35 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${(index * 3 + group + 1).toString(16).padStart(12, '0')}`,
      title,
    })),
  );
  const store = new PostgresTasks(pool);
  for (const row of [...expected].reverse()) await store.insert(row);
  assert.equal(
    (await pool.query('SELECT count(*)::integer AS count FROM tasks')).rows[0].count,
    105,
  );
  assert.deepEqual(await store.list(), expected.slice(0, 100));
});
