import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { ProjectElement } from '../model/contracts';
import { createGraphLayout, graphBounds, layoutSignature } from '../components/architecture-model';

/** Positions are UI state: refreshes append new nodes instead of moving existing ones. */
export function useArchitectureCanvas(
  elements: ProjectElement[],
  visible: ProjectElement[],
  filterKey: string,
) {
  const [layout, setLayout] = useState(() => createGraphLayout(elements));
  const signature = layoutSignature(elements);
  if (layout.signature !== signature) setLayout(createGraphLayout(elements, layout));
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    const bounds = graphBounds(visible, layout);
    const zoom = Math.min(1, 880 / bounds.width);
    setLastFilterKey(filterKey);
    setCamera({ x: (880 - bounds.width * zoom) / 2 - bounds.x * zoom, y: -bounds.y * zoom, zoom });
  }
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    originX: number;
    originY: number;
    scale: number;
  } | null>(null);
  const pan = (x: number, y: number) =>
    setCamera((value) => ({ ...value, x: value.x + x, y: value.y + y }));
  function start(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || (event.target as Element).closest('[data-graph-select]')) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      originX: camera.x,
      originY: camera.y,
      scale: Math.max(
        event.currentTarget.viewBox.baseVal.width / bounds.width,
        event.currentTarget.viewBox.baseVal.height / bounds.height,
      ),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: ReactPointerEvent<SVGSVGElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    setCamera((value) => ({
      ...value,
      x: current.originX + (event.clientX - current.x) * current.scale,
      y: current.originY + (event.clientY - current.y) * current.scale,
    }));
  }
  function stop(event: ReactPointerEvent<SVGSVGElement>) {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function key(event: ReactKeyboardEvent<SVGSVGElement>) {
    if (event.target !== event.currentTarget) return;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [40, 0],
      ArrowRight: [-40, 0],
      ArrowUp: [0, 40],
      ArrowDown: [0, -40],
    };
    const delta = moves[event.key];
    if (delta) {
      event.preventDefault();
      pan(...delta);
    }
  }
  return {
    layout,
    camera,
    pan,
    handlers: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: stop,
      onPointerCancel: stop,
      onKeyDown: key,
    },
    reset: () => setCamera({ x: 0, y: 0, zoom: 1 }),
    fit: (bounds: { x: number; y: number; width: number; height: number }) => {
      const zoom = Math.min(880 / bounds.width, 460 / bounds.height, 1);
      setCamera({
        x: (880 - bounds.width * zoom) / 2 - bounds.x * zoom,
        y: -bounds.y * zoom,
        zoom,
      });
    },
    zoom: (factor: number) =>
      setCamera((value) => {
        const zoom = Math.max(0.05, Math.min(3, value.zoom * factor));
        const ratio = zoom / value.zoom;
        return { zoom, x: 440 - (440 - value.x) * ratio, y: 230 - (230 - value.y) * ratio };
      }),
  };
}
