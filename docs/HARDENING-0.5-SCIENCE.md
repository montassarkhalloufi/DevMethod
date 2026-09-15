# Scientific audit of DevMethod 0.5: bounded exploration and falsifiable mechanisms

Research date: 2026-09-15. Baseline inspected: `8c23c0e921c12ebfade2ab7efe6a8e9734dc7309`. Read-only research; no repository source was modified by this worker. The note and immutable probe were integrated after the independent review; they do not approve a release.

## Conclusion for this candidate

One proportionate correction is justified by an observed defect: preserve demonstrable token/duration threshold crossings when another consumption observation is unknown. The baseline inspector correctly refuses eligibility in these cases but loses useful known facts. A fixed deterministic probe found 49 missing threshold diagnostics and 20 traces missing a known post-threshold-attempt diagnostic among 155 synthetic traces. Independent replay on the corrected worker commit reduced both diagnostic counts to zero under the unchanged protocol. These counts are neither native agent failure rates nor a general convergence result.

Other scientific connections clarify existing boundaries or suggest later experiments. None justifies introducing a general supervisor, theorem prover, learned stopping policy, information-theoretic context optimizer, Lie algebra, or relativistic model into 0.5.

## Pass 1: bounded exploration before further investment

Initial scope: six relevant scientific families plus the two optional abstract suggestions. Stop a direction when it lacks an observed need, a usable mechanism, or a credible simpler comparator.

| Family | Observed local problem or boundary | Candidate benefit | Validation cost and decision |
|---|---|---|---|
| Control and discrete dynamics | `loop` reads supplied histories; it does not control host execution | Separate monitoring from enforceable admission/cancellation | Low for capability wording; high for new runtime. Retain boundary, no runtime addition |
| Formal methods and temporal logic | Prefix checks exist, but nullable cumulative usage can erase known threshold facts | Preserve prefix safety information | Low: small traces and an independent lower-bound oracle. Deepen |
| Logic of evidence and falsification | `closure` checks current typed dependencies, not truth of assertions; seeded concurrency fixture demonstrates a sequential-test blind spot | Keep structural support separate from behavioral correctness | Low for review of present contract; native reviewer calibration costs more. Deepen existing evidence boundary; no semantic-certification feature |
| Information theory | Selected context, pins, and progressive loading exist; useful-fact retention is not natively measured | Compare compact context by preservation of task-relevant facts | Requires matched native tasks. Record experiment; defer optimizer |
| Optimization and uncertain decisions | Retry limits exist; benefit/cost of another attempt is not calibrated | Make stopping decisions consider expected useful information and review cost | Requires repeated real runs and utility definitions. Keep as a decision model, no numeric policy |
| Distributed systems | Planner has dependencies/ownership; worktree isolation remains operator-verified | Reconcile causal prerequisites and independently produced artifacts | Existing DAG invalidation already covers a structural slice. No scheduler or clock system needed |
| Relativity | Concurrent observations can be received in a misleading order | Possible teaching analogy for causal order | Lamport's direct software model is simpler. Reject physical model |
| Lie groups/algebras | No demonstrated smooth symmetry or infinitesimal transformation in the failing inspector | No additional benefit identified | Stop before deeper research; no credible competing mechanism |

Before the second pass, the concrete defect, expected improvement, and low validation cost were communicated to the integrator. The second pass was limited to prefix reasoning and the evidence boundary; no open-ended literature expansion followed.

## Pass 2A: preserve information under partial observation

### Scientific basis and classification

Abstract interpretation computes useful properties through a simpler representation that conservatively describes concrete possibilities. Cousot and Cousot's 1977 paper provides the foundational framework. Here the proposed application is a **small formal abstraction of the record's numeric semantics**, not abstract interpretation of an LLM's reasoning. A known nonnegative consumption contributes its exact value; an unknown entry contributes an unknown nonnegative quantity. Consequently, the sum of known entries remains a lower bound even when the exact total is unavailable. [Cousot and Cousot, 1977, author-hosted paper summary and bibliography](https://www.di.ens.fr/~cousot/COUSOTpapers/POPL77.shtml).

Temporal logic describes properties over evolving states. Finite-state model checking checks such properties against an explicit transition model; Clarke and Emerson's paper supplies the original concurrent-program example. Our probe is **bounded enumeration of finite traces**, not a CTL model checker or a proof over all agent behavior. The useful invariant is that later observations must not erase an already demonstrable threshold crossing. [Clarke and Emerson, Logic of Programs 1981, proceedings publication 1982](https://link.springer.com/chapter/10.1007/BFb0025774).

### Local finding and proposed decision

In `src/loop.ts`, once an entry is null, the prefix accumulator becomes null for all later entries. Final totals similarly remain null. Returning a null exact total is correct. Discarding the lower bound is avoidable information loss.

Minimal reproduction: token observations `[null, 230, 0]`, threshold 200, three passing attempts with explicit diagnosis/adjustment, progress true, and attempt/stagnation limits above three. Baseline returns `needs-reconciliation`, `observed.tokens: null`, empty `findings`, and empty `limitReasons`. Nevertheless, attempt 2 alone proves that the threshold was reached before attempt 3.

Recommended change: preserve exact-total uncertainty and known consumption separately. Use the known nonnegative lower bound to report threshold reasons and post-limit attempts. Retain `observed.tokens: null` and reconciliation whenever the selected threshold still has unknown usage. Do the equivalent for duration. Do not infer provider hard caps, cost, or omitted events. Use safe arithmetic or threshold saturation; summing individually safe integers can exceed the safe integer range.

Assumptions: records obey current nonnegative integer validation; entries use consistent units; the supplied order is authoritative. Negative refunds, overlapping wall-clock intervals, dishonest records, omissions, rewritten limits, or host-side execution are outside this model. Observed durations are the existing per-attempt accounting field, not independently established elapsed process time.

### Fixed experiment and baseline

Protocol: enumerate every token sequence of lengths 1, 2, and 3 over `[null, 0, 199, 200, 201]`. All attempts have progress true, passing outcome, evidence ID, diagnosis/adjustment, duration zero. Token threshold is 200; attempt and stagnation limits are eight; duration threshold is null. An independent BigInt sum of known entries checks threshold and prefix expectations. Unknown contributes zero **only to this lower bound**, never to the claimed exact observed total.

| Measure | Pre-correction result |
|---|---:|
| Synthetic traces enumerated | 155 |
| Traces containing unknown usage | 71 |
| Traces missing a demonstrable final token-threshold diagnostic | 49 |
| Traces missing at least one demonstrable post-threshold attempt diagnostic | 20 |
| Unknown-usage traces incorrectly admitted as eligible | 0 |

The 49 and 20 categories overlap. They are counts of traces, not counts of individual missing findings. Only this selected alphabet and maximum length were explored. The baseline already fails closed on unknown usage; the fix improves diagnostic precision.

Refutation: reject a proposed improvement if the same immutable protocol still misses demonstrable facts, newly admits unknown bounded consumption, converts the exact unknown total into a number, or flags a threshold without sufficient information. Compare against the existing null-propagating implementation, then against the simplest separate known-sum/unknown-flag implementation. A general interval library or solver must offer additional demonstrated value to displace that simple baseline. No such value was found.

Artifacts prepared for integration:

- [`loop-probe.mjs`](../evaluation/hardening-audit/loop-probe.mjs): SHA-256 `d4952425809602d756cceeac42082a4dc0fba5b8e73459f821e7cb73ea6ff3cb`.
- [`loop-baseline.json`](../evaluation/hardening-audit/loop-baseline.json): SHA-256 `bf870265f78276e2f89ae08ffc7bedffdf86fbac14ec8c5973f158eaa20a5532`.
- Run from the checkout being inspected: `node evaluation/hardening-audit/loop-probe.mjs`.

The script exits normally to produce an observation report; its exit code is not a passing acceptance verdict. Post-correction results must be recorded separately with the actual inspected revision and source hashes. The original baseline must remain unchanged.

### Independent post-correction replay and review

The implementation worker's corrected isolated controls worktree was inspected at commit `394f82338759f7bf9e19a867c9223282ade8e49e`. The exact same probe file was executed from that checkout. Its source hash remained unchanged; no cases, expectations, thresholds, ordering, or output counting rules were adjusted. The corrected source, generated output, and test diff were independently read. No blocking finding was identified in this scope.

| Fixed-protocol measure | Baseline | Corrected worker commit |
|---|---:|---:|
| Synthetic traces | 155 | 155 |
| Unknown-usage traces | 71 | 71 |
| Missing demonstrable threshold diagnostics | 49 | 0 |
| Traces missing a demonstrable post-threshold attempt diagnostic | 20 | 0 |
| Unknown-usage traces incorrectly eligible | 0 | 0 |

Result file: [`loop-corrected.json`](../evaluation/hardening-audit/loop-corrected.json), SHA-256 `2a5e3f8d2c2494400a1fa61d532af67e30180a9b44c051d8e769782f2a251fbd`.

Inspected file identities:

- `src/loop.ts`: `fed81f40f0f718b4134b9b8731fe2fd60be56894a7e9afaf5a4e1c4ce33938f4`.
- `dist/loop.js`: `177a60e1a7bf79ee592dc6d3a59d0d9494ceaf294475fa49a9b00db9198bfcbb`.
- `tests/closure-loop.test.mjs`: `3a3b37a052fff027a63238e2e18e09e4c7f8298b15231554d7518bbd8b5c9463`.

Code review confirmed independent known counters, null exact totals after any unknown observation, inclusive threshold comparison, prefix checks before the next attempt, and rejection when known usage exceeds safe integer arithmetic even alongside null entries. The worker's regression cases explicitly cover token and duration fields, below/equal/above-threshold boundaries, historical known crossings followed by null, no spurious next action, and partial-unknown overflow. Those test additions were read; this research worker executed the immutable probe, not a new or widened test campaign. Integrated release verification remains the integrator's responsibility.

## Pass 2B: claims, falsification, and evidence dependency

`src/closure.ts` joins criteria to current, typed, pinned evidence and `src/checkpoint.ts` propagates invalidity through explicit dependencies. These are **formal structural checks over declared records**. They do not prove that the recorded test establishes its natural-language criterion. A test can execute the changed lines while asserting the wrong result; an intact hash only identifies bytes. This boundary is already explicitly documented and should remain.

Mutation testing deliberately perturbs programs to challenge whether tests discriminate incorrect behavior. It is an **empirical falsification technique**, not a proof that all real defects are represented by the mutations. A relevant original source is DeMillo, Lipton, and Sayward, *Hints on Test Data Selection: Help for the Practicing Programmer* (Computer, 1978); the searchable author-uploaded copy identifies DeMillo at Georgia Tech and Lipton/Sayward at Yale. The full scanned PDF was reachable but did not yield readable text in this tool, so no detailed theorem or experimental numbers from it are asserted. [Original paper scan](https://www.st.cs.uni-saarland.de/edu/recommendation-systems/papers/Hints_on_Test_Data_Selection-1.pdf).

Concrete decision: review evidence relevance against a raw business invariant, and challenge risky behavior with a controlled negative example. The existing capacity-one concurrent probe already supplies one useful example. Do not repair its intentionally defective starting implementation or relabel that single observation as reviewer calibration.

Falsifiable later comparison: give reviewers otherwise matched healthy and seeded-defect implementations, without revealing the expected verdict; record missed defects, false positives, and review time. Compare a standard raw-contract review against the added mutation-oriented instruction. Reject the additional instruction if it increases false positives or cost without detecting more relevant defects. This needs actual reviewer sessions, independent healthy controls, and a stable contract; it is not a release prerequisite created by this research. For 0.5, retaining the existing boundary is sufficient.

## Other connections: definitions, limits, and experiments

### Control theory and dynamical systems

Discrete-event supervisory control models a process as event sequences and restricts permitted behavior using a supervisor. Ramadge and Wonham study discrete, asynchronous, potentially nondeterministic processes. The DevMethod mapping is a **simplified event model**: observations feed admission decisions, while enforceable host controls would have to mediate future actions. Merely inspecting a recorded sequence is monitoring, not closed-loop control. [Ramadge and Wonham, SIAM Journal on Control and Optimization 25(1), 1987](https://epubs.siam.org/doi/abs/10.1137/0325013).

Decision improved: keep CLI inspection, the historical scoped adapter, and general runtime supervision distinct. Assumptions for a true controller include observed events, enforceable controllable actions, and a correct process/specification model. Agent text and provider consumption are only partially observable here.

Possible refutation experiment for a future adapter: exceed a run budget or interrupt a long process, then independently verify that no later dispatch occurs; compare against a simple external process timeout and fixed attempt counter. If the adapter cannot actually prevent dispatch, reject the supervision claim. Not executed in this scientific probe.

Safety certificates in constrained-control research connect an explicit system model, a policy, and a function defining permitted states; their guarantees have stated assumptions. No comparable validated state/error function exists for DevMethod's `progress` boolean. Therefore declining stagnation or several successful runs cannot establish general stability or convergence. A proposed quality score would need independently measured violations and comparisons with fixed budgets before deeper analysis. No such score is introduced. [Ma, Liu, Li, Zheng, and Chen, L4DC/PMLR 168, 2022](https://proceedings.mlr.press/v168/ma22a.html).

### Information theory and context retention

The information bottleneck seeks a compressed representation that preserves information about a selected relevant variable. It provides an **analogy/design objective**, not an implemented estimator for this project. Tishby, Pereira, and Bialek's accessible arXiv record was submitted in April 2000 and identifies Hebrew University/NEC, AT&T Shannon Laboratory, and NEC affiliations. [Original information bottleneck manuscript](https://arxiv.org/abs/physics/0004057).

Decision improved: judge a context summary by retention of required constraints, uncertainty, source authority, and actual downstream decisions, rather than token reduction alone. DevMethod lacks a known joint distribution and validated task-relevance target for formal information-bottleneck optimization.

Refutable experiment: on matched pinned tasks, compare current progressive loading, a fixed brief, and a proposed summary at the same token budget; use held-out constraint questions and actual acceptance results, recording lost facts and costs. Reject the summary policy if it saves tokens by losing critical constraints or does no better than the fixed brief. Native outcomes are not available from the present synthetic probe. No estimator, entropy dashboard, or new context file is justified for 0.5.

### Optimization and decision under uncertainty

Rational metareasoning treats further computation as an action with expected decision benefit and cost. This is a **simplified decision model** for whether to research, retry, review, or stop. Russell and Wefald's IJCAI 1989 paper explicitly discusses the cost of metareasoning and limits of the simplifying single-step assumption. Its application was game-tree search, not LLM development. [Russell and Wefald, UC Berkeley, IJCAI 1989](https://www.ijcai.org/Proceedings/89-1/Papers/053.pdf).

Decision improved: before extra work, state the unresolved observation, expected useful decision change, and validation cost. This was used to bound this research. DevMethod has no calibrated probability of retry success or common utility scale; inventing numeric expected gains would create false precision.

Refutable later experiment: matched tasks under fixed budgets compare the current retry rule against a learned/heuristic decision to continue; measure actual acceptance, tokens, wall time, and human review. Reject the extra policy when its own overhead or missed completions outweigh measured benefit. Until those data exist, current explicit limits plus diagnosis/reconciliation are the simpler baseline. No adaptive optimizer is recommended for 0.5.

### Distributed causality and coordination

Lamport's happened-before relation orders events by local process order and message transmission; concurrent events need not have a determined causal order. This is a **direct formal concept for distributed execution**, used here as a simplified mapping to task prerequisites and checkpoint dependencies. A wall-clock label or a later-arriving worker report does not establish that a worker used a newly accepted contract. The original July 1978 paper prints Massachusetts Computer Associates as Lamport's affiliation. [Lamport, original paper](https://lamport.azurewebsites.net/pubs/time-clocks.pdf).

Decision improved: require a worker result to reference the contract revision and prerequisites it actually consumed. Existing pinned source/evidence DAG checks already implement a structural subset. Hashes and a declared worktree do not enforce isolation or shared-store atomicity.

Refutable future comparison: force contract-edit and worker-result arrival into opposite orders; verify stale dependents cannot become current. Compare a version-and-dependency check against a richer logical-clock design. If the latter catches nothing additional, retain the simpler DAG. Real event collection and host dispatch remain missing assumptions, so no clock infrastructure is added.

### Optional abstract suggestions

Special relativity relates physical observations across inertial frames under specific physical postulates. Comparing independently ordered worker observations to different frames is only an **analogy**. DevMethod has no measured physical-frame transformation problem; processor latency and stale reports are addressed more directly by software causality. A proposed relativistic model would have to improve detection of stale or conflicting results over the same revision/dependency baseline; no mechanism suggesting that improvement emerged. Stop this direction. [Einstein, 1905, original paper in English translation](https://users.physics.ox.ac.uk/~rtaylor/teaching/specrel.pdf).

Lie groups/algebras were stopped at the initial relevance gate: no identified smooth symmetry, reversible continuous action, or useful infinitesimal transformation applies to the observed nullable-counter defect. No mathematical application or experimental benefit is claimed. Proving arbitrary patch operations commute would instead require concrete contracts and conflict checks; introducing Lie terminology would not supply them.

## Integration into the 27-workstream audit

| Workstreams | Scientific conclusion | Candidate action |
|---|---|---|
| 7, 14, 17 | Partial observation must preserve known threshold information | Implement and independently replay the one demonstrated loop diagnostic correction |
| 8, 9, 11, 20, 21 | Structural support and selected negative examples do not certify semantic correctness | Preserve existing scope claims; keep native/healthy-control reviewer calibration pending |
| 4, 5, 6, 10 | Context compression must be judged by task-relevant information and revision consistency | Retain current progressive loading and pins; defer matched native comparison |
| 12, 21, 22 | Additional deliberation and harness rules have costs | Use a bounded benefit/cost gate; do not add an uncalibrated optimizer |
| 13, 15, 18 | Inspection and declared dependencies do not enforce host runtime control | Preserve explicit runtime/host limitations and reconciliation requirements |
| 27 | Scientific inspiration does not establish a general guarantee | Cite sources with scope and evidence layers; do not claim convergence/stability/superiority |

No new workstream is required. Optional experiments remain separate from release gates. Sources were accessed through public search and primary pages/manuscripts; several publisher PDFs were limited or inaccessible, as disclosed above. No scientific paper cited here tested DevMethod.
