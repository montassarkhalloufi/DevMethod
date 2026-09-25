import { randomUUID } from 'node:crypto';
import { buildRiskContext } from './risk-context.mjs';
import { acceptRiskOutput, riskPrompt } from './risk-model.mjs';
import { riskChecks } from './risk-profile.mjs';
import { evidenceNode } from './control-sources.mjs';
import { qualityCatalog } from './quality-catalog.mjs';
import { digest } from './files.mjs';
import { qualityAdapters } from './quality-adapters.mjs';

const reject = (message) => {
  throw Object.assign(new Error(message), { status: 409 });
};

export function createRiskService({ store, agent }) {
  const pending = new Map();

  function read(revisionId) {
    const context = buildRiskContext(store, revisionId);
    const analysis = store
      .read()
      .controlPlane?.analyses?.find((run) => run.contextKey === context.contextKey);
    const runner = agent?.(),
      status = runner?.status();
    const checks = [
      ...new Set([
        ...context.profile.checks,
        ...(analysis?.output?.findings ?? []).flatMap((finding) => riskChecks[finding.category]),
      ]),
    ];
    return {
      context,
      report: {
        contextKey: context.contextKey,
        revisionId,
        baseRevisionId: context.baseRevisionId,
        ...context.profile,
        checks,
        limits: [...context.limits, ...context.profile.limits],
        changedFiles: context.changedFiles,
        ...(analysis ? { analysis } : {}),
        available: Boolean(status?.automatic && !status.running && !analysis),
        availability: status
          ? status.message
          : 'Analyse IA indisponible : démarrer Studio avec son runner Codex local configuré.',
      },
    };
  }

  function finish(id, result, context) {
    store.commit(store.read().version, (draft) => {
      const run = draft.controlPlane.analyses.find((entry) => entry.id === id);
      if (run.status !== 'running') return;
      run.finishedAt = new Date().toISOString();
      run.usage = result.usage ?? null;
      run.status = 'failed';
      try {
        if (!result.ok) throw new Error('Analyse échouée ou interrompue ; aucun constat appliqué.');
        if (!result.usage)
          throw new Error(
            'Consommation inconnue ; résultat non appliqué et nouveaux appels suspendus.',
          );
        run.output = acceptRiskOutput(result.result, context);
        run.status = 'completed';
      } catch (error) {
        run.error = error.message;
      }
    });
  }

  function start(input) {
    const { context, report } = read(input.revisionId);
    if (input.contextKey !== context.contextKey)
      reject('Le contexte a changé ; rechargez avant d’analyser.');
    if (report.analysis) return;
    if (store.read().controlPlane?.analyses?.some((run) => run.status === 'running'))
      reject('Une analyse est déjà en cours.');
    if (!report.available) reject(report.availability);
    if (
      qualityAdapters.secrets({ sources: [{ path: 'contexte', content: JSON.stringify(context) }] })
        .findings.length
    )
      reject(
        'Un marqueur sensible est présent dans le contexte ; corriger avant transmission au modèle.',
      );
    const id = `risk-${randomUUID()}`,
      runner = agent();
    store.commit(store.read().version, (draft) => {
      draft.controlPlane.analyses ??= [];
      draft.controlPlane.analyses.push({
        id,
        contextKey: context.contextKey,
        revisionId: context.revisionId,
        status: 'running',
        startedAt: new Date().toISOString(),
        provider: 'Codex CLI · modèle par défaut · hybrid-risk-1 · lecture seule',
      });
    });
    let execution;
    try {
      execution = runner.inspect({ id, prompt: riskPrompt(context) });
    } catch {
      finish(id, { ok: false, usage: null }, context);
      return;
    }
    const completion = execution
      .then((result) => finish(id, result, context))
      .catch(() => {
        finish(id, { ok: false, usage: null }, context);
      })
      .finally(() => pending.delete(id));
    pending.set(id, completion);
  }

  return {
    read,
    start,
    cancel(id) {
      const run = store.read().controlPlane?.analyses?.find((entry) => entry.id === id);
      if (!run) reject('Analyse inconnue.');
      if (run.status !== 'running') return;
      agent()?.cancelInspection(id);
      store.commit(store.read().version, (draft) => {
        const current = draft.controlPlane.analyses.find((entry) => entry.id === id);
        current.status = 'cancelled';
        current.finishedAt = new Date().toISOString();
        current.error =
          'Annulée localement ; la consommation reste suivie par le budget du runner.';
      });
    },
    async close() {
      await Promise.allSettled([...pending.values()]);
    },
  };
}

export function applyRiskProfile(input, report) {
  const context = Object.fromEntries(
    ['projectId', 'missionId', 'actionId', 'revisionId', 'at'].map((key) => [key, input[key]]),
  );
  const findings = [...report.findings, ...(report.analysis?.output?.findings ?? [])];
  const checks = [...new Set(findings.flatMap((finding) => riskChecks[finding.category]))];
  input.riskRequirements = {};
  for (const id of checks) {
    const scenarios = findings
      .filter((finding) => riskChecks[finding.category].includes(id))
      .map(
        (finding) =>
          `${finding.path}:${finding.line} (${finding.side}) · ${finding.scenario ?? finding.reason}`,
      );
    const requirement = {
      fingerprint: digest(JSON.stringify([report.contextKey, id, scenarios])),
      scenarios,
    };
    input.riskRequirements[id] = requirement;
    input.dependencies[`risk:${id}`] = requirement.fingerprint;
    const existing = input.nodes.find((node) => node.checkId === id);
    if (existing) {
      existing.required = true;
      existing.dependencies[`risk:${id}`] ??= 'unbound';
    } else
      input.nodes.push(
        evidenceNode(context, {
          id: `hybrid-required:${id}`,
          kind: 'check',
          label: qualityCatalog.find((entry) => entry.id === id)?.title ?? id,
          status: 'missing',
          required: true,
          checkId: id,
          canRun: false,
          dependencyScope: 'revision',
          source: 'Exigence de la politique hybride v2',
          explanation:
            'Vérification ciblée requise par le contenu modifié ; aucune exécution observée.',
          link: { panel: 'checks', checkId: id, revisionId: report.revisionId },
        }),
      );
  }
  findings.forEach((finding, index) =>
    input.nodes.push(
      evidenceNode(context, {
        id: `hybrid-finding:${report.contextKey}:${index}`,
        kind: 'analysis',
        label: finding.reason.slice(0, 100),
        status: 'inferred',
        dependencyScope: 'revision',
        source:
          index < report.findings.length
            ? 'Profil syntaxique du changement'
            : 'Hypothèse contextuelle IA',
        explanation: `${finding.path}:${finding.line} (${finding.side}) · ${finding.scenario ?? finding.reason}`,
        limits: [finding.uncertainty ?? 'Signal syntaxique ; ne démontre pas un défaut.'],
        link: {
          panel: 'code',
          path: finding.path,
          revisionId:
            (finding.side === 'before' ? report.baseRevisionId : report.revisionId) ?? undefined,
        },
      }),
    ),
  );
  if (findings.some((finding) => finding.category === 'permissions'))
    input.signals.push({
      id: 'hybrid-permissions',
      level: 'high',
      category: 'permissions',
      humanResolvable: true,
      reason:
        'Modification possible des conditions d’accès : examiner la décision et vérifier les autorisations côté serveur.',
      evidenceIds: findings.flatMap((finding, index) =>
        finding.category === 'permissions' ? [`hybrid-finding:${report.contextKey}:${index}`] : [],
      ),
    });
  const coverageLimits = [...report.limits, ...(report.analysis?.output?.limits ?? [])];
  const narrowPresentation =
    report.categories.length === 1 && report.categories[0] === 'visual' && !coverageLimits.length;
  const complete = report.analysis?.status === 'completed';
  if (coverageLimits.length || (!narrowPresentation && report.changedFiles.length && !complete))
    input.signals.push({
      id: 'hybrid-coverage',
      level: 'medium',
      category: 'uncertainty',
      humanResolvable: false,
      evidenceIds: [],
      reason: coverageLimits.length
        ? 'Couverture du changement incomplète : consulter les limites de l’analyse.'
        : 'Analyse contextuelle du changement à compléter ; aucun accord humain ne remplace cette analyse.',
    });
  input.dependencies['hybrid-context'] = report.contextKey;
  input.policyId = 'control-plane-v2';
}
