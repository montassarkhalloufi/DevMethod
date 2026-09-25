import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountDiscussionSizing } from '../studio-ui/src/discussion-sizing.ts';

const storageKey = (region) => `devmethod:studio:${region}-height:v1`;
const regionLabel = { message: 'la zone de message', activity: 'l’historique' };

function fixture(t, { width = 1440, height = 1000, saved = {}, deniedStorage = false } = {}) {
  const dom = new JSDOM(
    `<div class="studio-layout"><aside id="discussion" class="conversation">
      <details id="activity" data-size-region="activity" open>
        <summary>Activité précédente</summary>
        <div id="conversation-flow" data-scroll-region="conversation">Un résultat conservé</div>
      </details>
      <section id="message-panel" class="request-panel" data-size-region="message">
        <details class="agent-connection"><summary>Agent hôte · manuel</summary></details>
        <form id="request-form"><textarea id="request">Mon brouillon non envoyé</textarea>
          <button type="submit">Envoyer</button>
        </form>
      </section>
    </aside></div>`,
    { url: 'http://localhost/' },
  );
  const { window } = dom,
    { document } = window;
  window.innerWidth = width;
  window.innerHeight = height;
  for (const [region, value] of Object.entries(saved))
    window.localStorage.setItem(storageKey(region), String(value));
  if (deniedStorage)
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Storage is unavailable');
      },
    });
  const controller = mountDiscussionSizing(document, window);
  t.after(() => {
    controller.destroy();
    dom.window.close();
  });
  const separator = (region) =>
    document.querySelector(
      `[role="separator"][aria-controls="${region === 'message' ? 'request' : 'conversation-flow'}"]`,
    );
  const size = (region) => Number(separator(region).getAttribute('aria-valuenow'));
  const key = (region, value, shiftKey = false) => {
    const event = new window.KeyboardEvent('keydown', {
      key: value,
      shiftKey,
      bubbles: true,
      cancelable: true,
    });
    separator(region).dispatchEvent(event);
    return event;
  };
  const button = (region, action) => {
    const result = [...document.querySelectorAll('button')].find((element) => {
      const name = element.getAttribute('aria-label') || element.textContent;
      return name.startsWith(action) && name.includes(regionLabel[region]);
    });
    assert.ok(result, `${action} control for ${region}`);
    return result;
  };
  const resize = (nextHeight, nextWidth = window.innerWidth) => {
    window.innerHeight = nextHeight;
    window.innerWidth = nextWidth;
    window.dispatchEvent(new window.Event('resize'));
  };
  return { window, document, controller, separator, size, key, button, resize };
}

function pointer(f, target, type, clientY, pointerId = 1) {
  const event = new f.window.MouseEvent(type, {
    button: 0,
    clientY,
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  target.dispatchEvent(event);
}

test('horizontal handles expose their target and keyboard follows the spatial direction', (t) => {
  const f = fixture(t);
  for (const region of ['message', 'activity']) {
    assert.equal(f.separator(region).getAttribute('aria-orientation'), 'horizontal');
    assert.equal(f.separator(region).tabIndex, 0);
    assert.ok(f.separator(region).getAttribute('aria-label').includes(regionLabel[region]));
  }
  assert.equal(f.size('message'), 52);
  assert.equal(f.size('activity'), 280);
  assert.equal(f.key('message', 'ArrowUp').defaultPrevented, true);
  assert.equal(f.size('message'), 68);
  f.key('message', 'ArrowUp', true);
  assert.equal(f.size('message'), 108);
  f.key('message', 'ArrowDown');
  assert.equal(f.size('message'), 92);
  f.key('activity', 'ArrowDown');
  assert.equal(f.size('activity'), 296);
  f.key('activity', 'ArrowUp', true);
  assert.equal(f.size('activity'), 256);
  assert.equal(f.key('activity', 'Tab').defaultPrevented, false);
});

test('keyboard limits persist independently and viewport clamping keeps the preferred height', (t) => {
  const f = fixture(t, { height: 1400 });
  f.key('message', 'End');
  f.key('activity', 'End');
  assert.equal(f.size('message'), 480);
  assert.equal(f.size('activity'), 900);
  assert.equal(f.window.localStorage.getItem(storageKey('message')), '480');
  assert.equal(f.window.localStorage.getItem(storageKey('activity')), '900');
  f.resize(600);
  assert.equal(f.size('message'), 160);
  assert.equal(f.size('activity'), 450);
  assert.equal(f.window.localStorage.getItem(storageKey('message')), '480');
  assert.equal(f.window.localStorage.getItem(storageKey('activity')), '900');
  f.resize(1400);
  assert.equal(f.size('message'), 480);
  assert.equal(f.size('activity'), 900);
  f.key('message', 'Home');
  f.key('activity', 'Home');
  assert.equal(f.size('message'), 52);
  assert.equal(f.size('activity'), 120);
});

test('saved heights restore, buttons adjust, and reset removes only that region preference', (t) => {
  const f = fixture(t, { saved: { message: 180, activity: 420 } });
  assert.equal(f.size('message'), 180);
  assert.equal(f.size('activity'), 420);
  f.button('message', 'Agrandir').click();
  assert.ok(f.size('message') > 180);
  f.button('message', 'Réduire').click();
  assert.equal(f.size('message'), 180);
  f.button('message', 'Rétablir').click();
  assert.equal(f.size('message'), 52);
  assert.equal(f.window.localStorage.getItem(storageKey('message')), null);
  assert.equal(f.window.localStorage.getItem(storageKey('activity')), '420');
  f.separator('activity').dispatchEvent(new f.window.MouseEvent('dblclick', { bubbles: true }));
  assert.equal(f.size('activity'), 280);
  assert.equal(f.window.localStorage.getItem(storageKey('activity')), null);
});

test('dragging the top message handle grows upwards and history grows downwards without submitting', (t) => {
  const f = fixture(t),
    input = f.document.getElementById('request');
  let submits = 0;
  f.document.getElementById('request-form').addEventListener('submit', (event) => {
    event.preventDefault();
    submits += 1;
  });
  input.setSelectionRange(4, 12);
  pointer(f, f.separator('message'), 'pointerdown', 500);
  pointer(f, f.window, 'pointermove', 400);
  assert.equal(f.size('message'), 152);
  pointer(f, f.window, 'pointerup', 400);
  assert.equal(f.window.localStorage.getItem(storageKey('message')), '152');
  pointer(f, f.separator('activity'), 'pointerdown', 300);
  pointer(f, f.window, 'pointermove', 450);
  assert.equal(f.size('activity'), 430);
  pointer(f, f.window, 'pointerup', 450);
  assert.equal(f.window.localStorage.getItem(storageKey('activity')), '430');
  assert.equal(f.document.getElementById('request'), input);
  assert.equal(input.value, 'Mon brouillon non envoyé');
  assert.equal(input.selectionStart, 4);
  assert.equal(input.selectionEnd, 12);
  assert.equal(submits, 0);
});

test('Escape cancels dragging while pointer cancellation and blur terminate it', (t) => {
  const f = fixture(t, { saved: { message: 200 } });
  pointer(f, f.separator('message'), 'pointerdown', 500);
  pointer(f, f.window, 'pointermove', 400);
  assert.equal(f.size('message'), 300);
  f.window.dispatchEvent(
    new f.window.KeyboardEvent('keydown', { key: 'Escape', cancelable: true }),
  );
  assert.equal(f.size('message'), 200);
  assert.equal(f.window.localStorage.getItem(storageKey('message')), '200');
  pointer(f, f.window, 'pointermove', 350);
  assert.equal(f.size('message'), 200);
  for (const event of ['pointercancel', 'blur']) {
    pointer(f, f.separator('activity'), 'pointerdown', 300);
    pointer(f, f.window, 'pointermove', 340);
    f.window.dispatchEvent(new f.window.Event(event));
    const stopped = f.size('activity');
    pointer(f, f.window, 'pointermove', 400);
    assert.equal(f.size('activity'), stopped);
  }
});

test('mobile ignores pointer dragging but keeps explicit and keyboard controls usable', (t) => {
  const f = fixture(t, { width: 390, height: 840 });
  pointer(f, f.separator('message'), 'pointerdown', 500);
  pointer(f, f.window, 'pointermove', 350);
  pointer(f, f.window, 'pointerup', 350);
  assert.equal(f.size('message'), 52);
  f.button('message', 'Agrandir').click();
  const enlarged = f.size('message');
  assert.ok(enlarged > 52);
  f.key('message', 'ArrowUp');
  assert.equal(f.size('message'), enlarged + 16);
  f.resize(250);
  assert.equal(f.size('message'), 52);
  assert.ok(f.size('activity') >= 120);
});

test('storage rejection does not prevent adjustments or reset', (t) => {
  const f = fixture(t, { deniedStorage: true });
  f.key('message', 'ArrowUp');
  assert.equal(f.size('message'), 68);
  f.button('activity', 'Agrandir').click();
  assert.ok(f.size('activity') > 280);
  f.button('activity', 'Rétablir').click();
  assert.equal(f.size('activity'), 280);
});

test('destroy removes interaction listeners and does not lose the existing message', (t) => {
  const f = fixture(t),
    input = f.document.getElementById('request'),
    handle = f.separator('message'),
    grow = f.button('message', 'Agrandir');
  f.key('message', 'ArrowUp');
  const height = f.size('message');
  f.controller.destroy();
  handle.dispatchEvent(new f.window.KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  grow.click();
  pointer(f, handle, 'pointerdown', 500);
  pointer(f, f.window, 'pointermove', 350);
  f.resize(600);
  assert.equal(Number(handle.getAttribute('aria-valuenow')), height);
  assert.equal(f.document.getElementById('request'), input);
  assert.equal(input.value, 'Mon brouillon non envoyé');
});
