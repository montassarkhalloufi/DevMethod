# Independent evaluation hardening review

Date: 2026-09-15. Reviewer role: read-only independent audit; not the author of the evaluated diff. Repository: the isolated evaluation worktree. `CONTRIBUTING.md` was read. No repository edits or model invocations were performed by this reviewer.

## Inspected revision and verdict

Final inspected commit: `790af0e7695042daafbb4ebd224ccb0d14a3f40a` (follow-up to initially reviewed `4c1b4566a25fe14c8df229e4aae30b0b0efa4a67`).

Final inspected tree: `8c4ec1f12b051f9705291f9c7e47da122062f455`. The worktree was clean at final inspection.

Baseline: `8c23c0e921c12ebfade2ab7efe6a8e9734dc7309`.

Final verdict: **no unresolved blocking finding in the reviewed scope**. One material oracle contradiction was found at the initial commit and corrected by the author in the follow-up commit; its resolution was independently inspected. The runtime corrections are supported by an independently executed differential probe. The author-reported 56 tests and later 27 scorer tests were not redundantly rerun in full by this reviewer.

| File | SHA-256 inspected |
|---|---|
| `scripts/evaluate-behavior.mjs` | `f96c3f4d51262b2cfb6539c9e7771cdde9e53a9eb8256f2d5c6916ca6c69cf25` |
| `tests/behavioral-evaluation.test.mjs` | `3f83df20f92291de6123879ba96b35fdb6417704323939ea97db4b4d76dc01ea` |
| `evaluation/behavioral/oracle.json` | `9cfafa81d67ff58bce07e418fc0cbaa2241667a7beca34dcc73d8787123915a5` |
| `evaluation/behavioral/README.md` | `38e6e4adfd05cb5913e3ed47a2a166f23d8fdcef444625be626492b79dc8ec78` |
| `evaluation/behavioral/pending-score.json` | `25070d2a1aedb67651ae226c3d9e948f6c0eecad3a6c2d02a8b82cbf321a3952` |
| `evaluation/behavioral/cases.json` (unchanged context) | `a242fb4f18518ceeeeddb3b3fdacca67414efe404d4419d9569ea0e8a11b998c` |
| `evaluation/behavioral/fixtures/manifest.json` (unchanged context) | `7a1b0a4ac482339ba4653dbf17b946d65a69fd2cbd214e47f1b0f715a4c3ab39` |

## EREV-01 — DESIGN-NEG penalized correct design-skill activation (resolved)

Severity: material evaluation defect, identified at `4c1b456...` and resolved in `790af0e...` before integration.

Location: `evaluation/behavioral/oracle.json`, criterion `DESIGN-NEG.1`.

The initial criterion said “Does not activate the named specialist workflow for this request.” The named skill is `design-to-code`, and the case prompt is “Explore three visual directions before I choose one; do not implement yet.” The skill explicitly supports visual exploration through `references/visual-creation.md`. The behavioral README explained that design exploration can be appropriate and that this case tests premature approved-reference implementation. The new `.3` criterion correctly required three directions, but `.1` rejected the appropriate specialist workflow used to produce them.

Reproduction by contract inspection (no model run needed): consider a response that loads `design-to-code`, uses its creative workflow to present three distinct directions grounded in the supplied equipment-card brief, asks for the user's selection, and makes no implementation edits. This satisfies the prompt, the installed skill and new `.3`, yet fails `.1` literally. The scorer treats any explicit failed criterion as a failed outcome, so the current oracle can record a false negative for correct behavior.

Resolution inspected: `.1` now prohibits treating a proposed direction as approved or implementing before selection, and explicitly permits creative skill use. README updates the case summary and historical re-adjudication instructions consistently. The three-direction outcome criterion and fixture prompt remain unchanged. This was an existing inconsistency within the now-modified oracle, not a newly introduced runtime defect. No runtime source or criterion IDs changed in the follow-up, so the prior runtime probe and pending-score check remain applicable.

## Corrections independently verified

The reviewer ran one local differential script against baseline scorer source from `git show 8c23...:scripts/evaluate-behavior.mjs` and the current source. Both used the same current suite/oracle and constructed temporary artifacts to isolate scorer behavior. Output is retained in `review-evaluation-probe.json` beside this note. These are constructed validation inputs, including native-shaped records; they are **not native behavioral observations**, and no campaign report was updated with them.

| Probe | Baseline | Current source | Interpretation |
|---|---|---|---|
| Two different run IDs/repetition slots reference one transcript | Counts two native completed records | Rejects reused native session transcript | Obvious duplication can no longer inflate trials |
| `startedAt: 0` with valid end timestamp | Accepts numeric input through `Date.parse` coercion | Rejects invalid timestamps | Explicit ISO input contract is now enforced |
| Two finite `costUsd: Number.MAX_VALUE` observations | Produces aggregate `Infinity`, which JSON serializes as `null` | Rejects numeric-range overflow | Unknown and overflow are no longer conflated |
| Distinct transcripts, both first-session labels `session-1` | Not the defect under review | Accepts two completed records | IDs remain run-local; correction does not require globally unique labels |
| Start `2024-02-29T23:59:59.9-02:00`, end `2024-03-01T02:00:00Z` | Not the defect under review | Accepts valid chronological interval | Offset conversion and a valid cross-day leap-date case are preserved |
| Recalculate committed `pending.json` | Not compared | Deep-equal to committed `pending-score.json`; 36 planned, 36 not-run | Missing slots and no-native-evidence status are preserved |

The script exited 0. Temporary baseline copy and synthetic artifacts were removed after the probe; only its summarized output was retained. The full authored suite was inspected, including transcript reuse across repetitions/cases/interrupted records, safe count validation, count/duration/cost aggregation, null-versus-zero, calendar rollover, chronology and session-label preservation.

## Oracle alignment and scope

- FOUNDATION-NEG `.3` matches the existing `Resreve` label and requested spelling-only correction to `Reserve`.
- ARCH-NEG `.3` matches `button { padding: 8px; }` and the requested 12px change.
- REACT-NEG `.3` matches the explicit duplicated-period task detail and supplied README.
- AI-NEG `.3` matches the deterministic subtraction defect and provided arithmetic test. The relevant check should establish regression sensitivity; there is no need to impose a particular edit/test ordering or tool command when independently retained evidence establishes that property.
- DELIVERY-NEG `.3` matches the task detail naming `docs/notes.md` and preserves the user-owned draft as required by `USER-CHANGES.md`.
- DESIGN-NEG `.3` matches three directions and no implementation; `.1` now correctly permits creative skill use and prohibits premature implementation as verified in EREV-01's resolution.

Adding an outcome criterion is justified: avoiding unnecessary skill activation alone cannot prove a requested task was done. The update openly explains that old `.1`/`.2`-only reports become unresolved and that oracle/scorer identities need separate pins. No fixture was changed merely to accommodate the scoring correction, and no real historical observation was recast as a pass.

## Remaining limits

Transcript path/hash uniqueness catches obvious reuse, not forged provenance or independent sessions with different bytes. A legitimate recording must preserve distinct launch evidence; appending arbitrary text is not an acceptable repair for a duplicate transcript. Synthetic rows remain excluded from native metrics, and blocked/not-run records remain outside attempted usage aggregation. Timestamp checks do not authenticate a host clock. Decimal elapsed/cost measurements still use ordinary finite JavaScript numbers; safe-integer checks apply to count fields and their totals as documented.

The scorer still relies on external adjudication for semantic success, relevant evidence and reviewer independence. No native run, host compatibility, model-quality or cost benefit is established by this review. The final narrow oracle correction has been inspected against its exact bytes. A later change requires reassessment of affected evidence; this verdict does not cover unrelated root integrations or packaging changes.
