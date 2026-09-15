const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { Pool } = require('pg');
const { createApp } = require('../build/http');
const { PostgresTasks } = require('../build/infrastructure/postgres');
const { migrateDatabase } = require('../build/infrastructure/migrate');
if (!process.env.DATABASE_URL)
  throw new Error('DATABASE_URL is required; use an isolated fixture database.');
test(
  'Next production HTML renders a task created through Nest and PostgreSQL',
  { timeout: 30000 },
  async (t) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    let app;
    let task;
    let web;
    t.after(async () => {
      if (web && web.exitCode === null) {
        const exited = once(web, 'exit');
        web.kill('SIGTERM');
        await exited;
      }
      if (app) await app.close();
      if (task) await pool.query('delete from tasks where id=$1', [task.id]);
      await pool.end();
    });
    await migrateDatabase(pool);
    app = await createApp(new PostgresTasks(pool));
    await app.listen(0, '127.0.0.1');
    const api = await app.getUrl();
    const rejected = await fetch(`${api}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'before\u0000after' }),
    });
    assert.equal(rejected.status, 400);
    const created = await fetch(`${api}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Verify the full stack' }),
    });
    assert.equal(created.status, 201);
    task = await created.json();
    web = spawn(
      process.execPath,
      [
        require.resolve('next/dist/bin/next'),
        'start',
        'web',
        '--port',
        '0',
        '--hostname',
        '127.0.0.1',
      ],
      {
        cwd: require('node:path').resolve(__dirname, '..'),
        env: { ...process.env, TASKS_API_URL: api, NEXT_TELEMETRY_DISABLED: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    const url = await new Promise((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => reject(new Error('Next did not become ready.')), 15000);
      web.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      web.once('exit', (code) => {
        clearTimeout(timer);
        reject(new Error(`Next exited before readiness: ${code}`));
      });
      const read = (chunk) => {
        output += chunk.toString();
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match && /Ready in/.test(output)) {
          clearTimeout(timer);
          resolve(match[0]);
        }
      };
      web.stdout.on('data', read);
      web.stderr.on('data', read);
    });
    const page = await fetch(url);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Verify the full stack/);
    assert.match(html, /Filter tasks/);
    await app.close();
    const unavailable = await fetch(url);
    assert.match(await unavailable.text(), /Tasks are unavailable/);
  },
);
