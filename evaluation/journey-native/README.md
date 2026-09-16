# Native journey smoke — one interrupted invocation

The first planned invocation produced a working fictional Repair Café CLI, but reached its 120-second deadline before final completion/accounting. The supervisor stopped immediately. **One of six slots attempted, zero completed native turns; five slots not run.** No A/B/C comparison or maintenance chain completed.

| Slot | Native state | Product observation |
| --- | --- | --- |
| A-initial | Timeout, 120.009 s, usage unknown | Independent checks passed all four criteria through 27 separate CLI processes; protected inputs unchanged |
| B-initial | Not run | Unknown |
| C-initial | Not run | Unknown |
| C-maintenance | Not run | Unknown |
| B-maintenance | Not run | Unknown |
| A-maintenance | Not run | Unknown |

The [frozen protocol](../../docs/research/journey-native-protocol-2026-09-16.md), [inputs](frozen-inputs.json), [results](results.json), [selected transcript excerpts](trace-excerpts.json), [artifact hashes](artifact-hashes.json), [independent review](review.md) and [unaltered application](artifacts/A-initial/app.mjs) separate the product outcome from native completion. The original [handoff](artifacts/A-initial/HANDOFF.md) is retained with its stale “pending final test run” text. It has not been repaired after the trial.

The native worker executed the ordinary supplied suite successfully. Its first additional edge-check command failed because the shell could not create a heredoc temporary file; its alternative command succeeded and reported four focused cases. The last retained event is that successful tool completion. No final answer, `turn.completed` or usage event arrived before timeout. This is an interrupted execution, not a false successful delivery claim.

No token or dollar total is available. `completedTurnTokensObserved: 0` is an empty sum of completed-turn reports, **not zero consumption**. Setup took 12.897 s and independent evaluation 0.85 s. Fixture/checker authoring, calibration, implementation and review were separate work; their elapsed time and model consumption were not independently metered. They are not treated as free.

The existing supervisor performed process-group shutdown and returned. A post-stop process/cwd inspection found no known Codex, Node or shell process in this campaign. No group PID was retained, so the check is narrower than a direct group-membership audit. Remote inference cancellation and final billing remain unverified. No retry, alternate route or subsequent native call occurred.

Before launch, automatic approval review rejected the command as insufficiently authorized quota use. The same command was accepted after the existing user request and fixed budget were presented for review. The rejected attempt created no model process or ledger slot. This was not a model retry or a second campaign.

## Review and verification

The workflow-audit worker authored/calibrated the fixture separately from the native product author, then reviewed the exact app/handoff hashes and retained transcript read-only. The operator separately inspected the published fictional artifacts and removed machine-specific paths from selected output. This is independent of the native producer, not a blinded external user study.

Maintained code checks: 11 focused supervisor/runner tests; full suite 276 passing plus two HTTP tests initially blocked by sandbox loopback permissions, then those two passing under authorized local execution; lint, formatting and Markdown link check passed. No unchanged green suite was rerun. Native results are not derived from these repository tests.

To reproduce product assertions without any model invocation: `node evaluation/journey-native/fixture/evaluate.mjs evaluation/journey-native/artifacts/A-initial initial`. The fixture's maintenance stage is retained as planned input, not native evidence. Its calibration belongs to [the fixture protocol](fixture/PROTOCOL.md).

The retained private campaign is `/private/tmp/devmethod-native-campaign-20260916`: `frozen.json`, immutable `ledger/A-initial.json`, raw `private/A-initial.jsonl`, stderr and full artifact snapshot. The transcript digest is `ff499061fe2bfa256d5f82872ba1a6b2d4f7c8fc631941f908c852cff01fb061`. Public hashes verify bytes, not authenticity by themselves.

Continuation requires reconciliation of this interrupted slot and unknown usage, then an explicit bounded decision about any new series. Do not resume this runner or reset its ledger to obtain a favorable result. The result is **indeterminate** for comparative benefit; preserve ordinary independent tests as the simpler default until useful incremental value is observed.
