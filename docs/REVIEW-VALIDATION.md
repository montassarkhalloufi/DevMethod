# Review interface verification

This record distinguishes automated checks, browser interactions and authored workflow scenarios. Exact candidate revision, package digest and platform CI are recorded in PR #19 and the release after the complete expanded candidate is verified.

## Automated checks

The format tests cover required/versioned fields, unknown fields, duplicate/dangling IDs, consultation dates, resolution evidence, counts independent from filters, policy-derived conclusions, selective changed-target signalling, link protocols, text redaction, unsafe image types and derived Markdown. Renderer tests cover inert JSON embedding, script CSP and absent remote program/style loads. CLI tests cover generated reports, output preflight/conflict preservation, bounded explicit paths, symlink refusal, legacy reading, invalid JSON without source disclosure, empty and packaged demo modes.

These tests check code, not whether a reviewing model follows the workflow or whether author-supplied evidence is true.

## Browser inspection — 2026-09-13

Real Codex in-app browser at 1586×992 and 390×844: inspected the implemented rendering against the user-approved artistic reference, composed filters, selected findings, evidence/correction tabs, coverage, mobile list/detail return and absence of horizontal overflow. A real focus-loss defect was observed when selecting a finding updated the hash and rebuilt the page twice. The fix uses a single render and restores focus; verified focus on detail-title and keyboard ArrowRight to the Correction tab. Mobile back restores the selected result and retains query/confidence filters.

Imported an adversarial JSON fixture through the real file picker: HTML-like title displayed literally, no script dialog or console warning/error. Unit tests independently verify redaction and escaped report embedding. Inspected a changed-revision page with targeted C-01/R-01 reassessment and an empty-viewer page. Also verified invalid-format, legacy inert Markdown, partial and blocked states, missing-finding mobile recovery, and an embedded real JPEG screenshot. Chrome produced an actual HTML download: inspected the last downloaded file, validated its format-1 data, saved query/selected finding/detail section and CSP program hash. The browser download-event listener timed out despite the actual file being created. Direct file:// reopening was rejected by the browser tool policy and was not bypassed; no successful offline-browser reopen is claimed. Post-package checks belong to the final candidate evidence.

## Authored workflow scenarios

| Scenario | Expected response under the revised workflow |
|---|---|
| Official docs describe a newer incompatible version | Keep installed version and accepted conventions; find matching docs, record compatibility limits; no automatic migration |
| “Official” skill lacks reliable publisher provenance | Mark unverified, do not install/execute; use verified documentation independently |
| No suitable official skill found | Record the bounded search limitation and consult official docs directly |
| Suspected issue cannot be reproduced | Keep suspected confidence and verification next step; no demonstrated vulnerability claim |
| Automated tests pass but visual defect is observed | Record the actual screenshot/interaction finding and its impact; automated success does not override it |
| A check cannot run | Record blocked or not-run with reason; preserve unrelated executed results |
| A correction is applied | Retain original evidence and require fresh relevant verification before resolved |
| No findings with limited coverage | State verified scope and uncovered surfaces; no completeness inference |

These are authored scenario walkthroughs, not transcripts of new authenticated model executions.

The [actual structured review](missions/workflow-0.3-reviews/interface/review.json) records the observed focus defect, original and post-fix evidence, and the blocked offline-browser check. Its [Markdown report](missions/workflow-0.3-reviews/interface/REVIEW.md) is generated from that source. This is separate from the fictional interface demo.

Actual rendering (fictional demo data): [desktop capture](images/review-interface-desktop.jpg), [mobile capture](images/review-interface-mobile.jpg). The user reference image is a design source, not an execution result.
