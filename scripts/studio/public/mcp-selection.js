import { createTranslator, createMessageBindings } from './i18n.js';
export function createMcpSelectionController({
  document,
  onGuidesChange,
  loadWidget = () => import('/studio-ui/mcp-widget.js'),
}) {
  const t = createTranslator(document);
  const messages = createMessageBindings(document);
  const host = document.getElementById('prompt-mcp-tools');
  let widget;
  let disposed = false;
  let restoredGuides = [];
  const ready = host
    ? loadWidget()
        .then((module) => {
          if (!disposed) widget = module.mountMcpWidget(host, { onGuidesChange });
        })
        .catch(() => {
          if (!disposed)
            messages.text(host, () =>
              t(
                'Les outils MCP sont indisponibles. Actualisez pour réessayer.',
                'MCP tools are unavailable. Refresh to try again.',
              ),
            );
        })
    : Promise.resolve();
  return {
    async restoreGuides(values) {
      restoredGuides = values;
      await ready;
      if (!disposed && restoredGuides === values) widget?.restoreGuides?.(values);
    },
    addGuides(values) {
      return widget?.addGuides?.(values) ?? false;
    },
    requestGuides: () => widget?.requestGuides?.() ?? restoredGuides,
    clearGuides: (sent) => widget?.clearGuides?.(sent),
    async prepareRequest() {
      await ready;
      return widget ? widget.prepareRequest() : true;
    },
    dispose() {
      disposed = true;
      messages.dispose();
      widget?.dispose();
    },
  };
}
