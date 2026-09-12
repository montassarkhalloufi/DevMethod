# Roadmap

Aim: a compact engineering workflow for verifiable changes in existing repositories. Compete through demonstrated outcomes. See the [BMad comparison](BMAD-COMPARISON.md) for sources and limits. Priorities are ordered; later work is not automatically authorized by completing an earlier item.

| Priority | Outcome | Acceptance evidence | State |
|---|---|---|---|
| P0 | Diagnose an adopted installation without losing customizations | Read-only doctor, malformed-path tests, full/subset host coverage, packed CLI checks | Implemented in this source change; release pending |
| P0 | Make first use and small fixes understandable | Quick/standard/major guidance, runnable B1 fixture, three starter prompts | Instructions/examples added; native behavioral evaluation pending |
| P0 | Distinguish claims from proof | Criterion-to-check verification record and release checklist | Templates/procedure added |
| P1 | Validate actual host behavior | Authenticated Codex, Claude Code and Cursor runs at pinned versions; all fourteen stages | Full cross-host evidence pending |
| P1 | Measure usefulness against alternatives | Matched no-method, DevMethod and BMad runs; publish success, failure, time and available usage | Protocol plus B1 fixture available; comparative runs pending |
| P1 | Trace installed versions | New manifests record package version and distribution provenance; old manifests remain readable | Planned |
| P2 | Preview safe upgrades | Classify unchanged, customized, added and removed files; produce reviewed diff without overwriting context | Planned |
| P2 | Detect stale project context | Identify affected decisions/checkpoints from source changes; do not treat age alone as staleness | Planned after evaluation |
| P2 | Validate structured state when needed | Versioned schema, actionable errors and transitions linked to evidence; coexist with existing trackers | Proposed, requires recurring need |
| Later | Coordinate bounded workers | Explicit scope, dependencies, ownership, worktrees, budgets, stop/recovery rules; supported host contract | Proposed, no scheduler implemented |

## What to add only after demand

Additional stack packs, a workflow builder or orchestration should solve repeated problems shown by real projects. The six existing modules remain the core. Do not add persona counts, a dashboard, cloud services or a vector store as proxies for workflow quality.

## Principles

- Preserve accepted project decisions, existing instructions and current authorization.
- Keep the CLI offline and dependency-free at runtime.
- Load relevant context progressively; measure savings before claiming them.
- Prefer a failed or blocked verification over a false claim of completion.
- Separate source implementation, npm publication, OS installation and native model behavior.
- Preserve required maintainer review for public releases; a recommended next step grants no new permission.

## Current authorized development

See [the milestone checkpoint](MILESTONES.md) for the focused implementation PRs, verification, dependencies and resume boundary. Provenance/update previews and checkpoint inspection are implemented in the linked PRs; fixture/comparison utilities are tested, while actual native and matched model evidence remain pending. Bounded orchestration is blocked on those prerequisites. The table above retains the roadmap's priority order; candidate implementation is not a released or behaviorally validated capability.
