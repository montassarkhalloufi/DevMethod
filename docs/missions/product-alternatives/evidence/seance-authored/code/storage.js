(function (root) {
  'use strict';
  const key = 'devmethod-seance-transaction-v1';
  root.SeanceStorage = {
    load() { const raw = localStorage.getItem(key); return raw === null ? null : root.SeanceDomain.validateDocument(JSON.parse(raw)); },
    save(document) { localStorage.setItem(key, JSON.stringify(document)); },
    key
  };
})(globalThis);
