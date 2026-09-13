# ADR 004: Content-pinned checkpoint evidence

Status: proposed for maintainer review with this implementation, 2026-09-13.

## Decision and scope

The authorized checkpoint-resumption milestone needs a bounded way to detect when previous verification no longer applies. Preserve the accepted six-module distribution, offline core and existing Markdown checkpoint workflow. Add an optional format 1 JSON record and dependency-free read-only API, owned by the checkpoint slice.

Pin repository-relative source files and evidence artifacts with SHA-256. Link each evidence item to explicit source IDs and optional evidence prerequisites. Validate references and reject cycles before inspection. Propagate invalidation from changed or unavailable sources and artifacts to their dependent evidence; preserve independent results. Failed and unrun prerequisites cannot support downstream success. Ignore age as an invalidation signal.

Keep scope/status/next action explicit. Completed scope requires a null next action. Inspection produces a report, never a state transition, automatic rehash, test execution, migration or new authorization. Blocked scope remains blocked until an authorized owner resolves it. Existing Markdown checkpoints continue manually; JSON is an opt-in companion rather than a replacement tracker.

## Alternatives and consequences

Keeping only prose is simplest but cannot reliably map changed inputs to affected evidence. Commit-only invalidation is too broad for independent work and misses uncommitted changes. Modification time confuses age with changed content. A scheduler or automatic repair system would expand permissions and operating complexity beyond this milestone.

Explicit pins require authors to record complete dependencies. The inspector cannot certify honest evidence, external state or omitted inputs. Local hashes are not release signatures. Unknown schema versions fail with actionable diagnostics. Portable safe paths and symlink preflight bound ordinary reads but do not defend against concurrent filesystem replacement. Inspect a quiescent project directory.

Revisit the schema only after native resumption runs expose concrete missing contracts. New schema versions must retain a deliberate compatibility path; this slice does not mandate adoption by existing projects.

## Verification

Tests cover selective/transitive invalidation, changed artifacts, failed and unrun prerequisites, unchanged bytes with old timestamps, absent files, malformed records, unsafe/symbolic paths and complete/blocked scope. Full installer tests and package inspection remain required. These tests are deterministic validator evidence, never native host behavior evidence.
