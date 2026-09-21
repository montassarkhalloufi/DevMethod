import { createTranslator, createMessageBindings } from './i18n.js';
export function createConnectorsController({ document, onPrepareRequest }) {
  const t = createTranslator(document);
  const messages = createMessageBindings(document);
  const dialog = document.getElementById('connectors-dialog');
  const host = document.getElementById('connectors-host');
  let widget,
    loading,
    revisionId = null,
    checkId,
    disposed = false;
  function options() {
    return {
      revisionId,
      checkId,
      onPrepareRequest(request) {
        if (onPrepareRequest(request) === false) return false;
        dialog.close();
        return true;
      },
    };
  }
  function open(id) {
    if (!dialog || !host) return;
    checkId = typeof id === 'string' ? id : undefined;
    if (!dialog.open) dialog.showModal();
    if (widget) return widget.update(options());
    messages.text(host, () =>
      t('Chargement des outils et services…', 'Loading tools and services…'),
    );
    loading ??= import('/studio-ui/connectors-widget.js')
      .then((module) => {
        if (disposed) return;
        widget = module.mountConnectorsWidget(host, options());
      })
      .catch(() => {
        if (disposed) return;
        loading = null;
        messages.text(host, () =>
          t(
            'Le catalogue ne peut pas être chargé. Fermez puis rouvrez pour réessayer.',
            'The catalog could not be loaded. Close and reopen to try again.',
          ),
        );
      });
  }
  return {
    open,
    close: () => dialog?.close?.(),
    update(id) {
      if (revisionId === id) return;
      revisionId = id;
      if (dialog?.open) widget?.update(options());
    },
    dispose() {
      disposed = true;
      messages.dispose();
      widget?.dispose();
      dialog?.close?.();
    },
  };
}
