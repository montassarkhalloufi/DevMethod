# Independent review: native pilot ledger usage and terminal-record compatibility

Date: 2026-09-15. Reviewer: independent scientific/control audit worker.

Final verdict: **no blocking finding identified in this bounded change** at commit `31217450856e4ffb165f7c9f0e8433548acb81d3` in the isolated controls worktree. No model was invoked, no native host process was dispatched, and no repository file was edited by this reviewer.

## Exact scope

Reviewed the native-ledger change against base `394f82338759f7bf9e19a867c9223282ade8e49e`, initially committed as `85cd0c6e49d8c2a60faf0f2da212c1b18cde6d86`, followed by the terminal-state compatibility correction `31217450856e4ffb165f7c9f0e8433548acb81d3`.

Changed files reviewed: `scripts/native-host.mjs`, `tests/native-host.test.mjs`, and `docs/NATIVE-PILOT.md`. The previously reviewed `loop` change was not retested or reassessed.

The review also read every production `recordRun` caller and its immediate result-shaping function, solely to assess this change's compatibility:

| Caller | Result/usage source | Compatible terminal records |
|---|---|---|
| `scripts/run-native-pilot.mjs` | `supervise` and `codexUsage` | exited, failed, unavailable, cancelled, timeout, output-limit; numeric usage object or null |
| `scripts/run-comparison-v2.mjs` | `runCodexTask` and `meterCodexTree` | exited, failed, cancelled, timeout, interrupted, incomplete; numeric usage object or null |
| `scripts/probe-codex-children.mjs` | Explicit exited/failed mapping and `meterCodexTree` | exited/failed with supplementary probe status and metadata; numeric usage object or null |

An interrupted/incomplete compatibility problem in the initial terminal whitelist was identified by the implementation worker and relayed by the integrator during review. The final commit explicitly permits recording these outcomes while keeping them ineligible for later admission. This review's passing verdict applies to the corrected commit, not the initial whitelist.

## Findings checked

1. **Malformed usage cannot bypass admission via NaN.** `observedTokens` requires an object and both counts to be nonnegative safe integers. Missing fields, empty object, arrays, null count fields, strings, negative/fractional counts, and unsafe integers fail validation. Legacy records are revalidated on admission; a previously written malformed object cannot evade the budget comparison.
2. **Arithmetic remains checked at both levels.** Input/output addition is validated within each record. Accumulation across records is checked separately. Equality uses the existing inclusive stop condition. An overflow is rejected rather than rounded into an admissible total.
3. **Invalid finalization does not rewrite a run slot.** Result-shape, terminal-status, and usage validation precede creation of the temporary result file. Failure leaves the prior running record for reconciliation. Admission creates no new run record after a rejected history; its lock is released in the existing `finally` path.
4. **Unknown is preserved as unknown.** Explicit null usage may be finalized, preserving the terminal outcome and any supplemental result metadata. Missing usage is not silently normalized to zero. `reserveRun` requires reconciliation for null usage or any status other than exited/failed, including interrupted/incomplete even when their counts are known.
5. **Existing adapter shapes remain usable.** Genuine zero input/output counts are accepted. `cachedInputTokens`, `costUSD`, thread information, and unrelated result metadata are retained; the budget uses input/output only. The two adapter meters may return null, and the ledger preserves it. An adapter producing an unsafe aggregate is now rejected at the ledger boundary.
6. **Documentation remains scoped.** The new paragraph describes an observed inter-run admission stop and reconciliation. It does not claim a hard provider token cap, general host validation, semantic task acceptance, or native Windows cancellation evidence.

The existing assumptions about a private ledger outside worker-writable roots, trusted operator ownership, and bounded optional fixture scope remain. This change is not reviewed as an adversarial filesystem store or a generic concurrent database.

## Executed independent checks

Two bounded probe protocols were executed through an inline Node ES module from the final checkout, using disposable local directories removed afterward. No model invocation or `supervise` process dispatch occurred.

**Probe 1 — actual adapter zero usage and inclusive threshold.** Called `codexUsage` on a synthetic completed-turn event with zero input/output/cached counts, finalized the first run, and verified the usage object survived byte serialization with `costUSD: null`. A second run was admitted and finalized with input 1/output 0. Admission with `observedTokenStop: 1` was rejected; no denied slot or lingering lock existed. Result: passed.

**Probe 2 — actual comparison adapter terminal outcomes with injected RPC.** Called `runCodexTask` with its existing `rpcFactory` dependency injection. The fake RPC emitted a completed root turn with status interrupted, or a completed root plus an active child requiring interruption. The first path produced `interrupted` with known input 2/output 1; the second produced `incomplete` with null usage because child consumption was unavailable. Both results were finalized through `recordRun`, reread, and compared to the actual returned status/usage. Both subsequent admissions were rejected for reconciliation and created no second slot. Result: both branches passed.

Observed probe output:

```json
{
  "format": 1,
  "reviewedCommit": "31217450856e4ffb165f7c9f0e8433548acb81d3",
  "modelInvocations": 0,
  "results": [
    {
      "probe": "actual-codexUsage-zero-then-threshold-equality",
      "outcome": "passed",
      "zeroUsage": { "inputTokens": 0, "outputTokens": 0, "cachedInputTokens": 0, "costUSD": null }
    },
    {
      "probe": "injected-rpc-caller-terminal-retention",
      "mode": "interrupted",
      "outcome": "passed",
      "retainedUsage": { "inputTokens": 2, "outputTokens": 1, "costUSD": null },
      "nextAdmission": "blocked"
    },
    {
      "probe": "injected-rpc-caller-terminal-retention",
      "mode": "incomplete",
      "outcome": "passed",
      "retainedUsage": null,
      "nextAdmission": "blocked"
    }
  ]
}
```

The added malformed-record, aggregate-overflow, zero-usage, and terminal-retention tests were read. The implementation worker reported a green 172-test suite including nine native-host tests; that full suite was not independently rerun by this reviewer. Final integrated checks remain separate from these two probes. Fake RPC results do not constitute native Codex validation.

## Inspected file hashes

SHA-256 at the final reviewed checkout:

| File | SHA-256 |
|---|---|
| `scripts/native-host.mjs` | `70daf729923410a1e554c6d5b2060e38f752f87e87fa1a5b8637bce6b51e392f` |
| `tests/native-host.test.mjs` | `a4611ea425a2da5c1641865d524c0bf3a4ea0232c93fb2c46e422186e07e060c` |
| `docs/NATIVE-PILOT.md` | `418d84950993384ef9313e3897bcc79fdce58885e4c66a36c3cf02cab9972e6d` |
| `scripts/hosts/codex-task.mjs` | `e2bf859a68628d8a3fe45c35aa4c848568a5e7653fbe5fa0acdce8361c5ba631` |
| `scripts/hosts/codex-meter.mjs` | `f48093ce35db8114f05455b51ea7a4539a18782cfa805dc0308c9691cbdaca4b` |
| `scripts/hosts/codex.mjs` | `7484ccc4ef31230e61c061db5cfe9666710d8e716fc2bf40aefd44d740ad0c85` |

This scoped review supports integrating the correction for exact-candidate validation. It does not authorize merge, package publication, native execution, deployment, or any unrelated work.
