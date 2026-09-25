# Independent review and verification boundaries

This record owns review observations for the maintenance tranche. [Results](RESULTS.md) own outcome claims; [the frozen protocol](PROTOCOL.md) owns the stopped experimental design. Repository gates and exact delivery revision are recorded in [the checkpoint](REPRISE.md).

## Pre-admission review

The independent reviewer inspected the new driver before any model admission. Three confirmed defects were corrected and exercised red-to-green:

1. A commentary event before a command was incorrectly sufficient to claim a final response. Completion now requires a nonempty terminal agent message immediately preceding the completed turn's end state.
2. A raw-output collision could discard already observed token accounting. Accounting is recorded first; exclusive output writes preserve existing bytes, expose collection errors and block further admission.
3. The working-file inventory excluded Git metadata. Staging the same dirty bytes could silently change attribution. Preparation now pins and admission compares HEAD/index/tracked/untracked state as well as working bytes.

[Failing regressions](evidence/preflight-red.log) and [corrected regressions](evidence/preflight-green.log) preserve the observations. The focused follow-up found no residual issue in those three deltas. It did not establish complete host startup or native method behavior.

## Post-stop review

At driver revision `2ab754d`, the reviewer independently verified the original frozen SHA, unchanged fixture, all seven unchanged workers (files **and** Git), exactly one admitted ledger entry, and six unadmitted comparison slots. The reviewer then verified all seven original and seven published digests in the public native export and checked the outcomes against frozen order.

No new blocking defect was found in that closure scope. The result distinguishes the failed host launch from the deliberately faulty unchanged readiness input, retains unknown usage and identifies the sanitized export as non-executable evidence. The earlier negative read probes do not establish host bootstrap compatibility. Local diagnosis and correction of that separate boundary cannot clear the stopped ledger.

The fixture/evaluator author and native-execution author worked in separate directories. The parent integrated and checked their changes. Evaluator calibration, author review and gate results are not independent proof of native productivity or of undisclosed-test discovery.

## Follow-up deltas

The parent reviewed the limited metadata exception and typed-invalid configuration probe from worker commit `50a4514`, integrated as `207afde`. The actual macOS regression verifies resolution of a new worker path while source, evaluator, frozen inputs, sibling contents/metadata and ancestor listings stay blocked. The [diagnostic](../../research/maintenance-startup-diagnosis-2026-09-16.md) limits the claim to the startup barrier, not completion or usage recovery. No application-evidence-lab runtime or method-stage change is involved.

The independent export review checked 347 regular archive files, no nested Git directories or reserved transfer, and explicit original/public provenance. It found one confirmed defect: the `/var/folders` alias remained in two normalized logs, contradicting the initial absence claim. The parent corrected only those public path strings and derived hashes, preserved the mistaken scan report, and recorded [before/after evidence](../../../evaluation/maintenance-fixtures/evidence/export-review-correction.json). Archive/bundle bytes, original private evidence, case verdicts and timings are unchanged; no recalibration was needed. The resulting public export inventory verifies successfully.
