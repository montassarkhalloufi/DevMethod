export function createMcpSelectionController({
  document,
  onGuidesChange,
  loadWidget = () => import('/studio-ui/mcp-widget.js'),
}) {
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
            host.textContent = 'Les outils MCP sont indisponibles. Actualisez pour réessayer.';
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
      widget?.dispose();
    },
  };
}
