export function createControlController({
  document,
  openPanel,
  showVersion,
  openSource,
  openConnectors,
  refresh,
}) {
  let widget,
    loading,
    disposed = false;
  const host = document.getElementById('control-workbench');
  const sidebar = document.getElementById('control-navigation');
  const modes = document.getElementById('control-modes');
  const tabs = document.querySelector('.shell-tabs');
  const originalParent = tabs?.parentElement;
  const originalNext = tabs?.nextSibling;
  const tabHost = document.getElementById('control-tabs');
  let options;
  function onOpen(link) {
    if (link.panel === 'connectors') return openConnectors?.(link.checkId);
    if (link.revisionId) showVersion(link.revisionId);
    if (link.panel === 'code' && link.path)
      return openSource(link.path, undefined, link.revisionId);
    openPanel(link.panel, 'push');
  }
  return {
    update(state, revisionId, panel) {
      if (panel === 'control' && tabHost && tabs?.parentElement !== tabHost) tabHost.append(tabs);
      if (panel !== 'control' && tabs && originalParent && tabs.parentElement !== originalParent)
        originalParent.insertBefore(tabs, originalNext);
      if (panel !== 'control') {
        if (widget && options) widget.update({ ...options, active: false });
        return;
      }
      if (!state || !host) return;
      options = {
        active: true,
        revisionId,
        mode: state.project.mode,
        sidebar,
        modes,
        onOpen,
        onStateChanged: refresh,
        onMode(mode) {
          const select = document.getElementById('studio-mode');
          select.value = mode;
          select.dispatchEvent(new document.defaultView.Event('change', { bubbles: true }));
        },
      };
      if (widget) return widget.update(options);
      loading ??= import('/studio-ui/control-widget.js')
        .then((module) => {
          if (!disposed) widget = module.mountControlWidget(host, options);
        })
        .catch(() => {
          loading = null;
          host.textContent =
            'Control Plane indisponible : rechargez pour réessayer. Aucun verdict positif n’est déduit.';
        });
    },
    dispose() {
      disposed = true;
      widget?.dispose();
      if (tabs && originalParent) originalParent.insertBefore(tabs, originalNext);
    },
  };
}
