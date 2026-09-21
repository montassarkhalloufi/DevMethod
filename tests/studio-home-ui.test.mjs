import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const bundle = await build({
  entryPoints: [path.resolve('studio-ui/src/home-widget.tsx')],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'HomeTest',
  jsx: 'automatic',
  loader: { '.css': 'empty', '.svg': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"test"' },
});
const reply = (value, ok = true) => ({ ok, json: async () => value });
const project = (id = 'p1', extra = {}) => ({
  id,
  name: 'Mon carnet',
  kind: 'new',
  workspace: '/Users/test/projets/' + id,
  createdAt: '2026-09-17T10:00:00Z',
  lastOpenedAt: null,
  ...extra,
});
const catalog = (projects = []) => reply({ projects, limits: { projects: 200 } });

async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await setTimeout(5);
  }
  assert.ok(predicate(), 'Expected home state not reached');
}

function fixture(t, fetcher) {
  const dom = new JSDOM('<html lang="fr" data-studio-language-ready><div id="root"></div></html>', {
    url: 'http://127.0.0.1:4330/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new dom.window.Event('close'));
  };
  const calls = [];
  dom.window.fetch = async (url, init) => {
    if (url === '/api/mcp') return reply({ presets: [], connections: [], supported: true });
    const input = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ url, init, input });
    return fetcher(url, input, init);
  };
  dom.window.eval(bundle.outputFiles[0].text + '\nwindow.HomeTest = HomeTest;');
  const navigations = [];
  const handle = dom.window.HomeTest.mountHomeWidget(dom.window.document.getElementById('root'), {
    navigate: (url) => navigations.push(url),
  });
  t.after(() => {
    handle.dispose();
    dom.window.close();
  });
  return { dom, document: dom.window.document, navigations, calls, handle };
}

const button = (f, label) => {
  const nodes = [...f.document.querySelectorAll('button')];
  const text = (node) => (node.getAttribute('aria-label') || node.textContent).trim();
  return (
    nodes.find((node) => text(node) === label) || nodes.find((node) => text(node).includes(label))
  );
};
const dialog = (f) => f.document.querySelector('dialog.home-dialog');
const compose = (f) =>
  f.document
    .querySelector('.idea-composer')
    .dispatchEvent(new f.dom.window.Event('submit', { bubbles: true, cancelable: true }));
const submit = (f) =>
  dialog(f)
    .querySelector('form')
    .dispatchEvent(new f.dom.window.Event('submit', { bubbles: true, cancelable: true }));

function type(f, name, value) {
  const input = f.document.querySelector(`[name="${name}"]`);
  const proto =
    input.tagName === 'TEXTAREA'
      ? f.dom.window.HTMLTextAreaElement.prototype
      : f.dom.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, value);
  input.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
}

async function launch(f, label) {
  await until(() => button(f, label));
  const trigger = button(f, label);
  trigger.focus();
  trigger.click();
  await until(() => dialog(f)?.open);
  return trigger;
}

test('empty home offers the idea composer and optional native import dialog with keyboard focus and absolute-path validation', async (t) => {
  const f = fixture(t, async () => catalog());
  await until(() => f.document.body.textContent.includes('Votre prochain projet commence ici'));
  assert.ok(f.document.querySelector('.idea-composer textarea'));
  assert.ok(button(f, 'Importer un projet'));
  assert.ok(button(f, 'Reprendre un projet'));
  assert.equal(f.document.querySelectorAll('dialog[open]').length, 0);
  assert.equal(dialog(f).open, false);
  const trigger = await launch(f, 'Reprendre un projet');
  const workspace = f.document.querySelector('[name="workspace"]');
  assert.equal(f.document.activeElement, workspace);
  type(f, 'workspace', './relative');
  submit(f);
  await until(() => f.document.querySelector('#home-form-error'));
  assert.equal(workspace.getAttribute('aria-invalid'), 'true');
  assert.equal(f.document.activeElement, workspace);
  assert.match(dialog(f).textContent, /chemin absolu/);
  assert.equal(f.calls.length, 1);
  const cancel = new f.dom.window.Event('cancel', { cancelable: true });
  dialog(f).dispatchEvent(cancel);
  if (!cancel.defaultPrevented) dialog(f).close();
  await until(() => !dialog(f).open);
  assert.equal(f.document.activeElement, trigger);
  await launch(f, 'Reprendre un projet');
  assert.equal(f.document.querySelector('[name="workspace"]').value, './relative');
});

test('recent projects come from the server, remain searchable through refresh errors, and resume focuses the list', async (t) => {
  let unavailable = true;
  const f = fixture(t, async () => {
    if (unavailable) throw new Error('Connexion locale interrompue.');
    return catalog([
      project('old', { name: 'Atelier', createdAt: '2026-09-16T10:00:00Z' }),
      project('recent', { name: 'École', lastOpenedAt: '2026-09-17T12:00:00Z' }),
    ]);
  });
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.equal(f.document.querySelectorAll('.home-project').length, 0);
  unavailable = false;
  button(f, 'Actualiser').click();
  await until(() => f.document.querySelectorAll('.home-project').length === 2);
  assert.equal(f.document.querySelector('.home-project strong').textContent, 'École');
  button(f, 'Reprendre un projet').click();
  await until(() => f.document.activeElement?.name === 'project-search');
  assert.equal(dialog(f).open, false);
  type(f, 'project-search', 'ecole');
  await until(() => f.document.querySelectorAll('.home-project').length === 1);
  unavailable = true;
  button(f, 'Actualiser').click();
  await until(() => f.document.querySelector('[role="alert"]'));
  assert.equal(f.document.querySelector('.home-project strong').textContent, 'École');
  assert.equal(f.document.querySelector('[name="project-search"]').value, 'ecole');
  type(f, 'project-search', 'missing');
  await until(() => f.document.body.textContent.includes('Aucun projet ne correspond'));
  assert.equal(f.calls.filter((call) => call.input).length, 0);
});

test('new project creation and session opening are sequential and double submission cannot create twice', async (t) => {
  let release;
  const created = project();
  const f = fixture(t, async (url) => {
    if (url === '/api/home') return catalog();
    if (url === '/api/home/projects')
      return new Promise((resolve) => {
        release = resolve;
      });
    return reply({ project: created, url: 'http://127.0.0.1:4388/?session=local' });
  });
  await until(() => f.document.querySelector('.idea-composer'));
  type(f, 'idea', ' Garder mes lectures. ');
  compose(f);
  compose(f);
  await until(() => release);
  assert.equal(f.calls.filter((call) => call.url.endsWith('/projects')).length, 1);
  assert.equal(button(f, 'Préparation du projet…').disabled, true);
  assert.equal(f.calls.filter((call) => call.url.endsWith('/open')).length, 0);
  assert.equal(f.document.querySelector('[name=idea]').disabled, true);
  release(reply({ project: created }));
  await until(() => f.navigations.length === 1);
  assert.equal(f.navigations[0], 'http://127.0.0.1:4388/?session=local#journey-foundation');
  const writes = f.calls.filter((call) => call.input);
  assert.deepEqual(
    writes.map((call) => call.url),
    ['/api/home/projects', '/api/home/open'],
  );
  assert.match(
    writes[0].input.requestId,
    /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/,
  );
  assert.equal(writes[0].input.name, undefined);
  assert.equal(writes[0].input.launch.action, 'build');
  assert.equal(writes[0].input.launch.projectType, 'website');
  assert.equal(writes[0].input.idea, 'Garder mes lectures.');
  assert.deepEqual(writes[1].input, { id: 'p1' });
  assert.ok(
    writes.every(
      (call) =>
        call.init.credentials === 'same-origin' &&
        call.init.headers['Content-Type'] === 'application/json',
    ),
  );
});

test('an imported project survives an opening failure and retry only opens its existing workspace', async (t) => {
  const imported = project('imported', { kind: 'imported', name: 'Sources existantes' });
  let opened = 0;
  const f = fixture(t, async (url) => {
    if (url === '/api/home') return catalog();
    if (url.endsWith('/projects')) return reply({ project: imported });
    return ++opened === 1
      ? reply({ error: 'Port indisponible. Réessayez.' }, false)
      : reply({ project: imported, url: 'http://127.0.0.1:4388/' });
  });
  await launch(f, 'Importer un projet');
  type(f, 'source', '/Users/test/source');
  submit(f);
  await until(() => dialog(f).querySelector('[role="alert"]'));
  assert.match(dialog(f).textContent, /est enregistré/);
  assert.equal(f.document.querySelector('[name="source"]').value, '/Users/test/source');
  assert.equal(f.document.querySelectorAll('.home-project').length, 1);
  button(f, 'Réessayer l’ouverture').click();
  await until(() => f.navigations.length === 1);
  assert.equal(f.calls.filter((call) => call.url.endsWith('/projects')).length, 1);
  assert.equal(opened, 2);
  assert.equal(f.navigations[0], 'http://127.0.0.1:4388/#journey-foundation');
  assert.equal(f.calls.find((call) => call.url.endsWith('/projects')).input.name, undefined);
});

test('an uncertain creation retry reuses its UUID and edited input gets a new request identity', async (t) => {
  let attempts = 0;
  let releaseRetry;
  const retryResponse = new Promise((resolve) => {
    releaseRetry = resolve;
  });
  const f = fixture(t, async (url) => {
    if (url === '/api/home') return catalog();
    attempts++;
    if (attempts === 2) await retryResponse;
    throw new Error('Connexion interrompue. Réessayez.');
  });
  await until(() => f.document.querySelector('.idea-composer'));
  type(f, 'idea', 'Une idée');
  compose(f);
  await until(() => f.document.querySelector('.composer-error'));
  assert.equal(f.document.querySelector('[name="idea"]').value, 'Une idée');
  assert.equal(leavingHomeWouldWarn(f), true);
  compose(f);
  await until(
    () =>
      f.calls.filter((call) => call.input).length === 2 &&
      f.document.querySelector('[name="idea"]').disabled,
  );
  releaseRetry();
  await until(
    () =>
      f.document.querySelector('.composer-error') &&
      !f.document.querySelector('[name="idea"]').disabled,
  );
  let writes = f.calls.filter((call) => call.input);
  assert.equal(writes[0].input.requestId, writes[1].input.requestId);
  type(f, 'idea', 'Une autre idée');
  compose(f);
  await until(() => f.calls.filter((call) => call.input).length === 3);
  writes = f.calls.filter((call) => call.input);
  assert.notEqual(writes[1].input.requestId, writes[2].input.requestId);
  assert.equal(writes[2].input.idea, 'Une autre idée');
  assert.equal(f.navigations.length, 0);
});

test('resuming an unlisted Studio workspace preserves the session destination instead of forcing foundation', async (t) => {
  const existing = project('existing', { kind: 'existing' });
  const f = fixture(t, async (url) => {
    if (url === '/api/home') return catalog();
    if (url.endsWith('/projects')) return reply({ project: existing });
    return reply({ project: existing, url: 'http://127.0.0.1:4388/#code' });
  });
  await launch(f, 'Reprendre un projet');
  type(f, 'workspace', '/Users/test/studio-project');
  submit(f);
  await until(() => f.navigations.length === 1);
  assert.equal(f.navigations[0], 'http://127.0.0.1:4388/#code');
  const input = f.calls.find((call) => call.url.endsWith('/projects')).input;
  assert.equal(input.kind, 'existing');
  assert.equal(input.workspace, '/Users/test/studio-project');
  assert.equal(input.source, undefined);
});

test('late initial loading cannot hide a project created while the catalogue was loading', async (t) => {
  let resolveList;
  const f = fixture(t, async (url) => {
    if (url === '/api/home')
      return new Promise((resolve) => {
        resolveList = resolve;
      });
    if (url.endsWith('/projects')) return reply({ project: project() });
    throw new Error('Ouverture interrompue.');
  });
  await until(() => f.document.querySelector('.idea-composer'));
  type(f, 'idea', 'Une idée');
  compose(f);
  await until(() => f.document.querySelector('.home-project'));
  resolveList(catalog());
  await setTimeout(30);
  assert.equal(f.document.querySelectorAll('.home-project').length, 1);
});

test('opening rejects foreign, credentialed, non-http or unexpected session destinations', async (t) => {
  for (const url of [
    'https://external.example/',
    'http://127.0.0.1.evil.example:4388/',
    'http://user:secret@127.0.0.1:4388/',
    'javascript:alert(1)',
    'http://127.0.0.1:4388/api/remove',
    'http://127.0.0.1/',
  ]) {
    await t.test(url, async (child) => {
      const p = project();
      const f = fixture(child, async (route) =>
        route === '/api/home' ? catalog([p]) : reply({ project: p, url }),
      );
      await until(() => button(f, 'Ouvrir Mon carnet'));
      button(f, 'Ouvrir Mon carnet').click();
      await until(() => f.document.querySelector('[role="alert"]'));
      assert.equal(f.navigations.length, 0);
      assert.equal(button(f, 'Ouvrir Mon carnet').disabled, false);
    });
  }
});

function leavingHomeWouldWarn(f) {
  const event = new f.dom.window.Event('beforeunload', { cancelable: true });
  f.dom.window.dispatchEvent(event);
  return event.defaultPrevented;
}

test('opening a recent project confirms an unsent idea before starting any request and cancellation keeps it editable', async (t) => {
  const f = fixture(t, async (url) => {
    if (url === '/api/home') return catalog([project('other', { name: 'Autre projet' })]);
    if (url === '/api/home/open')
      return reply({ project: project('other'), url: 'http://127.0.0.1:4331' });
    throw new Error('Unexpected request');
  });
  await until(() => button(f, 'Ouvrir Autre projet'));
  type(f, 'idea', 'Mon idée encore en cours');
  await until(() => leavingHomeWouldWarn(f));
  const origin = button(f, 'Ouvrir Autre projet');
  origin.focus();
  origin.click();
  await until(() => button(f, 'Garder mon idée'));
  assert.equal(f.calls.filter((call) => call.url === '/api/home/open').length, 0);
  assert.equal(f.document.querySelectorAll('dialog[open]').length, 1);
  assert.equal(f.document.activeElement, button(f, 'Garder mon idée'));
  button(f, 'Garder mon idée').click();
  await until(() => !dialog(f).open);
  assert.equal(f.document.activeElement, origin);
  assert.equal(f.document.querySelector('[name="idea"]').value, 'Mon idée encore en cours');
  assert.equal(f.document.querySelector('[name="idea"]').disabled, false);
  assert.equal(leavingHomeWouldWarn(f), true);
  origin.click();
  await until(() => button(f, 'Ouvrir quand même'));
  const confirm = button(f, 'Ouvrir quand même');
  confirm.click();
  confirm.click();
  await until(() => f.navigations.length === 1);
  assert.equal(f.calls.filter((call) => call.url === '/api/home/open').length, 1);
  assert.equal(leavingHomeWouldWarn(f), false);
});

for (const entry of [
  { label: 'Importer un projet', field: 'source', value: '/Users/test/sources' },
  {
    label: 'Ouvrir un autre dossier Studio',
    field: 'workspace',
    value: '/Users/test/autre-studio',
  },
]) {
  test(`${entry.label} confirms departure inside the same dialog and Escape keeps both drafts`, async (t) => {
    const f = fixture(t, async () => catalog());
    await until(() => f.document.querySelector('[name="idea"]'));
    type(f, 'idea', 'Un projet à ne pas perdre');
    await setTimeout(10);
    await launch(f, entry.label);
    type(f, entry.field, entry.value);
    await setTimeout(10);
    submit(f);
    await until(() => button(f, 'Garder mon idée'));
    assert.equal(f.calls.filter((call) => call.init.method === 'POST').length, 0);
    assert.equal(f.document.querySelectorAll('dialog[open]').length, 1);
    const cancel = new f.dom.window.Event('cancel', { cancelable: true });
    dialog(f).dispatchEvent(cancel);
    if (!cancel.defaultPrevented) dialog(f).close();
    await until(() => !button(f, 'Garder mon idée'));
    assert.equal(dialog(f).open, true);
    assert.equal(f.document.querySelector(`[name="${entry.field}"]`).value, entry.value);
    assert.equal(f.document.querySelector('[name="idea"]').value, 'Un projet à ne pas perdre');
    assert.equal(f.document.querySelector('[name="idea"]').disabled, false);
    button(f, 'Retour').click();
    await until(() => !dialog(f).open);
    assert.equal(button(f, 'Garder mon idée'), undefined);
    assert.equal(leavingHomeWouldWarn(f), true);
  });
}

test('own creation protects the unsaved idea until POST confirmation and preserves the saved marker after an opening failure', async (t) => {
  let finishCreate;
  let finishOpen;
  const f = fixture(t, async (url) => {
    if (url === '/api/home') return catalog([project('other', { name: 'Autre projet' })]);
    if (url === '/api/home/projects')
      return new Promise((resolve) => {
        finishCreate = resolve;
      });
    if (url === '/api/home/open')
      return new Promise((resolve) => {
        finishOpen = resolve;
      });
    throw new Error('Unexpected request');
  });
  await until(() => f.document.querySelector('[name="idea"]'));
  type(f, 'idea', 'Une idée sauvegardée après confirmation');
  await until(() => leavingHomeWouldWarn(f));
  compose(f);
  await until(() => finishCreate && f.document.querySelector('[name="idea"]').disabled);
  assert.equal(leavingHomeWouldWarn(f), true);
  assert.equal(button(f, 'Garder mon idée'), undefined);
  finishCreate(reply({ project: project('created') }));
  await until(() => finishOpen);
  assert.equal(leavingHomeWouldWarn(f), false);
  finishOpen(reply({ error: 'Session indisponible' }, false));
  await until(() => !f.document.querySelector('[name="idea"]').disabled);
  assert.equal(leavingHomeWouldWarn(f), false);
  button(f, 'Ouvrir Autre projet').click();
  await until(() => f.calls.filter((call) => call.url === '/api/home/open').length === 2);
  assert.equal(button(f, 'Garder mon idée'), undefined);
});

test('a failed approved departure restores the unsaved guard and the next departure asks again', async (t) => {
  const f = fixture(t, async (url) =>
    url === '/api/home'
      ? catalog([project('other', { name: 'Autre projet' })])
      : reply({ error: 'Impossible d’ouvrir la session' }, false),
  );
  await until(() => button(f, 'Ouvrir Autre projet'));
  type(f, 'idea', 'Mon idée reste ici');
  await until(() => leavingHomeWouldWarn(f));
  button(f, 'Ouvrir Autre projet').click();
  await until(() => button(f, 'Ouvrir quand même'));
  button(f, 'Ouvrir quand même').click();
  await until(
    () =>
      f.document.querySelector('[role="alert"]') &&
      !f.document.querySelector('[name="idea"]').disabled,
  );
  assert.equal(leavingHomeWouldWarn(f), true);
  assert.equal(f.document.querySelector('[name="idea"]').value, 'Mon idée reste ici');
  button(f, 'Ouvrir Autre projet').click();
  await until(() => button(f, 'Garder mon idée'));
  assert.equal(f.calls.filter((call) => call.url === '/api/home/open').length, 1);
});

test('closing ordinary composer options preserves the idea without asking to leave it', async (t) => {
  const f = fixture(t, async () => catalog());
  await until(() => f.document.querySelector('[name="idea"]'));
  type(f, 'idea', 'Une idée toujours en préparation');
  await until(() => leavingHomeWouldWarn(f));
  const trigger = button(f, 'Ajouter des références');
  trigger.focus();
  trigger.click();
  await until(() => f.document.querySelector('.composer-options-dialog').open);
  button(f, 'Terminé').click();
  await until(() => !f.document.querySelector('.composer-options-dialog').open);
  assert.equal(dialog(f).open, false);
  assert.equal(button(f, 'Garder mon idée'), undefined);
  assert.equal(f.document.querySelector('[name="idea"]').value, 'Une idée toujours en préparation');
  assert.equal(f.document.activeElement, trigger);
  assert.equal(f.calls.filter((call) => call.init.method === 'POST').length, 0);
});
