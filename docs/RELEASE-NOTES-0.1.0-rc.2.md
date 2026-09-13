# DevMethod 0.1.0-rc.2 — candidate, not published

Historical rc.2 record. For the current supported scope and validation, read [the 0.1.0 release record](RELEASE-0.1.0.md).

A mission now connects authorized scope, selected source context, acceptance checks and resumable evidence. The six existing skills and their invocations remain intact.

- Offline read-only mission, discover, context and context-check commands capture explicit source authority, revisions and byte pins. Git provenance detects branch/index/raw content changes without executing Git content hooks.
- Existing JSON checkpoints remain readable; optional Git, blockers and criterion metadata improve resumption. Blocked results remain blocked. Input sizes are bounded.
- Installation provenance and read-only update preview from earlier merged PRs are included. A new conflict category distinguishes divergent upstream and local edits. No update-apply command or migration is introduced.
- A bounded manual task planner validates dependencies, ownership, worktrees, attempts and stop states. It does not dispatch workers or claim universal host execution.
- Optional stack profiles accompany a fictional Next.js/NestJS/Drizzle/PostgreSQL example, with real unit, database and production HTML checks. Source and runtime dependencies remain separate.
- Package documentation includes adoption, context, updates, troubleshooting, evaluation protocols and release instructions.

Compatibility: Node.js 22+; Git required only for Git-aware context/provenance. No runtime dependencies for the CLI. Legacy installation manifests and checkpoints remain readable. New conflict/outcome enum values require consumers to handle unknown classifications conservatively. Checkpoint artifacts now have explicit size limits; retain large logs outside compact pinned records.

Limitations: native Codex/Claude/Cursor comparative behavior remains pending; token/cost measurements unavailable. Browser hydration and cloud/broker/other database profiles are not runtime-validated. Current evidence and exact remaining gates are in [RC2-VALIDATION.md](RC2-VALIDATION.md). No superiority over BMAD is claimed.

## Publication procedure (maintainer only)

Review the exact stacked PR commits and their platform CI, then authorize integration separately. After integration, use a clean checkout of the reviewed release commit:

```sh
npm ci
npm test
npm run check:docs
npm pack --dry-run
npm pack
# Only after explicit maintainer publication authorization:
npm publish --tag next --access public
```

Inspect the tarball to ensure docs/examples and generated CLI are included, without node_modules/build outputs/secrets. Verify the published registry version and tarball integrity, then repeat the packaged CLI smoke test. Preserve rc.1 as the rollback reference. This document authorizes none of those external actions.
