import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { createPreview } from '../scripts/studio/preview.mjs';
import { getRuntimeServices } from '../scripts/studio/backend-runtime.mjs';
import { digest, fileManifest } from '../scripts/studio/files.mjs';

async function fixture(t, html = '<!doctype html><h1>Version proposée</h1>') {
  const workspace = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'dm-comparison-preview-'),
  );
  const source = path.join(workspace, 'revisions/candidate/app');
  fs.mkdirSync(source, { recursive: true });
  fs.writeFileSync(path.join(source, 'index.html'), html);
  const state = {
    activeRevision: 'candidate',
    revisions: [{ id: 'candidate', files: fileManifest(source) }],
  };
  const studio = 'http://127.0.0.1:4330';
  const config = { workspace, getState: () => state, getStudioOrigin: () => studio };
  const application = createPreview(config);
  const comparison = createPreview({ ...config, readOnlyData: true });
  t.after(async () => {
    await Promise.all(
      [application, comparison].map(
        (server) =>
          new Promise((resolve) => {
            server.closeAllConnections();
            server.close(resolve);
          }),
      ),
    );
    fs.rmSync(workspace, { force: true, recursive: true });
  });
  await Promise.all(
    [application, comparison].map(
      (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)),
    ),
  );
  const origin = (server) => `http://127.0.0.1:${server.address().port}`;
  return {
    application: origin(application),
    comparison: origin(comparison),
    data: path.join(workspace, '.devmethod/data.json'),
    studio,
  };
}

const write = (origin, value, method = 'POST') =>
  fetch(origin + '/api/data', {
    method,
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });

test('comparison serves the real candidate on its own origin but refuses writes without changing persisted bytes', async (t) => {
  const f = await fixture(t);
  assert.notEqual(f.application, f.comparison);
  const inserted = await write(f.application, { version: 1, data: { registrations: ['Amina'] } });
  assert.equal(inserted.status, 200);
  const before = fs.readFileSync(f.data);
  const shown = await fetch(f.comparison + '/revisions/candidate/index.html');
  assert.equal(shown.status, 200);
  assert.match(await shown.text(), /Version proposée/);
  assert.match(shown.headers.get('content-security-policy'), /connect-src 'self'/);
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const refused = await write(f.comparison, { version: 2, data: { registrations: [] } }, method);
    assert.equal(refused.status, 405);
    assert.equal(refused.headers.get('allow'), 'GET');
    assert.match((await refused.json()).error, /comparaison.*lecture seule/);
  }
  assert.equal(digest(fs.readFileSync(f.data)), digest(before));
  assert.deepEqual(await (await fetch(f.application + '/api/data')).json(), {
    version: 2,
    data: { registrations: ['Amina'] },
  });
});

const formFixture = `<!doctype html><html><body>
  <h1>Version proposée</h1>
  <form><label>Nom<input name="name" value="Saisie conservée"></label><textarea>Un brouillon</textarea><select><option>A</option></select><button>Enregistrer</button></form>
  <div contenteditable="true">Texte à garder</div><div role="button" tabindex="0">Supprimer</div>
  <a href="#details">Lire les détails</a><details id="details"><summary>Détails</summary>Lecture utile</details>
  <script>window.actions=0; document.addEventListener('submit',event=>{event.preventDefault(); window.actions++}); document.querySelector('[role=button]').addEventListener('click',()=>window.actions++);</script>
</body></html>`;

async function rendered(t, origin) {
  const response = await fetch(origin);
  const dom = new JSDOM(await response.text(), { url: origin, runScripts: 'dangerously' });
  t.after(() => dom.window.close());
  await new Promise((resolve) => dom.window.setTimeout(resolve, 0));
  return {
    dom,
    document: dom.window.document,
    policy: response.headers.get('content-security-policy'),
  };
}

test('comparison disables rendered forms and custom controls while preserving drafts, native reading navigation and focus', async (t) => {
  const f = await fixture(t, formFixture);
  const { dom, document, policy } = await rendered(t, f.comparison);
  assert.match(policy, /form-action 'none'/);
  for (const control of document.querySelectorAll('input,textarea,select,button')) {
    assert.equal(control.disabled, true, `${control.tagName} must be visibly disabled`);
    assert.equal(control.getAttribute('aria-disabled'), 'true');
  }
  assert.equal(document.querySelector('input').value, 'Saisie conservée');
  assert.equal(document.querySelector('textarea').value, 'Un brouillon');
  assert.equal(
    document.querySelector('[contenteditable]').getAttribute('contenteditable'),
    'false',
  );
  assert.equal(document.querySelector('[role=button]').getAttribute('aria-disabled'), 'true');
  assert.equal(document.activeElement, document.body);
  const submit = new dom.window.Event('submit', { bubbles: true, cancelable: true });
  document.querySelector('form').dispatchEvent(submit);
  document.querySelector('[role=button]').click();
  assert.equal(submit.defaultPrevented, true);
  assert.equal(dom.window.actions, 0);
  assert.equal(document.querySelector('a').getAttribute('aria-disabled'), null);
  document.querySelector('summary').click();
  assert.equal(document.querySelector('details').open, true);
  assert.equal(document.activeElement, document.body);
});

test('comparison covers controls added or reenabled by application rendering without disabling the normal app', async (t) => {
  const f = await fixture(t, formFixture);
  const comparison = await rendered(t, f.comparison);
  const { document, dom } = comparison;
  document.querySelector('input').disabled = false;
  const button = document.createElement('button');
  button.textContent = 'Nouvelle action';
  document.body.append(button);
  await new Promise((resolve) => dom.window.setTimeout(resolve, 0));
  assert.equal(document.querySelector('input').disabled, true);
  assert.equal(button.disabled, true);
  const app = await rendered(t, f.application);
  assert.match(app.policy, /form-action 'self'/);
  assert.equal(app.document.querySelector('input').disabled, false);
  assert.equal(app.document.querySelector('button').disabled, false);
  app.document.querySelector('[role=button]').click();
  assert.equal(app.dom.window.actions, 1);
  assert.equal(
    app.document.querySelector('[contenteditable]').getAttribute('contenteditable'),
    'true',
  );
});

test('comparison preserves explicit element targeting and native local links without permitting script or cross-origin links', async (t) => {
  const f = await fixture(t, formFixture);
  const { document, dom } = await rendered(t, f.comparison);
  const messages = [];
  dom.window.postMessage = (value, origin) => messages.push({ value, origin });
  dom.window.dispatchEvent(
    new dom.window.MessageEvent('message', {
      source: dom.window,
      origin: f.studio,
      data: { type: 'devmethod-select', enabled: true },
    }),
  );
  const heading = document.querySelector('h1');
  heading.click();
  assert.equal(messages.length, 1);
  assert.equal(messages[0].value.type, 'devmethod-element');
  assert.equal(document.querySelector(messages[0].value.selector), heading);
  assert.equal(messages[0].origin, f.studio);
  assert.equal(document.activeElement, document.body);
  const local = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  document.querySelector('a').dispatchEvent(local);
  assert.equal(local.defaultPrevented, false);
  for (const href of ['javascript:window.actions++', 'https://example.com/write']) {
    const link = document.createElement('a');
    link.href = href;
    document.body.append(link);
    const click = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    assert.equal(click.defaultPrevented, true);
  }
  assert.equal(dom.window.actions, 0);
});

test('inspection can target a disabled comparison control by pointer without focusing or enabling it', async (t) => {
  const f = await fixture(t, formFixture);
  const { document, dom } = await rendered(t, f.comparison);
  const messages = [];
  dom.window.postMessage = (value) => messages.push(value);
  dom.window.CSS = { escape: (value) => value };
  const input = document.querySelector('input');
  const point = () => new dom.window.MouseEvent('pointerdown', { bubbles: true, cancelable: true });
  input.dispatchEvent(point());
  assert.equal(messages.length, 0);
  dom.window.dispatchEvent(
    new dom.window.MessageEvent('message', {
      source: dom.window,
      origin: f.studio,
      data: { type: 'devmethod-select', enabled: true },
    }),
  );
  const gesture = point();
  input.dispatchEvent(gesture);
  assert.equal(messages.length, 1);
  assert.equal(document.querySelector(messages[0].selector), input);
  assert.equal(gesture.defaultPrevented, true);
  assert.equal(input.disabled, true);
  assert.equal(input.value, 'Saisie conservée');
  assert.equal(document.activeElement, document.body);
});

test('comparison reads current data, not a fake isolated snapshot, and service diagnostics expose its read-only contract', async (t) => {
  const f = await fixture(t);
  assert.equal((await write(f.application, { version: 1, data: { count: 1 } })).status, 200);
  assert.deepEqual(await (await fetch(f.comparison + '/api/data')).json(), {
    version: 2,
    data: { count: 1 },
  });
  assert.equal((await write(f.application, { version: 2, data: { count: 2 } })).status, 200);
  assert.deepEqual(await (await fetch(f.comparison + '/api/data')).json(), {
    version: 3,
    data: { count: 2 },
  });
  const before = digest(fs.readFileSync(f.data));
  const runtime = await getRuntimeServices({
    previewOrigin: f.application,
    comparisonPreviewOrigin: f.comparison,
  });
  const service = runtime.services.find((entry) => entry.id === 'comparison');
  assert.equal(service.access, 'read-only');
  assert.deepEqual(service.endpoints, ['GET /api/data']);
  assert.equal(service.health.status, 'healthy');
  assert.equal(service.health.dataVersion, 3);
  assert.equal(digest(fs.readFileSync(f.data)), before);
});
