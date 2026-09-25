# Independent domain evaluator

Written from the public store interface without reading the producer application or the evidence runtime. The checker imports a candidate's `createStore` export only during candidate evaluation. Control runs use an independently written, deliberately small reference model.

Run from this directory:

```sh
node check.mjs /path/to/candidate healthy domain
node check.mjs /path/to/candidate capacity-fault domain
node check.mjs /path/to/candidate candidate domain
node run-controls.mjs
```

Supported modes are `healthy`, `capacity-fault`, `idempotency-fault`, `cancellation-fault`, `durability-fault`, and `candidate`. A healthy run must pass every criterion. Each fault control must fail its declared target through an explicit business assertion. The all-green `weak-check.mjs` passes healthy controls but misses every defect and must be rejected during qualification.

The runner writes exactly one JSON result to stdout only after semantic checking completes. Semantic failures exit 1; success exits 0. Missing exports, malformed source, unknown modes and other unexpected technical errors terminate without a valid JSON verdict. Failure to import a candidate must never be counted as detection of a business defect. An expected rejection is an API call that throws; this interface does not specify error classes.

## What is measured

- Finite seat validation examples and capacity exhaustion.
- Repeated requests, conflicting parameters and reopening with the same request identity.
- Cancellation, restored availability and replay without resurrection.
- Durable active/cancelled records across successive store objects in one process.
- Live and durable state remaining unchanged after tested rejected requests.

Faults are explicitly activated defects in a fixture model, not mutations discovered in producer code. They establish sensitivity to these four behavioral faults only. They cannot certify all defects, arbitrary adversarial evaluators, filesystem crash safety, concurrent processes, security, UI quality or the user's complete intent. The independent model and its checks can still share interpretation errors because they were written by the same evaluator author. A separate author, mutation tool and real user judgments remain useful additional controls.

## Scope and maintenance

`contract.json` pins only `store.mjs`: this is **domain evidence**, with no claim of HTTP or UI coverage. `evaluatorFiles` contains every executable or configuration input read by this check. Relative paths are resolved from this evaluator directory by the invoking runtime.

For the maintenance demonstration, work on a copy. Change garden's expected capacity from 3 to 4 in `expected-seeds.json` and update the capacity description in the contract. The control model reads the same configuration. Existing successful evidence must become stale; a candidate still seeding 3 must fail the capacity criterion. Patch the candidate to seed 4 and verify again. Do not alter the checker to accommodate wrong candidate behavior.

Changing a contract description does not automatically alter test meaning. Here the seed configuration explicitly supplies the expected outcome and belongs in the evaluator digest. Other semantic changes require corresponding reviewed checks.

## Provenance

Baseline: DevMethod commit `6f31552`. Branch: `experiment/evidence-oracle`. No producer or runtime source was read during creation. `run-controls.mjs` reproduces 13 probes and retains their outputs in `control-results.json`. The control runner and result log are not inputs to the domain check itself. This artifact is an executed finite mechanism probe, not a head-to-head model benchmark or a proof of general product superiority.
