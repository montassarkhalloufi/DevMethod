import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from './server.mjs';

async function listen(filePath) {
  const server = createApp(filePath);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

async function close(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'volunteer-http-'));
  const path = join(directory, 'state.json');
  const app = await listen(path);
  t.after(async () => {
    if (app.server.listening) await close(app.server);
    rmSync(directory, { recursive: true, force: true });
  });
  return { ...app, path };
}

async function post(url, path, value, extraHeaders = {}) {
  return fetch(`${url}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(value),
  });
}

test('serves the actual UI and protects loopback origin boundaries', async (t) => {
  const { url } = await fixture(t);
  const page = await fetch(url);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Choose your team/);
  assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  for (const path of ['/app.js', '/style.css'])
    assert.equal((await fetch(`${url}${path}`)).status, 200);
  assert.equal((await fetch(`${url}/unknown`)).status, 404);
  const denied = await post(
    url,
    '/api/reservations',
    { slotId: 'welcome', seats: 1, requestId: 'foreign' },
    { Origin: 'https://unrelated.example' },
  );
  assert.equal(denied.status, 403);
  assert.equal((await (await fetch(`${url}/api/state`)).json()).reservations.length, 0);
});

test('HTTP reserve, conflict, cancel and restart use persistent state', async (t) => {
  const { url, server, path } = await fixture(t);
  const input = { slotId: 'welcome', requestId: 'http-retry', seats: 2 };
  const response = await post(url, '/api/reservations', input);
  assert.equal(response.status, 200);
  const reservation = await response.json();
  assert.equal(reservation.status, 'active');
  assert.deepEqual(await (await post(url, '/api/reservations', input)).json(), reservation);
  const conflict = await post(url, '/api/reservations', { ...input, requestId: 'other', seats: 1 });
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).error, 'CAPACITY_EXCEEDED');
  await close(server);
  const restarted = await listen(path);
  t.after(() => close(restarted.server));
  const cancel = await post(restarted.url, `/api/reservations/${reservation.id}/cancel`, {});
  assert.equal((await cancel.json()).status, 'cancelled');
  const retry = await post(restarted.url, '/api/reservations', input);
  assert.equal((await retry.json()).status, 'cancelled');
  const state = await (await fetch(`${restarted.url}/api/state`)).json();
  assert.equal(state.slots[0].remaining, 2);
  assert.equal(state.reservations.length, 1);
});

test('simultaneous HTTP attempts cannot overbook a slot', async (t) => {
  const { url } = await fixture(t);
  const responses = await Promise.all(
    Array.from({ length: 8 }, (_, index) =>
      post(url, '/api/reservations', {
        slotId: 'garden',
        requestId: `concurrent-${index}`,
        seats: 1,
      }),
    ),
  );
  assert.equal(responses.filter((response) => response.status === 200).length, 3);
  assert.equal(responses.filter((response) => response.status === 409).length, 5);
  const state = await (await fetch(`${url}/api/state`)).json();
  assert.equal(state.slots[1].remaining, 0);
  assert.equal(state.reservations.length, 3);
});

test('malformed requests return an actionable client error without booking', async (t) => {
  const { url } = await fixture(t);
  for (const input of ['{', 'null', '[]', 'x'.repeat(5000)]) {
    const response = await fetch(`${url}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: input,
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'BAD_REQUEST');
  }
  const invalid = await post(url, '/api/reservations', {
    slotId: 'garden',
    requestId: 'fraction',
    seats: 1.5,
  });
  assert.equal(invalid.status, 400);
  assert.equal((await (await fetch(`${url}/api/state`)).json()).reservations.length, 0);
});
