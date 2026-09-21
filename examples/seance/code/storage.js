import { validateDocument } from './domain.js';

export const key = 'devmethod-seance-transaction-v1';

export function load(storage = localStorage) {
  const raw = storage.getItem(key);
  return raw === null ? null : validateDocument(JSON.parse(raw));
}

export function save(document, storage = localStorage) {
  storage.setItem(key, JSON.stringify(document));
}
