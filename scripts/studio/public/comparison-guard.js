// This function is injected before application scripts on the comparison origin only.
// It makes the read-only UI explicit; the server's write refusal remains the data boundary.
// A generic button cannot reliably be classified as navigation or mutation. Native links
// and disclosures retain their browser behavior; other actions require the interactive app.
export function installComparisonGuard() {
  const previewDocument = document;
  const custom =
    '[role="button"],[role="checkbox"],[role="switch"],[role="radio"],[role="combobox"],[role="textbox"],[role="slider"],[role="spinbutton"]';
  const controls = `input,textarea,select,button,[contenteditable],${custom}`;
  const explanation = 'Comparaison en lecture seule. Ouvrez l’application pour interagir.';

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
    if (control.hasAttribute('data-devmethod-readonly-control')) return;
    control.setAttribute('data-devmethod-readonly-control', '');
    control.setAttribute('aria-description', explanation);
    control.title = [control.title, explanation].filter(Boolean).join(' · ');
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
