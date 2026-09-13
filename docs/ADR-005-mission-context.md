# ADR 005: Explicit mission context and bounded planning

Status: proposed for maintainer review, 2026-09-13.

The authorized evolution needs deterministic mission/context checks, reliable Git-aware resumption and bounded task planning. Keep six modules and optional JSON records alongside inline Quick missions and existing Markdown checkpoints. Add read-only CLI commands; do not execute a mission's commands. Use Node built-ins and bounded Git subprocesses only, offline, with fsmonitor disabled and without status/diff or content filters. Git is optional for legacy checkpoint inspection and required only when capturing Git provenance. Never invoke a shell with user strings.

Context contains source metadata and hashes, not source bodies. Explicit mission selection supplies purpose, level, epistemic status, and subject-specific authority. Discover tracked filenames as suggestions, not automatic authority. Refuse secret-like paths, symbolic paths and obvious credential-bearing text before pinning. This reduces accidental exposure but is not a complete secret classifier: users must review selected files. Bound record size, file size and inventory size. Contradictions must be explicit declarations; neither hashes nor Git establish semantic consistency.

Git snapshots record branch, commit and hashes of index/untracked metadata and raw tracked bytes. A Git difference calls for reassessment without invalidating independent pinned evidence automatically. Pins still determine selective content invalidation. A checkpoint never renews external authorization.

The generic planner validates and reports tasks, never spawns hosts or creates worktrees. Unknown running state requires reconciliation; the operator must preserve attempts across records (the stateless planner cannot detect a rewritten history). Existing native-dispatch evidence/budget gates remain. Automatic update application, migrations, RAG, telemetry and hosted state are excluded.
