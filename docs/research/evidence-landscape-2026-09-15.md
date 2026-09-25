# DevMethod experimental research: landscape and prior-art notes

Research cut-off: **2026-09-15 UTC**. Author: landscape worker. This is an intermediate research artifact, not a validated comparative benchmark. Scope: primary public documentation and maintainer publications; no native product trials, paid services, or hidden model calls were performed. Twelve individual search queries plus direct primary-page retrievals were used.

## Main finding

DevMethod should not claim novelty for planning agents, independent evaluators, browser verification, execution checkpoints, bounded loops, persistent context, or evidence bound to a commit. Strong documented prior art exists across these mechanisms. A useful contribution could still be a small, portable, comprehensible combination that measurably prevents invalid completion and unsafe continuation while preserving useful autonomy. That is an integration and product-value hypothesis, not established research novelty.

The most informative entry point is **maintaining a trustworthy definition of done through failures and subsequent change** in small applications. It is narrower than replacing every creation environment, but it connects intention, functional checks, correction, delivery and maintenance. A critical falsifier is that ordinary tests plus Git may deliver the same benefit more cheaply.

## Evidence labels and limitations

- **Marketing/author claim:** a vendor or maintainer asserts a benefit, score or adoption result. This is not independent observation.
- **Documented:** primary documentation specifies a capability or runnable interface. Availability can depend on plan, model, version and environment.
- **Author experiment:** the source reports its own executed experiment; configurations and limitations still require inspection.
- **Observed here:** a run executed in this research workspace with its outputs retained. There are **no native competitor runs** in this landscape artifact.

Documentation pages were retrieved on the cut-off date. Unless a tag is explicitly recorded below, they are unpinned rolling documentation and cannot establish a reproducible product version. A fair subsequent trial must record CLI/package version or source commit, actual model identifier, settings, tools, allowed time and token budget. A current product homepage is not evidence for a specific released package version.

## Comparators selected by documented capability

| Comparator | Available/documented contribution | Version/date established | Evidence status and unresolved comparison |
|---|---|---|---|
| Excellent model + shell/editor/Git + clear instruction | The necessary simple baseline. mini-swe-agent is a concrete minimal reference implementation with a linear history and simple action loop. | mini-swe-agent repository states v2; exact release/commit not pinned in this scan. | Source documents design and claims benchmark performance; no score reproduced. Use the **same actual model** as DevMethod, and give this baseline the same task information and tools. [S1] |
| Codex and its harness | Repository work, tool execution and parallel isolated tasks; OpenAI's harness case study describes mechanical architecture constraints and maintenance agents. A managed Agents API announced September 10 exposes long sessions and subagents. | Historical Codex launch May 16, 2025; harness case study February 11, 2026; managed API announcement September 10, 2026. No installed version pinned. | Documented and vendor case studies. Do not present the 2025 launch as the whole current product. Managed features were not exercised. [S2–S4] |
| Claude Code / Claude Agent SDK harness research | Application creation with planning, generator/evaluator separation, live browser verification, iteration, and compaction. | March 24, 2026 experiment explicitly compares Opus 4.5 and later simplifies around Opus 4.6. | Author experiments, not a universal default Claude Code workflow or independent replication. A particularly important close comparator. [S5] |
| Cursor Agent | Current docs describe skeptical verifier subagents, a planner–implementer–verifier pattern, isolated worktrees/cloud environments and resumable subagents. | Rolling docs retrieved September 15; no release pinned. | Documented. These primitives already cover agent roles, isolation and continuity. A verifier prompt does not establish statistical independence or adequate user requirements. [S6] |
| BMAD Method | Skills for product/technical decisions and delivery, preserving context for existing or new projects. Current release adjusts process depth after investigation and records review verdicts and evidence. | **v6.12.0**, released **September 4, 2026**, release commit shown as **05bfbd4**. | Documented release behavior; not executed. Comparing only to old heavyweight BMAD workflows would be a straw comparator. [S7, S8] |
| OpenHands SDK | Conversation state persistence, interruption and continuation, plus composable runtime/tooling. | Rolling SDK docs retrieved September 15; exact package version not pinned. | Documented APIs. Saving state immediately does not itself prove external workspace or side effects can be faithfully restored. [S9, S10] |
| SWE-agent / mini-swe-agent | A research-friendly issue-solving agent and minimal successor. | Official SWE-agent docs now mark SWE-agent maintenance-only and recommend mini-swe-agent. | Documented status. Include legacy SWE-agent as history, use the maintained mini implementation in new head-to-head trials unless testing a specific legacy claim. [S1, S11] |
| LangGraph | Persistent graph state, replay, branching and interrupts support control over long-running workflows. | Rolling documentation retrieved September 15; no package version pinned. | Documented execution infrastructure, not an end-to-end product designer. Replayed nodes execute again, including LLM/API calls; state replay is not filesystem rollback. [S12] |
| Lovable | App creation environment with live browser checks, frontend tests and edge-function verification. | Rolling documentation retrieved September 15; SaaS version not pinned. | Documented, not trialed. Its documentation says most verification tools run on request, with some suggested or initiated during investigation. Native preview affordances deserve a usability comparison if access is later available. [S13] |

This is a capability-selected sample, not an exhaustive ranking. No claim is made that omitted systems lack any capability, or that these are universally the best products. Access and reproducibility should determine which receive native experimental arms.

## Close prior art that changes the design space

### Separate generation and evaluation already has strong precedent

Anthropic's March 2026 application-development experiment includes planning from short prompts, generator/evaluator separation, pre-code sprint agreements, and an evaluator interacting with UI, API and database behavior. It reports QA calibration problems and model-dependent overhead. With stronger models it removes sprint structure and reduces evaluation frequency. This undermines any fixed claim that more gates or agents always improve results. It also means a proposed DevMethod contract/evaluator cycle must be compared to this simpler pattern, not just uncontrolled generation. [S5]

### Mechanical boundaries and maintenance are established engineering practice

OpenAI describes repository-local constraints enforced through custom linters and structural tests, with documentation maintenance and cleanup agents. The publication is a team case study, not a randomized comparison and not a guaranteed Codex feature. It nevertheless establishes that executable architectural constraints and continuity-oriented repository knowledge are existing approaches. [S3]

### Evidence freshness is closely related to attestation systems

in-toto/SLSA already describes review and test-result attestations attached to source identities, build artifacts identified by digests, and policy-based verification. A local DevMethod proof ledger should therefore be positioned as an accessible adaptation of established provenance ideas. A hash binds bytes; it does not make the assertion true, identify a trustworthy producer, or prevent a process with write access from replacing the record. Do not describe unsigned self-produced JSON as cryptographically trustworthy evidence. [S14]

### Test adequacy must be challenged, not equated to coverage

Mutation testing deliberately alters implementation behavior to see whether tests detect the alteration. Stryker distinguishes killed, surviving, uncovered and timed-out mutants. Detection of selected injected faults is evidence about those faults, not proof that the application meets all user needs. An equivalent mutation or invalid mutant also needs different treatment from a missed real defect. A DevMethod implementation using hand-authored behavioral faults should call that a seeded-fault evaluation unless it genuinely implements broader mutation testing. [S15]

## Persistent user problems: hypotheses, not market-prevalence estimates

| Problem | Why current documented primitives do not settle it | Small informative test |
|---|---|---|
| Correctly interpreting intent | A planner can formalize a mistaken interpretation; an evaluator can share it. | Keep an independently authored user outcome hidden from implementation, but ensure it is fairly implied by the task. Count assumption-caused product failures. |
| Useful autonomy | Checkpoints and permission prompts are controls; neither selects when interrupting the user has value. | Compare fixed gates, delegated defaults and risk-based escalation; record unnecessary interruptions and material wrong decisions. |
| Functional and visual quality | Browser tools provide observation, not an adequate oracle or taste calibration. | Score actual task completion, accessibility basics and blinded human visual preference separately. Do not substitute process compliance for product quality. |
| Invalid claims of completion | An agent may write a passing report, or reuse an old green result, while behavior changes. | Change source, requirement, fixture, checker or runtime input after verification and attempt delivery. Inspect whether stale evidence is accepted. |
| Persistent wrong direction | Repeated local improvements can optimize the wrong objective. | Include a contradictory requirement and a reproducible recurring failure; measure edits made before diagnosing or pausing. |
| Maintenance | A resumed conversation may contain stale assumptions and unexamined external side effects. | Restart in a fresh process, modify the need, introduce a regression and require old critical behaviors to keep working. |
| Multi-agent economics | Parallelism introduces coordination cost and shared-workspace conflicts. | Compare one well-configured agent to a bounded helper on truly separable work; include total tokens, conflict resolution and elapsed time. |
| Human understanding | More logs may make decisions harder to review. | Ask a new reviewer to decide whether to deliver, explain a failure, and identify the next action; measure correctness and time. |

No usability study or interview was conducted here. These hypotheses are motivated by the documented engineering gaps and should be tested with actual users before broad market claims.

## Recommended experimental decomposition

Test the mechanism separately from any model advantage:

1. **Simple strong baseline:** same model/tools, explicit instruction to build and verify, ordinary tests and Git. No DevMethod machinery.
2. **Baseline plus independent behavioral checks:** identical production code proposals and the same external checks, no evidence ledger. This isolates whether better tests explain all gains.
3. **Baseline plus checks and a small evidence lifecycle:** evidence records identify the requirement, code, checker and fixtures; stale records block completion. Add reproducible counterexamples and a bounded correction policy only where the task needs them.
4. **Optional richer control arm:** a planner/generator/evaluator split with matched budget; include only when there is access and an actual run can be performed. Do not implement a caricature of Claude, Cursor or BMAD and label that a native comparator.

Suggested near-term engineering probes: a passing but weak smoke check; a changed file outside the declared check scope; a requirement change without code change; a modified test fixture; a test command that exits zero while doing no meaningful assertions; repeated same failure; transient infrastructure failure; aborted/restarted execution; timeout with a still-running child process; and two independent agents changing a common contract.

Several probes test the evidence machinery rather than delivered product quality. Report these as **mechanism tests**. They cannot establish that DevMethod builds more useful products or is better than a coding agent.

Use at least two task families: a capacity-constrained reservation application and a resource-lending workflow with conflicting dates and return state. Keep one family or change request outside implementation design. A sample written after selecting the mechanism is a holdout only if its author is genuinely isolated from implementation details and scoring is fixed before the run. Otherwise call it a new fixture.

Primary outcome: externally verified useful behavior after initial delivery and after a change. Report separately false completion, retained regressions, time, tool/model consumption, intervention count and maintenance burden. Do not collapse these into a single opaque score. Equal task information and comparable budgets are more important than equal number of agents.

For local deterministic probes, report exact counts with no statistical generalization. For stochastic agent comparisons, record repeat trials and paired task results; predefine both a meaningful effect and an acceptable overhead before inspecting results. A full statistical campaign remains unexecuted until actual model runs and accessible comparator versions are pinned. Anthropic's evaluation guidance explicitly distinguishes trials, graders and outcomes, and warns that task/grader assumptions can create unfair failures. [S16]

## Decision implications

- Start with a portable verification/execution boundary, not a new general-purpose orchestrator. Current tools already supply substantial orchestration.
- Preserve ordinary commands and existing tests. A new user should gain a clearer answer to what is verified, why action stopped and what changed since last success.
- Make unsupported or stale evidence explicit. Avoid claims that hashes, model self-review or a green exit code prove correctness.
- Evaluate the cheapest plausible implementation before adding dependencies, centralized services or persistent multi-agent graphs.
- Retain a fully working application journey in the demonstration. A trustworthy report for an unusable app does not satisfy the user's ambition.
- If checks alone match the ledger's outcome and reviewability, simplify to checks plus a short status artifact. If the strongest baseline succeeds equally often, report parity rather than inventing superiority.

## Primary source register

S1. SWE-agent maintainers, **mini-swe-agent repository**, rolling, retrieved 2026-09-15: https://github.com/swe-agent/mini-swe-agent . Design, v2 notice and author-reported performance. Scores not used as comparative evidence here.

S2. OpenAI, **Introducing Codex**, 2025-05-16: https://openai.com/index/introducing-codex/ . Historical product scope, isolated repository tasks.

S3. OpenAI, **Harness engineering**, 2026-02-11: https://openai.com/index/harness-engineering/ . Repository constraints and maintenance case study.

S4. OpenAI, **Introducing the Agents API**, 2026-09-10: https://openai.com/index/introducing-the-agents-api/ . Announcement of managed Codex harness, long sessions and subagents. Customer testimonials are marketing evidence only.

S5. Anthropic, **Harness design for long-running application development**, 2026-03-24: https://www.anthropic.com/engineering/harness-design-long-running-apps . Close prior art and model-dependent simplification; experimental claims are the author's.

S6. Cursor, **Subagents**, rolling: https://cursor.com/docs/subagents . Verifier, orchestration, isolation and resume documentation.

S7. BMAD maintainers, **BMAD-METHOD repository**, rolling: https://github.com/bmad-code-org/BMAD-METHOD . Current workflow purpose and installation scope.

S8. BMAD maintainers, **v6.12.0 release**, 2026-09-04: https://github.com/bmad-code-org/BMAD-METHOD/releases/tag/v6.12.0 . Version/date/05bfbd4 verified from releases page: https://github.com/bmad-code-org/BMAD-METHOD/releases . Evidence-linked review and adaptive process scope.

S9. OpenHands, **Persistence**, rolling: https://docs.openhands.dev/sdk/guides/convo-persistence . Automatic conversation state persistence.

S10. OpenHands, **Pause and Resume**, rolling: https://docs.openhands.dev/sdk/guides/convo-pause-and-resume . Explicit pause and rerun API.

S11. SWE-agent maintainers, **Getting Started**, rolling: https://swe-agent.com/latest/ . Maintenance-only notice and mini-swe-agent recommendation.

S12. LangChain, **Use time-travel**, rolling: https://docs.langchain.com/oss/python/langgraph/use-time-travel . Checkpoint replay/fork semantics and re-executed calls.

S13. Lovable, **Test and verify your app**, rolling: https://docs.lovable.dev/features/testing . Verification types, observations and request-based activation.

S14. SLSA/in-toto maintainers, **in-toto and SLSA**, 2023-05-02: https://slsa.dev/blog/2023/05/in-toto-and-slsa . Test/review attestations, digests and policy verification.

S15. Stryker maintainers, **Mutant states and metrics**, rolling: https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/ . Fault-detection outcome taxonomy.

S16. Anthropic, **Demystifying evals for AI agents**, 2026-01-09: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents . Tasks, trials, graders, calibration and fair task specification.

## Resume state

Completed: source-grounded scan, explicit prior-art cautions, nine comparator rows, proposed falsifiers and experiment decomposition. Not completed: installing or trialing native competitors; pinning their package commits; independent user research; representative stochastic model comparison; exhaustive prior-art or patent search. No novelty or general superiority conclusion is supported yet.
