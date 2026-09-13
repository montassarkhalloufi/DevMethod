# Matched comparison records

Run `node scripts/comparison.mjs BATCH_JSON` to validate and summarize a completed or blocked batch. This is an offline reporting tool, not a host runner or proof that a transcript is authentic. Do not use test records as published evaluation evidence.

The JSON root has `format: 1`, `budget` and `runs`. Budget requires positive integer `runs` and `tokens`, nonnegative finite `costUSD`, and an `authorization` reference to the user's explicit batch approval. A missing budget blocks native dispatch, not fixture/tool development.

Every run has:

| Fields | Meaning |
|---|---|
| `caseId`, `repetition`, `arm` | Positive repetition; arm is `none`, `devmethod` or `bmad` |
| `fixtureDigest`, `promptDigest` | SHA-256 of the pinned case manifest and identical task prompt |
| `hostVersion`, `model` | Exact installed host and model identifiers |
| `toolsDigest`, `permissionsDigest` | SHA-256 of retained tool and permission configuration |
| `perRunTokens`, `perRunCostUSD`, `timeoutSeconds` | Identical positive token/time and nonnegative USD ceilings in each matched triple |
| `methodRevision`, `wrapper` | Exact reviewed method commit/package integrity and native invocation; control revision is `none` |
| `status` | `passed`, `failed`, `blocked` or `timeout` |
| `evidence`, `review` | Retained evidence manifest reference plus independent review record, or explicit environment blocker |
| `tokens`, `costUSD`, `elapsedSeconds` | Trustworthy measured nonnegative numbers, otherwise JSON `null` |

Provide all three arms for each case/repetition, including blocked environments. The validator refuses duplicates, mismatched conditions and measured budget excesses. Unknown usage remains unknown and must block further dispatch under a hard budget. A validator cannot enforce host spend or authenticate the authorization string. The supervising operator owns those checks before each run.

Preparation and collection follow [the native evaluation workspace](README.md). Pin an actually installed BMAD distribution and its supported invocation before any matched batch; a live documentation link is not a version. Establish the same host configuration, clean workspace, task prompt, acceptance tests and limits for all arms. Rotate arm order across repetitions. Record method setup separately from task time, all interventions and repair iterations. Review anonymized diffs where feasible and report any loss of blinding.

The report gives pass/fail/blocked/timeout counts with denominators for each case and arm. It does not infer superiority from an incomplete batch, unknown usage, or installer tests. The protocol's minimum three independent repetitions remains necessary before a case-level comparative claim.

## Current checkpoint

Tooling implemented; no matched model batch executed. Budget approval is pending. Each host requires a locally verified authenticated environment. BMAD is not pinned/installed for this batch. B2 has no pinned React project/approved screen. Resolve these prerequisites before native dispatch. No orchestrator should treat this tooling's unit tests as a passed comparison gate.

## rc.2 setup observation

On 2026-09-13, BMAD npm 6.12.0 was installed with lifecycle scripts disabled in an isolated temporary directory, then its core/BMM Codex export was actually generated with English configuration and the fictional user Evaluator. Package integrity, export digest and host version probes are in [candidate-setup.json](candidate-setup.json). This proves local setup only, not native workflow behavior. Regenerate clean per-arm exports and snapshot all bytes/configuration before a future budgeted batch; the temporary setup is not a reusable evaluation session. The earlier “not installed” checkpoint above is historical. Model and budget remain unset; no runs have been fabricated to fill a comparison table.
