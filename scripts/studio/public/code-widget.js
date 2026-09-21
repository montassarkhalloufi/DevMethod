import { createTranslator, createMessageBindings } from './i18n.js';
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
  const t = createTranslator(document);
  const messages = createMessageBindings(document);
  let widget;
  let loading;
  let current;
  let markers = [];
  let disposed = false;
  let enabled = false;
  let failed = false;
  let pendingFocus;
  const status = document.createElement('p');
  status.className = 'code-language-status';
  messages.text(status, () =>
    t('Chargement de l’éditeur multicolore…', 'Loading the syntax editor…'),
  );
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
    messages.text(status, () =>
      t(
        'Éditeur multicolore indisponible. Mode texte conservé ; sauvegarde et vérification restent utilisables.',
        'Syntax editor unavailable. Plain text mode is preserved; saving and checks remain available.',
      ),
    );
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
              messages.text(status, () =>
                items.length
                  ? t(
                      '{count} diagnostic(s) local(aux) · hors typage complet et tests du projet.',
                      '{count} local diagnostic(s) · excludes full type checking and project tests.',
                      { count: items.length },
                    )
                  : t(
                      'Aucun diagnostic local reçu. Exécutez le contrôle du projet pour vérifier le code.',
                      'No local diagnostics received. Run the project check to verify the code.',
                    ),
              );
          },
        }),
      )
      .then((handle) => {
        if (disposed) return handle.dispose();
        widget = handle;
        messages.text(status, () =>
          t(
            'Coloration par langage · syntaxe locale. Le typage complet dépend de la vérification du projet.',
            'Language highlighting · local syntax. Full type checking depends on the project check.',
          ),
        );
        const ready = invoke((mounted) => {
          mounted.setDiagnostics(markers);
          if (current) mounted.setDocument(current);
        });
        if (ready) {
          host.hidden = !enabled;
          fallback.hidden = true;
          if (pendingFocus && enabled) {
            invoke((mounted) => mounted.focus(pendingFocus));
            pendingFocus = undefined;
          }
        }
      })
      .catch(degrade);
  }
  return {
    setDocument(next) {
      if (disposed) return;
      if (current?.path !== next.path) pendingFocus = undefined;
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
          messages.text(status, () =>
            t(
              'Mode texte : les workers de l’éditeur sont indisponibles.',
              'Plain text mode: editor workers are unavailable.',
            ),
          );
        void start();
      }
    },
    setDiagnostics(next) {
      markers = next;
      invoke((mounted) => mounted.setDiagnostics(next));
    },
    clear() {
      enabled = false;
      pendingFocus = undefined;
      host.hidden = true;
      status.hidden = true;
    },
    focus(position) {
      if (!invoke((mounted) => mounted.focus(position))) {
        pendingFocus = position;
        fallback.focus();
      }
    },
    dispose() {
      messages.dispose();
      if (disposed) return;
      disposed = true;
      releaseWidget();
      status.remove();
    },
  };
}
