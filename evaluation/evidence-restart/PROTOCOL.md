# Known-fault restart repair comparison

Frozen before executing the new checker, 2026-09-16. Base: `440db4322167102546cd974004462fb4dab743a5`.

This is repair of the already observed queue restart miss, not a held-out population or generalization test. Preserve V1/V2 inputs, manifests and outcomes byte-for-byte. The retained red baseline demonstrates the existing checker accepting `lost-restart` while the independent, actual two-process adjudicator fails durability and finality.

## Mechanism and competing alternative

Compose the unchanged partial checker with the unchanged independent restart adjudicator. A criterion passes only if its original assertion and corresponding restart assertion pass. Reuse the original healthy/duplicate/resurrect controls; add no new control and change no candidate. The same composed entrypoint serves both ordinary independent checks and calibrated application evidence. Never infer semantics from criterion text or add a mandatory workflow stage.

Run the four known candidates once in fixed order: healthy, duplicate, resurrect, lost-restart. For each candidate, run the ordinary checker, then the calibrated lab with the same runner and assertions. Prediction: both accept only healthy. Distinguish semantic failure from malformed output, crash or timeout. Preserve raw ordinary invocations before parsing and the complete lab reports. Run no retries or model calls.

## Boundaries and measurements

Maximum: 4 ordinary runner invocations and 16 lab runner invocations, each invoking the partial checker plus the adjudicator. The adjudicator itself launches two separate processes against one durable file. Thus a completed checker involves 5 Node processes including its entrypoint (100 total across the two arms). The runner counts are observed from ordinary invocation records and lab completed/interrupted records; nested counts are derived from the fixed completed execution path, not independent OS process accounting. Each nested command has a 7-second timeout and 16 KiB output bound; lab runner timeout is 15 seconds, attempt timeout 65 seconds, and output cap 32 KiB. Stop after one pass; do not retry unfavorable results.

Retain Node/platform, source and protocol hashes, invocation argv/status/output, result classifications, elapsed durations and maintained added-code line/byte counts. Timings describe a single fixed-order local run, not a benchmark. Author time, human interruptions, model consumption and user benefit are unmeasured. The comparison has not equalized the supplied calibration controls or their execution cost.

Accept the repair only if ordinary and lab checks reject the known restart fault, retain healthy acceptance and correctly classify the other faults, while execution failures remain technical failures. Prefer ordinary checks when identical correctness needs no calibrated receipt or freshness management. Any equal correctness is a null lab advantage on this task and must be reported. Do not run the original selection script or overwrite historical results.
