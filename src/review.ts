import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { sanitizedReview, redactReviewText, type Review } from './review-model.js';

export interface ReviewPresentation {
  review?: unknown;
  legacy?: string | null;
  currentRevision?: string | null;
  changedTargets?: string[];
}
export function renderReviewHTML(input: ReviewPresentation): string {
  const review: Review | null = input.review == null ? null : sanitizedReview(input.review);
  const legacy = input.legacy == null ? null : redactReviewText(input.legacy);
  const script = fs.readFileSync(new URL('./review-browser.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('./review-ui.css', import.meta.url), 'utf8');
  const scriptHash = createHash('sha256').update(script).digest('base64');
  const payload = JSON.stringify({
    review,
    legacy,
    currentRevision: input.currentRevision ?? null,
    changedTargets: input.changedTargets ?? [],
  })
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${scriptHash}'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><title>DevMethod · Review</title><style>${css}</style></head><body><div id="app"><p class="loading">Chargement de la review…</p></div><noscript>Activez JavaScript pour les filtres et la consultation. Le rapport Markdown reste disponible via le CLI.</noscript><script id="review-data" type="application/json">${payload}</script><script>${script}</script></body></html>\n`;
}
