import { mountDiscussionSizing } from './discussion-sizing.ts';

const widthKey = 'devmethod:studio:conversation-width:v1';
const minimumConversation = 300;
const minimumWorkspace = 420;

interface ScrollPosition {
  root: HTMLElement;
  top: number;
  left: number;
  anchor?: string;
  offset?: number;
}

export function captureScroll(document: Document): ScrollPosition[] {
  return [
    ...document.querySelectorAll<HTMLElement>(
      '[data-scroll-region], .workbench > [role="tabpanel"]',
    ),
  ]
    .filter((root) => root.clientHeight > 0)
    .map((root) => {
      const bounds = root.getBoundingClientRect();
      const visible = [...root.querySelectorAll<HTMLElement>('[data-scroll-key]')].find((node) => {
        const rect = node.getBoundingClientRect();
        return rect.height > 0 && rect.bottom > bounds.top && rect.top < bounds.bottom;
      });
      return {
        root,
        top: root.scrollTop,
        left: root.scrollLeft,
        anchor: visible?.dataset.scrollKey,
        offset: visible ? visible.getBoundingClientRect().top - bounds.top : undefined,
      };
    });
}

export function restoreScroll(positions: ScrollPosition[]): void {
  for (const item of positions) {
    if (!item.root.isConnected) continue;
    const anchor = item.anchor
      ? [...item.root.querySelectorAll<HTMLElement>('[data-scroll-key]')].find(
          (node) => node.dataset.scrollKey === item.anchor,
        )
      : undefined;
    if (anchor) revealReadingAnchor(anchor, item.root);
    const shift =
      anchor && item.offset !== undefined
        ? anchor.getBoundingClientRect().top - item.root.getBoundingClientRect().top - item.offset
        : 0;
    item.root.scrollTop = anchor ? item.root.scrollTop + shift : item.top;
    item.root.scrollLeft = item.left;
  }
}

function revealReadingAnchor(anchor: HTMLElement, root: HTMLElement): void {
  // A new recent item can move the item being read into the history disclosure.
  for (let node = anchor.parentElement; node && node !== root; node = node.parentElement) {
    if (node.tagName === 'DETAILS') node.setAttribute('open', '');
  }
}

function readWidth(window: Window): number | null {
  try {
    const value = Number(window.localStorage.getItem(widthKey));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function saveWidth(window: Window, value: number | null): void {
  try {
    if (value === null) window.localStorage.removeItem(widthKey);
    else window.localStorage.setItem(widthKey, String(value));
  } catch {
    /* Resizing still works when browser storage is unavailable. */
  }
}

export function mountStudioLayout(document: Document, window: Window) {
  const layout = document.querySelector<HTMLElement>('.studio-layout');
  const separator = document.getElementById('conversation-resizer');
  const expand = document.getElementById('expand-workspace');
  if (!layout || !separator || !expand) return { destroy() {} };
  const discussionSizing = mountDiscussionSizing(document, window);
  const disposers: (() => void)[] = [];
  let preference = readWidth(window);
  let currentWidth = minimumConversation;
  let drag: { startX: number; width: number; pointer: number } | null = null;
  let positions: ScrollPosition[] = [];
  let isolated: { element: HTMLElement; wasInert: boolean }[] = [];
  let expanded = false;

  function listen(target: EventTarget, type: string, callback: EventListener): void {
    target.addEventListener(type, callback);
    disposers.push(() => target.removeEventListener(type, callback));
  }

  function limits() {
    const technical = ['code', 'checks'].includes(document.body.dataset.activePanel || '');
    const minimum = technical ? 240 : minimumConversation;
    const style = window.getComputedStyle(layout!);
    const available =
      (layout!.clientWidth || window.innerWidth) -
      (Number.parseFloat(style.paddingLeft) || 0) -
      (Number.parseFloat(style.paddingRight) || 0) -
      2 * (Number.parseFloat(style.columnGap) || 8) -
      8;
    return {
      min: minimum,
      max: Math.max(minimum, Math.min(720, available - minimumWorkspace)),
      default: technical ? 260 : Math.max(minimum, available * 0.3),
    };
  }

  function resize(): void {
    const range = limits();
    currentWidth = Math.round(
      Math.min(range.max, Math.max(range.min, preference ?? range.default)),
    );
    layout!.style.setProperty('--conversation-width', currentWidth + 'px');
    separator!.setAttribute('aria-valuemin', String(range.min));
    separator!.setAttribute('aria-valuemax', String(Math.floor(range.max)));
    separator!.setAttribute('aria-valuenow', String(currentWidth));
    separator!.setAttribute('aria-valuetext', `${currentWidth} pixels pour la discussion`);
    separator!.tabIndex = window.innerWidth > 900 && !expanded ? 0 : -1;
  }

  function setWidth(value: number): void {
    const range = limits();
    preference = Math.min(range.max, Math.max(range.min, value));
    const before = captureScroll(document);
    resize();
    restoreScroll(before);
  }

  function stopDrag(): void {
    if (!drag) return;
    if (separator!.hasPointerCapture?.(drag.pointer))
      separator!.releasePointerCapture(drag.pointer);
    drag = null;
    layout!.classList.remove('layout-resizing');
    saveWidth(window, preference);
  }

  function toggleExpanded(): void {
    const before = captureScroll(document);
    if (!expanded) {
      isolated = [
        ...document.querySelectorAll<HTMLElement>(
          '.topbar, .mobile-navigation, .skip-link, #discussion, #conversation-resizer',
        ),
      ].map((element) => ({ element, wasInert: element.hasAttribute('inert') }));
      for (const item of isolated) item.element.setAttribute('inert', '');
    } else {
      for (const item of isolated) if (!item.wasInert) item.element.removeAttribute('inert');
      isolated = [];
    }
    expanded = !expanded;
    layout!.classList.toggle('workspace-expanded', expanded);
    document.body.classList.toggle('studio-expanded', expanded);
    expand!.setAttribute('aria-pressed', String(expanded));
    const label = expanded ? 'Revenir à la disposition' : 'Agrandir cette vue';
    expand!.setAttribute('aria-label', label);
    expand!.setAttribute('title', label);
    resize();
    restoreScroll(before);
    expand!.focus({ preventScroll: true });
  }

  function separatorKey(event: KeyboardEvent): void {
    if (window.innerWidth <= 900 || expanded) return;
    const range = limits(),
      step = event.shiftKey ? 40 : 16;
    const widths: Record<string, number> = {
      ArrowLeft: currentWidth - step,
      ArrowRight: currentWidth + step,
      Home: range.min,
      End: range.max,
    };
    const value = widths[event.key];
    if (value === undefined) return;
    event.preventDefault();
    setWidth(value);
    saveWidth(window, preference);
  }

  listen(separator, 'keydown', (event) => separatorKey(event as KeyboardEvent));
  listen(separator, 'dblclick', () => {
    const before = captureScroll(document);
    preference = null;
    saveWidth(window, null);
    resize();
    restoreScroll(before);
  });
  listen(separator, 'pointerdown', (event) => {
    const pointer = event as PointerEvent;
    if (pointer.button !== 0 || window.innerWidth <= 900 || expanded) return;
    pointer.preventDefault();
    separator.focus({ preventScroll: true });
    drag = { startX: pointer.clientX, width: currentWidth, pointer: pointer.pointerId };
    separator.setPointerCapture?.(pointer.pointerId);
    layout.classList.add('layout-resizing');
  });
  listen(window, 'pointermove', (event) => {
    const pointer = event as PointerEvent;
    if (drag && pointer.pointerId === drag.pointer)
      setWidth(drag.width + pointer.clientX - drag.startX);
  });
  for (const type of ['pointerup', 'pointercancel', 'blur']) listen(window, type, stopDrag);
  listen(window, 'resize', () => {
    const before = captureScroll(document);
    stopDrag();
    resize();
    restoreScroll(before);
  });
  listen(expand, 'click', toggleExpanded);
  listen(window, 'keydown', (event) => {
    const key = event as KeyboardEvent;
    if (key.key !== 'Escape' || key.defaultPrevented) return;
    if (drag) {
      setWidth(drag.width);
      stopDrag();
      key.preventDefault();
    } else if (expanded) {
      toggleExpanded();
      key.preventDefault();
    }
  });
  listen(document, 'studio:before-render', () => {
    positions = captureScroll(document);
  });
  listen(document, 'studio:after-render', () => {
    restoreScroll(positions);
    positions = [];
  });
  resize();
  return {
    destroy() {
      discussionSizing.destroy();
      stopDrag();
      if (expanded) toggleExpanded();
      for (const dispose of disposers) dispose();
    },
  };
}

if (typeof document !== 'undefined' && document.body?.hasAttribute('data-studio')) {
  mountStudioLayout(document, window);
}
