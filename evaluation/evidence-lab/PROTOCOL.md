# Evidence calibration selection protocol

Protocol version: 1, frozen before any experimental subprocess execution on 2026-09-15. Its SHA-256 is included in each result. This is a deterministic mechanism experiment, not an evaluation of a coding model, reviewer accuracy, or native DevMethod/BMAD usage. All cases below are development cases; none is held out. No claim of novelty is tested.

## Question and predeclared decision

Can checking that a criterion accepts a known healthy control and rejects a known fault reduce misleading green results enough to justify an optional preflight? Does selecting from three candidates with the same oracle repair a weak oracle?

Prefer the simplest mechanism that detects an observed failure class. Adopt calibration only as a scoped diagnostic if it prevents acceptance under tautological/broken checks while preserving acceptance of healthy candidates under discriminating checks. Reject any interpretation as semantic certification if a partial oracle passes calibration and accepts an unrepresented fault. Do not select a portfolio as the remedy for weak evidence unless it improves actual delivered correctness with that evidence, and record its additional executions. Native model superiority remains untested regardless of outcomes.

## Fixed domain contracts and implementations

| Domain | Contract | Healthy | Primary fault/control | Secondary fault |
| --- | --- | --- | --- | --- |
| Capacity booking | For integer capacity >= 0, occupied between 0 and capacity, and integer quantity, return remaining places only if quantity > 0 and occupied + quantity <= capacity; otherwise return null. No persistence or concurrency claim. | Enforce both conditions | Check quantity against capacity, ignoring occupied places | Accept zero/negative quantities |
| Cents invoice | For small valid nonnegative integer unit prices, positive integer quantities, and integer discount basis points 0–10000, sum line subtotals, apply discount once, and round final cents half upward. Overflow and invalid inputs excluded. | Multiply each unit price by quantity and round final total | Ignore quantities | Floor final discounted cents |

The known fault control is the primary fault. A candidate is either healthy, primary fault, or secondary fault. Controls and ground truth are supplied by this experiment's author, not inferred from the candidate's test results. This common authorship is a major limitation.

## Fixed oracle types

1. **Strong**: capacity includes exact fit, overflow, and nonpositive quantity; invoice includes multiple quantities, rounding, and full discount. This is strong for the seeded cases, not exhaustive.
2. **Partial**: capacity includes exact fit/overflow but omits nonpositive quantities; invoice checks line quantities without fractional-cent discount rounding. It should expose overinterpretation of calibration.
3. **Tautological**: compare a deterministic invocation with itself; no independently expected result.
4. **Always-fail**: an unconditional criterion assertion failure, including on the healthy control.
5. **Broken-import**: import a nonexistent module, a process/infrastructure failure, never a successful fault kill.

Each oracle and implementation is retained in the executable source and hashed into the result. Child checks distinguish a criterion assertion failure (exit 1 and structured assertion result) from a crash/import/runtime error (exit 2), timeout, signal, or malformed/missing output. Only an observed criterion assertion failure qualifies as rejection of a fault control; a generic nonzero exit never does.

## Arms, order and budgets

- **A — Candidate only:** run each oracle once on all three implementations in each domain; accept exactly on a valid pass. 30 subprocesses.
- **B — Calibrated oracle:** run each oracle on healthy and primary-fault controls first, even when the first control fails; calibration is valid only for healthy pass plus fault criterion-failure. Run all three candidates only for valid calibrations, with no result reuse from A. At most 20 + 30 subprocesses; for the declared fixtures, strong and partial yield 20 + 12 = 32. Invalid calibration returns `invalid-oracle`, distinct from a candidate rejection.
- **C — Three-candidate portfolio:** run each oracle on all three implementations, then select the first passing one in ascending SHA-256 order of `DevMethod-evidence-lab-v1:<domain>:<candidate-id>`. IDs are `healthy`, `primary-fault`, `secondary-fault`. This fixed seed/order is independent of observed test results and cannot be changed after inspection. No additional reviewer or oracle is supplied. 30 subprocesses.

Fixed domain order: capacity booking, then cents invoice. Oracle order as above; implementation order healthy, primary fault, secondary fault. Arms A, B, C run in that order. Do not randomize or repeat after observing outcomes. Launch at most 100 experimental subprocesses overall and stop before violating the cap. Each child has a 1000 ms timeout and 16 KiB output cap; no retry, network, paid API, installation, or agent generation. Expected count is 92. Calibration may consume more process budget than A/C because it has two additional supplied controls; no equal-cost superiority claim follows. Per-arm complete counts and wall time expose the tradeoff. Portfolio creation costs are unavailable because these are fixed implementations.

## Outcomes and denominators

Preserve every child launch and arm decision. Report candidate false acceptance / known faulty candidates and false rejection / known healthy candidates for A/B. For B additionally show invalid-oracle counts and healthy candidates withheld by invalid calibration; do not silently count those as a correct implementation failing its criterion. For C report wrong selections / portfolios, no selection / portfolios, selected identity and first-candidate identity, plus selected correctness versus the same first candidate under A. Do not pool A/B candidate classifications with C portfolio selections into a headline score.

Also report total child executions, cumulative child time, arm wall time, each child's elapsed time, invalid healthy/fault controls, criterion failures, infrastructure errors, timeouts and output-protocol errors. Runtime is descriptive from a single sequential run, not a latency benchmark. Tokens, model cost, user interruptions, UX quality, real task completion and maintenance burden are unmeasured.

## Falsifiers and simpler alternatives

- Calibration fails its narrow purpose if an always-fail, tautological or broken-import check is declared valid; it adds unacceptable mechanism rigidity if it prevents a healthy candidate passing under the strong oracle.
- Calibration-as-certification is falsified by an accepted secondary fault under a calibrated partial oracle. Do not repair that oracle or add a control after seeing the result to improve the reported score.
- Portfolio selection fails as an evidence-quality remedy if a selected candidate is wrong under a weak oracle, or if it cannot distinguish healthy and faulty results even when an accidental choice is healthy. Results depend on the fixed candidate pool/order and are not general model selection evidence.
- A simpler alternative is one trusted requirement assertion with a known expected value, without an execution controller. An independent reviewer or separately authored acceptance check may be preferable. The present experiment does not compare those people's accuracy or costs.

An independently authored held-out case must be reported separately, with its authorship and creation time, and must not alter these selection cases. Production integration needs fresh evidence, provenance checks and an explicit statement that controls cover only their demonstrated distinctions.

## Reproduction

Run `node evaluation/evidence-lab/selection.mjs` from the repository root. The script writes `evaluation/evidence-lab/results.json` atomically after collecting all results and emits a compact summary. Preserve the committed original before running if actual timings matter. No dependency installation is needed. Result hashes pin this protocol and the full script; a base repository revision is recorded from Git when available. Git metadata inspection is not an experimental evaluator subprocess.
