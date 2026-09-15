# Durable queue V2: preregistered protocol compatibility correction

Date: 2026-09-15. V1 population commit: `718854c581d8f09804d5deb65f4b117b0d8bb437`. Preserve every original file, `PROTOCOL.md`, and `SHA256SUMS` unchanged. V2 adds files; it does not replace V1 or remove its blocked observations.

## Observed feasibility failure motivating this revision

The coordinator reports that V1 ran against all four candidate selections. Each evaluation halted at the duplicate calibration control: the runner emitted a strict JSON report containing a failed criterion but exited zero. The integrated runtime's public contract requires exit zero when every criterion passes and exit one when any criterion fails. This exit-status requirement was omitted from the original fixture-author task. No candidate was evaluated by that runtime campaign. V1 consumed eight runner subprocesses; the separate restart adjudication consumed eight child processes. The coordinator retains these observations separately.

This is a runner-protocol compatibility failure, not a defect-discrimination outcome. It does not establish that any candidate was accepted or rejected. Keep its four blocked evaluations in reporting denominators and label the cause explicitly. V2 is a uniform new feasibility campaign over the same population, not a retry of only an unfavorable arm.

## Exact change and unchanged hypotheses

`runner-v2.mjs` is byte-for-byte identical to `runner.mjs` except for one assignment immediately after the JSON output:

```js
process.exitCode = idempotency && finality ? 0 : 1;
```

`contract-v2.json` changes only the two runner-path references to `runner-v2.mjs`. Requirement text, criterion IDs, healthy/fault mode identities, assertions, control implementations, candidate implementations, limits, and all V1 semantic predictions remain unchanged. The checker remains deliberately partial: it never reopens storage. The unseen `lost-restart` defect is still predicted to pass partial checking and fail independent restart adjudication. No new defect control has been added to make that result disappear.

## Freeze and bounded execution

Before V2 runtime execution, verify both `sha256sum -c SHA256SUMS` and `sha256sum -c SHA256SUMS-v2` from this directory. The second manifest binds every original file, including the original manifest, and the three new V2 input files. Syntax checks are permitted before freeze; no V2 runner or runtime execution has occurred at freeze time.

Run the same four candidates uniformly with the V2 contract. Maximum: 16 runner subprocesses, with the existing three-second per-child limit, and no automatic retries. Separately execute the unchanged adjudicator for each candidate, at most eight fresh child processes. Record actual runtime revision, report paths, all outcomes, execution failures, subprocess counts, and elapsed time independently of the frozen inputs. Preserve both campaign versions and do not relabel the initial blocked campaign as a successful result.

All scope, independence limits, and predictions in `PROTOCOL.md` still apply. This is a deterministic post-design domain fixture, not a blinded native-agent benchmark, novelty evidence, or proof of general product correctness. This compatibility correction supplies no new semantic evidence by itself.
