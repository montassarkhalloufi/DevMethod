# Evidence lab: resumable research and delivery checkpoint

Date: 2026-09-15. Baseline `main`: `6f31552ac3f68c70ee1caa7b4bffb1181341a336`, PR #32 confirmed merged. No other open PR was returned when this mission began. Work is isolated on `experiment/application-evidence-lab`; the earlier `improve/application-checks-and-adoption` branch was not present in this workspace and was not reused.

The candidate is the commit containing this checkpoint and its follow-up review corrections. The draft PR identifies the exact reviewed commit/tree and final gates. Run `git log -1 --format='%H %T'` and `git status --short` before resuming; do not infer that an old local result describes a newer checkout.

## Outcome and evidence map

| Problem | Decision and implemented boundary | Verification and remaining limit |
| --- | --- | --- |
| Strong current alternatives | Capability-based primary-source survey, nine comparator rows; no uniqueness claim | [Landscape](research/evidence-landscape-2026-09-15.md); rolling docs and untried products labelled |
| Architecture choice | Three designs; optional evidence challenge layer selected over mandatory generic control | [ADR 013](ADR-013-application-evidence-lab.md); product-search preference trial still absent |
| Self-confirming checks | Healthy and known-fault qualification before candidate checks | [Fixed comparison](../evaluation/evidence-lab/README.md); 6/20→2/20 false acceptances, 6/10 healthy withheld; strong simple checks match seeded correctness |
| Real application checks | Explicit external Node adapters, exact criterion verdicts, execution permits, finite budgets | Runtime tests and complete CLI demonstration; trusted local code, no universal interception |
| Evidence freshness | Bind declared inputs, checker, contract and engine; invalidate after change | New-process status and requirement/code-change demonstration; undeclared dependencies remain outside claim |
| Correction and recovery | Journal before effects, atomic writes/locks, stable failures, finite attempts/no-progress, sticky stops | Crash/lock/timeout and repeated-failure tests; local named-session scope only |
| New session / multiple agents | Preserve session history; never automatically substitute another session after halt | Cooperating processes on the same session serialize. Another session path can create separate history: host must retain the canonical path and reconcile external effects |
| Complete product journey | Volunteer UI/API, durable reservations, cancellation and restart; new-event default capacity change preserves old event data | Real HTTP and DOM event tests, independent evaluator and script; no production/multi-process storage claim |
| Visual quality | Responsive source design and semantic DOM checks | Cloud Browser URL policy blocked local navigation; real browser layout/assistive-tech/CSP validation remains unavailable |
| Post-design cases | Independently authored queue population, unchanged semantics across reporting-protocol correction | [Frozen V1](../evaluation/evidence-holdout/PROTOCOL.md), [V2 correction](../evaluation/evidence-holdout/PROTOCOL-V2.md); retain misses and initial blocked runs |
| Native agent gain | Reuse existing host/evaluation tooling with a three-arm baseline | [Admission protocol](research/evidence-native-protocol.md); executable/model/accounting access missing, zero new native trials |
| Adoption and human comprehension | Working offline guide, no telemetry or contacts | [First use](EVIDENCE-LAB.md); no external user study or observed adoption claim |

## Reproduce locally

```sh
npm ci
npm run lint
npm run format:check
npm test
npm run test:greenfield
npm run test:evidence-demo
node scripts/evidence-holdout.mjs
npm run check:docs
npm pack --dry-run
```

The selection experiment can be reproduced with `node evaluation/evidence-lab/selection.mjs`; it rewrites its results file, so preserve the committed original first. `node scripts/evidence-holdout.mjs v1` intentionally reproduces the historical reporting incompatibility. V2 changes only exit reporting; it does not strengthen the partial checker to hide its restart miss.

Each demonstration invocation creates a distinct disposable experiment workspace and preserves it. This is development evaluation of a new candidate, not permission to replace a stopped application session. The two initial integration failures are retained: exit-code semantics mismatch, then an unjustified restriction against correlated faults. Both led to red→green regressions. The application also had an observed old-event capacity regression, corrected before its commit.

## Local verification at delivery

264 root tests, 26 existing greenfield tests and 11 volunteer application tests passed on Node 24.19.0/Linux, with no skipped tests. The root suite includes 47 runtime regressions and two DOM-to-HTTP product journeys. Lint and formatting passed; cognitive complexity maximum is 15 across 133 maintained files. The [retained integrated reports](../evaluation/evidence-runs/README.md) include the complete 16-observation demo and the post-design false support. Final package and review status are bound to the exact candidate in the draft PR.

## Resume decisions

1. Inspect the draft PR's current tree and review notes. Do not merge, publish npm or deploy without fresh explicit authorization.
2. Treat the lab as experimental and optional. Keep existing skills/guard contracts unchanged unless a separately evidenced change justifies migration.
3. Finish native/browser/external-user validation only when the corresponding capability is actually available. Do not fill missing slots with fixtures or worker reports.
4. Compare against good independent tests plus Git before adding selective invalidation, more agents, a scheduler or mandatory workflow stages. The measured benefit is scoped discrimination and evidence handling, not demonstrated end-to-end product superiority.

No merge, npm publication, deployment, purchase, new paid service, contact or telemetry is included in this delivery.
