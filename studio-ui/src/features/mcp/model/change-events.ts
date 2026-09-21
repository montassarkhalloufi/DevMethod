type McpChange = 'connections' | 'selection';
const eventName = (kind: McpChange) => `devmethod:mcp-${kind}-changed`;

// Studio widgets are independent bundles. The page event carries only an instance marker;
// each listener reads the authoritative endpoint instead of copying credentials or state.
export function notifyMcpChange(kind: McpChange, source: symbol) {
  window.dispatchEvent(new CustomEvent(eventName(kind), { detail: source }));
}

export function onMcpChange(kind: McpChange, source: symbol, refresh: () => void) {
  const listener = (event: Event) => {
    if ((event as CustomEvent<symbol>).detail !== source) refresh();
  };
  window.addEventListener(eventName(kind), listener);
  return () => window.removeEventListener(eventName(kind), listener);
}
