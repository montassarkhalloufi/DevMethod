# Checkpoint resumption

The optional format 1 JSON checkpoint records source pins and evidence dependencies. Its read-only inspector is available in `dist/checkpoint.js`; it does not execute tests, update hashes, change project files or grant permission. Existing Markdown checkpoints remain supported as a manual workflow. No migration or new module is required.

## Record and resume

1. Record the authorized scope, actual state, next action, source revisions and checks using the scoped-delivery checkpoint template. Preserve project instructions and accepted decisions.
2. For machine inspection, write a separate JSON checkpoint using the contract below. Compute SHA-256 from the exact bytes of each relevant source and saved evidence artifact. Include code, tests, contracts and instructions that the evidence relies on. Record versions of tools or external sources in a pinned local inventory; refresh that inventory from the actual environment on resumption.
3. On resumption, inspect the checkpoint against the actual project. Review changed sources and affected evidence, including transitive dependencies. Repeat the affected checks before recording replacement artifacts and hashes. Never merely rehash changed files to make an earlier success look current.
4. Respect the original scope and current permissions. A ready report is evidence consistency, not authorization. A completed scope with stale evidence may need reassessment; it still supplies no next action and never authorizes additional backlog.

Example API usage from a source checkout (or replace the import with the installed package's absolute `dist/checkpoint.js` path):

```js
import { readCheckpoint } from './dist/checkpoint.js';
const report = readCheckpoint('/absolute/project', 'checkpoint.json');
console.log(JSON.stringify(report, null, 2));
```

The inspector does not exit the process. Callers choose their own policy from `status` and findings. `inspectCheckpoint(destination, input)` inspects an already parsed untrusted value with the same validation.

## Format 1 contract

This illustrative record uses placeholders; replace each hash with 64 lowercase hexadecimal characters before inspection. File paths are relative to the project. IDs are unique within sources and within evidence. Empty evidence is allowed for a newly started checkpoint but produces `reverify`.

```json
{
  "format": 1,
  "scope": "Correct the parser under the approved contract; local changes only.",
  "status": "active",
  "nextAction": "Review the verified parser diff.",
  "sources": [
    { "id": "parser", "path": "src/parser.ts", "sha256": "<source hash>" },
    { "id": "contract", "path": "docs/parser-contract.md", "sha256": "<contract hash>" }
  ],
  "evidence": [
    {
      "id": "tests",
      "path": "evidence/tests.txt",
      "sha256": "<artifact hash>",
      "sourceIds": ["parser", "contract"],
      "dependsOn": [],
      "outcome": "passed"
    },
    {
      "id": "review",
      "path": "evidence/review.md",
      "sha256": "<artifact hash>",
      "sourceIds": ["parser", "contract"],
      "dependsOn": ["tests"],
      "outcome": "passed"
    }
  ]
}
```

`status` is `active`, `blocked` or `complete`. Active and blocked records require a nonempty `nextAction`; complete requires `null`. Evidence outcomes are `passed`, `failed` or `not-run`. Each evidence entry requires at least one source and may depend on other evidence IDs. Unknown IDs, duplicate IDs/paths, cycles and malformed hashes are invalid. Additional fields may carry human context but do not affect inspection.

A content change or unavailable source invalidates its evidence. A changed or unavailable artifact invalidates that evidence. Invalidated, failed and unrun prerequisites invalidate dependent evidence recursively; independent evidence remains usable. Timestamp age alone has no effect. If bytes change back to the pinned content, the content comparison is unchanged; this is not an audit history.

Report format 1 includes destination, status, findings, per-source states and per-evidence states. Findings have stable category codes; message text may evolve. `ready` means active scope with all pins consistent and all recorded evidence passed. `complete` requires consistent pins and completed scope. `reverify` means changes, missing evidence, failed checks or unrun checks prevent relying on the record. `blocked` preserves an explicitly blocked scope, with findings still identifying stale evidence. `invalid` means the checkpoint or destination cannot be inspected. Consumers must examine evidence and findings even for blocked records.

## Limits and validation

Hashes are a local baseline, not signed evidence or proof that a check was executed honestly. The inspector cannot discover omitted dependencies, changes to an external host or service, unrecorded environment state, permission changes, or semantic equivalence. Pin and refresh those inputs explicitly. Existing project policies and manual verification remain authoritative.

The inspector rejects absolute/traversal paths, Windows drive/stream/device aliases, symbolic paths and non-regular artifacts. Inspect a directory that is not being modified concurrently: preflight checks do not provide an operating-system sandbox against path replacement races. No network, subprocess, credentials, telemetry or host evaluation is involved.

Automated tests exercise content changes, timestamp independence, selective and transitive invalidation, missing files, failed/unrun evidence, invalid schemas, unsafe paths, symlinks, completed/blocked state and byte preservation. These establish local validator behavior; native host resumption remains an evaluation requirement.
