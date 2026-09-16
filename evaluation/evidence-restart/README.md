# Repairing the known process-restart evidence gap

The new optional checker composes the frozen queue checks with the existing independent two-process restart adjudicator. Ordinary checks and calibrated lab checking now reject the known `lost-restart` defect. Neither the deliberately defective candidate nor the partial V1/V2 checker was corrected. The lab runtime and historical reports remain unchanged.

This is a **known-fault repair**, not new held-out evidence or a native-agent comparison. The [protocol](PROTOCOL.md) preceded execution of the new checker. The [red baseline](baseline-red.log) records the original partial checker exiting zero while the restart adjudicator reports both requirements failed. That baseline used Node 23.10.0; subsequent focused tests and the retained comparison used Node 24.18.0 on macOS. The baseline itself uses only built-in Node modules; no Node 23 development-tool compatibility is claimed.

## Observed comparison

[Raw results](results.json) retain exact input hashes, ordinary invocation arguments/exits/output, complete lab reports, planned invocations, durations and code-size measurements. Before the retained comparison, the integration test exercised the same known cases successfully; there was no failed new-checker result to omit or retry. This is one recorded fixed-order run, not a timing benchmark.

| Known candidate | Ordinary composed checks | Same checks through lab | Criterion outcome |
| --- | --- | --- | --- |
| Healthy | Pass | Supported | Both pass |
| Duplicate | Fail | Failed | Idempotency fails |
| Resurrection | Fail | Failed | Finality fails |
| Lost restart | Fail | Failed | Both fail |

The ordinary arm launched 4 checker entrypoints; the lab launched 16 including controls. Each completed checker invokes the original partial runner and the original adjudicator; the adjudicator launches a writer and a separate reader. This gives 20 versus 80 Node processes along the completed paths. Nested counts are derived from these fixed completed paths, not independent OS process accounting. Observed cumulative elapsed time was 630.188 ms ordinary versus 3373.277 ms lab. Controls are extra supplied evidence and extra work; this is not an equal-cost comparison.

Added maintained code is 85 lines / 3,177 bytes for the checker, 159 lines / 5,731 bytes for the comparison and 67 lines / 2,463 bytes for regression tests (311 lines / 11,371 bytes total). These mechanical source-size measurements are not author time or maintenance cost. No model cost, human-effort reduction, user preference or user benefit was measured.

**Decision: retain the process checks; prefer ordinary independent tests for this demonstrated task.** Both arms reject all three known faults and preserve healthy acceptance. Calibration adds no demonstrated correctness here. The lab remains optional when its existing receipts, freshness and control diagnostics are useful. This repair supplies no reason to add a scheduler, infer semantic coverage from text, or make the lab a compulsory completion gate.

## Reproduce and use

From a built source checkout on a supported POSIX host:

```sh
node scripts/evidence-restart-comparison.mjs
node --test tests/evidence-restart.test.mjs
```

The comparison prints a new temporary workspace and writes `results.json` there; it never overwrites this retained result. It copies the frozen inputs into an external evaluator and prepares one contract/session per known candidate. The generated evaluator can also be invoked directly:

```sh
node /printed/workspace/evaluator/restart-check.mjs /path/to/queue candidate queue-partial
```

The candidate implements the existing synchronous `createQueue(file)` interface from the [original protocol](../evidence-holdout/PROTOCOL.md). Keep all four evaluator files together. Exact lab invocation remains the standard `evidence plan/run/status` interface with the generated contract. The new runner composes assertions, validates nested verdicts and exit consistency, and returns semantic failures only after both checkers report valid observations. Unexpected imports, malformed output, timeout or process failure cannot become a fault kill.

Two focused regressions passed: identical ordinary/lab outcomes for the four known cases using real process restarts, and an unexpected candidate import crash staying unavailable/interrupted rather than becoming a semantic detection. Tests for the POSIX-only lab are skipped on Windows; Windows execution support is not claimed. Focused ESLint and formatting passed. Full repository gates, independent review and package checks belong to the integrating candidate.

The old demo application capacity defect is a separate historical issue: seed defaults once replaced existing event capacity, and the original branch already corrected it. The intentional queue restart fault is not evidence that the current volunteer application loses data. Its domain evaluator promises reopening in one process, while its demonstration adds real process probes; neither proves crash durability or concurrent-writer safety.
