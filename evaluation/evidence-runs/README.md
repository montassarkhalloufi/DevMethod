# Integrated evidence lab observations

Research date: 2026-09-15. These are local deterministic executions and a generated application demonstration, not matched native model comparisons. The source tree and final package gates are identified in the draft PR.

## Preserved failures that changed the implementation

1. [First integration](integration-exit-failure.log): the independently authored adapter emitted valid failed verdicts and exit 1. The initial runtime expected exit 0 for every valid report and incorrectly halted. A red regression confirmed the mismatch. The final protocol requires exit 0 with all-passed or exit 1 with at least one failed criterion, after validating the complete JSON envelope; contradictions and crashes interrupt.
2. [Second integration](integration-correlated-fault.log): genuine idempotency and durability faults affected more than one criterion. The runtime's unrequested non-target-pass restriction rejected these valid controls. A red regression confirmed that excessive rigidity. The correction requires the target to fail while allowing other criteria to fail; healthy controls still must pass everything. The independent controls were preserved.
3. [Queue V1](holdout-v1-blocked.json): the frozen partial checker reported failures with exit 0 because its author had not received the exit-code detail. All four candidates were blocked before candidate execution. The [V2 protocol](../evidence-holdout/PROTOCOL-V2.md) changes only reporting, keeps every V1 file/semantic assertion and records the unsuccessful first run. This was a feasibility correction, not an improved oracle.
4. The application's initial seed-derived read behavior would silently change saved event capacity after a default change. The application worker reproduced `4 !== 3` with a temporary changed module, then corrected persistence. Its retained regression now checks old event capacity/reservations/bytes and new event defaults.

Failed application sessions were never reset. Subsequent runs are distinct development experiments after identified software/protocol corrections, with the failed traces retained.

## What the post-design population established

The [queue population](../evidence-holdout/PROTOCOL.md) was authored after the public runtime contract was fixed, independently of the producer and without reading runtime implementation or selection results. It was not used to choose the architecture. Labels are visible; its author wrote both candidates and controls. It is not a blinded product benchmark.

| Candidate | Partial lab evidence | Independent process-restart behavior |
| --- | --- | --- |
| Healthy | Supported | Persistence and finality pass |
| Duplicate | Failed | Restart checks pass; duplication is a separate caught defect |
| Resurrection | Failed | Persistence passes; finality fails |
| Lost restart | **Supported despite defect** | **Persistence and finality fail** |

V2 runs all four candidates uniformly: 16 runner invocations plus 8 restart-adjudication child processes. The last row is a retained false support for the broader intended requirement. It refutes calibration-as-certification. The partial checker has no restart scenario; hashes and a complete criterion mapping cannot create that missing observation. No extra control was added to improve this result.

## Reproduce and interpret the application journey

`node scripts/evidence-demo.mjs` creates an independent working app copy and evaluator, preserves every CLI report, demonstrates a vacuous checker failing, replaces it with independent assertions, records supported evidence, resumes through a new process, changes new-event defaults, observes stale evidence, verifies the new version and independently reopens both old and new event files. A separate predeclared stop probe retains two same-signature failures and proves a new permit does not erase its halt.

The actual UI event handlers also run through JSDOM against the real HTTP application in `tests/evidence-application.test.mjs`: reserve until full, show reference, cancel and restore capacity, and retry a lost response without creating another booking. This is DOM/HTTP integration, **not real-browser rendering, accessibility or visual quality evidence**. Cloud Browser denied the local URL by policy; no alternate browser route was attempted. The source still provides a responsive interface for a user's local browser.

## Claims and open comparisons

The [selection experiment](../evidence-lab/README.md) showed fewer accepted seeded faults with calibration, alongside withheld healthy candidates and a null portfolio outcome. Good simple independent checks matched its seeded correctness. The lab adds explicit bounded execution, uncertainty and freshness handling; their end-to-end user benefit and total authoring/maintenance cost remain unmeasured.

No new Codex, Claude Code, Cursor, BMAD, Lovable or managed-agent trial was run. No external user was contacted. Model tokens/dollars are unavailable; local subprocess counts and timings must not be described as model cost. The [native admission plan](../../docs/research/evidence-native-protocol.md) keeps those comparisons blocked until exact host/model/access/usage and new task inputs are available.

## Retained final execution files

- [Application journey](application-journey.json): 19 observations (16 CLI calls and three store-process probes) and old/new event maintenance values.
- [Queue V2 outcomes](holdout-v2-results.json): four results and independent restart adjudication, including the false support.
- [Execution inputs](execution-inputs.json): exact local source, evaluator and test hashes; final reviewed Git tree and package gates are recorded in the draft PR.

Absolute temporary paths, timestamps, random reservation IDs and measured durations describe the original machine execution. Reproduction should match semantic outcomes, not these incidental values. Model usage/cost and real-browser/user scores remain unmeasured.

## Independent pre-PR review corrections

Two read-only reviewers inspected commit `64c1093629e0751567028beb08eda6319158d3e0` (tree `1130f7da73a9bc1a04ae2f18a2210a22d9d09362`). Their bounded review found three P2 defects, not evidence of general product superiority:

1. Tightening the no-progress limit could start another complete attempt before stopping. The [retained red regression](review-runtime-red.log) reproduced the extra attempt. Effective limits and history are now checked before pending intent or subprocess launch; the regression checks unchanged invocation and attempt counts.
2. Journal enum validation coerced arrays into strings. A singleton outcome array could escape scalar validation. The same red log records the accepted corrupt state; strict string membership now rejects it without rewriting the record.
3. Demonstration and holdout scripts parsed some child output before retaining raw exit/signal/error/stdout/stderr. Malformed output could erase useful failure evidence. The correction saves the raw invocation before parsing or assertions, with injected malformed/empty/timeout regressions.

The draft PR binds the final correction review and gates to its exact tree. These reviews did not execute native agents, validate browser layout, or claim hostile-code isolation.

The initial limit correction exposed another history-bound violation under a new revision; [its red regressions](review-runtime-delta-red.log) are retained. Final preflight uses prospective limits without rewriting metadata for completed attempts and records revision adoption only with an actual pending attempt. The trace worker's [red excerpt](review-traces-red-excerpt.log) is labelled as a transcription of its executed tool output, not a raw redirected process log. Both reviewers accepted their correction deltas; the PR identifies the final commit/tree.

## Platform CI corrections

The first platform workflow on PR head `6cc3f4ce38ac27e99dccc0e8dbdc965925a14e78` passed Linux and the separate fullstack workflow. It exposed two portability faults:

- [Windows formatting failure](ci-windows-format-failure.log): new application/evaluator files lacked the maintained LF checkout attributes. [Git checkout reproduction](checkout-line-endings.json) confirms CRLF before and LF after the attributes fix, which also preserves frozen experiment bytes. Native Windows CI remains the platform gate.
- [macOS packed-demo failure](ci-macos-package-failure.log): the OS temporary directory uses a symbolic prefix. Demonstration workspaces must start from the canonical OS temp directory, while the runtime continues to reject unreviewed symbolic paths. The [retained red regression](temp-alias-red.log) reproduces the problem on POSIX; the corrected test runs the real journey through an aliased temporary base. Windows skips this actual POSIX execution test, while its eight protocol-trace tests still run.

Final platform outcomes and exact candidate are recorded in the draft PR. No native-agent evaluation is implied by these Node/OS checks.
