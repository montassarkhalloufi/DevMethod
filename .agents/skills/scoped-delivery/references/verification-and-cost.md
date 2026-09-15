# Verification and cost

## Verify at the level of risk

- Documentation only: accuracy, diff, and links; no application build or remote CI without need.
- Pure logic: invariants, bounds, and errors in unit tests.
- Data access: constraint, transaction, and concurrency in integration tests.
- External contract: schema, mapping, error, version, and idempotency.
- UI: accessible behavior, real rendering, and approved reference.
- Framework/SSR/auth boundary: integration/browser, not mocks alone.
- Payment/entitlement/quota: server sources, duplicates, cross-access, and atomicity.
- Migration/release: compatibility, restore or forward-fix, and post-change verification.

Before substantial implementation, connect each required outcome to a check that could expose its failure. At closure, inspect this mapping again: a green suite can leave a required journey untested, and a content hash establishes unchanged bytes, not truth or complete coverage. Treat uncovered required behavior as unverified; preserve failures and explain any accepted scope change rather than silently weakening a criterion. Keep this mapping inline for Quick work.

Use project gates even when stricter. Do not invent an unavailable command; report the command actually run and its outcome. An unrun check remains unrun.

## Bounded review

Connect every finding to a location, observable consequence, scenario, and correction. Distinguish bug, demonstrated risk, and preference. Do not request multiple identical opinions to create an appearance of certainty. If independent review is required but impossible, report it rather than simulating it.

Use [the review workflow](review-workflow.md) as the owner of data-flow, failure-scenario, compatibility and finding-classification guidance. Choose relevant probes; do not turn every small change into an exhaustive audit.

Evaluate complete diff, boundaries, behavior, security, and tests at the stated commit. Re-examine touched areas after corrections, and the whole only when impact warrants it.

## Operational cost

Work locally before pushing when the environment allows it. Read failure logs before rerunning. Cloud agents and remote CI consume resources, even with a worktree.

Preserve stricter accepted project policies, especially CI budgets and review of a frozen commit. Precise caps remain in the local profile; do not impose manual CI or its disablement on other projects.

Do not run matrices, container builds, Terraform, or heavy stateful tests for a no-impact touch-up. Never remove a required gate to lower cost. Respect authorization for paid calls and visible consumption limits.

For long or repeated work, use the existing time, attempt and consumption limits. Report usage only when the host supplies it; label estimates and unknowns. A threshold checked between calls can overshoot during a call and is not a hard cap. These instructions do not enforce runtime limits. Read relevant log excerpts and store bulky output by reference; expand them when the failure requires it rather than repeatedly loading the entire history.
