---
name: project-foundation
description: Start or resume the DevMethod workflow for a project or requested change, selecting the amount of planning and delivery guidance needed. Use for explicit DevMethod requests, project setup, or context recovery; skip implicit routing of isolated edits that already have sufficient context.
---

# Project Foundation

Establish durable working context from the actual project. This kit is a reusable method, not an authority above the project's own instructions. Read only the relevant modules.

## Start or resume

1. Read `CONTRIBUTING.md` when present, applicable instructions, work status, manifests/lockfiles, and referenced decisions. Inspect provided sources before selecting a stack. Do not read secrets.
2. Identify separately the product source of truth, accepted decisions, executable scope, visual reference, and delivered code. Their authority depends on the subject, not only their date. Never confuse a proposal, mockup, and implementation.
3. Reuse the existing local profile. Otherwise adapt [the profile](assets/PROJECT_PROFILE.md) from the session's sources and decisions. Mark unknowns. Ask only for what blocks a material decision; progress with the rest.
4. Describe the requested outcome, exclusions, affected boundaries, and smallest useful slice. A kit request does not trigger development in the projects being studied.
5. Apply the relevant module below. Preserve the session's authorizations; the kit does not authorize new purchases, publications, messages, merges, or changes to external sources.
6. Deliver the verified result within the requested scope. Save a compact checkpoint when work must continue, rather than a new copy of every source.

Before adoption, define the stack, commands, scope, deployment permissions, and data handling in the profile. If `CONTRIBUTING.md` is absent, report it as a missing source without inventing its content or blocking an already-scoped standalone creation. Skills are optional procedures; they do not replace policy, decisions, tests, or review.

Project-specific examples, history, and sources remain in that project. This kit never treats them as universal rules.

## Mission context

Use a mission as the unit of authorized work. Keep Quick records inline; substantial work may use [mission context](references/mission-context.md) and the scoped-delivery mission template. Select sources by subject authority and load details progressively. Optional offline CLI inspection never executes a mission.

## Reusable working method

This kit formalizes a complete method: exploration → framing → design → architecture → planning → implementation → testing → review → integration. A new constraint, failed validation, or open decision returns work to the appropriate command.

For a new change, select the quick, standard, or major path using [work sizing](references/work-sizing.md). These paths select relevant stages; they do not add commands or require fourteen separate turns. A clear small fix can perform readiness, implementation, review, and verification together under existing authorization.

Read [the operating commands](references/operating-commands.md) for any invocation with a stage, or to structure a new project, epic, or slice. In Codex, run `$project-foundation status`. In Claude Code or Cursor, run `/project-foundation status`. Replace `status` with the desired stage. The commands do not replace project commands.

At the end of every execution, state what is done, what remains uncertain or blocked, and one recommended next command.

## Kit modules

| Need | Skill to resolve by name |
|---|---|
| Decide product/stack trade-offs, ADRs, DDD, or backend boundaries | `decision-architecture` |
| Translate an approved reference into UI and verify fidelity | `design-to-code` |
| Build/refactor React, hooks, state, and server/client boundaries | `react-feature-engineering` |
| Design product agents, evidence, AI providers, and jobs | `reliable-ai-integration` |
| Turn scope into verifiable delivery, review, and resumption | `scoped-delivery` |

Resolve names through available skills or local folder frontmatter. Do not assume installed folders retain their original name. If a module is missing, state the gap and handle the independent work; do not claim it was loaded.

For React, the in-house module complements official Vercel skills. Reference URLs do not constitute an installation. Approved and pinned project sources take precedence over a newer upstream version.

## Copy the folder into another project

The DevMethod installer copies the selected skills, their resources, context templates, and a start prompt. It preserves divergent files and does not modify existing instructions.

From the target project, with Node.js 22+ and npm:

```bash
npx --yes --package=github:montassarkhalloufi/DevMethod devmethod init --tool codex
```

Choose `--tool claude` or `--tool cursor` for those tools. Without an option, an interactive terminal asks which one to use. Add `--modules decision-architecture,scoped-delivery` to limit modules; `project-foundation` remains included. Add `--dry-run` to inspect without writing, or `--dest` to install into a fresh directory. npm downloads the package; the installer itself works offline. Claude Code requires carrying relevant rules into its existing `CLAUDE.md`, or importing an existing `AGENTS.md` with `@AGENTS.md`.

Inspect the summary. Identical files are reused; any conflict blocks the entire operation before writing. The folder contains the skills for the selected profile, `PROJECT_PROFILE.md`, `AGENTS.foundation.md`, `START_HERE.md`, `DEVMETHOD-LICENSE`, and an integrity manifest. For another installation, run the CLI from that other project. Installation does not prove that a connected model executed the commands.

To update: install into a fresh directory and compare before merging. Merge useful rules into existing instructions only when that adoption is requested. Do not replace `AGENTS.md`, decisions, lockfiles, or already-approved skills. Adapt the profile once, then reuse it.
