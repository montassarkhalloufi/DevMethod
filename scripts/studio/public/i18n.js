export const languageKey = 'devmethod:studio:language:v1';
const cookieName = 'devmethod-studio-language';
const changeEvent = 'studio:language-change';

export function isLocale(value) {
  return value === 'en' || value === 'fr';
}

function savedLocale(document, window) {
  try {
    const cookie = document.cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(cookieName + '='))
      ?.slice(cookieName.length + 1);
    if (isLocale(cookie)) return cookie;
  } catch {
    // The preference still works when cookies are unavailable.
  }
  try {
    const stored = window.localStorage.getItem(languageKey);
    if (isLocale(stored)) return stored;
  } catch {
    // Private browser modes can refuse persistent storage.
  }
  return undefined;
}

export function getLocale(document = globalThis.document) {
  const value = document?.documentElement.lang;
  return isLocale(value) ? value : 'en';
}

export function initializeLocale(document = globalThis.document, window = globalThis.window) {
  if (!document || !window) return 'en';
  if (!document.documentElement.hasAttribute('data-studio-language-ready')) {
    document.documentElement.lang = savedLocale(document, window) ?? 'en';
    document.documentElement.setAttribute('data-studio-language-ready', '');
  }
  return getLocale(document);
}

export function setLocale(locale, document = globalThis.document, window = globalThis.window) {
  if (!isLocale(locale)) throw new TypeError('Unsupported Studio language');
  if (!document || !window) return;
  document.documentElement.lang = locale;
  document.documentElement.setAttribute('data-studio-language-ready', '');
  try {
    window.localStorage.setItem(languageKey, locale);
  } catch {
    // Keep the current selection even without persistence.
  }
  try {
    // Cookies share this harmless preference across the local home/project ports.
    document.cookie = `${cookieName}=${locale}; Path=/; SameSite=Strict; Max-Age=31536000`;
  } catch {
    // localStorage remains a fallback where cookies are unavailable.
  }
  window.dispatchEvent(new window.Event(changeEvent));
}

const subscriptions = new WeakMap();

export function subscribeLocale(callback, window = globalThis.window) {
  if (!window) return () => {};
  let group = subscriptions.get(window);
  if (!group) {
    const listeners = new Set();
    const notify = () => {
      for (const listener of listeners) listener();
    };
    const storage = (event) => {
      if (event.key !== languageKey || !isLocale(event.newValue)) return;
      window.document.documentElement.lang = event.newValue;
      notify();
    };
    const focus = () => {
      const value = savedLocale(window.document, window);
      if (!isLocale(value) || value === getLocale(window.document)) return;
      window.document.documentElement.lang = value;
      notify();
    };
    group = { listeners, notify, storage, focus };
    subscriptions.set(window, group);
    window.addEventListener(changeEvent, notify);
    window.addEventListener('storage', storage);
    window.addEventListener('focus', focus);
  }
  group.listeners.add(callback);
  return () => {
    group.listeners.delete(callback);
    if (group.listeners.size) return;
    window.removeEventListener(changeEvent, group.notify);
    window.removeEventListener('storage', group.storage);
    window.removeEventListener('focus', group.focus);
    subscriptions.delete(window);
  };
}

export function translate(fr, en, values = {}, locale = getLocale()) {
  const message = locale === 'fr' ? fr : en;
  return message.replace(/\{([a-zA-Z][\w]*)\}/g, (match, name) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}

export const t = translate;

export function createTranslator(document) {
  return (fr, en, values) => translate(fr, en, values, getLocale(document));
}

// Only explicitly authored shell labels are translated. Never walk project data,
// source editors, previews, user input or historical records.
export function translateStaticLabels(document) {
  const locale = getLocale(document);
  for (const node of document.querySelectorAll('[data-i18n-fr][data-i18n-en]')) {
    node.textContent = node.getAttribute('data-i18n-' + locale);
  }
  for (const attribute of ['title', 'placeholder', 'aria-label']) {
    for (const node of document.querySelectorAll(`[data-i18n-${attribute}-fr]`)) {
      const value = node.getAttribute(`data-i18n-${attribute}-${locale}`);
      if (value !== null) node.setAttribute(attribute, value);
    }
  }
}

export function mountLocaleControls(document, window) {
  initializeLocale(document, window);
  const update = () => {
    translateStaticLabels(document);
    for (const select of document.querySelectorAll('[data-studio-language]'))
      select.value = getLocale(document);
    if (document.body.classList.contains('studio-home'))
      document.title = translate(
        'DevMethod — Vos projets',
        'DevMethod — Your projects',
        {},
        getLocale(document),
      );
  };
  const change = (event) => {
    if (event.target?.matches('[data-studio-language]') && isLocale(event.target.value))
      setLocale(event.target.value, document, window);
  };
  update();
  const unsubscribe = subscribeLocale(update, window);
  document.addEventListener('change', change);
  return () => {
    unsubscribe();
    document.removeEventListener('change', change);
  };
}

/** Explicit bindings for authored legacy UI labels; never traverse user content. */
export function createMessageBindings(document) {
  const nodes = new Set();
  const bindings = new WeakMap();
  let sweepQueued = false;
  let disposed = false;
  function scheduleSweep() {
    if (sweepQueued || disposed) return;
    sweepQueued = true;
    queueMicrotask(() => {
      sweepQueued = false;
      if (disposed) return;
      for (const reference of nodes) if (!reference.deref()) nodes.delete(reference);
    });
  }
  const readValue = (node, name) =>
    name === 'textContent' ? node.textContent : node.getAttribute(name);
  const writeValue = (node, name, value) => {
    if (name === 'textContent') node.textContent = value;
    else node.setAttribute(name, value);
  };
  function bind(node, name, read) {
    if (name === 'textContent') {
      node.removeAttribute?.('data-i18n-fr');
      node.removeAttribute?.('data-i18n-en');
    }
    const value = String(read());
    writeValue(node, name, value);
    let fields = bindings.get(node);
    if (!fields) {
      fields = new Map();
      bindings.set(node, fields);
      nodes.add(new WeakRef(node));
    }
    fields.set(name, { read, value });
    scheduleSweep();
  }
  const stop = subscribeLocale(() => {
    for (const reference of nodes) {
      const node = reference.deref();
      if (!node) {
        nodes.delete(reference);
        continue;
      }
      const fields = bindings.get(node);
      for (const [name, binding] of fields) {
        if (readValue(node, name) !== binding.value) {
          fields.delete(name);
          continue;
        }
        binding.value = String(binding.read());
        writeValue(node, name, binding.value);
      }
    }
  }, document.defaultView);
  return {
    text: (node, read) => bind(node, 'textContent', read),
    attribute: bind,
    dispose() {
      disposed = true;
      stop();
      nodes.clear();
    },
  };
}

// Runtime facts stay canonical; only these exact product status messages are projected.
const agentStatusMessages = new Map([
  [
    'Vérification navigateur locale du candidat en cours ; aucun nouvel appel fournisseur.',
    'Local browser verification of the candidate in progress; no new provider call.',
  ],
  [
    'Vérification navigateur suspendue ou indisponible ; candidat conservé sans réussite déduite.',
    'Browser verification suspended or unavailable; candidate preserved without assuming success.',
  ],
  ['Disponibilité de Codex à vérifier.', 'Codex availability needs checking.'],
  [
    'Codex CLI indisponible. Installez-le ou rendez-le accessible au processus Studio.',
    'Codex CLI unavailable. Install it or make it accessible to the Studio process.',
  ],
  [
    'Accès Codex existant détecté. Les limites de cet accès restent applicables.',
    'Existing Codex access detected. Its limits still apply.',
  ],
  [
    'Connexion Codex non établie. Connectez Codex dans votre terminal, puis vérifiez à nouveau.',
    'Codex connection not established. Connect Codex in your terminal, then check again.',
  ],
  [
    'Le type d’accès Codex a changé. Une nouvelle activation explicite est nécessaire.',
    'The Codex access type changed. Explicit activation is required again.',
  ],
  ['Prêt à traiter une demande locale.', 'Ready to process a local request.'],
  [
    'Consommation inconnue : exécution automatique suspendue.',
    'Usage unknown: automatic execution suspended.',
  ],
  [
    'Seuil de consommation atteint : aucun nouvel appel automatique.',
    'Usage threshold reached: no new automatic call.',
  ],
  [
    'Nombre maximal de demandes atteint : aucun nouvel appel automatique.',
    'Maximum request count reached: no new automatic call.',
  ],
  [
    'Construction locale en cours ; les résultats restent à vérifier.',
    'Local build in progress; results still need verification.',
  ],
  [
    'Version appliquée après relecture des contrôles ; données et limites conservées.',
    'Version applied after reviewing checks; data and limits preserved.',
  ],
  [
    'Échec technique constaté ; une correction bornée repart du candidat conservé.',
    'Technical failure observed; a bounded correction resumes from the preserved candidate.',
  ],
  [
    'Résultat conservé ; consultez la décision de contrôle et les preuves dans Vérifications.',
    'Result preserved; review the control decision and evidence in Checks.',
  ],
  [
    'Une action outil attend un accord, a échoué ou conserve un résultat inconnu ; aucun nouvel appel lancé.',
    'A tool action awaits approval, failed or has an unknown outcome; no new call started.',
  ],
  [
    'La correction attend un nouveau contrôle favorable de son candidat et de ses preuves.',
    'Correction awaits a fresh favorable assessment of its candidate and evidence.',
  ],
  [
    'Contrôle préalable indisponible ou illisible ; aucun nouvel appel lancé.',
    'Preflight control unavailable or unreadable; no new call started.',
  ],
  [
    'Un candidat attend vérification ou décision ; les demandes suivantes restent conservées.',
    'A candidate awaits verification or a decision; subsequent requests are preserved.',
  ],
  [
    'La demande en attente vise une ancienne révision. Annulez-la et soumettez-la à nouveau.',
    'The pending request targets an older revision. Cancel it and submit it again.',
  ],
]);
agentStatusMessages.set(
  'La demande liée au candidat reste suspendue par ses contrôles courants.',
  'The candidate-linked request remains suspended by its current controls.',
);
const frenchAgentStatusMessages = new Map([...agentStatusMessages].map(([fr, en]) => [en, fr]));
export function translateAgentMessage(message, locale = getLocale()) {
  return (
    (locale === 'fr' ? frenchAgentStatusMessages.get(message) : agentStatusMessages.get(message)) ??
    message
  );
}
