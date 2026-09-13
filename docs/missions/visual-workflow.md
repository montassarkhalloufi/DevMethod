# Visual workflow and proportionate delivery pilot

Canonical local mission record. Scope: incorporate the previously reviewed mission-tracking change; implement the reusable visual-creation procedure; forward-test a small change with an agent; demonstrate visual direction through implementation with a user-selected reference. No Rolevidence changes, merge, deployment or npm publication.

## Criteria and evidence

| ID | Criterion | Current evidence | Status |
| --- | --- | --- | --- |
| V1 | Existing design command routes new directions and preserves approved references | design-to-code/references/visual-creation.md; project-foundation routing | Implemented; linked resources resolve and installation includes procedure |
| V2 | Visible comparable directions and actual user selection | examples/visual-pilot/directions-v1.png generated with built-in image tool | A selected explicitly by user |
| V3 | Selected image mockup with approval/version | examples/visual-pilot/editorial-mockup-v1.png generated and inspected | Approved explicitly by user |
| V4 | Interactive implementation, desktop/mobile captures and mismatch detection | app/ implemented; browser-check.cjs passed in Chrome; desktop-actual.png and mobile-actual.png inspected; color mismatch detected and restored | Passed with disclosed fidelity limits |
| P1 | Agent completes a small fix without per-stage documents or redundant checks | Actual subagent fixed one predicate; 2/2 tests pass in one run; only requested report created, no stage documents. See examples/visual-pilot/quick-filter/AGENT-RESULT.md | Passed for this case |
| P2 | Updated kit installs with valid resources and regression checks pass | npm ci (cached), npm test 72/72, check:docs, pack --dry-run; fresh Codex install 44 files, doctor ok | Passed |

## Visual brief

Fictional Lisière personal reading library, for readers tracking books and next reading actions. No accounts, backend, purchases or external data. One main library screen with status filters, adding a book and changing reading status. Desktop and mobile. The visible board proposes A editorial ivory/ink/rust with serif hierarchy, B compact cobalt utilitarian geometry, C airy sage/forest botanical illustration. A was selected explicitly by the user.

Generated board v1 contains presentation additions (navigation, author names, decorative copy) that are proposals, not approved scope. Its “Lire” label must be resolved in the final contract: the demo tracks reading and does not supply book content. Final controls will use truthful tracking actions unless scope is changed. Book metadata is fictional.

## Asset provenance

Direction board: built-in image generation, 2026-09-13. No supplied visual reference. Prompt asked for three equal panels of the same French library screen and mobile previews, titled Éditorial, Atelier and Botanique; same three fictional books, status filters and add action; different typography, density and imagery. Saved asset: ../../examples/visual-pilot/directions-v1.png. This is a selection board, not an approved implementation reference. Detailed prompt is stored beside the asset.

## Resume

The user selected A and approved detailed mockup v1. The supervised pilot is complete locally. A future independent visual test must use a fresh agent/session; this pilot does not establish autonomous or cross-host reliability. GitHub branch push is now authorized; merge and npm publication are not.

## Verification limits

The generic skill-creator Python validator could not run because PyYAML is absent in both available Python runtimes. Repository installation/regression tests and Markdown link checks passed; these are not equivalent to behavioral validation of the entire visual procedure. The first npm ci attempt could not complete with the isolated cache/network constraints; retry using the existing npm cache offline succeeded without changing the lockfile. No npm publication, merge or new product deployment. Current evidence applies to this local change set with the approved editorial mockup.

## Selected mockup v1

Built-in image tool, reference directions-v1.png panel A. Preserves ivory/ink/rust and serif hierarchy. Removes speculative navigation and changes Lire to Commencer / Marquer terminé. Desktop three columns; mobile stacked cover/detail rows. Image inspected: controls and labels are present; mobile font sizing and header spacing require browser checks, not inferred accessibility. Generated cover lettering has minor raster artifacts and is not authoritative metadata. Final text comes from semantic HTML. The user subsequently approved this exact mockup before implementation.

## Completed browser pilot

The user explicitly approved editorial-mockup-v1.png. Vanilla HTML/CSS/JS prototype implemented under examples/visual-pilot/app, no added runtime dependencies. Real localStorage persistence, add dialog, status transitions and filters. No loading spinner: synchronous local operation; storage failure has a visible warning; empty filters have recovery guidance. No book reading content is implied.

Chrome headless test passed: initial three books, empty completed filter, starting then completing a book, adding, persistence across reload, Escape and focus return, no mobile overflow at 390px, no JS page errors. Intentional rust-to-blue mismatch detected by a targeted color assertion then removed by reload. This is a bounded mismatch probe, not an independent general visual reviewer. Desktop 1100x1000 and mobile 390x844 captures inspected against the approved board. Three-column/stacked hierarchy, rust/ivory palette and approved covers retained; cover images render from the approved image as CSS sprites. System Georgia rendering, heading size and spacing differ from the raster; no pixel-perfect claim. Full-page mobile capture scrolls beyond 844px as expected. Keyboard test covers dialog close/focus, not a full accessibility audit.

Prototype and implementation are one artifact. To run: python3 -m http.server 8765 --bind 127.0.0.1 --directory examples/visual-pilot/app. Tests require an externally available Playwright and Chrome; run node examples/visual-pilot/browser-check.cjs with PLAYWRIGHT_MODULE if necessary. No package dependency or host configuration was changed. Development server remains on loopback for user preview.

Scope complete locally: procedure, simple agent test, actual image generation, user choice, approved detailed mockup, interactive browser prototype and comparison. No publication or merge. This one supervised Codex pilot does not prove cross-host operation, general quality improvement or BMAD superiority.
