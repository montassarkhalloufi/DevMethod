import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type PointerEvent,
  type KeyboardEvent,
} from 'react';

export const EXPLORER_WIDTH_KEY = 'devmethod.studio.explorer-width.v1';
export const DEFAULT_EXPLORER_WIDTH = 230;
const MIN_WIDTH = 160;
const MAX_WIDTH = 420;
const SOURCE_MIN_WIDTH = 260;

function readPreference() {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(EXPLORER_WIDTH_KEY) || 'null');
    if (
      typeof saved === 'object' &&
      saved &&
      'version' in saved &&
      saved.version === 1 &&
      'width' in saved &&
      typeof saved.width === 'number' &&
      Number.isFinite(saved.width)
    ) {
      return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, saved.width));
    }
  } catch {
    /* Storage is optional; a private browser may reject it. */
  }
  return DEFAULT_EXPLORER_WIDTH;
}
function savePreference(width: number) {
  try {
    localStorage.setItem(EXPLORER_WIDTH_KEY, JSON.stringify({ version: 1, width }));
  } catch {
    /* Resizing remains available when storage is disabled. */
  }
}
interface WidthState {
  width: number;
  maximum: number;
  enabled: boolean;
}
interface Drag {
  pointerId: number;
  startX: number;
  startWidth: number;
  target: HTMLElement;
}
export function useExplorerWidth(explorer: RefObject<HTMLElement | null>) {
  const [preference] = useState(readPreference);
  const preferred = useRef(preference);
  const layout = useRef<HTMLElement | null>(null);
  const drag = useRef<Drag | null>(null);
  const limits = useRef<WidthState>({
    width: preferred.current,
    maximum: MAX_WIDTH,
    enabled: true,
  });
  const [state, setState] = useState(limits.current);
  function apply(value: number) {
    const width = Math.min(limits.current.maximum, Math.max(MIN_WIDTH, Math.round(value)));
    const next = { ...limits.current, width };
    limits.current = next;
    layout.current?.style.setProperty('--explorer-width', width + 'px');
    setState(next);
    return width;
  }
  function commit(value: number) {
    preferred.current = apply(value);
    savePreference(preferred.current);
  }
  useEffect(() => {
    const element = explorer.current?.closest<HTMLElement>('.project-files-layout');
    if (!element) return;
    layout.current = element;
    function measure() {
      const available = element!.getBoundingClientRect().width;
      if (available <= 0) return;
      const enabled = available >= MIN_WIDTH + SOURCE_MIN_WIDTH && window.innerWidth > 650;
      const maximum = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, available - SOURCE_MIN_WIDTH));
      const desired = drag.current ? limits.current.width : preferred.current;
      const width = Math.min(maximum, Math.max(MIN_WIDTH, desired));
      limits.current = { width, maximum, enabled };
      element!.style.setProperty('--explorer-width', width + 'px');
      element!.dataset.explorerStacked = String(!enabled);
      setState((previous) =>
        previous.width === width && previous.maximum === maximum && previous.enabled === enabled
          ? previous
          : limits.current,
      );
    }
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      const active = drag.current;
      if (active?.target.hasPointerCapture?.(active.pointerId))
        active.target.releasePointerCapture(active.pointerId);
      drag.current = null;
      delete element.dataset.explorerResizing;
      delete element.dataset.explorerStacked;
      element.style.removeProperty('--explorer-width');
      layout.current = null;
    };
  }, [explorer]);
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !limits.current.enabled) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: limits.current.width,
      target: event.currentTarget,
    };
    if (layout.current) layout.current.dataset.explorerResizing = 'true';
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    apply(active.startWidth + event.clientX - active.startX);
  }
  function finish(event: PointerEvent<HTMLDivElement>, cancel: boolean) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    drag.current = null;
    if (cancel) apply(active.startWidth);
    else commit(limits.current.width);
    if (layout.current) delete layout.current.dataset.explorerResizing;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = {
      ArrowLeft: -(event.shiftKey ? 40 : 16),
      ArrowRight: event.shiftKey ? 40 : 16,
    };
    let width = limits.current.width + (moves[event.key] || 0);
    if (event.key === 'Home') width = MIN_WIDTH;
    else if (event.key === 'End') width = limits.current.maximum;
    else if (event.key === 'Enter') width = DEFAULT_EXPLORER_WIDTH;
    else if (!(event.key in moves)) return;
    event.preventDefault();
    commit(width);
  }
  return {
    state,
    onPointerDown,
    onPointerMove,
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => finish(event, false),
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finish(event, true),
    onKeyDown,
    reset: () => commit(DEFAULT_EXPLORER_WIDTH),
  };
}
