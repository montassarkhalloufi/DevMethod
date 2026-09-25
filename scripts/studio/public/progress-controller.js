export function createProgressController({
  document,
  api,
  onOpenFile,
  loadWidget = () => import('/studio-ui/progress-widget.js'),
}) {
  const host = document.getElementById('job-progress');
  const loadProgress = (id, signal) => api.progress(id, signal);
  let latest,
    widget,
    loading,
    disposed = false;
  function render() {
    if (!disposed && latest) widget?.update(latest);
  }
  return {
    update(state) {
      if (!host || !api.progress) return;
      host.hidden = !state.jobs.length;
      const anchor = document.getElementById(
        state.jobs.some((job) => ['queued', 'running'].includes(job.status))
          ? 'responsibilities'
          : 'preserve-constraints',
      );
      if (anchor && host.nextElementSibling !== anchor && !host.contains(document.activeElement))
        anchor.before(host);
      latest = { jobs: state.jobs, revisions: state.revisions, loadProgress, onOpenFile };
      if (!state.jobs.length) return;
      loading ??= loadWidget()
        .then((module) => {
          if (disposed) return;
          widget = module.mountProgressWidget(host);
          render();
        })
        .catch(() => {
          loading = null;
          if (!disposed)
            host.textContent = 'L’avancement ne peut pas être affiché. Actualisez pour réessayer.';
        });
      render();
    },
    dispose() {
      disposed = true;
      widget?.dispose();
    },
  };
}
