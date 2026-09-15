# Implementation quality and capacity follow-up

Date: 2026-09-15. This extends the [27-workstream audit](HARDENING-0.5.md) on the user's explicit request to make DevMethod's own code an example of the method it recommends. It covers the CLI, host/evaluation tools, review UI and the three maintained applications: Pocket Tasks, Clair and the fullstack fixture. Deliberately defective and pinned historical experiments retain their bytes. No production-scale certification is claimed.

## Architecture and human responsibility

DevMethod is a local TypeScript CLI and reusable engineering guidance, with explicit records, a static review viewer and experimental host adapters. It is not a microservice platform or a general autonomous dispatcher. Dependency injection is used where an actual boundary needs replacement; pure validators and renderers need no class hierarchy. The fullstack example separates domain/application, an explicit store port, PostgreSQL infrastructure, HTTP and server/client presentation. Independent deployment, service-owned data, delivery semantics, compatibility and operational ownership must be assessed when a selected architecture actually uses services; microservices are not a capacity requirement.

Humans set goals, constraints and consequential trade-offs, retain authorization responsibility and inspect meaningful evidence. Agents execute within existing authorization, preserve uncertainty and prepare concrete outcomes. Checks and bounded loops assist this work; they cannot decide whether a business goal or test oracle is sufficient. Repeated confirmations for already authorized routine steps add no assurance. Human review should receive the decision, alternatives, evidence, uncertainty and resulting commitment.

## Demonstrated defects and corrections

| Finding | Correction | Failure-detecting evidence and limit |
|---|---|---|
| A customized 32 MiB installed file was materialized by doctor, and read again by update preview. | Stream SHA-256 through a 64 KiB buffer; reuse doctor inspection during update. | Tests reject whole-payload `readFileSync`, compare actual digest, exercise empty/short reads, error cleanup and FD closure. Memory remains proportional to other live data; I/O time remains proportional to file size. Local directories must remain quiescent, as before. |
| Init read a conflicting large file before checking its size; an oversized manifest could also be read before its bound. | Compare size before content and apply the existing 1 MiB manifest limit before reading. | Three recorded regressions were red before correction and green after. Arbitrary customization stays untouched; no stronger concurrent-filesystem transaction guarantee is inferred. |
| Fullstack POST admitted non-JSON form data contrary to its local-service contract. | Reject unsupported media with 415 before the application/store call; retain charset-bearing JSON. | Real Nest HTTP reproduction returned 201 and one write before correction; regression now verifies 415/no write for form/plain/multipart. No actual browser-origin exploitation was executed. |
| Pocket's generic 4xx branch hid Reload when a task was deleted by another client. | Expose reconciliation after 404 while keeping the input-rejection branch for other client errors. | New regression observed red then green; stale-state recovery is checked, not a multi-user load claim. |
| Existing UI tests bypassed the Add form listener; a disconnected form survived. A loose UUID assertion accepted 36 dashes. | Exercise the registered event handler and assert a real UUID structure and distinct creations. | Both targeted mutants survived the old assertions and fail the corrected tests. This is evidence for two specific test gaps, not a global mutation score. |

See the earlier [execution record](HARDENING-0.5-AUDIT.md) for partial token accounting, malformed native usage, transcript duplication, oracle completeness and timestamp/metric fixes.

## Decomposition and automated gates

The first root measurement used ESLint 10.10.0 and SonarJS 4.2.1 over 65 files, finding eight lint errors and 18 functions above the local cognitive-complexity threshold of 15. The scope grew as presentation components, type declarations, test cases and the reporting command were separated. A further example-only pass found two functions scoring 18. These scores are static heuristics, not a universal complexity law or a proof of quality.

| Responsibility | Before maximum / principal hotspot | Refactored maximum in the relevant file(s), before final formatting |
|---|---:|---:|
| Behavioral evaluator | 87 | 9 |
| Comparison validator | 37 | 7 |
| Loop history inspection | 74 | 8 |
| Planner inspection | 70 | 10 |
| Checkpoint validation and inspection | 39 / 31 | 8 |
| Closure inspection | 23 | 8 |
| Review viewer orchestration | 24 | Split DOM, summary, coverage/evidence and detail presentation; state/event wiring remains in the app |
| Pocket server / UI | 18 / long mixed render | 10 / 11 |
| Clair UI | 18 | 4 |

Validation of review records now uses section-specific predicates; its public validation entry point is nine lines, with type-only declarations in a separate file. No runtime module dependency or schema version is added by the type extraction. Host protocol parsing, usage aggregation, fixture preparation and CLI output preparation also have smaller named responsibilities. Functions have explicit visual separation, and maintained source, scripts, tests and example code use Prettier. Generated `dist` is rebuilt from source rather than manually formatted.

`npm run lint` checks the maintained scope, including TypeScript recommended rules and cognitive complexity, with zero permitted warnings. `npm run format:check` checks the declared maintained file types. Both commands are CI steps on Linux, macOS and Windows. `npm run quality:report` emits analyzer versions, scope, file count, maximum and locations of positive scores. Inspect long functions, declarative schemas and module cohesion even when this gate passes. Splitting a function solely to game its score, excessive forwarding and extra architecture layers are not acceptable substitutes for clarity.

The tool versions are exact development dependencies. Runtime consumers acquire no new npm dependencies. `npm audit` on the installed root dependency graph reported zero known advisories during this audit; that is a dated database observation, not absence of all vulnerabilities.

## Test relevance and verification strategy

For a reproducible defect with an available test boundary, the guidance requires red → correction → green. Stable business rules benefit from small test-first steps; covered refactors use green → refactor → green. An exploratory step can be appropriate when the contract itself is uncertain. [Primary TDD/quality research](HARDENING-0.5-QUALITY-SOURCES.md) does not support claiming universal superiority of every tests-first sequence.

Each test should connect a real requirement or invariant to an observable result and a plausible failing implementation. Do not require a unit test for every private helper, count duplicated scenarios as independent assurance, or use line coverage alone as a verdict. Integration and contract checks belong at real boundaries: filesystem, process, HTTP, database, rendering and external adapter protocols. The added DOM integration tests execute the generated viewer's actual event bindings and assert filters, global counts, selected detail, keyboard tabs, record-backed panels and focus. They do not prove layout, browser CSP enforcement or assistive-technology behavior.

Independent reviewers inspected separately authored changes. Differential checks covered 446 checkpoint/closure cases, 899 loop/planner cases, 96 evaluator/comparison cases and 1,603 review-model mutations, with matching results/messages in those finite sets. The fixed 155-history loop protocol retains its previous corrected output. These checks protect refactoring semantics; they do not establish semantic correctness of every input or native model effectiveness.

The available remote browser rejected access to the local review page with `ERR_BLOCKED_BY_CLIENT`. No current visual/browser validation is claimed. Additional fullstack regressions exercise a generic HTTP 500 on insert failure (a leaking-error mutant fails) and a 105-row database dataset with an independent first-100 title/UUID oracle. PostgreSQL is unavailable in the local workspace; the fullstack workflow supplies PostgreSQL 17 and must be read for the final PR head. The 36 native behavioral slots remain not-run, not zero-valued successes.

## Capacity, security and operating practices

The [capacity research and risk matrix](HARDENING-0.5-SCALE.md) maps 19 failure families to mechanisms and observable experiments. Relevant guidance now explicitly covers bounded in-flight work, pools multiplied by maximum instances and deployment surge, saturation behavior, retry amplification, cache stampedes, tenant isolation, streaming/backpressure/cancellation, access-path measurement, stable deep pagination, replay competition, telemetry cost and recovery distinctions.

Apply the broader existing guidance according to the chosen system: invariants and authoritative state; transactions/isolation and conflict handling; idempotency and ambiguous effects; outbox/inbox and delivery/ordering contracts; API compatibility and authorization; data ownership and lifecycle; migrations/backfills; threat modeling and resource abuse; secret and dependency controls; observability/SLOs; deploy/drain/rollback; backup restoration and disaster recovery; accessibility, privacy and operational ownership. Each applicable claim needs risk → invariant → enforcement boundary → concurrency/failure scope → evidence. Mark an irrelevant control inapplicable with its reason rather than introducing every pattern.

Billions of records or millions of users require a declared workload, distributions/skew, read/write mix, concurrency/arrival model, topology, service objectives and measured resources/cost. Unit tests, an index, a queue or an architecture diagram cannot establish that capacity. No such production load, restore drill or multi-region failover experiment was run in this follow-up. This is an auditable improvement to guidance and implementation, with explicit remaining evidence needs.
