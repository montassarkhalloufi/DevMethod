# Inspect evidence coverage and correction history

These optional CLI inspectors complement existing mission/checkpoint records. They do not run skills or dispatch agents. Normal Quick work remains inline; Markdown tickets are not parsed by these commands. Use the installed agent's normal workflow for implementation and verification.

## Criterion coverage

```sh
devmethod closure --mission mission.json --checkpoint checkpoint.json --dest /path/to/project --json
```

Use existing [mission and checkpoint formats](MISSIONS.md). Closure is deliberately stricter than legacy `resume`, whose behavior is unchanged:

- Pin the exact mission JSON as a checkpoint source. Keep the checkpoint/report itself outside tracked changes (for example in an ignored evidence directory) before capturing Git provenance; changing tracked evidence after capturing provenance correctly calls for reassessment.
- Include each selected mission context source with the same ID/path, and each acceptance criterion's `changes` as pinned source files. All criteria in this mission are required; keep deferred work out of the selected scope.
- Evidence names `criterionIds`, its verification `kind`, and the actual inspected Git commit in `revision`. Its `sourceIds` must include the pinned mission and every changed file for the criterion. `dependsOn` links prerequisite evidence. Paths, hashes and outcomes follow existing checkpoint validation.
- Record the actual final verification artifact, then capture the checkpoint's Git snapshot. The snapshot includes raw tracked working bytes, so a dirty revision is still checked. Missing Git provenance cannot support this stricter closure inspection.

For example, if `AC1` changes `reservation.ts`, a supporting item can have `criterionIds: ["AC1"]`, `kind: "automated"`, `revision: "<inspected commit>"` and `sourceIds: ["mission", "reservation", "contract"]`. The IDs refer to sources actually pinned in that checkpoint. No string in `verification` or `nextAction` is executed.

| Result | Meaning |
|---|---|
| `supported` | Every declared criterion has structurally matching, current recorded evidence; exit 0 |
| `unmet` | Missing coverage, provenance or context linkage; exit 1 |
| `reverify` | Inputs, Git state or recorded verification no longer support relying on the checkpoint; exit 1 |
| `blocked` | Mission/checkpoint dependencies remain blocked; exit 1 |
| `invalid` / invocation error | Malformed records or unsafe paths; exit 2 |

**Supported is not a completion certificate.** Review whether criteria capture the user's real objective and whether the checks demonstrate them. A log saying “passed” can be wrong or irrelevant; this inspector does not rerun tests or judge artifacts. A recommendation cannot substitute for an automated check. No result changes mission status or grants permission to integrate/publish.

## Correction history

```sh
devmethod loop --loop loop.json --dest /path/to/project --json
```

A minimal format 1 record (fictional example, no execution evidence):

```json
{
  "format": 1,
  "missionId": "RESERVE",
  "state": "active",
  "nextAction": "Inspect the failing capacity scenario",
  "stopReason": null,
  "limits": {
    "maxAttempts": 3,
    "maxConsecutiveNoProgress": 2,
    "maxDurationMs": null,
    "maxObservedTokens": null
  },
  "attempts": []
}
```

Each attempt contains contiguous `number` starting at 1, `outcome` (`passed`, `failed`, `blocked`, `interrupted`), `observation`, nullable `diagnosis`/`adjustment`, `evidenceIds`, boolean `progress`, and nullable nonnegative integer `durationMs`/`tokens`. Passing claims need evidence IDs; this command does not resolve or certify those IDs. Before retrying a failed/blocked/interrupted attempt, record the diagnosis and changed approach or reconciled state in the next attempt. Text presence is not semantic validation.

Limits: 1–100 attempts; no-progress limit cannot exceed max attempts. Optional duration and observed-token thresholds are positive safe integers or null. Unknown usage is null, never zero. Unknown usage under a selected threshold requires reconciliation. Known nonnegative observations can still prove a threshold crossing: the inspector retains that crossing and any later attempt while the full reported total remains null. Totals are reported after attempts; these are not enforced process or provider caps. An attempt recorded after an earlier threshold crossing is flagged even if later progress resets the streak. Review any authorized limit change in the canonical mission; never erase attempts to regain budget. The inspector cannot detect an operator deleting prior attempts or rewriting the declared limits.

States are `active`, `complete`, `blocked`, `interrupted`, `limit-reached`, `abandoned`. Active requires a next action and no stop reason. Stopped states need a reason; complete/abandoned have no next action. Reports distinguish `eligible` (exit 0), `correct-course`, `needs-reconciliation`, `blocked`, `limit-reached`, `abandoned` and `closure-required` (exit 1). Invalid input exits 2. A successful last attempt can require closure even if it reached a budget limit; it never authorizes another attempt. Completed history without a passing last attempt cannot support closure.

## Verification and limitations

`node --test tests/closure-loop.test.mjs` exercises the actual inspectors and CLI. These are deterministic fixture checks, not an observed model campaign. The [behavioral evaluation suite](../evaluation/behavioral/README.md) separates those evidence layers. See [host capabilities](HOST-CAPABILITIES.md) for what is guidance, implemented inspection, historical pilot or unavailable. The [ADR](ADR-011-evidence-coverage-and-loop-inspection.md) records compatibility and trust boundaries.
