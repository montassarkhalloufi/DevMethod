# Closing PR #34 without overstating its coverage

Inspected 2026-09-16: PR #34 remains draft/open at `5448fe82b001c592f44856baa2752c4fe4516588`, based on PR #33 `440db4322167102546cd974004462fb4dab743a5`, also draft/open. Four jobs are successful and there are no formal GitHub reviews. The prior independent agent reviews remain distinct from maintainer approval. No historical check was rerun for this audit.

## Why the test counts differ

[Platform run 35063760204](https://github.com/montassarkhalloufi/DevMethod/actions/runs/35063760204) checked synthetic merge `610c920`, incorporating exactly those base/head revisions.

| Platform | Enumerated | Passed | Skipped | Nested cases not registered relative to POSIX |
| --- | ---: | ---: | ---: | ---: |
| Linux | 287 | 287 | 0 | 0 |
| macOS | 287 | 287 | 0 | 0 |
| Windows | 274 | 235 | 39 | 13 |

The 39 Windows skips consist of 35 runtime cases registered through `posixTest` in `tests/evidence-runtime.test.mjs`, two restart-checker cases, one application trace with a symbolic temporary directory, and one POSIX process-group descendant cancellation case. Their sources explicitly skip unsupported execution. The runtime itself refuses execution on Windows.

The 13 remaining cases are nested `t.test()` calls in the skipped parent “incoherent stored support fails closed instead of reporting fresh evidence”. Because its callback never runs, Node never registers the children. These cover malformed/contradictory stored support, revision/note/time/freshness errors, invalid verdicts, masked failure and unfinished success. Thus **287 = 235 executed + 39 skipped + 13 unregistered children**; no test files disappeared. Windows green does not establish the POSIX execution or process-group guarantees.

Greenfield 26/26 passed on each platform. Linux separately ran the 11/11 volunteer application tests and the retained holdout demonstration. Packed installation/inspection passed on all platforms; packed application/restart execution remains POSIX-only. [Fullstack run 35063760213](https://github.com/montassarkhalloufi/DevMethod/actions/runs/35063760213) passed seven unit, two database and one end-to-end checks.

The independent read-only audit used the retained CI log and the identified source, not inferred totals. Local log: `/tmp/devmethod-pr34-platform-ci.log`; portable primary evidence remains the linked GitHub run and committed test conditions.

## Change separation and adoption

| Surface | Scope / adoption boundary |
| --- | --- |
| Demonstration | Quantity recovery fix, UI feedback, regressions and real browser captures |
| Reusable verification | Optional checker for the declared queue interface, composed from existing assertions and a real process restart; not a generic scenario engine |
| Evaluation protocol | Explicit native driver, frozen fixture, interrupted result and separate accounting/continuity/runtime fixes |
| Existing experimental lab | Runtime, generated distribution, skills, dependencies and workflows unchanged; historical faulty fixtures retained |

**Decision: retain PR #34's commit separation.** Another split offers no demonstrated adoption advantage: the checker, demo, native trial and driver repairs are already separate commits/surfaces. The native-driver fixes improve the evaluation instrument; no native call validated those corrected paths afterward. Nothing here promotes the lab into a default gate or authorizes integration.
