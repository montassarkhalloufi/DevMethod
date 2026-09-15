# ADR 012: Local command gates and persistent behavioral stops

Status: implemented for the explicitly requested PR #32 extension, 2026-09-15; exact-candidate maintainer review and release acceptance remain separate.

## Decision and scope

The host's namespaced workflow skills remain instructions. The existing `closure` and `loop` commands remain read-only inspectors. Add an optional local controller, `devmethod guard`, for `/implement`, `/verify` and `/integrate`. This is an explicit new contract, not a claim that ADR 011 already provided a runtime dispatcher.

The controller owns a local session record, a subprocess invoking only the bundled `scripts/evaluate-behavior.mjs`, a snapshot of declared inputs, and the session's local acceptance state. It never dispatches an agent, executes command text from a mission, intercepts host tools, opens/merges a PR or deploys software. Local `accepted` is distinct from merged or released. Host authorization, readiness judgment and independent review still apply.

The bundled evaluator measures the DevMethod behavioral suite. It is not a generic application test runner. Other applications need a separately reviewed evaluator contract. Each mission criterion must have current supporting checkpoint evidence pointing to the same validated behavioral report. A reviewer must still judge the relevance and completeness of those criteria.

## Command gates

| Command | Required inputs and state | Owned effect |
| --- | --- | --- |
| `/implement` | Ready active mission, readable selected context, no blocked dependency/unresolved contradiction, matching session scope, no stop latch | Open the implementation gate; preserve attempts and clear previous acceptance evidence. No code is generated. |
| `/verify` | Existing gate and matching ready mission; report and artifact directory; diagnosis and adjustment after failure; no stop latch | At most one scorer attempt per invocation; freeze inputs and record its outcome. Reuse unchanged passing evidence without adding an attempt. |
| `/integrate` | Ready matching mission, recorded receipt, supported current closure and report coverage for every criterion; no stop latch | Revalidate the receipt and observations, then record local acceptance with its evidence signature. It never records `merged`. |

No command grants permission for external actions. An unsatisfied integration gate can leave a candidate available for review but cannot record acceptance.

## Failure identity and termination

The scorer's optional `--guard` output includes a stable SHA-256 failure signature. Behavioral identity includes case, repetition, kind, outcome, missing criterion IDs and nonpassing criterion verdicts. It excludes run IDs, timestamps, transcript paths, metrics and judgment prose. Reordering runs or rephrasing a diagnosis cannot reset the same failure. A different failing criterion has a different identity. Without `--guard`, the existing scorer output and exit-code contract remain unchanged: exit zero means valid scoring, not a passing campaign.

Two consecutive failed attempts with the same signature permanently halt that session. The rule takes precedence over claimed progress, a subsequent success, and a complete label in inspected history. Diagnosis is necessary to request a second failed-check attempt but cannot override this rule. A passing attempt separates failures. Old unsigned inspector histories do not acquire invented signatures.

Evaluator validation failures use a digest of exit status and bounded stderr, without printing its contents. Timeout, signal or execution failure requires immediate human reconciliation. There is no retry loop, automatic resume, stale-lock reclamation or reset flag. One session has at most 100 recorded attempts; each scorer subprocess has a 30-second timeout and bounded output. These are local limits, not provider/token budgets or a wall-clock cap on the entire command.

## Context and evidence

Persist pending intent before writing a snapshot or invoking the scorer. Freeze the exact mission, selected sources, criterion change files, report and declared artifacts. Store their bytes and hashes, Git state and an engine signature covering the scorer, suite/oracle and controlling modules. Check the same inputs after evaluation. Changes during verification halt the session. On repeated failure, retain the snapshot and refuse all three commands before reading evaluator inputs again.

The snapshot is bounded to 512 declared files and 32 MiB of content, with existing per-file and Git provenance bounds. No symlink or secret-like selected path is accepted. Selected sources retain credential screening; private-key markers are also refused in frozen files. Declared artifacts may contain sensitive business data: keep the session private. Freezing preserves selected bytes; it does not prevent external edits or capture undeclared content. Require a quiescent workspace. The session lock serializes only cooperating local guard processes.

A passing receipt requires every planned native slot to pass, validated artifact hashes/provenance, and `methodRevision` equal to the inspected Git commit. This strict profile also requires tracked workspace bytes and index to match that commit, and declared source/change paths to belong to it. Commit reviewed implementation changes before collecting native observations. This prevents old reports from being rebound to modified code under an unchanged HEAD. Raw-byte comparison does not run Git filters: a CRLF-converted checkout differing from LF blobs, submodules, symlinks or unverifiable tracked content is refused, not silently normalized. Reports and their artifact directory must stay outside HEAD/index; keep them ignored. They cannot overlap selected source/change paths. A mission may remain untracked; if tracked, its bytes must also match the commit.

Missing, interrupted, unresolved, failed or synthetic observations cannot pass. The receipt binds context and report hashes. Integration re-scores existing observations and rechecks freshness; it does not repeat native trials. A manufactured digest alone is insufficient. Hashes do not establish authorship, independent adjudication, or that a claimed trial actually ran on the reported revision. Those remain evidence-review responsibilities.

Both receipt validation and checkpoint coverage precede acceptance. Changes to code, selected inputs, ignored artifacts, engine or Git provenance invalidate the receipt. Missing inputs or validation errors stop the matching session and clear acceptance. A different mission/session scope cannot rewrite the original session.

## Storage and recovery

`--session` names a dedicated directory outside the workspace and its ancestors, keeping guard writes out of Git provenance. Its parent must exist. A new directory must be empty; unrelated contents are never overwritten. Files use private permissions where supported. An exclusive-create lock covers read/modify/write and the child process. Writes use a flushed temporary file and atomic rename, with consistent read/write size bounds. These are local-filesystem/process-crash controls, not a distributed lease or power-loss certification.

A crashed process can leave a lock or pending intent. Both refuse automatic continuation. Preserve `state.json` and any `context.json`, establish that no owner remains active, reconcile the failure and external effects, and obtain a scoped human decision before starting a new session. Do not create sessions to disguise halted history. A malicious local owner can rewrite/delete these files; the controller does not claim tamper-proof storage or cryptographic identity.

## Invocation

```sh
devmethod guard --command /implement --dest ./repo --mission mission.json --session ./guard-session
devmethod guard --command /verify --dest ./repo --mission mission.json --session ./guard-session --report report.json --artifacts artifacts
devmethod guard --command /verify --dest ./repo --mission mission.json --session ./guard-session --report report.json --artifacts artifacts --diagnosis "Observed cause" --adjustment "Distinguishing correction"
devmethod guard --command /integrate --dest ./repo --mission mission.json --session ./guard-session --checkpoint checkpoint.json
```

All responses are JSON. Exit 0 means the local gate passed, exit 1 means blocked/failed/human intervention, and exit 2 means malformed CLI invocation. A halted response has `allowed: false`, `nextAction: null`, a stop reason, attempt count, failure signature and the available frozen-context reference. No response claims a PR was merged.

## Verification

Regression tests invoke real CLI subprocesses against temporary Git repositories and the bundled scorer. Constructed native-shaped reports test validation only; they are not actual native-agent performance evidence. Cover persistent double failures, semantic failure despite exit zero, reordered reports, changed failure identity, evidence reuse, old/synthetic/tampered evidence, stale code under the same HEAD, unsupported coverage, frozen bytes, occupied locks, pending recovery, storage bounds and scope isolation. Preserve existing inspector, installer and scorer contracts.

Local validation of this extension: 215/215 root tests and 26/26 greenfield tests passed on Linux with Node 24.19.0, without skips. ESLint, Prettier, TypeScript/build and local documentation-link checks passed. The refreshed quality report covers 115 maintained files, maximum cognitive complexity 12, zero functions above the local threshold of 15. This metric is a review aid, not proof of correctness. The separate native behavioral campaign remains unexecuted; constructed test inputs cannot close its 36 slots.
