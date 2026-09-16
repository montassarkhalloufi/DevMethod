// Server verification is displayed separately from syntax diagnostics in the editor.
export const SERVER_DIAGNOSTIC_OWNER = 'devmethod';

export function localMarkers<T extends { owner: string }>(markers: readonly T[]): T[] {
  return markers.filter((item) => item.owner !== SERVER_DIAGNOSTIC_OWNER);
}
