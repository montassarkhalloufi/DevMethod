# Mission-driven release candidate

Baseline inspected: `18d65c7e3b1c772eef69fb24a04eae9313a3f418`, clean checkout. GitHub API on 2026-09-13 confirms PRs #1–#5 merged. Do not reapply them. npm registry still serves `devmethod-ai@0.1.0-rc.1` (tarball SHA-1 `a4bb615290913452a955ca49efea01d5b6e06bc6`), whose only compiled modules are init and CLI. The source baseline's 44 tests passed locally. Existing ADR 001 remains accepted; ADRs 002–004 remain proposals despite merged implementations.

| Capability | Observed state / evidence | Gap | Action |
|---|---|---|---|
| Installation and preservation | Six hosts-profiled modules; installer tests | Candidate not published | Preserve contract, test packed candidate |
| Diagnostics and upgrades | PRs #1/#3 merged, tested read-only preview | Conflict not a distinct category | Add explicit conflict classification |
| Mission/context | Sizing and prose templates | No bounded source selection/provenance inspection | M1 structured optional records and read-only CLI |
| Evidence/resumption | PR #5 pins sources and evidence DAG | No Git comparison or blocked evidence | M1 backwards-compatible extensions |
| Stack adoption | React skill guidance | No runnable Next/Nest/data example | M2 profiles and fictional vertical fixture |
| Evaluation | B1/B3/B4/B5 collectors and matched validator | Native runs/budget and B2 absent | M2 fixture; M4 report actual availability and pending protocols |
| Orchestration | Gate documented | No generic planner | M3 bounded read-only planner; native dispatch remains gated |
| Public adoption | README/roadmap lag merged code | Commands, release scope and examples inconsistent | M4 candidate docs, clean package checks, review and draft PRs |

## Milestones and acceptance

1. **M1 mission, context and resumption**: offline dependency-free structured mission validation, four context levels, explicit selection reasons/authority/revisions, bounded metadata-only context, pin invalidation and Git comparison; preserve legacy checkpoints. Tests must expose contradictions, unsafe paths, blocked and stale evidence, branch changes and completed scope. One owner controls shared CLI/schema and root lockfile.
2. **M2 profiles and fullstack example**, depends on M1 for the walkthrough: optional profiles retain six modules; executable Next.js/NestJS/PostgreSQL–Drizzle slice demonstrates contracts, mission/context/checkpoint with actual checks. Separate implementation worktree owns fixture and profiles. External services and native runs are never simulated as passing.
3. **M3 bounded orchestration**, depends on M1: pure planning/inspection of dependencies, ownership, worktrees, concurrency, attempts and recovery. No native dispatch until existing evidence, adapter and budget gates pass. Sequential fallback is mandatory.
4. **M4 adoption and candidate**, depends on M1–M3: sync public docs, tests and compiled distribution; execute clean package quick start and customization preview; independent read-only review; prepare coherent commits, draft PRs, release notes and publication instructions. No main merge, npm publish or deployment.

Observed defects are recorded above. Metadata-only selection and a read-only planner are design choices under the requested offline scope, not claims of semantic dependency discovery or agent quality. Host version availability is not behavioral validation. Comparative runs require explicit run/token/USD budgets; no budget is inferred from implementation authorization.

## Delivered milestone checkpoint

- M1: mission/context and Git-aware compatible checkpoint inspection implemented, 56 root regressions passed, independent core review corrected and verified.
- M2: eight optional profiles and real Next/Nest/PostgreSQL fixture implemented; domain/HTTP/model, real persistence and production HTML checks passed. Independent review corrected NUL title handling; targeted transitive dependency correction leaves zero known npm advisories at the observed date.
- M3: bounded generic manual planner implemented and tested. Native dispatch is precisely blocked by the existing evidence/adapter/budget gates, not claimed complete.
- M4: clean tarball/adoption/update smoke, documentation checks, mission evidence walkthrough, release notes and stacked draft PRs prepared. BMAD 6.12.0 Codex export was actually staged without model calls. Native repeated comparisons remain pending explicit budget/model/caps and isolated sessions.

See [rc.2 validation](RC2-VALIDATION.md) for the evidence matrix, CI and resumable handoff. No main merge, npm publication or deployment was performed. ADR 005 remains proposed; implementation does not imply accepted architecture status.
