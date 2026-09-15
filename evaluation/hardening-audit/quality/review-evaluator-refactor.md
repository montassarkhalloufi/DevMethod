# Independent evaluator refactor review

No blocking regression found in the reviewed commit. The extracted helpers preserve the supported JSON-record validation, scoring, aggregate accounting and CLI behavior inspected here. This conclusion concerns the refactor, not the authenticity of submitted behavioral evidence or the effectiveness of DevMethod.

## Exact scope

- Repository worktree: `/workspace/scratch/0182c7a94d20/evaluator-refactor`.
- Candidate: `f374c527f328a388c4453faa7b11fac30a506ae0`.
- Candidate tree: `b8f199eeef6b84bc494890aff24447099bc749c5`.
- Parent: `0fff7d10bb1cf15fa4af6012eaad5755021e2fe2`.
- Files: `scripts/evaluate-behavior.mjs` and `scripts/comparison.mjs`; the commit changes only these files.
- Candidate SHA-256: evaluator `626b4fb4f0b7554cface7f8c2a1951ba788a2dd3868bb53101957aa8dffb57d6`; comparison `2274021f3a2ebd75a26587addff5de4dcac6a2a9df850961e3b50dd28c28e1ab`.

Read CONTRIBUTING, both complete source versions and the existing targeted tests. No repository edits were made. A local untracked `node_modules` entry appeared during concurrent work; it is outside the inspected commit and was not created or changed by this review.

## Contract review

| Contract | Observation |
|---|---|
| Native-attempt boundary | `isNativeAttempt` preserves the former predicate: completed and interrupted native records require provenance and contribute usage; blocked and not-run records do not. Synthetic records never contribute native performance or attempted-native usage. |
| Provenance and sessions | Required fields, configuration grouping, per-case fixture revision consistency, real timezone-bearing dates and chronology retain their checks and order. Session labels remain local to a run. Transcript IDs, paths and bytes must be distinct within a native run, and paths/bytes cannot be reused across native attempts. |
| Artifact and judgment checks | Artifact path/hash/type/size checks remain in the same validation sequence. Judgments still require a valid criterion, verdict, justification and appropriate evidence references. No submitted text is executed. |
| Outcome and denominator | `runOutcome` retains fail precedence, unresolved missing criteria, explicit unfinished states and implicit not-run slots. Planned rows preserve suite/repetition order; synthetic completion does not inflate native results. |
| Metrics | Safe integer counts, finite nonnegative measurements, explicit null unknowns and overflow rejection remain. No known observations yields null, not zero; measured zero remains known. Interrupted attempt usage is retained. |
| Three-arm comparison | Matched condition checks, explicit budgets, each case/repetition's three arms, duplicate rejection, status denominators, usage completeness and error messages are preserved. The exported functions, constants and result fields remain unchanged. |
| CLI and limitations | Argument checks, JSON output, exit code 2 on errors and stated integrity/authenticity limitations are preserved. Neither module dispatches a model. |

## Independent execution

Ran an external scratch probe against exact parent and candidate source snapshots using Node `v24.19.0`. It compared returned objects or exception name/message for 91 constructed API scenarios, plus exit status/stdout/stderr for five CLI scenarios: **96 comparisons, zero differences**.

The probe includes the kind/status/judgment combinations; empty plan; missing provenance fields; invalid timestamps and chronology; duplicate identities/slots; session evidence; mixed configurations/revisions; reused transcript paths/bytes; local session labels with distinct transcripts; missing/invalid evidence; unsafe individual counts and aggregate overflow; mixed known/null usage including an interrupted attempt; two-session resume completion; matched comparison statuses and budget/condition failures. Independent assertions also check outcome precedence, the 36-slot denominator, exclusion of unattempted native records, measured zero versus unknown, interrupted usage, and minimum resume sessions. CLI checks cover usage errors, pending output, malformed JSON and a valid comparison batch.

Reproduce: `node /workspace/scratch/0182c7a94d20/review-evaluator-refactor-probe/probe.mjs`. Source snapshots, constructed evidence and machine-readable `result.json` remain beside that script. The first probe run exposed a mistake in its negative chronology input: equal instants are valid. The input was corrected to an end before the start; the complete run then passed. No candidate change was needed.

The author's reported 30 passing targeted tests were inspected but not rerun; the differential probe addresses the remaining refactor risk directly. It is bounded testing, not a formal equivalence proof or validation on every supported runtime. Artifact-size and symlink guards were reviewed unchanged; no additional large-file or filesystem-race campaign was run. Constructed native-shaped inputs exercise validators only: they are not native host observations, independent adjudication or proof of production capacity.
