import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { browserProtocol, readBrowserScenarios } from './browser-scenarios.mjs';
import {
  assertBrowserSnapshot,
  copyBrowserSnapshot,
  browserEnvironment,
  createBrowserRuntime,
} from './browser-runtime.mjs';
import { executeBrowserStep } from './browser-steps.mjs';

const limits = [
  'Assertions du manifeste uniquement ; leurs liens aux critères sont déclaratifs, sans validation de leur pertinence ni de leur exhaustivité.',
  'Données synthétiques isolées ; aucun profil utilisateur ni service externe. Le filtrage applicatif ne constitue pas une isolation réseau du système.',
  'Un succès ne prouve ni tous les parcours, ni tous les navigateurs, ni la sécurité du candidat.',
];
const boundedClose = async (close) => {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve()
        .then(close)
        .then(() => true),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(false), 3000);
      }),
    ]);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

async function recordedStep(step, stepIndex, scenario, runtime, nonce, execution, record) {
  const assertion = step.action.startsWith('expect')
    ? { step: stepIndex + 1, action: step.action, status: 'running' }
    : null;
  if (assertion) record.assertions.push(assertion);
  try {
    await executeBrowserStep(step, runtime, nonce, execution);
    if (runtime.violations.size) throw new Error('Politique de recette en échec.');
    if (assertion) assertion.status = 'passed';
    record.executedSteps++;
    return null;
  } catch {
    record.status = execution.signal.aborted ? 'blocked' : 'failed';
    if (assertion) assertion.status = record.status;
    return {
      status: record.status,
      findings: [
        {
          target: `${scenario.id}:step-${stepIndex + 1}`,
          message: `Étape ${step.action} non satisfaite. Les valeurs privées et diagnostics bruts du navigateur sont masqués.`,
        },
        ...[...runtime.violations].map((message) => ({ target: scenario.id, message })),
      ],
    };
  }
}

async function scenarios(manifest, runtime, execution, report) {
  for (const [index, scenario] of manifest.scenarios.entries()) {
    execution.guard();
    const record = report[index];
    record.status = 'running';
    const nonce = randomUUID();
    await runtime.fresh();
    for (const [stepIndex, step] of scenario.steps.entries()) {
      execution.guard();
      const failure = await recordedStep(
        step,
        stepIndex,
        scenario,
        runtime,
        nonce,
        execution,
        record,
      );
      if (failure) return failure;
    }
    record.status = 'passed';
    await runtime.stop();
  }
  return { status: 'passed', findings: [] };
}

function failureMessage(aborted, phase) {
  if (aborted) return 'Contrôle interrompu ou délai dépassé ; aucune réussite enregistrée.';
  if (phase === 'driver')
    return 'Pilote playwright-core 1.63.0 indisponible ; aucune installation automatique.';
  if (phase === 'launch')
    return 'Navigateur sélectionné indisponible ou lancement refusé ; aucun téléchargement automatique.';
  return 'Contrôle navigateur indisponible ou sources modifiées ; aucune réussite enregistrée.';
}

/** Internal dependency seam for controlled harness tests; public entry always loads the pinned driver. */
export async function runBrowserVerification(snapshot, options, loadDriver) {
  const { channel, signal, timeoutMs = 60000 } = options;
  const metadata = {
    protocol: browserProtocol,
    driverVersion: null,
    browserVersion: null,
    channel,
    scenarios: [],
  };
  const result = (status, observed, findings = []) => ({
    status,
    observed,
    findings,
    limits,
    browser: metadata,
  });
  if (
    !['chrome', 'msedge'].includes(channel) ||
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 60000
  )
    return result(
      'blocked',
      'Choisissez Chrome ou Edge installé ; délai requis entre 1 et 60 000 ms.',
    );
  let manifest;
  try {
    manifest = readBrowserScenarios(snapshot);
  } catch (error) {
    return result('blocked', error.message);
  }
  try {
    assertBrowserSnapshot(snapshot);
  } catch {
    return result('blocked', 'Sources du candidat indisponibles ou modifiées.');
  }
  metadata.manifestFingerprint = manifest.manifestFingerprint;
  metadata.sourceFingerprint = snapshot.fingerprint;
  metadata.scenarios = manifest.scenarios.map(({ id, title, criterionIds }) => ({
    id,
    title,
    criterionIds,
    status: 'not-run',
    executedSteps: 0,
    assertions: [],
  }));
  const controller = new AbortController();
  const deadline = Date.now() + timeoutMs;
  const remaining = () => Math.max(1, deadline - Date.now());
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const timer = setTimeout(abort, timeoutMs);
  const guard = () => {
    if (controller.signal.aborted || Date.now() >= deadline) {
      abort();
      throw new Error('Contrôle interrompu ou délai dépassé.');
    }
  };
  let directory,
    browser,
    runtime,
    phase = 'prepare';
  const work = async () => {
    guard();
    directory = copyBrowserSnapshot(snapshot);
    phase = 'driver';
    const driver = await loadDriver();
    guard();
    metadata.driverVersion = driver.version;
    phase = 'launch';
    browser = await driver.chromium.launch({
      channel,
      headless: true,
      chromiumSandbox: true,
      env: browserEnvironment(directory),
      timeout: remaining(),
    });
    if (controller.signal.aborted) {
      await browser.close();
      guard();
    }
    metadata.browserVersion = browser.version();
    guard();
    phase = 'execute';
    runtime = createBrowserRuntime({ directory, snapshot, browser, remaining, guard });
    try {
      const outcome = await scenarios(
        manifest,
        runtime,
        { remaining, guard, signal: controller.signal },
        metadata.scenarios,
      );
      guard();
      assertBrowserSnapshot(snapshot);
      return result(
        outcome.status,
        outcome.status === 'passed'
          ? `${manifest.scenarios.length} scénario(s) exécuté(s), assertions satisfaites dans le navigateur local.`
          : 'Le parcours déclaré ne satisfait pas toutes les assertions ou contraintes de recette.',
        outcome.findings,
      );
    } finally {
      await runtime.stop();
    }
  };
  let abortListener;
  const interrupted = new Promise((_, reject) => {
    abortListener = () => reject(new Error('Contrôle interrompu ou délai dépassé.'));
    controller.signal.addEventListener('abort', abortListener, { once: true });
    if (controller.signal.aborted) abortListener();
  });
  let outcome;
  try {
    outcome = await Promise.race([work(), interrupted]);
    guard();
    return outcome;
  } catch {
    const observed = failureMessage(controller.signal.aborted, phase);
    for (const record of metadata.scenarios.filter((item) => item.status === 'running')) {
      record.status = 'blocked';
      record.assertions
        .filter((item) => item.status === 'running')
        .forEach((item) => {
          item.status = 'blocked';
        });
    }
    return result('blocked', observed);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
    controller.signal.removeEventListener('abort', abortListener);
    const runtimeClosed = await boundedClose(async () => {
      await runtime?.stop();
    });
    const browserClosed = await boundedClose(async () => {
      await browser?.close();
    });
    if (outcome?.status === 'passed' && (!runtimeClosed || !browserClosed)) {
      outcome.status = 'blocked';
      outcome.observed =
        'Fermeture du runtime ou navigateur non confirmée ; aucune réussite enregistrée.';
    }
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  }
}
