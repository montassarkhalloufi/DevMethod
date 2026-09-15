# Quality, test order and bounded engineering requirements

Research date: 2026-09-15. This note addresses the additional quality/TDD scope. Six primary sources are retained. It does not claim that human-development studies establish effects for coding agents. No repository file was edited and no new model experiment was run.

## Decision

Adopt an explicit conditional requirement, not a universal claim of TDD superiority: reproduce a known testable defect before correcting it; use small red–green–refactor cycles for specified, testable behavior; preserve existing green behavior tests during pure refactoring; permit a bounded exploratory step when the contract or observation mechanism is not yet known. Every exception must name the concrete reason and the alternative evidence. Test relevance and actual execution are mandatory regardless of order.

This is a proposed DevMethod engineering policy. Its justification is the ability to demonstrate that a regression check distinguishes the observed defect from its correction, combined with short feedback cycles. The sources below do not prove that writing tests first always improves speed or quality, or that the policy has already improved DevMethod agent outcomes.

## Existing guidance and the actual gap

Read in this checkout:

- `.agents/skills/scoped-delivery/references/verification-and-cost.md` already maps risk to verification level, ties checks to required outcomes, and rejects false closure from a green but incomplete suite.
- `.agents/skills/project-foundation/assets/ENGINEERING_POLICY.template.md` already requires strict TypeScript, inward dependencies, pragmatic SOLID, cohesive functions, meaningful patterns and actual project quality commands.
- `.agents/skills/decision-architecture/references/backend-boundaries.md` already separates domain/application/infrastructure, avoids ceremonial mappers and generic repositories, and calls for real integration tests for transactions, constraints and concurrency.
- `.agents/skills/react-feature-engineering/SKILL.md` already separates rendering, effects, pure logic and server authority, and discourages both giant components and empty wrappers.
- The reviewed CI profile already preserves installed commands and required gates. Search results also identify existing retry, idempotency and workload guidance in the API, operations, messaging and persistence profiles.

The distinct gap is an explicit choice of test order plus a compact standard for rejecting redundant, vacuous or implementation-copied tests. Most architecture and distributed-systems requirements should remain owned by existing references. Add links or a short clarification where needed; do not repeat a large checklist in every skill.

## Research procedure and access

Pass 1 checked current guidance and located sources on TDD outcomes, understandability, dependency direction, test portfolios and retry safety. Pass 2 addressed only two uncertainties: whether sequencing itself explains TDD results, and whether primary references support the proposed concrete quality checks. Its expected benefit was avoiding an unsupported universal mandate; its cost was targeted reading of study limitations and official documentation.

The Microsoft publication page could not be fetched; the same study's IBM Research record was readable. The AWS HTML article redirected to an empty extracted page; its official AWS-hosted PDF was readable. A microservice testing slide deck exposed only its introduction/navigation, so the readable primary article by Ham Vocke was retained instead. These replacements did not expand the final six-source corpus. Search snippets and secondary summaries were not used as substitutes for the retained evidence.

## Six primary sources

### Q1 — TDD process characteristics, not a universal sequencing effect

[Fucci, Erdogmus, Turhan, Oivo and Juristo: A Dissection of the Test-Driven Development Process](https://arxiv.org/abs/1611.05994), submitted 2016-11-18; linked TSE DOI `10.1109/TSE.2016.2616877`. The [author manuscript](https://arxiv.org/pdf/1611.05994) names University of Oulu, Carnegie Mellon University and Universidad Politécnica de Madrid affiliations.

The regression study analyzes 82 observations from 39 professionals. Finer, more uniform cycles were positively associated with measured quality/productivity; sequencing had no important influence. This is not proof that order never matters. The authors acknowledge limited causal inference, convenience sampling, constrained testing experience, short tasks, fixed stories, and two artificial tasks. Functional correctness does not measure all maintainability or usability outcomes. The negative refactoring association also has construct-validity limitations.

Consequence: require a short feedback loop and actual behavioral evidence. Do not use this paper either to outlaw test-first or to declare test-last equivalent in every context. A coding-agent trial remains necessary for causal claims about DevMethod.

### Q2 — Positive industrial TDD results with comparison limits

[Nagappan, Maximilien, Bhat and Williams: Realizing quality improvement through test driven development](https://research.ibm.com/publications/realizing-quality-improvement-through-test-driven-development-results-and-experiences-of-four-industrial-teams), IBM Research record dated 2008-02-27, *Empirical Software Engineering*. The abstract covers three Microsoft teams and one IBM team.

The reported pre-release defect density was 40–90% lower than similar projects without TDD; teams subjectively estimated 15–35% higher initial development time. This is an industrial case study, not randomized assignment of the same work to two processes. The accessible record supports these reported results but does not eliminate differences between projects, teams, testing discipline or other concurrent practices.

Consequence: TDD is a plausible quality practice with possible upfront cost. Do not promise those percentages for DevMethod, contemporary TypeScript teams or AI-generated tests. Together with Q1, this supports a bounded policy chosen for the failure mode, not a slogan that TDD is always faster or always better.

### Q3 — Cognitive Complexity is an inspectability signal

[G. Ann Campbell, SonarSource: Cognitive Complexity](https://www.sonarsource.com/docs/CognitiveComplexity.pdf), version 1.7, 2023-08-29; official metric specification and explanatory white paper.

The metric counts breaks in linear control flow and nested structures while discounting selected readable shorthand. It aims to approximate relative difficulty of understanding control flow, rather than simply count execution paths. Extracting a named function can reduce local scores.

Limits/inference: a lower score alone does not prove comprehensibility, correctness or sound architecture. Fragmentation can move difficulty into navigation, implicit state and cross-function coupling. The paper does not establish a universal project gate such as “15 for every function.” Use the installed analyzer's language/version and accepted threshold, not an invented equivalent calculation.

Consequence: review changed complex functions for unnecessary nesting, mixed responsibilities and unclear invariants. Prefer cohesive extraction and explicit names. Keep behavior tests green, and assess whether the resulting call flow is actually easier to understand. Do not introduce a paid Sonar service or whole-repository rewrite solely to obtain a number.

### Q4 — Clean Architecture: dependency direction and testable rules

[Robert C. Martin: The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), 2012-08-13, the author's primary exposition.

The central proposal separates policy from implementation mechanisms and keeps source dependencies directed toward policy. Business rules should be testable without transport, persistence or UI. The circles are schematic; the text does not prescribe exactly four layers. It allows entities to be data/functions as well as objects.

Evidence type: an architecture proposal, not a controlled demonstration that one folder structure improves all projects. Database replacement does not itself make migration, concurrency or transaction semantics equivalent.

Consequence: retain DevMethod's existing inward dependencies, consumer-owned ports and composition guidance. Name the boundary being protected and the concrete change it enables. Do not create layers, factories, repositories or interface-per-class patterns without a relevant responsibility or variation. Tests can support the business contract; integration evidence still establishes actual adapter guarantees.

### Q5 — Test behavior, preserve useful boundaries, avoid redundant checks

[Ham Vocke: The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), 2018-02-26; the byline identifies a Thoughtworks developer/consultant at publication.

This primary practitioner article distinguishes unit, integration, contract, UI and end-to-end checks. It recommends observable behavior over private call structure, cautions against trivial coverage-chasing, and removes duplicated higher-level conditions while retaining checks that prove wiring lower levels cannot observe. It explicitly acknowledges the risk of testing a different database engine from production and that fake external responses can drift.

Limits: the pyramid is a heuristic, not a mandatory numeric distribution. Its Spring-era examples do not establish current tool versions or database equivalence. Some repeated setup can improve readability; eliminating redundant guarantees does not require eliminating every duplicated line of test code.

Consequence: choose the cheapest layer that can expose the relevant failure. Keep a small integration or journey check when it proves an additional boundary. Do not repeat every pure-rule edge case through the browser or mistake mocks for provider/transaction verification.

### Q6 — Retries are a correctness and load decision

[Marc Brooker, AWS: Timeouts, retries, and backoff with jitter](https://d1.awsstatic.com/builderslibrary/pdfs/timeouts-retries-and-backoff-with-jitter.pdf), official PDF with 2019 copyright; exact original publication day not stated there. The current HTML relocation date is not used as the original date.

The operational account explains that a timed-out operation may already have caused side effects; safe retries need suitable idempotent semantics. Retries increase load and can multiply across layers. Backoff, jitter and bounded retry behavior address different parts of overload/recovery. Timeouts also need meaningful scope, including connection-related work where applicable.

Limit: these are mechanisms and experience, not proof of capacity for a particular service. Adding all resilience patterns indiscriminately can introduce new states and testing burden. A client-side key without server guarantees is insufficient.

Consequence: before implementing retry, establish outcome ambiguity, retry ownership, allowed errors, stopping conditions and deduplication scope. Test the intended recovery and duplicate-effect invariant at the actual boundary; measure workload when claiming throughput, tail latency or recovery capacity.

## Executable rule for agents

The following is suggested policy text for the existing verification reference, not a new required project artifact:

> Before changing behavior, identify the user-visible rule or invariant and inspect existing coverage. For a reproducible defect, first run the smallest relevant regression check against the defective behavior and confirm that it fails for the expected reason. Implement the correction, run the check again, and preserve the red and green observations. For a specified, testable new rule, use short red–green–refactor cycles by default. A missing dependency or broken test setup is not evidence that the intended behavioral assertion detected the defect. If prior red evidence cannot be obtained, record the concrete limitation and do not label the work test-first.
>
> For behavior-preserving refactoring with adequate tests, start from green and keep those behavioral checks unchanged unless their assumptions legitimately change; do not manufacture a failure. When exploration is necessary to discover an API, an interface seam or a visual direction, bound the exploration, then define the accepted behavior and its check before hardening. Documentation and purely visual changes use proportionate accuracy/rendering checks rather than artificial unit tests.
>
> Derive expected results from the contract, not by reusing the production algorithm. Every added test must expose a named plausible failure not already covered equivalently. Prefer extending an existing test when appropriate. Test the real boundary for integration guarantees. Report actual commands and results; passing coverage, lint or a second model's approval is not sufficient proof of business correctness.

## When to require which order

| Situation | Required/default sequence | What would be misleading? |
|---|---|---|
| Known reproducible bug, viable local seam | Minimal regression red → correction → green → relevant existing regression checks | Writing a test that already passes on the broken code, or recording an import failure as proof of the business bug |
| Specified pure rule, calculation, validation or state transition | Relevant expected result first → red → smallest implementation → green/refactor | Recomputing expected values with the same helper or duplicating an implementation branch verbatim |
| Persistence or service contract change | Expected invariant/contract first; red at the narrow real integration boundary where feasible | Claiming a mocked transaction proves database atomicity or assuming an SDK retry proves end-to-end idempotence |
| Behavior-preserving refactor with sufficient tests | Establish green baseline → refactor → same behavioral checks green | Breaking code intentionally to manufacture a TDD story or rewriting the oracle merely to accept new internals |
| Legacy behavior not yet understood | Observe and characterize actual behavior → distinguish intended behavior from known defects → change deliberately | Treating an accidental existing result as a new business requirement |
| Unknown API or design exploration | Time-bounded spike → explicit decision/contract → appropriate check → production implementation/hardening | Calling prototype exploration complete production validation or allowing an indefinite test-later phase |
| Pure documentation, formatting or static layout | Existing lint/format/accuracy/render checks as applicable | Adding a unit-test suite for a wording or spacing change |
| Required environment unavailable | Complete independent checks; record the blocked layer and exact next action | Simulating a successful integration run, claiming TDD after the fact, or silently removing the gate |

A skeleton may be needed to make a test executable. That preparation is acceptable; distinguish it from the later observation that the relevant behavior actually fails. Retrospective testing can still be valuable, but it must be described honestly.

## What counts as a meaningful test

Use a short explanation in the task or test name: contract/invariant, plausible failure, distinguishing input/state and expected observation. These need not become four mandatory metadata fields.

- Check a public outcome or invariant, including a relevant boundary, error or transition. An assertion that merely confirms its own mock setup, a getter assignment or a framework's documented primitive usually adds no application evidence.
- A synthetic fixture is legitimate when it faithfully represents the real contract and failure conditions. Do not invent unsupported product rules or unrealistic stories simply to raise the test count. The initial mission explicitly allows fictional data; that remains compatible with realistic scenarios.
- Keep the expected value independent of the implementation under test. For complex calculations, use a trusted worked case, invariant, independently derived reference or metamorphic relation with stated assumptions.
- Reuse existing coverage when it detects the same defect at the same guarantee boundary. Overlap across layers is justified only by additional evidence: for example, a unit rule check and a real SQL concurrency check establish different guarantees.
- Targeted mutation or replay against the prior defective revision can help establish that a test detects a particular fault. It is optional when a genuine red observation already establishes that fact; do not install a mutation framework for every patch.
- Assertions must run and asynchronous work must be awaited. Identify any relevant flaky timing and prefer controlled schedules/failure injection. A test suite that exits green without exercising the assertion is not evidence.

## Clean code, SOLID, patterns and automated gates

These are applications of existing DevMethod policy, informed by Q3/Q4/Q5; they are not six new universally mandatory tools.

| Concern | Concrete engineering decision | Guard against ritual |
|---|---|---|
| Cohesion and names | Give each changed unit a clear responsibility and expose state/effect boundaries | Splitting every few lines into wrappers, or using vague “manager/helper/service” names to hide mixed work |
| SOLID | For the relevant change: separate unrelated reasons to change; add extension points for actual variation; preserve substitution contracts; keep consumer interfaces narrow; keep policy independent of concrete mechanisms | Enforcing one class/file per principle, speculative inheritance, fake interfaces or generic repositories |
| Design patterns | Name the repeated problem, invariants and simpler alternative before adopting a pattern | Adding factory/strategy/saga/outbox simply because it appears on a best-practice list |
| Lint and strict typing | Run the repository's configured checks on the relevant code, preserve accepted strictness, fix genuine failures | Disabling a rule or adding broad casts/suppressions to obtain green output |
| Formatter, including Prettier when selected | Use the already selected formatter and configuration; maintain a reproducible check command | Installing a second competing formatter or rewriting unrelated files without a scope reason |
| Cognitive complexity | Use the installed analyzer and agreed threshold, then inspect readability, nesting and call flow | Claiming a numeric score proves understandability or moving complexity into a maze of tiny calls |
| Quality report | State the commands actually run, changed scope and remaining uncertainty | Saying “Clean Architecture/SOLID compliant” with no concrete boundary or evidence |

If a project has no lint/format configuration, establishing a minimal compatible configuration can be a project-foundation choice within the authorized scope. Select one owner for formatting, pin compatible dependencies and record the chosen commands. Do not infer that a research citation authorizes a paid service or migration of unrelated projects.

## Distributed-system checks selected by actual risk

DevMethod already has the relevant architecture/profile owners. Use these examples to assess a touched boundary, not as a checklist to execute for every change:

| Observed or introduced risk | Proportionate distinguishing check | Claim it cannot support |
|---|---|---|
| Timeout after durable mutation | Inject failure after commit, reconcile/retry with the accepted request identity, assert one intended effect and a coherent response | Exactly-once execution across all providers and crash states |
| Redelivery/concurrent duplicate | Exercise the consumer/storage deduplication boundary with the same identity and competing deliveries | Broker delivery guarantees inferred from an in-memory set |
| Retry amplification | Inspect existing client/SDK retry layers, then inject transient errors and count attempts against a bounded budget | Production availability from one happy-path retry |
| Capacity/latency requirement | Declare arrival pattern, concurrency, duration, dataset and environment; measure error categories, latency distribution and saturation/recovery as appropriate | Production-scale throughput from a short local synthetic run |
| API/schema evolution | Verify the relevant consumer/provider contract and supported version transition | Real provider compatibility from hand-authored mock responses alone |
| Atomic quota/reservation invariant | Controlled concurrent operations against the actual persistence guarantee | Race safety from sequential unit tests |

No actual load test or integration result is supplied by this research note. Use the existing case only when it represents a contract under implementation or a previously observed defect; do not add a new business feature to create a test target.

## Minimal integration and refutable follow-up

1. Add the conditional order/meaningfulness rule to the existing verification owner; link it from delivery/engineering guidance rather than duplicating it.
2. Preserve existing pragmatic architecture, React decomposition and distributed-systems references. Only clarify a specific identified gap.
3. Require actual project lint/format/type/test commands, without pretending one gate subsumes the others.
4. Apply the order rule to the next suitable real repository correction and retain red/green evidence. This demonstrates process compliance for that change, not a causal quality gain.
5. A later efficacy study can compare matched, authorized native tasks under test-first and incremental test-last, using the same task inputs, contracts, models, settings and budgets. Evaluate correctness with withheld acceptance criteria and account for review/rework, time and test redundancy. Avoid reusing a task on the same agent context after revealing its solution. If one approach costs more without improved independently assessed outcomes, narrow the policy for that task class. Do not launch this comparison without an explicit bounded run budget and available hosts.

Stopping decision: the current evidence supports an executable conditional policy and preserves existing verification levels. It does not justify a universal TDD promise, new mandatory architecture framework, arbitrary complexity threshold, blanket mutation campaign or exhaustive load test requirement for DevMethod 0.5.
