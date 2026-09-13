import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPath, parseJson, stat } from './filesystem.js';
import { safePath, secretPath, readLocal } from './records.js';
import { sanitizedReview, summarizeReview, reviewMarkdown, reviewFreshness, redactReviewText } from './review-model.js';
import { renderReviewHTML } from './review.js';

export interface ReviewOptions { destination: string; review?: string; legacy?: string; demo?: boolean; output?: string; markdown?: string; currentRevision?: string; changedTargets?: string[] }
/** Read only explicitly selected sources. No repository commands, file traversal or server. */
export function prepareReview(options: ReviewOptions) {
  const root = path.resolve(options.destination);
  checkPath(root);
  for (const value of [options.review, options.legacy, options.output, options.markdown, options.currentRevision]) if (value !== undefined && !value.trim()) throw new Error('Review options must not be empty.');
  if (options.currentRevision && options.currentRevision.length > 8192) throw new Error('Revision label exceeds the allowed length.');
  if (options.changedTargets && (options.changedTargets.length > 256 || options.changedTargets.some(t => !t.trim() || t.length > 8192))) throw new Error('Changed targets exceed the allowed bounds.');
  if ([options.review, options.legacy, options.demo].filter(Boolean).length > 1) throw new Error('Choose one of --review, --legacy or --demo.');
  if (options.markdown && !options.review && !options.legacy && !options.demo) throw new Error('Markdown export requires a selected review.');
  const read = (file: string): string => { if (secretPath(file)) throw new Error('Secret-like review paths are excluded.'); return readLocal(root, file, 4 * 1024 * 1024).toString('utf8'); };
  const source = options.demo ? fs.readFileSync(fileURLToPath(new URL('../examples/review/review.json', import.meta.url)), 'utf8') : options.review ? read(options.review) : null;
  const review = source === null ? null : sanitizedReview(parseJson(source));
  const legacy = options.legacy ? redactReviewText(read(options.legacy)) : null;
  const outputs: [string, string][] = [];
  if (options.output) outputs.push([options.output, renderReviewHTML({ review, legacy, currentRevision: options.currentRevision, changedTargets: options.changedTargets })]);
  if (options.markdown) outputs.push([options.markdown, review ? reviewMarkdown(review) : legacy!]);
  for (const [file] of outputs) {
    if (!safePath(file) || secretPath(file) || (file === options.output ? !file.endsWith('.html') : !file.endsWith('.md'))) throw new Error('Review outputs require safe relative .html / .md paths.');
    checkPath(path.resolve(root, file));
    if (stat(path.resolve(root, file))) throw new Error('Review output already exists; choose a fresh path. No files written.');
  }
  if (new Set(outputs.map(([f]) => f)).size !== outputs.length) throw new Error('Review output paths must be distinct.');
  const created: string[] = [], directories: string[] = [];
  const mkdir = (dir: string): void => { if (stat(dir)) return; mkdir(path.dirname(dir)); fs.mkdirSync(dir); directories.push(dir); };
  try {
    for (const [file, content] of outputs) {
      const target = path.resolve(root, file); mkdir(path.dirname(target)); checkPath(target);
      const fd = fs.openSync(target, 'wx'); created.push(target); try { fs.writeFileSync(fd, content); } finally { fs.closeSync(fd); }
    }
  } catch (error) { for (const f of created.reverse()) fs.unlinkSync(f); for (const d of directories.reverse()) fs.rmdirSync(d); throw error; }
  return { format: 1, reviewId: review?.id ?? null, status: review ? summarizeReview(review).conclusion : legacy !== null ? 'legacy' : 'empty', summary: review ? summarizeReview(review) : null, freshness: review ? reviewFreshness(review, options.currentRevision ?? null, options.changedTargets ?? []) : null, outputs: outputs.map(([file]) => path.resolve(root, file)), limitations: 'Explicit record only; no review execution or filesystem evidence discovery. Legacy Markdown has no inferred fields. Inspect privacy before sharing; automatic redaction is heuristic.' };
}
