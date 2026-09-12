# Authorized milestone checkpoint

Baseline: `ce11461252f6a3b8e14f7af021c362e5d4742915`, matching main after merged PR #1. The starting checkout was clean. PR #1 introduced diagnostics and workflow guidance; ADR 001 is accepted and ADR 002 remains labeled proposed. New ADRs are proposals, not inferred maintainer acceptance. This campaign does not merge main or publish npm.

| Milestone | Delivered slice | Remaining gate |
|---|---|---|
| M1 native fixtures/evidence | [PR #2](https://github.com/montassarkhalloufi/DevMethod/pull/2): pinned B1/B3/B4/B5, objective collection and protected checks | B2 pinned React source/approved screen; actual authenticated host runs covering all fourteen stages; no synthetic substitute |
| M2 provenance/update preview | [PR #3](https://github.com/montassarkhalloufi/DevMethod/pull/3): compatible manifests, offline read-only candidate comparison | Maintainer review; exact-candidate platform checks before cross-platform claims |
| M3 checkpoint resumption | [PR #5](https://github.com/montassarkhalloufi/DevMethod/pull/5): optional JSON evidence DAG and read-only resume CLI, manual Markdown retained | Maintainer review and actual native resumption evidence; depends on M2's shared CLI branch |
| M4 matched comparisons | [PR #4](https://github.com/montassarkhalloufi/DevMethod/pull/4): matched-condition/budget validator and per-arm denominators; depends on PR #2 | Explicit evaluation budget, pinned installed BMAD, authenticated host, actual runs and independent evidence review |
| M5 bounded orchestration | Prerequisites and stop conditions recorded below | Blocked by native evidence and supported host dispatch/recovery contract; no scheduler or automatic dispatch implemented |

Implementation tests are evidence for these local utilities only. They do not establish native instruction adherence, comparative results or orchestration readiness. Local environment/authentication observations are retained separately and excluded from public commits. No repeated model evaluation batch has been executed in this campaign.

## Verification and ownership

Implementation used separate worktrees with non-overlapping worker ownership. One owner controls manifest and CLI changes. Completed revisions received a separate read-only review. Review found an enum coercion bug in checkpoint validation; actual string checks and array regressions corrected it. Changes to a reviewed surface invalidate that surface's earlier review until rechecked.

Required checks: `npm ci`, `npm test`, `npm pack --dry-run` and diff inspection. Packaging may use a disposable `--cache` path without changing the user's shared cache. Generated `dist/` remains committed. Each implementation PR records its exact checks and limits. Packed CLI checks are separate from authenticated model behavior. Native platform CI for PR #3 passed all three OS jobs in [run 34726451896](https://github.com/montassarkhalloufi/DevMethod/actions/runs/34726451896). Fixture CI initially failed on Windows because checkout converted pinned bytes to CRLF; commit `4e6be74` enforces LF for fixture paths without relaxing hashes. Check the latest PR jobs before claiming that correction passed on Windows.

## Native budget gate

Before running or retrying model evaluations, record the user's explicit maximum run count, combined input/output tokens and total USD. Also pin model, per-run limits and timeout, enforceable host limits, method commit, fixture and prompt. A missing approval or unenforceable cap blocks dispatch. Unknown usage is not zero; it blocks further runs under a hard cap. Authentication/version probes and fixture tests are not model evaluations. Resolve the pending budget question before continuing this gate.

## Orchestration gate and authorized boundary

Do not activate worker dispatch until actual native evidence confirms discovery, bounded edits, failure reporting, local-only integration and fresh-session resumption for the selected pinned host. Confirm provenance/update preservation, evidence invalidation, matched-case outcomes and a supported dispatch/cancellation contract. Reviewer approval of the actual evidence is required; a nonempty evidence filename or a test fixture is insufficient.

After those prerequisites pass, the authorized slice is at most two concurrent implementation workers on isolated worktrees and non-overlapping file ownership. One supervising owner retains shared contracts and integration order. Each task must have a fixed scope, dependency list, acceptance checks, budget allocation, timeout, cancellation rule and checkpoint path. A failed prerequisite, conflicting write, stale evidence, unavailable usage, exhausted budget, host failure or missing authorization stops affected dispatch. Keep independent work bounded by the existing authorization. Review a frozen commit read-only; corrections invalidate affected checks. On completion record scope exhausted; do not discover or dispatch further backlog. Merges, releases and new spending remain outside this campaign.

This gate documents the blocked scope; it is not an implemented host scheduler. Do not weaken it to claim M5 complete.

## Resume

Read this checkpoint, the PR diffs, CONTRIBUTING, current ADR statuses and actual git state. Preserve all branches and project customizations. Combine only the reviewed candidate branches in an isolated local branch for joint verification; do not merge main. If source or contracts changed, invalidate affected evidence before rerunning relevant checks. Resolve native budget/host prerequisites, pin BMAD and supply B2's design source before dependent runs. Retain failures and unavailable environments in denominators.

Recommended next command: `$project-foundation correct-course DEVMETHOD-NATIVE` to resolve the budget and native prerequisites within this same scope. Do not start another backlog item.
