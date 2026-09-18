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

## Test relevance and order

Derive expected behavior from the accepted requirement or invariant, independently of the production algorithm. Inspect existing coverage first; add or extend a test only for a plausible failure or guarantee not already covered equivalently. Representative synthetic data is useful; invented product rules or scenarios added only to increase the test count are not. Overlap across layers is justified when it verifies another boundary, such as actual HTTP wiring or database constraints.

Assert the promised observable output, error, durable effect, authorization or invariant. Definedness, a type assertion, snapshot or mocked call count alone is insufficient when it cannot detect a violation of that requirement. Do not calculate the expected result with the same production helper. Ensure assertions execute and asynchronous work is awaited; distinguish an intended behavioral failure from an import, configuration or unavailable-dependency failure.

For an authorized correction of a reproducible defect, create or reuse the smallest relevant regression check and **require red → correction → green** when that check can run within the permitted environment. Confirm red fails for the expected reason against the starting behavior; preserve both observations. Necessary test scaffolding is allowed, but a broken harness is not red evidence. If reproduction is genuinely blocked, record the concrete cause and alternative evidence, continue independent work, and leave the affected claim unverified; do not describe retrospective testing as TDD.

For specified, testable new rules, use small red–green–refactor increments by default. For behavior-preserving refactoring with adequate tests, establish a green baseline and retain those behavior checks; do not manufacture a failure or rewrite expectations to fit new internals. For an unknown API, legacy behavior or visual direction, bound the exploration, distinguish observations from accepted requirements, then define the contract and relevant checks before hardening. Record a concrete reason for departing from the default and the alternative verification. Documentation, formatting and static-layout changes use proportionate accuracy/rendering checks instead of artificial unit tests.

Choose the cheapest layer that can expose the actual risk: pure-rule unit checks, real adapter/database integration, end-to-end or browser interaction, controlled concurrent operations, persistence across restart, or representative load. Mocks do not establish the mocked system's transaction, provider or failure semantics. A load claim requires its workload, duration, environment and measured result; a local simulation establishes only its stated scope. A relevant negative example or targeted mutation may challenge a high-risk assertion when it adds information; it is unnecessary when genuine red evidence already establishes that sensitivity. Test count and coverage do not certify business correctness.

This conditional order is an engineering policy, not a claim of universal TDD superiority. [Fucci et al.'s process study](https://arxiv.org/abs/1611.05994) distinguishes sequencing from cycle size/regularity; the [industrial TDD case study](https://research.ibm.com/publications/realizing-quality-improvement-through-test-driven-development-results-and-experiences-of-four-industrial-teams) has project-comparison limits. Neither establishes a causal benefit for DevMethod coding agents.

## Code quality and actual tools

Inspect package scripts, lockfiles and effective configuration for lint, formatter (including Prettier when selected), type-check and requested complexity checks. Distinguish an absent tool/adapter, missing configuration, unmet prerequisite, not run, running, timeout, failed and passed. An absent configuration file need not block a check whose applicable tool defaults suffice; record what actually applies. For a newly scaffolded project under delegated engineering setup, establish a small compatible set of pinned quality tools and reproducible commands. Preserve existing conventions and one formatting owner; avoid unrelated reformatting, competing tools or a whole-project migration.

Use the host's actual capabilities and existing permissions: execute the appropriate available check or complete necessary authorized setup. Otherwise identify the missing prerequisite, its owner and next action; ask only for missing authority. Preparing a request does not execute a check.

Separate a diagnostic/agent capability from an application runtime service. A discovered MCP tool, configured API or installed analyzer establishes only that state; connection and operation outcomes need their own observations. Reuse the accepted capability choice, or resolve `decision-architecture` for an open selection, without forcing a new provider. Attribute external results to the invoked tool/interface and its version, configuration/environment and source scope; unknown versions remain unknown. A connector's success flag does not replace inspection of the claimed result.

Normalize observations in the existing evidence record: inspected sources/revision, criterion and file scope, tool/version and effective configuration, command or procedure, actual status, raw output reference, and diagnostics with location and expected/observed behavior when known. Keep human/model interpretation and suggested corrections separate from the observed result. Neither a suggested fix nor acceptance of a risk converts an unrun or failed check into success. Apply [bounded correction](bounded-correction.md) to act on the result.

Assess decomposition through coherent responsibilities, explicit state/effects, inward dependencies, narrow consumer interfaces and relevant substitution contracts. Separate pure rules, use-case coordination, adapters and composition where those responsibilities exist; preserve React's view/state/server boundaries. Extract meaningful units rather than hiding complexity in empty wrappers or speculative patterns. A tidy folder tree alone does not establish Clean Architecture or SOLID compliance.

When cognitive complexity is requested or configured, use an actual compatible analyzer. Report the metric name, reported unit, analyzer/rule version and calculation method/configuration, inspected function/module scope, values and applicable project thresholds. Compare before/after only with the same method and scope; assess readability and call flow as well. If the analyzer cannot run, report **not measured** and the missing tool/access; do not substitute guessed scores, line counts or cyclomatic complexity. Respect the selected analyzer's documented semantics, such as [SonarSource's Cognitive Complexity specification](https://www.sonarsource.com/docs/CognitiveComplexity.pdf); no universal threshold follows from the citation. Fix justified violations by clarifying control flow/responsibility rather than disabling rules. Lint, formatting and complexity results do not prove correctness, concurrency safety or capacity.

## Bounded review

Connect every finding to a location, observable consequence, scenario, and correction. Distinguish bug, demonstrated risk, and preference. Do not request multiple identical opinions to create an appearance of certainty. If independent review is required but impossible, report it rather than simulating it.

Use [the review workflow](review-workflow.md) as the owner of data-flow, failure-scenario, compatibility and finding-classification guidance. Choose relevant probes; do not turn every small change into an exhaustive audit.

Evaluate complete diff, boundaries, behavior, security, and tests at the stated commit. Re-examine touched areas after corrections, and the whole only when impact warrants it.

## Operational cost

Work locally before pushing when the environment allows it. Read failure logs before rerunning. Cloud agents and remote CI consume resources, even with a worktree.

Preserve stricter accepted project policies, especially CI budgets and review of a frozen commit. Precise caps remain in the local profile; do not impose manual CI or its disablement on other projects.

Do not run matrices, container builds, Terraform, or heavy stateful tests for a no-impact touch-up. Never remove a required gate to lower cost. Respect authorization for paid calls and visible consumption limits.

For long or repeated work, use the existing time, attempt and consumption limits. Report usage only when the host supplies it; label estimates and unknowns. A threshold checked between calls can overshoot during a call and is not a hard cap. These instructions do not enforce runtime limits. Read relevant log excerpts and store bulky output by reference; expand them when the failure requires it rather than repeatedly loading the entire history.
