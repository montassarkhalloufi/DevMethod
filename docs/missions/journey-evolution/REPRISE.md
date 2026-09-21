# Journey evolution checkpoint — 2026-09-16

Start with this record, [mission scope](PLAN.md), [corrected capability/research matrix](../../research/journey-audit-2026-09-16.md) and current Git/PR state. This is a dated handoff; it does not authorize a new campaign, merge, publication or deployment.

## Candidate and delivery

Code candidate `3d500abb9a56acc742fed15ce5743e19ec8cb195`, tree `eec4905e7e3dac17a984834145b8b8467566af04`; the following documentation-only commit contains this record. Branch `codex/journey-evidence-evolution`, based on PR #33 `440db4322167102546cd974004462fb4dab743a5`. The clean initial worktree was updated from an older detached commit. Other worktrees and the original experiment branch were preserved.

Delivery is a linked draft PR against `experiment/application-evidence-lab`, keeping this observed repair/evaluation separate from the original lab experiment. Resolve its actual URL/head/CI with `gh pr view codex/journey-evidence-evolution --json url,headRefOid,statusCheckRollup`. The PR owns current remote checks and the final archive digest; this checkpoint never promotes old CI to a new head. No npm version bump or publication is part of the delivery.

Native worker integration: local `fe2d963` → `8aab2a6` preserves the executed driver; `efba6a0` → `e2c693c` and `184da56` → `3d500ab` preserve the corrected native implementation blobs. Parent context changes Git trees/commit IDs, not those source bytes. Historical runtime/application evidence under `evaluation/evidence-holdout`, `evaluation/evidence-lab`, `evaluation/evidence-runs`, and `src/`/`dist/` is byte-identical to PR #33.

## Delivered decisions and observations

| Track | Decision / outcome | Evidence and limits |
| --- | --- | --- |
| Existing method | Retain the complete procedures. No duplicate rule or mandatory new stage added | [Matrix](../../research/journey-audit-2026-09-16.md) distinguishes written instruction, code, behavior, quality and measured benefit |
| Known restart miss | Retain real process checks; prefer ordinary independent execution for this case | [Comparison](../../../evaluation/evidence-restart/README.md): all three known faults detected, healthy accepted in both arms; 4 vs 16 checker invocations. No new generalization or author-effort benefit |
| Generic transition engine | Simplified to composition of existing assertions/adjudicator | No new general framework or semantic completion certificate |
| Browser recovery | Fixed silently reset quantity and stale error notice; unavailable quantity remains explicit until changed | [Browser record](BROWSER.md), screenshots and red→green regressions. Reload, real server restart, cancellation and keyboard exercised; no user-preference or full accessibility claim |
| Native feasibility | One of six slots attempted; timeout at 120.009s stopped all later calls | [Native record](../../../evaluation/journey-native/README.md): A product passed four criteria in 27 real processes, handoff incomplete; B/C and maintenance not run. Total tokens/dollars unknown; exact historical Node runtime unpinned |
| Pilot reliability | Corrected continuity acceptance, witness preservation, unresolved-slot reporting, unknown usage and future runtime pins | [Independent reviews](REVIEW.md). Local regressions pass; no new native execution validates the corrected future paths |
| Context simplification / general superiority | Indeterminate; no expansion justified by this pilot | No external users, current native Spec Kit/BMAD comparison, model replication or image-design quality comparison |

## Executed gates and artifact boundaries

Node 24.18.0/macOS: final `npm test` **287/287**, zero failures/skips; ESLint, Prettier, documentation links and regenerated-build consistency pass. Cognitive complexity maximum 15, zero over the project threshold; this is a static review heuristic.

The unchanged existing greenfield suites passed **26/26**, and volunteer application tests **11/11**. The complete application evidence demonstration passed after the UI repair. Those application files were unchanged by the later native-driver commits, so their independent results were retained. Frozen selection/holdout fixtures were not repaired or rewritten.

The actual npm archive is created and extracted. The package smoke now additionally executes the composed restart checker both ordinarily and through the packaged runtime against healthy and lost-restart cases, alongside the complete demonstration, three host layouts, subset/customization preservation and prior behavior. An initial packed documentation check found two links into excluded `src/`; these were corrected to the inspected GitHub commit. [Failure retained](evidence/package-links-red.log). Archive bytes change with packaged documentation; use the final digest and exact head recorded in the PR, not an earlier local archive.

[Browser input hashes](evidence/browser-inputs.json) bind observed source/captures. Private gate logs are `/tmp/devmethod-final-*.log` and `/tmp/devmethod-journey-*.log`; they may be temporary. Public reports, hashes and retained failure traces provide the portable scope. Screenshots are real JPEG captures from the browser API. The temporary browser tabs were closed and the local test server stopped.

The native campaign remains locally at `/private/tmp/devmethod-native-campaign-20260916`; its immutable ledger, raw JSONL/stderr and full snapshot were not reset. Public sanitized excerpts and fictional artifacts are under `evaluation/journey-native/`. A post-stop process inspection found no known campaign processes; remote cancellation/final billing was not proven.

## Exact next action

Review the linked PR at its current head and inspect its platform jobs; do not merge or publish under this handoff. If changes are requested, repeat only affected checks plus repository gates. The experiment's direction is **ordinary strong checks first; optional lab only when its additional lifecycle evidence earns its cost**.

Do not resume the stopped native runner or substitute a fresh directory to evade its stop. Any new native series first needs reconciliation of the interrupted slot/unknown consumption, a scoped budget/authorization decision and a newly frozen protocol accounting for runtime and handoff time. Keep the interrupted result in its original denominator. Broader product/design preference and user-benefit claims require external evidence not supplied by an agent simulation.
