# Native journey smoke — frozen 2026-09-16

One newly authored fictional Repair Café CLI task, followed by a fresh-session requirement change. This is a feasibility smoke, not evidence of statistical superiority, product usability or generalization across projects. The six slots remain in the denominator even when the budget stops dispatch.

| Arm | Intervention |
| --- | --- |
| A | Strong ordinary implementation prompt and identical independent checks |
| B | Same task plus DevMethod stable `6f31552ac3f68c70ee1caa7b4bffb1181341a336` |
| C | Same task plus experimental `440db4322167102546cd974004462fb4dab743a5`, with optional access to the application evidence lab |

C deliberately pins the pre-repair candidate. Later implementation changes receive no credit from this campaign. Lab adoption is observed, not forced. Each workspace receives the same delivery brief and ordinary acceptance checks; the maintenance requirement is revealed only for the second session. Independent controls and future requirements stay outside initial assigned roots. Code is kept in one entry point; this narrow task intentionally excludes UI, concurrency and power-loss guarantees.

Fixed execution order: A-initial, B-initial, C-initial, C-maintenance, B-maintenance, A-maintenance. One repetition only, no selective reruns. A failed initial implementation stays in the denominator. Maintenance preparation uses the initial implementation to create data; any fallback is explicitly marked `assisted`, never a successful native continuity chain.

## Admission and fixed budget

- Codex CLI 0.147.0; `gpt-5.6-sol`; reasoning `low`; macOS 15.0 arm64; Node 24.18.0. Read-only CLI/RPC preflight confirmed ChatGPT authentication and model availability before dispatch. Claude 2.1.238 was present but unauthenticated and is excluded.
- At most six native model invocations; one active; 120-second termination deadline plus 1.5-second local kill grace; 2 MiB combined output per invocation.
- Stop before the next invocation once observed input plus output reaches 100000 tokens. This can overshoot during a call and is not a hard token or dollar cap. Any interruption, timeout, unknown usage or failed host process stops the campaign. No automatic retry, purchases, quota resets, alternate provider or extra worker.
- Dollars remain unavailable with this authentication. The read-only account preflight showed 44% of the weekly Codex window consumed; this is account metadata, not a campaign token measurement. No account settings changed.
- A new canonical campaign directory, immutable slot IDs and frozen driver/input hashes are retained locally. Existing interrupted historical campaigns are neither resumed nor reset. The earlier comparison-v2 remains at a lower bound of 366489 tokens, with final accounting unknown.

The runner reuses the existing supervisor without modifying its contract. It ignores user configuration, disables plugins, apps, hooks, browser/computer/image tools and nested agents, disables worker networking, and limits ordinary writes to the worker root. A task-local TMPDIR allows the supplied real-process acceptance checks. The parent process needs network access to the model provider. Independent evaluation has a separate macOS sandbox with writes limited to its temporary directory; maintenance preparation can also write its two declared fixture files.

Global user/system skills are disabled with per-invocation `skills.config` overrides; credentials and user configuration are not copied or changed. A no-model `codex debug prompt-input` probe with 52 disabled path entries produced no available-skills catalog, project-foundation mention or built-in skill path. This tests catalog isolation, not removal of every ambient instruction. The installed B/C project skills remain the intended intervention; shared global instruction policy may remain. [Official configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference) documents these enablement overrides.

## Outcomes and accounting

Primary observations: independent criterion verdicts after delivery/change and actual cross-session data preservation. Separately record process completion, protected-input changes, handoff quality, false success claims, method/lab use, regression reports, elapsed model time, setup/evaluator/review effort, tokens and unavailable dollars. No composite quality score. A passing program does not validate its producer's unexecuted claims.

The independent fixture was authored by the workflow-audit worker before any native call. Manifest SHA-256: `edfd5603725a7cf784bc7cac97b6174c32e64da9a2a9d1602d984f3175bcf24c`; 22-file SHA256SUMS digest: `ffa8f6104e7c6c45b07551741be5f2d3144ba32ef685396493419a7a319e1ba8`. Its author reports calibration on 11 cells/291 CLI processes, including targeted faults. Calibration is test-authoring evidence, not native product performance. All initial public assertions are the same bytes as the independent evaluator's initial assertions; the same rule holds for maintenance.

Raw native output and complete workspace snapshots stay outside public records. Only manually inspected fictional task/product artifacts, sanitized observations and short trace excerpts are published in `evaluation/journey-native/`. Final results must retain all not-run slots and the exact stop reason.

Reproduction is explicit opt-in: `node scripts/native-journey-smoke.mjs prepare FIXTURE NEW_ABSOLUTE_ROOT`, then `node scripts/native-journey-smoke.mjs run ROOT` after reviewing the frozen record. The new bounded authorization for this task does not authorize a later operator's campaign. Results and review are linked from the evaluation directory after execution.
