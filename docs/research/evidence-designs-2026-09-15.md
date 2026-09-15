# DevMethod research designs and falsifiable selection

Research date: 2026-09-15. This is a design contribution, not an experiment report or a novelty claim. Repository inspected: `main` at `6f31552`, including `CONTRIBUTING.md`, ADR 011, ADR 012, `EVALUATION.md`, `NATIVE-PILOT.md`, and `NATIVE-PILOT-RESULTS.md`. No repository files were changed by this research worker. Scientific discovery used five grouped search calls; seven useful primary publications are retained below. Access to the Barr survey PDF failed; it is not used as evidence here.

## 1. What the present evidence actually permits

DevMethod already has an explicit local controller, persistent stops, evidence binding, and selective invalidation. Describing it as merely Markdown would be inaccurate. ADR 012 is equally explicit that its evaluator is the bundled DevMethod behavioral scorer, not a general application runner. ADR 011 states that source hashes do not establish that tests inspect the right behavior or that the mission captures the user's actual requirements.

The native pilot is valuable but narrow: one matched B1 observation per arm, incomplete repetitions, and an unconfirmed environment explanation for the BMAD failure. The reported B1 token totals are 136,469 for DevMethod and 50,248 for the baseline. This is an observed cost warning in that setting, not a stable causal estimate or a reason to discard the method. The existing evidence does not establish general superiority, frontend quality, or a complete native two-session maintenance chain.

The clearest unresolved architectural boundary is between **evidence integrity** and **evidence discrimination**. The current guard can establish that recorded evidence is current under its contract; it cannot establish that a check would reject a plausible wrong implementation. A useful initial target is a small product with stable observable rules, persistent state, and one later requirement change. Success would be fewer false acceptances without making a healthy implementation unusable or expensive to maintain.

## 2. Scientific grounding and strict limits

The following concepts are used to choose mechanisms. They are not proof that a development agent converges or that a product meets all user needs.

| Concept | Definition and source | Proposed use and classification | What does not follow |
| --- | --- | --- | --- |
| Oracle assessment | An oracle distinguishes intended from faulty behavior; it can miss faults or reject correct states. Jahangirova et al. combine generated scenarios and mutations to expose both errors. | **Direct methodological application:** test checks against reviewed healthy and defective controls before relying on their verdicts. | Passing a finite calibration population does not establish a perfect oracle. Their measured gains do not transfer to DevMethod. [S1](https://discovery.ucl.ac.uk/id/eprint/1493269/1/main.pdf) |
| Metamorphic testing | Relations between outputs for related inputs can reveal faults when exact expected outputs are hard to enumerate. | **Direct application for specified relations:** relabeling fictional participant identities must not change capacity; cancellation followed by rebooking must restore the same availability. | A relation can be wrong or incomplete. It can also hold for a useless constant implementation. Healthy and defective controls remain necessary. [S2](https://arxiv.org/abs/2002.12543) |
| Runtime assurance | A trusted monitor and fallback constrain an advanced controller; formal guarantees depend on a stated model and trusted components. | **Architectural analogy**, plus ordinary deterministic enforcement of local state transitions: continue, suspend, or invalidate a receipt. | DevMethod lacks the physical dynamics, recoverability assumptions, and machine-checked proof of the cited framework. Stopping a process is not proof of safe external effects or convergence. [S3](https://shemesh.larc.nasa.gov/fm/papers/NFM2024-draft.pdf) |
| Mixed initiative and expected utility | Choose between autonomous action, waiting, or asking by considering uncertainty, cost, benefit, and the user's attention. | **Simplified decision model:** ask only when the decision matters enough to outweigh interruption; otherwise take a reversible default or run a cheap discriminating experiment. | LLM confidence is not a calibrated probability. A numeric score without calibration is not scientific decision theory. [S4](https://erichorvitz.com/chi99horvitz.pdf) |
| Human–AI interaction | Users need understandable capabilities, opportunities to correct the system, and control across interaction stages. | **Design guidance, not formal application:** show the concrete product, which decisions remain uncertain, and exactly which properties have evidence. | Adopting guidelines does not establish usability, visual quality, or user comprehension; those need observed user tasks. [S5](https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/) |
| Empirical software engineering | Evaluate an explicit treatment using a specified design, measurements, analysis, and documented threats to validity. | **Direct methodological application:** preregistration, paired task inputs, separate design and evaluation populations, failures retained, and declared independence. | Small convenience samples cannot establish universal rankings; repeated runs of one deterministic fixture are not independent product tasks. [S6](https://www.ehealthinformation.ca/web/default/files/wp-files/2001-Preliminary-Guidelines-for-Empirical-Research.pdf) |
| Oracle anchoring | An expected value derived from the code under mutation can move with the defect and preserve a passing comparison. | **Mechanism hypothesis informed by a recent preprint:** explicitly review the provenance of expected values, tolerances, preconditions, and scenario generation. | Canedo reports one system and one author. This is a relevant limited observation, not settled prevalence evidence or a universal theorem about all calculated expectations. [S7](https://arxiv.org/pdf/2608.17214) |

Information theory is relevant to evaluating how informative an oracle is, but a true-oracle distribution is unavailable here. Do not report mutual information, entropy reduction, or Bayesian confidence as measured quantities. Likewise, do not introduce Lie groups or relativity: no precise benefit to this bounded software problem has been established. Local hashes and causal dependency records are useful engineering mechanisms, not distributed consensus or authenticated authorship.

## 3. Three genuinely different designs

### A. A general local execution and acceptance controller

**User problem.** A user wants an agent to work without constant supervision, but repeated retries, stale checks, and premature completion claims waste time.

**Mechanism.** Generalize the local controller through a separately reviewed application evaluator contract: a bounded executable with fixed arguments, normalized outcomes, explicit resource limits, immutable input identities, a persistent stop policy, and a local acceptance receipt. Preserve the current behavioral scorer as one adapter. This makes the lifecycle enforceable across app types.

**Existing similar work.** ADR 012 already does most of this for a narrower evaluator. Runtime assurance supplies an architectural precedent, while ordinary CI quality gates already accept or reject candidates. The capability survey must assess available host supervisors separately.

**Real difference to establish.** Unified current evidence and resumable bounded correction across hosts could reduce integration effort. Adding a runner alone is not a research breakthrough and does not solve wrong tests or ambiguous user intent.

**Necessary assumptions.** The evaluator is relevant, the host cooperates, local process controls work, and checked inputs sufficiently represent the product. A local lock controls only cooperating local writers.

**Expected benefit.** Deterministic prevention of stale acceptance and repeated identical failed attempts; less dependence on instruction adherence.

**New risks.** Generic command execution expands the trusted boundary; host differences, cancellation, background descendants, unmetered provider work, adapter maintenance, and rigidity can outweigh the benefit.

**Minimum prototype.** One Node application evaluator with passing, genuine assertion failure, malformed report, timeout, interruption, and stale-input fixtures. No agent dispatcher is needed to falsify the local control claim.

**Invalidating experiment.** Feed it a wrong application plus a constant-green test. If it accepts, the hypothesized semantic-quality advantage is absent even when execution controls are correct. If a simple existing CI check plus two-attempt wrapper has the same relevant local outcomes with less integration cost, prefer that simpler design.

**Simpler alternative.** Use the existing host, a stable test command, and explicit stop-and-report instructions. Add a minimal local wrapper only for demonstrated failures.

### B. A separate evidence challenge layer

**User problem.** An agent delivers a convincing product and green tests, but the tests encode the same mistaken assumptions as the implementation. On later changes, the old success remains persuasive although it no longer covers the changed behavior.

**Mechanism.** The acceptance path has a stable requirement boundary and a separate checking boundary. Each selected criterion has a reviewed observable expectation, a healthy control, and at least one plausible defective control. A checker must accept the healthy control and reject the relevant defects for the expected behavioral reason before its candidate verdict can support acceptance. The receipt binds requirement revision, checker, controls, candidate, runtime configuration, and observations. A requirement change invalidates the relevant evidence and requires requalification. Correction targets either the product or the checker according to the observed failure.

**Existing similar work.** Oracle assessment, mutation testing, test-driven development, differential testing, independent acceptance suites, and OASIs precede this mechanism. ADR 011/012 already bind evidence. The new work would be integrating these into a low-friction, provider-independent lifecycle for agent-created products; that integration's usefulness must be measured. Do not claim invention of testing the tests.

**Real difference to establish.** The system exposes a concrete reason to distrust a green report before accepting the product, and carries that requirement across revisions. Its strongest possible claim is task-specific evidence discrimination with useful maintenance ergonomics, not universal correctness.

**Necessary assumptions.** Controls are actually healthy or defective according to the user requirement, they exercise meaningful defect classes, and expected values are grounded outside the mutable implementation. If the same agent authors every layer, semantic independence has not been achieved merely by using separate files or worker names.

**Expected benefit.** Catch vacuous or overly permissive tests, false failure gates, and stale acceptance. Product generation remains with whichever capable host the user already uses.

**New risks.** Maintaining controls costs time. Overfitting to the control set can inflate confidence; synthetic mutants can be unrealistic; controls can duplicate implementation. Strict checks can reject legitimate variation. Deliberately untrusted code can exploit a shared process or filesystem; a local pilot must state that it is trusted cooperative code rather than claim sandboxing.

**Minimum prototype.** A dependency-free local runner and versioned contract for a bounded booking or lending product, with real persistence and a later capacity/cancellation change. Provide one weak checker and one strengthened checker, a healthy implementation, plausible defective controls, candidate observations, and a receipt that becomes stale on relevant changes. Use an existing application UI rather than build a dashboard for the protocol.

**Invalidating experiment.** On a preregistered control population, compare candidate self-tests alone with qualified evidence. Count false acceptance of defects and false rejection of healthy variants. Include a correct implementation, a constant-green checker, a constant-red checker, a checker that imports successfully but ignores behavior, a syntax/import failure, a meaningful boundary defect, and later unseen defects. Reject the mechanism if it cannot discriminate these or if improvements disappear on separately authored cases. Stop expanding it if ordinary independent acceptance tests plus a simple mutation tool achieve the same outcomes with materially less maintenance.

**Simpler alternative.** A separate acceptance test directory owned by a reviewer, a few hand-reviewed regression cases, and existing mutation testing. This is a mandatory comparator, not an inferior strawman.

### C. Product search by bounded competing experiments — the radical alternative

**User problem.** An ambiguous idea can yield a polished wrong product. More careful execution of a fixed interpretation simply makes the wrong direction more expensive.

**Mechanism.** Replace the default linear document-and-command progression with short decisions about uncertainty. Keep only the user's objective, constraints, decisive assumptions, and a small experiment ledger. Before committing to a costly interpretation, produce two minimally different runnable slices or investigate a cheap discriminating fact. Choose the next action by expected decision value and reversibility, then keep one direction and discard the other. Subsequent work follows observed product outcomes, not mandatory workflow phases.

**Existing similar work.** Mixed-initiative interfaces, rapid prototyping, design exploration, active learning, and best-of-N generation all precede parts of this idea. Merely running two agents and asking a third to vote is not an independent user oracle.

**Real difference to establish.** A practical controller that spends a small, bounded budget on the uncertainty most likely to change the product could reduce late rework and user interruptions. It would challenge DevMethod's default workflow structure rather than add another phase to it.

**Necessary assumptions.** Alternative interpretations are enumerable, their differences can be experienced or tested cheaply, and an evaluation signal correlates with the user's actual preference. User utility and the cost of a wrong guess cannot simply be invented by an LLM.

**Expected benefit.** Earlier detection of wrong direction and fewer unnecessary clarification questions; better product fit when intent is underspecified.

**New risks.** Duplicated generation cost, over-optimizing easy-to-score UI outcomes, inconsistent interpretation across workers, false precision in value estimates, and more decisions for the user. A weak judge can systematically select the wrong prototype.

**Minimum prototype.** Three to six ambiguous briefs with a prewritten stakeholder preference and task-based acceptance rubric. At most two small slices per brief, one clarification opportunity, fixed total generation budget, and no generalized planner. Compare with a capable model given the same tools and permission to ask one high-value question.

**Invalidating experiment.** Reveal the stakeholder preference only at adjudication. Compare correct task completion, requirement reversals, user time, and total effort. If two prototypes do not improve final acceptance over one prototype plus one well-chosen question, or cause substantially more effort, stop. A scripted hidden preference tests routing under those assumptions; it is not a user study and cannot establish real user satisfaction.

**Simpler alternative.** Ask one concrete question or show one reversible prototype early. If that works, a general uncertainty controller is unjustified.

## 4. Selection should be staged, not announced as a winner in advance

The provisional recommendation is **B as the smallest falsifiable entry point**. It attacks an explicit gap in ADR 011, can preserve current hosts, and can be tested without paid model access. A is useful supporting infrastructure only where B needs it; implementing a universal runner first risks missing the actual problem. C is the largest product-level departure and needs real preference evidence that a deterministic local harness cannot supply.

This is a recommendation to experiment, not a result. The root implementation must record the actual design choice only after examining the experiments it runs. If controls merely restate an independent acceptance suite, simplify B. If the healthy variants are frequently rejected or maintenance burden is high, prefer the ordinary test suite. If the primary user problem proves to be intent ambiguity rather than false acceptance, C may be the better future direction.

## 5. Smallest experiments and preregistration requirements

Before running: freeze the manifest with task IDs, design/evaluation split, exact starting revisions, evaluator identities, budgets, comparator definitions, and primary outcomes. Later edits create a new experiment identity. Fixtures used to develop a checker are calibration, not held-out evaluation. Cases authored by a separate worker are independently authored only if that worker truly did not see implementation or candidate results; all workers in this environment share storage, so confidentiality and blindness must not be inferred.

| Stage | What it can decide | Arms | Primary outcomes | Proposed resource bound |
| --- | --- | --- | --- | --- |
| E0: local discrimination | Whether local mechanisms distinguish useful evidence from false confidence | Self-test acceptance; A generic green gate; B qualified checks; simple independent tests | Defects accepted; healthy controls rejected; invalid executions misclassified | One preregistered finite population; at most 100 subprocess observations, each at most 10 seconds; no native model calls |
| E1: revision chain | Whether evidence remains relevant after product/requirement change | Existing current-evidence binding; B qualification bound to requirement revision | Stale acceptance; corrected acceptance; unnecessary invalidation; human corrective steps | One design scenario and two separately authored later changes; bounded local runs only |
| E2: native product work | Whether B improves a user's delivered result under matched resources | Excellent model + tools + clear brief; same plus independent tests; same plus B; DevMethod 0.5 | Functional task success; false completion; observed time/usage; rework and interruptions | Select exact available model/host first; equal total per-arm budget including checker/control authoring; preregister stop limits before admission |
| E3: uncertain intent | Whether C improves fit enough to pay for branching | One prototype + one question; two slices + uncertainty decision | Stakeholder task success; reversals; user time; generation effort | At most two slices and one question per brief; same total model budget across arms |

Do not run costly E2/E3 until E0/E1 justify the mechanism and actual host access is available. Do all useful local engineering now; lack of native host access does not make synthetic results equivalent to model performance. Conversely, do not end the project at a proposal when local implementation and local product verification remain feasible.

## 6. Implementation details that determine whether B is meaningful

1. **Separate semantic failure from execution failure.** A timeout, missing import, invalid report, or syntax error is not evidence that a checker detected the intended defect. Record a stable criterion outcome and expected assertion cause; generic nonzero status is insufficient calibration evidence.
2. **Both control directions matter.** Constant-green checks accept defects; constant-red checks reject healthy behavior. Include healthy variations so one overfitted canonical output cannot look reliable.
3. **Pin the requirement, not only the code.** A capacity change should invalidate its acceptance evidence even if the checker source happens not to change. The old contract remains inspectable; a new contract never retrospectively rewrites its meaning.
4. **Preserve honest boundary claims.** SHA-256 binds bytes, not authorship or truth. A separate process does not imply hostile-code isolation; a local receipt does not imply merged, deployed, user approved, or externally reconciled.
5. **Avoid universal adapters initially.** One fixed Node invocation and explicit application contract are easier to inspect than arbitrary shell text, dynamic plugin loading, or a new agent dispatcher.
6. **Treat a challenged oracle as a product finding.** When qualification fails, show the behavior it missed and the smallest concrete next correction. Do not bury the user in ceremony or imply that creating more reports improves the app.
7. **Make maintenance visible in the product.** Demonstrate restart with persistent data, change a requirement, invalidate old evidence, implement the change, requalify, and show the changed behavior in the local UI/API.
8. **Use observed budgets honestly.** Record monotonic elapsed time and subprocess counts. Token/cost fields are unavailable without trustworthy host usage; local runtime is not model cost. Checker/control creation must be charged to any end-to-end comparison.

## 7. Claim ladder and adoption conditions

- A passing deterministic fixture supports only the implemented local behavior on that fixture.
- A matched finite challenge population can support a claim of fewer false acceptances on that population, with healthy-control results and execution cost alongside it.
- A native matched product campaign can support a claim scoped to those models, versions, prompts, tools, tasks, and budgets.
- General user benefit needs realistic maintenance work and observed users. Aesthetics, accessibility, and comprehensibility need their own outcome evidence; a backend oracle does not establish them.
- Broad novelty needs further prior-art search, especially mutation-testing integrations, oracle generation, independent validators, agent evaluation harnesses, and versioned acceptance contracts. The seven papers below are scientific grounding, not an exhaustive novelty search.

Initial adoption fits teams building small software products with explicit rules, executable interfaces, reproducible local environments, and an owner for acceptance criteria. It is weaker for inherently subjective aesthetics, inaccessible external systems, rapidly disputed requirements, or settings where maintaining representative controls exceeds the risk reduction. For a tiny low-risk edit, excellent tools and a clear request may remain best.

## Primary source register

- **S1 — Jahangirova, Clark, Harman, Tonella (ISSTA 2016), _Test Oracle Assessment and Improvement_.** Author institutional PDF, full text inspected. Direct prior art for oracle qualification, false positives, false negatives, and the continued need for intended-behavior knowledge. [Publication](https://discovery.ucl.ac.uk/id/eprint/1493269/1/main.pdf).
- **S2 — Chen, Cheung, Yiu (HKUST technical report 1998; arXiv posting 2020), _Metamorphic Testing: A New Approach for Generating Next Test Cases_.** Original report identity confirmed in the PDF/search record; abstract inspected. Supports relations among tests, not a complete oracle. [Publication](https://arxiv.org/abs/2002.12543).
- **S3 — Slagel et al. (NFM 2024 draft), _A Formal Verification Framework for Runtime Assurance_.** NASA-hosted author paper, framework assumptions inspected. Used only as architectural analogy; no proof transfer. [Publication](https://shemesh.larc.nasa.gov/fm/papers/NFM2024-draft.pdf).
- **S4 — Horvitz (CHI 1999), _Principles of Mixed-Initiative User Interfaces_.** Author-hosted paper, principles and decision discussion inspected. Supports uncertainty-aware action and interruption tradeoffs. [Publication](https://erichorvitz.com/chi99horvitz.pdf).
- **S5 — Amershi et al. (CHI 2019), _Guidelines for Human-AI Interaction_.** Microsoft Research publication record inspected. Supports interaction design guidance; not evidence of DevMethod UX quality. [Publication](https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/).
- **S6 — Kitchenham et al. (NRC technical report January 2001), _Preliminary Guidelines for Empirical Research in Software Engineering_.** Primary NRC report hosted by a coauthor's research group; date and methods scope inspected. Distinct from the later 2002 journal publication. [Publication](https://www.ehealthinformation.ca/web/default/files/wp-files/2001-Preliminary-Guidelines-for-Empirical-Research.pdf).
- **S7 — Canedo (arXiv v1, 17 August 2026), _Oracles That Cannot Fail: Anchoring and the Expectation That Moves With the Fault_.** Full PDF opened; mechanism, intervention rationale, and single-system/single-author limitation inspected. Peer review not established; treat as a narrow recent primary observation. [Publication](https://arxiv.org/pdf/2608.17214).
