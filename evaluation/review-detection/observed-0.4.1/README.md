# Observed bounded review, 0.4.1 candidate

Date: 2026-09-13. One independent delegated Codex agent reviewed four isolated cases using the candidate installed skills. Its supplied context contained TASK.md, the five source modules and installed method resources, not the oracle, expected defect IDs or author reproduction tests. Deliberately-defective comments were removed from the supplied cases; the control's accepted contract was retained. The exact source bytes are included and hashed. All source hashes were unchanged after review.

The evaluator produced [raw findings](raw-findings.md), [executable probes](review-probes.mjs) and [captured results](probe-results.json). Run `node review-probes.mjs` from this directory to reproduce those probes. The root agent subsequently inspected the artifacts against the oracle and recorded [adjudication](adjudication.json); [score.json](score.json) is derived with scoreDetection, not a keyword matcher. The adjudicator authored the oracle; this is disclosed, not an independent human judgment.

| Case | Expected confirmed defects | Detected | Missed/unconfirmed | False positives |
|---|---:|---:|---|---:|
| Sensitive outputs | 1 | 1 | none | 0 |
| Submission/recovery | 3 | 2 | TIMEOUT | 0 |
| Compatibility | 1 | 1 | none | 0 |
| Correct control | 0 | 0 | not applicable | 0 |

Observed: 4/5 expected defects confirmed (80% on this tiny set); no false positive among the four confirmed findings. Charge-success-then-timeout was named as an unknown risk but not exercised, so TIMEOUT remains missed/unconfirmed rather than credited as a confirmed detection. The correct control received no invented architectural blocker. Application sink exposure was tested before any report masking.

Limits: one run, five simple known defects, no matched earlier-version or BMAD baseline, no production systems, no human blind adjudication. This demonstrates bounded actual review behavior, not a general detection rate or an improvement over another version/method. Native autocomplete, graphical report opening, process-kill recovery and real provider/database behavior are not tested. The review was explicitly given a skill path; discovery was not measured. The raw narrative/probes are retained, not a complete host transport transcript. Model identifier, metered usage/cost and elapsed time were not independently captured and remain unavailable. Reviewer Node version was v23.10.0.
