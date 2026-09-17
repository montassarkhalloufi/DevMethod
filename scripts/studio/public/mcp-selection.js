export function createMcpSelectionController({
  document,
  loadWidget = () => import('/studio-ui/mcp-widget.js'),
}) {
  const host = document.getElementById('prompt-mcp-tools');
  let widget;
  let disposed = false;
  const ready = host
    ? loadWidget()
        .then((module) => {
          if (!disposed) widget = module.mountMcpWidget(host);
        })
        .catch(() => {
          if (!disposed)
            host.textContent = 'Les outils MCP sont indisponibles. Actualisez pour réessayer.';
        })
    : Promise.resolve();
  return {
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
