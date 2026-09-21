function observation(event, scope) {
  const data = event.data;
  if (
    !scope?.frame?.contentWindow ||
    !scope.origin ||
    !scope.revisionId ||
    event.source !== scope.frame.contentWindow ||
    event.origin !== scope.origin ||
    data?.type !== 'devmethod-runtime-error' ||
    data.buildId !== scope.revisionId ||
    typeof data.message !== 'string' ||
    !data.message.trim() ||
    typeof data.file !== 'string'
  )
    return null;
  return {
    revisionId: scope.revisionId,
    message: data.message.slice(0, 2000),
    file: data.file.slice(0, 500),
    line: Number.isSafeInteger(data.line) && data.line > 0 ? data.line : null,
  };
}

/** Negative, untrusted preview signals only; no successful check or approval is inferred. */
export function createRuntimeObserver({ window, getScope, submit, onError }) {
  const seen = new Map();
  const queue = [];
  let working = false;
  let disposed = false;
  function current(scope) {
    const next = getScope();
    return (
      !disposed &&
      next?.frame === scope.frame &&
      next?.origin === scope.origin &&
      next?.revisionId === scope.revisionId
    );
  }
  async function drain() {
    if (working || disposed) return;
    working = true;
    try {
      while (queue.length && !disposed) {
        const { scope, input } = queue.shift();
        if (!current(scope)) continue;
        try {
          await submit(input);
        } catch (error) {
          if (current(scope)) onError(error);
        }
      }
    } finally {
      working = false;
    }
  }
  function receive(event) {
    if (disposed) return;
    const scope = getScope();
    const input = observation(event, scope);
    if (!input) return;
    const keys = seen.get(input.revisionId) ?? new Set();
    const key = JSON.stringify(input);
    if (keys.size >= 20 || keys.has(key)) return;
    keys.add(key);
    seen.set(input.revisionId, keys);
    queue.push({ scope, input });
    void drain();
  }
  window.addEventListener('message', receive);
  return {
    dispose() {
      disposed = true;
      queue.length = 0;
      window.removeEventListener('message', receive);
    },
  };
}
