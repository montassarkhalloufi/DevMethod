# Calibrate evidence before accepting a candidate

An execution receipt or a pinned passing log cannot establish that its assertions examine the intended behavior. This development fixture tests a small response: require a criterion to accept a known healthy control and fail a known faulty control before applying it to candidate code. It complements the existing [H08 semantic probe](../hardening-audit/semantic-probe.mjs).

The [protocol](PROTOCOL.md) was written before the run. The [executable](selection.mjs) contains every implementation, oracle, classification rule and fixed portfolio ordering seed. The [original results](results.json) retain all 92 actual subprocess outcomes, source hashes, control decisions, selected identities and timings. No coding model was invoked. The cases are authored development inputs, not hidden or independently judged evaluations.

Run from the repository root with Node.js 22+:

```sh
node evaluation/evidence-lab/selection.mjs
```

This replaces `results.json`, including runtime-dependent metadata. Preserve the original if comparing runs. No dependencies, network access or paid service are needed. Each evaluator child has a one-second timeout and bounded output; the entire experiment refuses more than 100 evaluator subprocesses. The classifier distinguishes criterion assertion failures from import/runtime errors, timeouts and malformed output. A failed import cannot count as detecting the faulty behavior.

## Observations from the recorded run

| Measure | A: candidate only | B: calibrated criterion | C: three-candidate portfolio |
| --- | ---: | ---: | ---: |
| Evaluator executions | 30 | 32 | 30 |
| Arm wall time, one run | 1629.682 ms | 1778.541 ms | 1689.917 ms |
| Faulty candidates accepted | 6 / 20 | 2 / 20 | Not the same denominator |
| Healthy candidates rejected by a criterion | 2 / 10 | 0 / 10 | Not the same denominator |
| Healthy candidates withheld by invalid calibration | 0 / 10 | 6 / 10 | Not applicable |
| Healthy candidates with unavailable checks | 2 / 10 | 0 / 10 | Not applicable |
| Invalid calibrations | Not applicable | 6 / 10 | Not applicable |
| Healthy / wrong / no selection | Not applicable | Not applicable | 6 / 0 / 4, over 10 portfolios |

No timeout or output-protocol error occurred. Broken imports caused 6 infrastructure errors in A, 4 during B's controls, and 6 in C. Raw per-process details are retained. These times are descriptive on one machine, with a fixed arm order and no repetitions; they are not a latency benchmark.

| Oracle type, across both domains | A faulty acceptance | B faulty acceptance | B calibration result | C selected outcome |
| --- | ---: | ---: | --- | --- |
| Strong for seeded cases | 0 / 4 | 0 / 4 | Valid in both domains | Healthy in both domains |
| Partial | 2 / 4 | 2 / 4 | Valid in both domains | Healthy in both domains |
| Tautological | 4 / 4 | 0 / 4; all withheld | Invalid: faulty control passes | Healthy in both domains |
| Always-fail | 0 / 4 | 0 / 4; all withheld | Invalid: healthy control fails | No selection |
| Broken-import | 0 / 4; checks unavailable | 0 / 4; all withheld | Invalid: both controls crash | No selection |

Calibration reduced acceptance of seeded faults from 6 to 2 while withholding every candidate under three unusable oracle types. Its superficially better false-rejection figure comes with six healthy candidates withheld; it did not make those checks useful. The added controls cost two more executions than exhaustive candidate-only checking in this exact suite because invalid calibrations prevented six candidate launches per rejected oracle type. On a strong oracle alone, B needs five executions versus A's three, or three executions versus one for a single candidate. Controls are additional supplied knowledge and their authoring cost is unmeasured.

The partial oracle falsified calibration-as-certification: it rejected the primary calibration fault but accepted the secondary fault in each domain. The capacity defect accepts nonpositive quantities; the invoice defect floors fractional cents. Adding controls after seeing this failure would contaminate the selection experiment, so the original oracle/control set was retained.

The portfolio result was better than the initially suspected failure: the predeclared hash order happened to put the healthy implementation first in both domains. Therefore it made zero wrong selections, even with tautological checks. This is a real retained result, not evidence that the weak oracle distinguished correctness. The same first candidate already passed A in every one of the six successful portfolio cells. Against that matched single-candidate choice, the portfolio changed no selection outcome while running three checks instead of one. Neither a portfolio correctness disadvantage nor a general portfolio advantage was demonstrated. Candidate generation costs, independent judging and alternative orderings were not evaluated.

## Selection and limits

The defensible implementation direction is an optional calibrated-evidence diagnostic with explicit `invalid-oracle`, `criterion-failure` and `infrastructure-error` states. It can prevent the observed tautological/always-fail/broken-check confusion and show the exact distinctions a check demonstrated. A green calibration must never be described as proof of complete product correctness, requirement coverage or safe delivery. Users still need meaningful acceptance criteria and controls.

A trusted expected-value assertion remains the simpler alternative when its relevance is already established. This experiment does not measure whether a human or model writes better assertions, finds omitted requirements, improves product UX, or maintains code more reliably. It has two tiny deterministic domains, hand-authored faults, common authorship of contracts and checks, no concurrency/persistence, one fixed candidate pool/order, no adversarial protection and no native model baseline. Acceptance counts use repeated oracle/candidate combinations, not twenty independent real-world tasks. There is no statistical superiority claim.

An independently authored held-out case, if added, belongs in a separate result with its own contract and provenance. These selection cases must remain development-only. Larger native comparisons need matched host/model versions, task prompts, actual usage costs, independent delivered-product judgments, fresh sessions and retained failures under the repository's [evaluation protocol](../../docs/EVALUATION.md).
