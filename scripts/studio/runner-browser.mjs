import { readBrowserConfiguration } from './browser-configuration.mjs';
import { readControlTools } from './control-tools.mjs';
import { revisionAdmission } from './admission.mjs';
import { contextKey } from './jobs.mjs';

const configured = (value) =>
  value.enabled === true &&
  value.automatic === true &&
  typeof value.configurationId === 'string' &&
  value.configurationId.length > 0 &&
  Number.isSafeInteger(value.version) &&
  value.version > 0 &&
  ['chrome', 'msedge'].includes(value.channel) &&
  value.driverAvailable === true &&
  value.driverVersion === '1.63.0';
const configurationKey = (value) =>
  JSON.stringify([
    value.configurationId,
    value.version,
    value.enabled,
    value.automatic,
    value.channel,
    value.driverAvailable,
    value.driverVersion,
  ]);
const terminalReceipt = (report, revisionId) => {
  const receipt = report.checks?.find((row) => row.id === 'business-browser')?.evidence;
  return receipt?.revisionId === revisionId &&
    receipt.checkId === 'business-browser' &&
    receipt.source?.kind === 'studio-adapter' &&
    !receipt.provider &&
    receipt.freshness === 'current' &&
    receipt.fingerprint === report.fingerprint &&
    Number.isFinite(Date.parse(receipt.finishedAt)) &&
    ['passed', 'failed', 'blocked'].includes(receipt.status)
    ? receipt
    : null;
};

function candidateGuard({
  store,
  completed,
  job,
  controller,
  getAgent,
  getLiveActions,
  readConfiguration,
  configuration,
}) {
  const expectedContext = contextKey(completed.state);
  const expectedConfiguration = configurationKey(configuration);
  return () => {
    const state = store.read();
    const revision = state.revisions.find((item) => item.id === completed.revision.id);
    if (
      controller.signal.aborted ||
      getAgent().usageUnknown ||
      !revision ||
      revision.jobId !== job.id ||
      !state.jobs.some((item) => item.id === job.id && item.status === 'ready') ||
      state.activeRevision !== job.baseRevision ||
      contextKey(state) !== expectedContext ||
      !revisionAdmission(state, revision).allowed
    )
      throw new Error('Candidat ou contexte indisponible pour la vérification automatique.');
    const current = readConfiguration(store);
    if (!configured(current) || configurationKey(current) !== expectedConfiguration)
      throw new Error('Autorisation locale de vérification modifiée.');
    const tools = readControlTools(store, job.id, getLiveActions?.());
    if (tools.externalOutcomeUnknown || tools.pending.length || tools.failures.length)
      throw new Error('Une action outil bloque la vérification automatique.');
  };
}

/** One newly completed candidate only. Never backfill historical jobs or grant criterion coverage. */
export async function verifyRunnerBrowser({
  store,
  completed,
  job,
  controller,
  getAgent,
  getLiveActions,
  services = {},
  onStatus,
  onMessage,
}) {
  if (!completed.revision) return;
  const readConfiguration = services.readBrowserConfiguration ?? readBrowserConfiguration;
  let configuration;
  try {
    configuration = readConfiguration(store);
  } catch {
    return;
  }
  if (!configured(configuration)) return;
  const identity = { jobId: job.id, revisionId: completed.revision.id };
  const finish = (status, receipt) =>
    onStatus({
      ...identity,
      status,
      ...(receipt ? { receiptId: receipt.id } : {}),
      finishedAt: new Date().toISOString(),
    });
  const guard = candidateGuard({
    store,
    completed,
    job,
    controller,
    getAgent,
    getLiveActions,
    readConfiguration,
    configuration,
  });
  let timer,
    started = false;
  try {
    guard();
    started = true;
    onStatus({ ...identity, status: 'running' });
    onMessage(
      'Vérification navigateur locale du candidat en cours ; aucun nouvel appel fournisseur.',
    );
    const quality =
      services.readProjectQuality && services.runProjectQuality
        ? services
        : await import('./quality.mjs');
    const read = services.readProjectQuality ?? quality.readProjectQuality;
    const run = services.runProjectQuality ?? quality.runProjectQuality;
    const report = await read(store, completed.revision.id);
    guard();
    if (report.localChanges || report.revisionId !== completed.revision.id) {
      finish('blocked');
      return;
    }
    const existing = terminalReceipt(report, completed.revision.id);
    if (existing) {
      finish(existing.status, existing);
      return;
    }
    if (
      report.localChanges ||
      report.revisionId !== completed.revision.id ||
      !report.checks?.find((row) => row.id === 'business-browser')?.canRun
    ) {
      finish('blocked');
      return;
    }
    // Configuration endpoints do not wake the runner. Revoke promptly even while
    // the executor is awaiting a browser action; always clear the observer below.
    timer = setInterval(() => {
      try {
        guard();
      } catch {
        controller.abort();
      }
    }, 150);
    timer.unref();
    guard();
    const after = await run(store, completed.revision.id, 'business-browser', {
      signal: controller.signal,
      timeoutMs: 60000,
    });
    guard();
    const receipt = terminalReceipt(after, completed.revision.id);
    finish(receipt?.status ?? 'blocked', receipt);
  } catch {
    if (started) controller.abort();
    finish('blocked');
    onMessage(
      'Vérification navigateur suspendue ou indisponible ; candidat conservé sans réussite déduite.',
    );
  } finally {
    clearInterval(timer);
  }
}
