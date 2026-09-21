// This function is injected before application scripts on the comparison origin only.
// It makes the read-only UI explicit; the server's write refusal remains the data boundary.
// A generic button cannot reliably be classified as navigation or mutation. Native links
// and disclosures retain their browser behavior; other actions require the interactive app.
export function installComparisonGuard() {
  const previewDocument = document;
  const custom =
    '[role="button"],[role="checkbox"],[role="switch"],[role="radio"],[role="combobox"],[role="textbox"],[role="slider"],[role="spinbutton"]';
  const controls = `input,textarea,select,button,[contenteditable],${custom}`;
  // Self-contained: this function is serialized into the isolated comparison page.
  // Do not change the application's document language or inspect its content.
  function preferredLocale() {
    try {
      const cookie = previewDocument.cookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('devmethod-studio-language='))
        ?.split('=')[1];
      if (cookie === 'en' || cookie === 'fr') return cookie;
    } catch {
      /* Cookies may be unavailable on an isolated preview. */
    }
    try {
      const stored = window.localStorage.getItem('devmethod:studio:language:v1');
      if (stored === 'en' || stored === 'fr') return stored;
    } catch {
      /* Default to English without requiring storage. */
    }
    return 'en';
  }
  let locale = preferredLocale();
  const titles = new WeakMap();
  function explanation() {
    return locale === 'fr'
      ? 'Comparaison en lecture seule. Ouvrez l’application pour interagir.'
      : 'Read-only comparison. Open the application to interact.';
  }

  function disableControl(control) {
    if ('disabled' in control && !control.disabled) control.disabled = true;
    if (
      control.hasAttribute('contenteditable') &&
      control.getAttribute('contenteditable') !== 'false'
    )
      control.setAttribute('contenteditable', 'false');
    if (control.matches(custom) && control.getAttribute('tabindex') !== '-1')
      control.setAttribute('tabindex', '-1');
    if (control.getAttribute('aria-disabled') !== 'true')
      control.setAttribute('aria-disabled', 'true');
    if (!titles.has(control)) titles.set(control, control.title);
    control.setAttribute('data-devmethod-readonly-control', '');
    control.setAttribute('aria-description', explanation());
    control.title = [titles.get(control), explanation()].filter(Boolean).join(' · ');
  }

  function disableControls() {
    previewDocument.querySelectorAll(controls).forEach(disableControl);
  }

  function preventAction(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function isNativeReadingTarget(target) {
    if (target.closest?.('summary')) return true;
    const link = target.closest?.('a[href]');
    if (!link) return false;
    try {
      const url = new URL(link.href, location.href);
      return ['http:', 'https:'].includes(url.protocol) && url.origin === location.origin;
    } catch {
      return false;
    }
  }

  const style = previewDocument.createElement('style');
  style.textContent =
    '[data-devmethod-readonly-control]{cursor:not-allowed!important}button[data-devmethod-readonly-control],[role="button"][data-devmethod-readonly-control]{opacity:.55}';
  (previewDocument.head ?? previewDocument.documentElement).append(style);
  disableControls();
  function refreshLanguage() {
    const next = preferredLocale();
    if (next === locale) return;
    locale = next;
    disableControls();
  }
  window.addEventListener('focus', refreshLanguage);
  window.addEventListener('storage', refreshLanguage);
  window.addEventListener('studio:language-change', refreshLanguage);
  // Cookies are shared across local ports, but storage events are not.
  let languageTimer = window.setInterval(refreshLanguage, 1000);
  window.addEventListener('pagehide', () => {
    window.clearInterval(languageTimer);
    languageTimer = null;
  });
  window.addEventListener('pageshow', () => {
    refreshLanguage();
    languageTimer ??= window.setInterval(refreshLanguage, 1000);
  });
  new MutationObserver(disableControls).observe(previewDocument.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'contenteditable', 'aria-disabled', 'tabindex', 'role'],
  });
  for (const type of ['submit', 'reset', 'beforeinput', 'input', 'change'])
    window.addEventListener(type, preventAction, true);
  window.addEventListener(
    'click',
    (event) => {
      if (!isNativeReadingTarget(event.target)) event.preventDefault();
      // Keep native navigation/disclosure, without forwarding clicks to unknown mutation handlers.
      event.stopImmediatePropagation();
    },
    true,
  );
  for (const type of ['pointerdown', 'pointerup', 'keydown'])
    window.addEventListener(
      type,
      (event) => {
        if (event.type === 'keydown' && ['Tab', 'Escape'].includes(event.key)) return;
        if (event.target.closest?.(controls)) preventAction(event);
      },
      true,
    );
}
