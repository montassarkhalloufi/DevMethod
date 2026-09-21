import { createTranslator, createMessageBindings } from './i18n.js';
export function createAgentController({
  document,
  onStatus,
  loadWidget = () => import('/studio-ui/agent-widget.js'),
}) {
  const t = createTranslator(document);
  const messages = createMessageBindings(document);
  const host = document.getElementById('agent-configuration');
  const details = host?.closest('details');
  let latest, widget, loading;
  let disposed = false;
  function render() {
    if (!disposed && latest) widget?.update({ agent: latest, onStatus: received });
  }
  function received(status) {
    update(status);
    onStatus(status);
  }
  function open() {
    if (!details?.open || !latest || disposed) return;
    loading ??= loadWidget()
      .then((module) => {
        if (disposed) return;
        widget = module.mountAgentWidget(host);
        render();
      })
      .catch(() => {
        loading = null;
        if (!disposed)
          messages.text(host, () =>
            t(
              'Configuration indisponible. Fermez puis rouvrez ce panneau pour réessayer.',
              'Configuration unavailable. Close and reopen this panel to try again.',
            ),
          );
      });
  }
  function update(status) {
    if (!host || !status?.settings || !status.availability) return;
    if (latest && status.settings.version < latest.settings.version) return;
    latest = status;
    render();
    open();
  }
  details?.addEventListener('toggle', open);
  return {
    update,
    dispose() {
      disposed = true;
      messages.dispose();
      details?.removeEventListener('toggle', open);
      widget?.dispose();
    },
  };
}
