# Method commands

These commands describe a reusable work path. They are not shell commands and do not authorize any external action.

## Native invocation

The table's short names are internal stages, not standalone native commands. Invoke `$project-foundation verify TASK-1` in Codex, or `/project-foundation verify TASK-1` in Claude Code and Cursor. Apply the same syntax to all fourteen stages, with their optional argument. Do not register `/verify`, `/review`, or other short names as global commands: they can conflict with the tool's commands. Every recommended next command must be qualified in the same way. If the host is unknown, write `project-foundation: verify TASK-1` in natural language.

An unknown stage displays available stages without starting work. With no stage, read the current state and apply `status`. Routing is an instruction to the model, not a deterministic parser or execution guarantee.

Every command starts by reading applicable instructions, accepted decisions, real status, and required sources. It produces a verifiable outcome without inventing missing data, business rules, or validation.

| Command | Purpose | Suggested next step |
|---|---|---|
| `/explore` | Understand the problem, users, market, and constraints | `/frame` |
| `/frame` | Define value, scope, exclusions, and metrics | `/design` or `/architecture` |
| `/design` | Define or apply an approved UX/UI direction | `/architecture` |
| `/architecture` | Define boundaries, ADRs, contracts, risks, and open decisions | `/plan` |
| `/plan` | Break work into milestones, epics, and ready tickets | `/ready` |
| `/ready <ticket>` | Verify scope, DoD, dependencies, contract, and tests | `/implement <ticket>` |
| `/implement <ticket>` | Deliver a coherent slice with focused tests | `/review <ticket>` |
| `/review <ticket>` | Review diff, architecture, contracts, tests, and risks | `/verify` or `/implement` |
| `/verify <ticket>` | Run documented checks and assess evidence | `/integrate <ticket>` |
| `/integrate <ticket>` | Prepare a PR/merge under repository policy | `/next` |
| `/correct-course` | Address a scope change or invalidated decision | `/architecture` or `/plan` |
| `/next` | Resume from real status and select the next slice | appropriate command |
| `/status` | Distinguish planned, in progress, PR, merged, and deployed | `/next` or `/correct-course` |
| `/handoff` | Create a concise checkpoint for another session or agent | `/next` |

## Output rules

At the end of every command, provide:

1. **Done**: concrete outcome and available evidence.
2. **Not done / uncertain**: limits, assumptions, and blockers.
3. **Recommended next command**: exactly one command, with the ticket when present.
4. Ask for authorization only before a merge, deployment, publication, message, or external action that was not already authorized.

## Ready ticket

A ready ticket contains its objective, scope and exclusions, acceptance criteria, Definition of Done, ADRs/contracts to respect, dependencies/blockers/milestone, and test strategy. An unresolved dependency leads to `/correct-course`, never to an invented rule.

Run `/ready <ticket>` before the first implementation change in the slice. Read its real dependencies, not only its imported status. `/ready` and `/status` are assessments: they do not fix code or change an external tracker without a corresponding request. For a project already underway, assess the next slice and report earlier gates that were not observed.

When the user requests an audit or full test of the path, retain the output of each command at the time it runs with its inputs, evidence, and next command. Label later reconstructions; they do not prove that a control preceded the code.

## Implementation loop

`/implement` means build a slice, test what it touches, review the diff and boundaries, correct it, then run agreed checks. Distinguish local code, an open PR, merged code, and verified deployment.

A failed `/verify` returns to the relevant correction. If a gate is blocked by the environment, recommend `/correct-course` or `/handoff`, not `/integrate`. An explicit `/integrate` invocation with an unsatisfied gate may prepare a candidate, but must refuse acceptance. `/integrate` respects and names the actual authorized delivery mode (local, PR, or merge). At scope completion, `/next` records completion and offers `/status` as an optional consultation; it does not create new features or an automatic loop.
