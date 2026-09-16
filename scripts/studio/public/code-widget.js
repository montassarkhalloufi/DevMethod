// Progressive integration: the durable draft stays in the existing controller.
// Monaco owns rendering, selections and undo, never the network save lifecycle.
export function createCodeSurface({
  document,
  host,
  fallback,
  onChange,
  onSelection,
  onSave,
  loadWidget = () => import('/studio-ui/code-widget.js'),
}) {
  let widget;
  let loading;
  let current;
  let markers = [];
  let disposed = false;
  let enabled = false;
  let failed = false;
  const status = document.createElement('p');
  status.className = 'code-language-status';
  status.textContent = 'Chargement de l’éditeur multicolore…';
  host.after(status);
  host.hidden = true;

  function releaseWidget() {
    const previous = widget;
    widget = undefined;
    try {
      previous?.dispose();
    } catch {
      // The durable text controller must remain usable even if teardown fails.
    }
  }
  function degrade() {
    failed = true;
    releaseWidget();
    if (disposed) return;
    host.hidden = true;
    fallback.hidden = !enabled;
    status.textContent =
      'Éditeur multicolore indisponible. Mode texte conservé ; sauvegarde et vérification restent utilisables.';
  }
  function invoke(action) {
    if (!widget || disposed) return false;
    try {
      action(widget);
      return true;
    } catch {
      degrade();
      return false;
    }
  }
  async function start() {
    if (loading || disposed || failed || !document.defaultView?.Worker) return;
    loading = Promise.resolve()
      .then(loadWidget)
      .then((module) =>
        module.mountCodeWidget(host, {
          onChange,
          onSelection,
          onSave,
          onDiagnostics(items) {
            if (!disposed && !failed)
              status.textContent = `${items.length} diagnostic(s) local(aux) · syntaxe du fichier, hors typage complet et tests du projet.`;
          },
        }),
      )
      .then((handle) => {
        if (disposed) return handle.dispose();
        widget = handle;
        status.textContent =
          'Coloration par langage · syntaxe locale. Le typage complet dépend de la vérification du projet.';
        const ready = invoke((mounted) => {
          mounted.setDiagnostics(markers);
          if (current) mounted.setDocument(current);
        });
        if (ready) {
          host.hidden = !enabled;
          fallback.hidden = true;
        }
      })
      .catch(degrade);
  }
  return {
    setDocument(next) {
      if (disposed) return;
      current = next;
      enabled = true;
      status.hidden = false;
      if (widget) {
        if (invoke((mounted) => mounted.setDocument(next))) {
          host.hidden = false;
          fallback.hidden = true;
        }
      } else {
        fallback.hidden = false;
        if (!document.defaultView?.Worker)
          status.textContent = 'Mode texte : les workers de l’éditeur sont indisponibles.';
        void start();
      }
    },
    setDiagnostics(next) {
      markers = next;
      invoke((mounted) => mounted.setDiagnostics(next));
    },
    clear() {
      enabled = false;
      host.hidden = true;
      status.hidden = true;
    },
    focus(position) {
      if (!invoke((mounted) => mounted.focus(position))) fallback.focus();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      releaseWidget();
      status.remove();
    },
  };
}
