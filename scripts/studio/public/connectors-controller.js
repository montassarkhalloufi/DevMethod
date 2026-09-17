export function createConnectorsController({ document, onPrepareRequest }) {
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
    host.textContent = 'Chargement des outils et services…';
    loading ??= import('/studio-ui/connectors-widget.js')
      .then((module) => {
        if (disposed) return;
        widget = module.mountConnectorsWidget(host, options());
      })
      .catch(() => {
        loading = null;
        host.textContent =
          'Le catalogue ne peut pas être chargé. Fermez puis rouvrez pour réessayer.';
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
      widget?.dispose();
      dialog?.close?.();
    },
  };
}
