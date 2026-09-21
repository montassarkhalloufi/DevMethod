import { createTranslator, subscribeLocale } from '../../scripts/studio/public/i18n.js';

interface Zone {
  root: HTMLElement;
  target: HTMLElement;
  controls: HTMLElement;
  separator: HTMLElement;
  kind: 'message' | 'activity';
  preference: number | null;
  height: number;
}

interface Drag {
  zone: Zone;
  pointer: number;
  startY: number;
  height: number;
  previous: number | null;
}

function storageKey(kind: Zone['kind']) {
  return `devmethod:studio:${kind}-height:v1`;
}

function readHeight(window: Window, kind: Zone['kind']): number | null {
  try {
    const value = Number(window.localStorage.getItem(storageKey(kind)));
    return Number.isFinite(value) && value > 0 && value <= 10000 ? value : null;
  } catch {
    return null;
  }
}

function saveHeight(window: Window, zone: Zone) {
  try {
    if (zone.preference === null) window.localStorage.removeItem(storageKey(zone.kind));
    else window.localStorage.setItem(storageKey(zone.kind), String(zone.preference));
  } catch {
    // Resizing remains available when browser storage is disabled.
  }
}

function limits(zone: Zone, window: Window) {
  if (zone.kind === 'message') {
    return {
      min: 52,
      max: Math.max(52, Math.min(480, Math.floor(window.innerHeight * 0.5) - 140)),
      initial: 52,
    };
  }
  return {
    min: 120,
    max: Math.max(120, Math.min(900, Math.floor(window.innerHeight * 0.75))),
    initial: 280,
  };
}

function renderHeight(zone: Zone, window: Window) {
  const range = limits(zone, window);
  zone.height = Math.round(
    Math.max(range.min, Math.min(range.max, zone.preference ?? range.initial)),
  );
  zone.root.style.setProperty(`--${zone.kind}-height`, `${zone.height}px`);
  zone.separator.setAttribute('aria-valuemin', String(range.min));
  zone.separator.setAttribute('aria-valuemax', String(range.max));
  zone.separator.setAttribute('aria-valuenow', String(zone.height));
  zone.separator.setAttribute('aria-valuetext', `${zone.height} pixels`);
}

function renderZoneLabels(zone: Zone) {
  const t = createTranslator(zone.root.ownerDocument);
  const label =
    zone.kind === 'message'
      ? t('la zone de message', 'the message area')
      : t('l’historique', 'the history');
  zone.separator.setAttribute(
    'aria-label',
    t('Hauteur de {area}', 'Height of {area}', { area: label }),
  );
  zone.separator.title = t(
    'Glisser pour redimensionner · Double-clic pour rétablir',
    'Drag to resize · Double-click to reset',
  );
  const labels = {
    reduce: t('Réduire {area}', 'Reduce {area}', { area: label }),
    reset: t('Rétablir la taille de {area}', 'Reset the size of {area}', { area: label }),
    grow: t('Agrandir {area}', 'Expand {area}', { area: label }),
  };
  for (const [action, value] of Object.entries(labels)) {
    const button = zone.controls.querySelector<HTMLButtonElement>(
      `[data-size-action="${action}"]`,
    )!;
    button.setAttribute('aria-label', value);
    button.title = value;
  }
  zone.controls.querySelector('.sr-only')!.textContent = t(
    'Glissez la poignée ou utilisez les flèches haut et bas. Début et Fin : tailles minimale et maximale. Double-clic : taille initiale.',
    'Drag the handle or use the up and down arrow keys. Home and End: minimum and maximum size. Double-click: initial size.',
  );
}

function createZone(document: Document, window: Window, kind: Zone['kind']): Zone | null {
  const root = document.querySelector<HTMLElement>(`[data-size-region="${kind}"]`);
  const target = document.getElementById(kind === 'message' ? 'request' : 'conversation-flow');
  if (!root || !target) return null;
  const label = kind === 'message' ? 'la zone de message' : 'l’historique';
  const controls = document.createElement('div');
  controls.className = 'panel-size-controls';
  controls.innerHTML = `<div class="panel-height-handle" role="separator" tabindex="0" aria-orientation="horizontal" aria-controls="${target.id}" aria-label="Hauteur de ${label}" aria-describedby="${kind}-size-help"></div>
    <button type="button" data-size-action="reduce" aria-label="Réduire ${label}" title="Réduire ${label}">−</button>
    <button type="button" data-size-action="reset" aria-label="Rétablir la taille de ${label}" title="Rétablir la taille initiale">↺</button>
    <button type="button" data-size-action="grow" aria-label="Agrandir ${label}" title="Agrandir ${label}">+</button>
    <span class="sr-only" id="${kind}-size-help">Glissez la poignée ou utilisez les flèches haut et bas. Début et Fin : tailles minimale et maximale. Double-clic : taille initiale.</span>`;
  const separator = controls.querySelector<HTMLElement>('[role="separator"]')!;
  separator.title = 'Glisser pour redimensionner · Double-clic pour rétablir';
  if (kind === 'message') root.prepend(controls);
  else root.append(controls);
  root.classList.add('panel-size-enabled');
  const zone = {
    root,
    target,
    controls,
    separator,
    kind,
    preference: readHeight(window, kind),
    height: 0,
  };
  renderHeight(zone, window);
  renderZoneLabels(zone);
  return zone;
}

export function mountDiscussionSizing(document: Document, window: Window) {
  const zones = (['message', 'activity'] as const)
    .map((kind) => createZone(document, window, kind))
    .filter((zone): zone is Zone => zone !== null);
  const disposers: (() => void)[] = [];
  let drag: Drag | null = null;
  function listen(target: EventTarget, event: string, callback: EventListener) {
    target.addEventListener(event, callback);
    disposers.push(() => target.removeEventListener(event, callback));
  }
  function setHeight(zone: Zone, value: number | null, persist = true) {
    const range = limits(zone, window);
    zone.preference = value === null ? null : Math.max(range.min, Math.min(range.max, value));
    renderHeight(zone, window);
    if (persist) saveHeight(window, zone);
  }
  function stopDrag(cancel = false) {
    if (!drag) return;
    const current = drag;
    drag = null;
    if (current.zone.separator.hasPointerCapture?.(current.pointer)) {
      current.zone.separator.releasePointerCapture(current.pointer);
    }
    if (cancel) current.zone.preference = current.previous;
    renderHeight(current.zone, window);
    saveHeight(window, current.zone);
    document.body.classList.remove('discussion-height-resizing');
  }
  function onKey(zone: Zone, event: KeyboardEvent) {
    const step = (event.shiftKey ? 40 : 16) * (zone.kind === 'message' ? -1 : 1);
    const range = limits(zone, window);
    const values: Record<string, number> = {
      ArrowUp: zone.height - step,
      ArrowDown: zone.height + step,
      Home: range.min,
      End: range.max,
    };
    const value = values[event.key];
    if (value === undefined) return;
    event.preventDefault();
    setHeight(zone, value);
  }
  function bindZone(zone: Zone) {
    listen(zone.separator, 'keydown', (event) => onKey(zone, event as KeyboardEvent));
    listen(zone.separator, 'dblclick', () => setHeight(zone, null));
    listen(zone.controls, 'click', (event) => {
      const action = (event.target as HTMLElement).closest<HTMLElement>('[data-size-action]')
        ?.dataset.sizeAction;
      if (!action) return;
      setHeight(zone, action === 'reset' ? null : zone.height + (action === 'grow' ? 40 : -40));
    });
    listen(zone.separator, 'pointerdown', (event) => {
      const pointer = event as PointerEvent;
      if (pointer.button !== 0 || window.innerWidth <= 900) return;
      pointer.preventDefault();
      stopDrag();
      zone.separator.focus({ preventScroll: true });
      drag = {
        zone,
        pointer: pointer.pointerId,
        startY: pointer.clientY,
        height: zone.height,
        previous: zone.preference,
      };
      zone.separator.setPointerCapture?.(pointer.pointerId);
      document.body.classList.add('discussion-height-resizing');
    });
  }
  zones.forEach(bindZone);
  disposers.push(subscribeLocale(() => zones.forEach(renderZoneLabels), window));
  listen(window, 'pointermove', (event) => {
    const pointer = event as PointerEvent;
    if (!drag || drag.pointer !== pointer.pointerId) return;
    const direction = drag.zone.kind === 'message' ? -1 : 1;
    setHeight(drag.zone, drag.height + (pointer.clientY - drag.startY) * direction, false);
  });
  listen(window, 'pointerup', () => stopDrag());
  listen(window, 'pointercancel', () => stopDrag(true));
  listen(window, 'blur', () => stopDrag());
  listen(window, 'keydown', (event) => {
    const key = event as KeyboardEvent;
    if (key.key !== 'Escape' || key.defaultPrevented || !drag) return;
    key.preventDefault();
    stopDrag(true);
  });
  listen(window, 'resize', () => {
    stopDrag();
    zones.forEach((zone) => renderHeight(zone, window));
  });
  return {
    destroy() {
      stopDrag();
      disposers.forEach((dispose) => dispose());
      for (const zone of zones) {
        zone.controls.remove();
        zone.root.classList.remove('panel-size-enabled');
        zone.root.style.removeProperty(`--${zone.kind}-height`);
      }
    },
  };
}
