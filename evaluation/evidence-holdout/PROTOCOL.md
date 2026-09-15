# Durable queue: independently authored post-design evaluation

Frozen before runtime execution on 2026-09-15. Base repository: `6f31552`.
The author read the public runner contract and prior ADRs, but never the new runtime source, calibration code, or its results. This third domain was not used to select the mechanism. This is **not** a blinded native-agent benchmark: fixtures are deterministic, their labels are visible, and all workers share storage. Controls and candidate implementations were authored here independently of the capacity/invoice demo producer. No paid/model call is involved.

## Requirements and fixture boundary

Fictional string IDs only. `createQueue(path)` exposes synchronous `enqueue(id): boolean`, `complete(id): boolean`, and `pending(): string[]`. A false enqueue result means that identity already exists, including a completed identity. Pending identities and completed identities must survive normal process exit/restart. Atomic crashes, concurrent writers, invalid IDs, filesystem corruption, and distributed durability are outside this fixture's scope.

`controls.mjs` represents state with separate pending/completed arrays. Candidates use rows carrying lifecycle state. The modes `healthy`, `duplicate`, and `resurrect` select controls. The mode `candidate` imports only the selected candidate directory's `queue.mjs`. Both criteria must appear in the runner's strict verdict object. Exceptions produce execution failures, never a successful calibrated defect detection.

## Frozen predictions — not results

| Candidate/control | Partial checker idempotency | Partial checker finality | Independent restart adjudication |
| --- | --- | --- | --- |
| Healthy control | passed | passed | Not scheduled |
| Duplicate control | failed | passed | Not scheduled |
| Resurrection control | passed | failed | Not scheduled |
| `candidates/healthy` | passed | passed | Durability and finality pass |
| `candidates/duplicate` | failed | passed | Durability and finality pass; duplication is a separate defect |
| `candidates/resurrect` | passed | failed | Durability passes, finality fails |
| `candidates/lost-restart` | passed | passed | Durability and finality fail |

The last defect is deliberately absent from calibration controls. The partial checker never reopens storage although both criteria require restart behavior. Its successful calibration must **not** be reported as semantic independence, complete requirement coverage, or evidence that all product defects are detected. A false acceptance here is the prespecified falsifier of that stronger claim.

## Freeze and execution order

`SHA256SUMS` binds this protocol, contract, checker, controls, adjudicator, and all candidate modules. Verify it from this directory with `sha256sum -c SHA256SUMS` before executing. Only `node --check` syntax validation was allowed before the freeze; no runtime or checker execution occurred. The parent records actual runtime revision and result files separately, preserving this frozen input population.

1. Evaluate controls and the four candidates through the integrated runtime, preserving all verdicts, counts, elapsed time and any execution failures. Maximum: 24 runner subprocesses, 3 seconds each, no automatic retries.
2. Separately run `node adjudicate.mjs /absolute/path/to/candidate` for each candidate. Maximum: 8 fresh child processes. The adjudicator writes in one process, exits, then opens the same storage in another process. It checks both retained pending work and retry of a previously completed ID. It does not use the partial checker's result and is not part of its calibration set.
3. Report the partial checker's misses alongside detected defects and the healthy control. If observed outcomes differ from predictions, preserve the original population and diagnose in a new version; do not silently revise this manifest or remove a failing case.

No assertion of statistical generalization, actual user preference, production durability, cost savings, or native agent quality is supported by this fixture. No observations have been made at freeze time.
