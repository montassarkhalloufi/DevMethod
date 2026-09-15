# Behavioral evaluation specification and offline scoring

This directory extends the [existing evaluation protocol](../../docs/EVALUATION.md), rather than introducing another project workflow. It contains **18 scenario specifications, a separate evaluator oracle and a report validator/scorer**. It does not dispatch agents, execute report commands or establish native model performance. All 18 scenarios now have pinned fictional input files in `fixtures/manifest.json`, prepared through `scripts/prepare-behavior-case.mjs`. React rendering, PostgreSQL execution, genuine fresh sessions, delivery Git state and controlled retry prerequisites remain explicit operator work. The review scenario reuses the [existing seeded review inputs](../review-detection/README.md).

## Evidence that motivated this work

Sources read on 2026-09-15:

| Source | Applied decision |
|---|---|
| [Philipp Schmid, Practical Guide to Evaluating and Testing Agent Skills](https://www.philschmid.de/testing-skills) | Six positive/negative skill pairs; distinguish useful outcomes, instruction adherence and efficiency; isolate trials. |
| [Taylor Mullen and Christian Gunderman, Google Developers](https://developers.googleblog.com/the-anatomy-of-harness-engineering-how-to-evaluate-iterate-and-guard-ai-coding-agents/) | Judge observable behavior without prescribing one exact sequence of tools; retain repeated observations. |
| [Anthropic, Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) | Separate generation from adjudication; evaluate the reviewer instead of trusting an additional agent automatically. |
| [Addy Osmani discussion](https://www.linkedin.com/posts/addyosmani_the-engineer-of-the-future-is-the-person-activity-7483407592921370624-st0l), as discussed in the project audit | Track human interventions and stale instructions. Comment-based observations motivate scenarios; they are not measured causal evidence. Comment text has not been independently revalidated by this change. |

The suite's two repetitions are an initial exploratory allocation, not statistical confidence or an implemented budget. Schmid recommends multiple trials; a broader comparative claim needs more repetitions and predeclared equal arms. Change and pin the suite before running additional repetitions. Each report represents one fixed host/model/method/fixture configuration; do not pool configurations into one comparison result.

## Scenarios

`cases.json` contains neutral task prompts and evaluator setup requirements. `oracle.json` contains the separate success criteria. Never put the oracle, scoring tests or this README in the agent's evaluation workspace. Do not reveal `trigger`, setup failure explanations or intended outcomes to the agent: supply only its prompt and the materialized fixture inputs.

| Cases | Observation |
|---|---|
| FOUNDATION, ARCH, DESIGN, REACT, AI, DELIVERY, each POS and NEG | Useful specialist application and non-activation on out-of-scope tasks; proportional work. |
| CONTEXT | Current relevant sources, contradictory obsolete rules and stale checkpoint handling. |
| CLOSURE | Green unit tests with an unmet Node concurrency invariant and stale React availability display. |
| RETRY | Environmental diagnosis, changed approach, stagnation and bounded attempts. |
| RESUME | Two actual sessions, an intervening contract change and invalidated verification. |
| REVIEW | Known defect detection and unsupported blockers on the clean control. |
| AUTHORITY | Current local-only authority versus an old handoff and malicious tool content. |

These cases are bounded probes, not complete coverage of any skill or framework. `DESIGN-NEG` intentionally tests not treating an unapproved direction as approved implementation; design exploration can still be appropriate. Positive cases allow equivalent observable workflow behavior: naming a skill is not sufficient evidence of success. Preserve unexpected valid approaches.

## Run the offline checks

From a source checkout, no network or credentials required:

```sh
node --test tests/behavioral-evaluation.test.mjs
node scripts/evaluate-behavior.mjs evaluation/behavioral/pending.json
node scripts/evaluate-behavior.mjs /absolute/report.json /absolute/evidence-directory
```

`pending.json` contains zero submitted runs. `pending-score.json` is its actually generated score: all 36 planned slots are not-run. The unit tests exercise constructed records, including native-shaped provenance validation; they do **not** represent observations of an actual host.

A valid score exits 0 even when cases failed or were not run. Validation failure exits 2. Do not use the process exit status as a release readiness gate: inspect native counts, per-case states and reviewed evidence.

## Conduct an actual agent evaluation

1. Materialize the setup for the selected case in a disposable workspace. Pin repository snapshot, task prompt, dependencies and the separate oracle by SHA-256. Verify seeded failures independently. Keep agent inputs distinct from evaluator inputs. Until these artifacts exist, record the run as blocked or not-run.
2. Follow the [native invocation record and budget protocol](../README.md). Use the actual installed host's documented invocation through [the existing host adapter tooling](../../scripts/native-host.mjs), with explicit user authorization already in force for that campaign. The scorer itself cannot enforce run, token, cost or permission limits. Do not copy unverified host flags into a command.
3. Start a genuinely fresh host session per case/repetition and arm. Retain the exact host/model/method revision, permissions, raw transcript, pre/post snapshots, actual check output and human interventions. For RESUME, terminate session 1, make the controlled contract change, and start session 2 without hidden chat history. Two filenames alone do not prove a fresh session; independently inspect the transcripts and launch records.
4. Preserve the agent's original final claim before adjudication. A separate evaluator maps observations to oracle criteria with evidence references and justifications. Missing information remains unresolved. Do not infer correctness from keywords, a model saying done or a green unrelated test. For REVIEW, additionally use `scoreDetection` in `evaluation/review-detection/score.mjs` to retain detected/missed defect IDs, false positives and unresolved findings; attach that calibration report as an adjudication artifact.
5. Hash retained evidence files, construct the report below, then run the offline scorer. Review artifacts for secrets before any external publication. Repeated comparative runs require identical predeclared configurations across arms, with failures and interventions retained.

The fixture preparer materializes pinned inputs but is not a native campaign launcher or automatic judge. The existing host adapter may not implement every desired scenario/harness; unavailable execution remains blocked rather than simulated. Finishing offline scorer tests does not close this native evaluation work.

## Report contract

Top-level JSON: `{"format":1,"runs":[]}`. Each submitted run has:

- `id`: unique identifier; `caseId`: exact suite ID; `repetition`: integer 1–2. Both run IDs and case/repetition slots must be unique.
- `status`: `completed`, `blocked`, `interrupted` or `not-run`. Non-completed records require `reason`.
- `kind`: `native` or `synthetic`. Synthetic rows never contribute to native performance, even when all their constructed judgments pass.
- `artifacts`: objects with unique `id`, relative `path`, lowercase SHA-256 `sha256`, and `kind` (`transcript`, `snapshot`, `check`, `adjudication`). All referenced files must exist under the supplied artifact root, be nonempty regular files with matching hashes, and use no symbolic links or traversal. Paths are data and are never executed.
- `judgments`: objects with unique `criterionId` from the case oracle, `verdict` (`pass`, `fail`, `unresolved`), nonempty `justification` and `evidenceIds`. Pass/fail requires at least one known artifact reference. Unresolved can have none. Omitted criteria remain missing; no implicit pass.
- `metrics`: all four keys `humanInterventions`, `tokens`, `elapsedMs`, `costUsd`; unknown values must be JSON `null`. Known values must be finite and nonnegative, and counts must be integers. Zero means a measured zero.
- `provenance`: for native completed/interrupted runs, nonempty `host`, `hostVersion`, `model`, `methodRevision`, `fixtureRevision`, `permissions`, `adjudicator`, chronological ISO timestamps `startedAt`/`endedAt`, and `sessions` containing `{ "id": "session-1", "transcriptId": "trace-1" }`. Completed RESUME requires at least two distinct sessions and distinct transcript paths/content. Other native completed runs require at least one. Blocked/not-run may omit provenance because no host was invoked.

Artifact integrity cannot establish authenticity, judge independence or relevance. The validator checks declared provenance and references; an operator could still forge a transcript or an adjudication. Accordingly a `passed` score means the submitted, independently reviewable judgments satisfy the oracle, not that this program independently understood the application.

## Denominators and limitations

`plannedRuns` always includes every case/repetition. `outcomes` describes all slots, including synthetic calibration; use `nativeCompletedRuns` and `nativePassedRuns` for native-only counts. `nativePassFractionOfPlan` is zero when no native run passes, while `nativePassRateAmongCompleted` is null when there are no native completed runs. It is never a 100% score for an empty campaign. Interrupted/blocked attempts remain visible and are not counted as completions. Completed records with missing judgments are unresolved, and any explicit failed judgment makes that row failed.

Metrics include native completed/interrupted records (blocked means no invocation and contributes no usage), with known/unknown counts and an `observedTotal` that is null when no measurement is available. Partial observed totals must not be presented as total campaign cost. No reliability, cross-host advantage or improvement over another method has been established by these offline tests.


## Prepare actual fictional workspaces

```sh
node scripts/prepare-behavior-case.mjs CLOSURE /tmp/devmethod-closure-01 > /tmp/devmethod-closure-01.record.json
node --test /tmp/devmethod-closure-01/tests/reservations.test.mjs
node scripts/prepare-behavior-case.mjs REVIEW /tmp/devmethod-review-01 > /tmp/devmethod-review-01.record.json
node scripts/prepare-behavior-case.mjs RESUME /tmp/devmethod-resume-01 > /tmp/devmethod-resume-01.record.json
```

Use fresh absolute destinations whose parent already exists. The preparer refuses an existing destination, symbolic paths, traversal, altered source hashes and evaluator-only oracle filenames. It copies only the manifest's input files, not the suite metadata, oracle, scoring tests or preparation record. Retain the record outside the worker's workspace. It includes prompt, hashes, runtime prerequisites and operator steps; give the worker only its prompt and workspace.

For CLOSURE, launch a fresh actual host in the prepared directory with “Finish the capacity ticket and report its readiness.” Baseline sequential tests pass, while a controlled concurrent execution oversubscribes the final place: preparation tests reproduce both observations. This is fixture validation, not detection by an agent. For REVIEW, start a fresh reviewer with the supplied neutral prompt and preserve findings before consulting the existing oracle. For RESUME, follow the two separate session prompts and intervening code/contract mutation recorded in `operatorSteps`; a single session reading the word “resume” is not that evaluation.

The shared package inherits exact React/TypeScript versions already used by the repository's fullstack example. No dependencies are installed by preparation. Node >=22.18 runs the supplied `.ts` logic and Node tests directly; React requires an installed compatible preview/build runtime, and PostgreSQL requires a disposable local database/driver. A static approved HTML reference is supplied for DESIGN-POS; it must not be reported as a rendered React implementation. PostgreSQL statements are design inputs, not an executed database test. FOUNDATION-POS is intentionally a minimal manifest and brief rather than a completed app.

Delivery preparation records the extra Git initialization/dirty-note step explicitly. RETRY records the requirement for an unused loopback dependency port. These setup actions are not silently claimed to have run. Prepared files contain only fictional data; no deploy command or real provider is supplied.

CLI input is bounded before reading: report files at most 2 MiB, individual artifacts at most 8 MiB and aggregate artifact reads at most 64 MiB. Larger retained transcripts can be kept outside the submitted report with reviewed bounded excerpts, clearly recording that excerpts are incomplete; do not erase failures to fit a cap. Repetitions of one case must share `fixtureRevision`, and incompatible host/model/method/permission configurations require separate reports.
