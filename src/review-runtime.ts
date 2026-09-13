/** Exact installed runtime allowlist; never permit arbitrary scripts in manifests. */
export const reviewRuntimeFiles = [
  'review-agent.mjs', 'review-cli.mjs', 'review-open.mjs', 'review-model.mjs',
  'review.mjs', 'records.mjs', 'filesystem.mjs', 'review-browser.js', 'review-ui.css',
] as const;

export function isReviewRuntimePath(parts: string[]): boolean {
  return parts.length === 5 && parts[2] === 'scoped-delivery' && parts[3] === 'scripts' &&
    reviewRuntimeFiles.some(name => name === parts[4]);
}
