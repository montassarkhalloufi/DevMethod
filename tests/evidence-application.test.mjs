import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { JSDOM } from 'jsdom';
import { createApp } from '../examples/evidence-lab/app/server.mjs';

const html = fs.readFileSync(
  new URL('../examples/evidence-lab/app/public/index.html', import.meta.url),
  'utf8',
);
const script = fs.readFileSync(
  new URL('../examples/evidence-lab/app/public/app.js', import.meta.url),
  'utf8',
);

async function waitFor(predicate) {
  const started = performance.now();
  while (!predicate()) {
    if (performance.now() - started > 3000)
      throw new Error('Expected DOM outcome was not observed.');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function fixture(t, loseFirstResponse = false) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-ui-test-'));
  const server = createApp(path.join(directory, 'state.json'));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const dom = new JSDOM(html, { url: origin, runScripts: 'outside-only' });
  let lost = false;
  dom.window.fetch = async (target, options) => {
    const response = await fetch(new URL(target, origin), options);
    if (loseFirstResponse && !lost && target === '/api/reservations') {
      lost = true;
      await response.text();
      throw new Error('Simulated lost response after durable commit.');
    }
    return response;
  };
  dom.window.eval(script);
  t.after(async () => {
    dom.window.close();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(directory, { recursive: true });
  });
  await waitFor(() => dom.window.document.querySelectorAll('.slot').length === 2);
  return { dom, document: dom.window.document, origin };
}

function reserve(dom, document, seats) {
  const form = document.querySelector('.slot form');
  form.querySelector('select').value = String(seats);
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

test('actual DOM event bindings reserve, show full capacity and cancel through the HTTP application', async (t) => {
  const { dom, document, origin } = await fixture(t);
  assert.equal(document.querySelector('#available').textContent, '5');
  reserve(dom, document, 2);
  await waitFor(() => document.querySelector('.availability').textContent === 'Team complete');
  assert.equal(document.querySelector('.slot button').disabled, true);
  assert.match(document.querySelector('.reservation code').textContent, /^Reference: /);
  assert.equal(document.activeElement, document.querySelector('#notice'));
  const stored = await (await fetch(`${origin}/api/state`)).json();
  assert.equal(stored.reservations.length, 1);
  assert.equal(stored.reservations[0].seats, 2);
  document.querySelector('.cancel-button').click();
  await waitFor(() => document.querySelector('.cancelled-label'));
  assert.equal(document.querySelector('#available').textContent, '5');
  assert.equal(document.querySelector('.slot button').disabled, false);
  assert.equal(
    (await (await fetch(`${origin}/api/state`)).json()).reservations[0].status,
    'cancelled',
  );
});

test('UI retries an uncertain response with the same request identity and avoids a duplicate booking', async (t) => {
  const { dom, document, origin } = await fixture(t, true);
  reserve(dom, document, 1);
  await waitFor(() => document.querySelector('#notice').classList.contains('error'));
  assert.match(document.querySelector('#notice').textContent, /retrying these same places is safe/);
  reserve(dom, document, 1);
  await waitFor(
    () =>
      document.querySelector('.reservation') &&
      !document.querySelector('#notice').classList.contains('error'),
  );
  const state = await (await fetch(`${origin}/api/state`)).json();
  assert.equal(state.reservations.length, 1);
  assert.equal(state.slots.find((slot) => slot.id === 'welcome').remaining, 1);
});

test('refresh preserves an unsubmitted choice after recovery instead of silently booking fewer seats', async (t) => {
  const { dom, document } = await fixture(t);
  const select = document.querySelector('.slot select');
  select.value = '2';
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  document.querySelector('#refresh').click();
  await waitFor(() => document.querySelector('.slot select') !== select);
  assert.equal(document.querySelector('.slot select').value, '2');
  assert.equal(document.querySelector('.slot button').disabled, false);
});

test('refresh keeps a now-unavailable choice explicit until the user chooses a valid quantity', async (t) => {
  const { dom, document, origin } = await fixture(t);
  const select = document.querySelector('.slot select');
  select.value = '2';
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  const result = await fetch(`${origin}/api/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slotId: 'welcome', seats: 1, requestId: 'another-visitor' }),
  });
  assert.equal(result.status, 200);
  document.querySelector('#refresh').click();
  await waitFor(() => document.querySelector('.slot select') !== select);
  const current = document.querySelector('.slot select');
  assert.equal(current.value, '2');
  assert.match(current.selectedOptions[0].textContent, /unavailable/);
  assert.equal(document.querySelector('.slot button').disabled, true);
  assert.equal(document.querySelector('.quantity-hint').hidden, false);
  assert.equal(
    current.getAttribute('aria-describedby'),
    document.querySelector('.quantity-hint').id,
  );
  current.value = '1';
  current.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(document.querySelector('.slot button').disabled, false);
  assert.equal(document.querySelector('.quantity-hint').hidden, true);
  reserve(dom, document, 1);
  await waitFor(() => document.querySelectorAll('.reservation').length === 2);
  assert.equal(document.querySelector('.availability').textContent, 'Team complete');
});
