// Accepted project contract: trim text; reject non-string values. No layering mandate.
export function normalizeLabel(value) {
  if (typeof value !== 'string') throw new TypeError('Expected text');
  return value.trim();
}
