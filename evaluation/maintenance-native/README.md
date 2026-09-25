# Maintenance native admission — stopped

The frozen readiness admission on 2026-09-16 failed before any JSONL event: exit 1, `Error: Operation not permitted (os error 1)`, 0.04 seconds. The worker's two initial files are unchanged. No agent-authored test, final response or token usage was collected. This is an execution failure; it supplies no product-quality result. The independent clamp assertion fails on the unchanged deliberately faulty input, not on an agent-produced solution.

The [outcomes](outcomes.json) retain all seven planned slots: one failed admission, six not run. A/B comparison, candidate C, authored-test sensitivity, browser inspection and reserved transfer were not executed. There is no token, money or productivity saving to report. Missing usage is null, not zero; an empty transcript does not independently prove zero provider consumption.

The [protocol](../../docs/missions/maintenance-value/PROTOCOL.md) was frozen before dispatch at source `2ab754d`, with original digest `2733e70e5316f0ce9f10e6495b984dcb6052860e51e320bc4a61106b05296f88`. Its stop was enforced; the slot and ledger were not retried, reset or replaced. Local diagnostics and subsequent source fixes do not retroactively validate this run or authorize another admission.

[Subsequent local diagnosis](../../docs/research/maintenance-startup-diagnosis-2026-09-16.md) identifies a metadata restriction blocking worker path resolution before typed configuration validation. The old file-read probes missed host bootstrap compatibility. The correction and a fresh-tree probe are recorded separately; complete native inference remains unverified.

## Raw evidence and privacy

- [Raw stderr](private/readiness.stderr), empty [JSONL](private/readiness.jsonl), [dispatch](private/readiness-dispatch.json), [ledger](ledger/readiness.json) and [result](private/readiness-result.json).
- [Frozen inputs and schedule](frozen.json). Its source, fixture and worker hashes bind the actual initial bytes; a Git snapshot also binds starting HEAD/index/diffs for attribution.
- [Export inventory](EXPORT.json) contains original and published SHA-256 values and the two path substitutions. The retained `frozen.sha256` is the **original private** digest, not a permit for the sanitized published JSON. This export is review evidence, not an executable campaign root.

Original private evidence remains at `/private/tmp/devmethod-maintenance-campaign-20260916`. The earlier interrupted campaign remains separate and unchanged; its unknown accounting was explicitly retained in the new protocol. The published historical [journey evidence](../journey-native/README.md) still owns that result.

The [public fixture export](../maintenance-fixtures/README.md) supplies deterministic reproduction separately. Its resume observation is anonymized, requiring a declared derived baseline HEAD and new public freeze. It is not byte-for-byte the private native input and cannot be substituted under the original native permit. Reserved transfer contents remain undistributed.
