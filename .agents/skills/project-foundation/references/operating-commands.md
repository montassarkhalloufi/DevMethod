# Method commands

These commands describe a reusable work path. They are not shell commands and do not authorize any external action.

## Native invocation

The table's short names are internal stages, not standalone native commands. Invoke `$project-foundation verify TASK-1` in Codex, or `/project-foundation verify TASK-1` in Claude Code and Cursor. Apply the same syntax to all fourteen stages, with their optional argument. Do not register `/verify`, `/review`, or other short names as global commands: they can conflict with the tool's commands. Every recommended next command must be qualified in the same way. If the host is unknown, write `project-foundation: verify TASK-1` in natural language.

An unknown stage displays available stages without starting work. With no stage, read the current state and apply `status`. Routing is an instruction to the model, not a deterministic parser or execution guarantee.

Every command starts by reading applicable instructions, accepted decisions, real status, and required sources. It produces a verifiable outcome without inventing missing data, business rules, or validation.

Use [work sizing](work-sizing.md) to select relevant stages. A quick change may assess readiness and complete implementation, review, and verification in one run. The stage list does not require separate user turns or documents for each stage. Explicit `status`, `ready`, or `review` requests retain their assessment scope.

| Command | Purpose | Suggested next step |
|---|---|---|
| `/explore` | Research existing solutions proportionately and discuss evidence and next direction | `/frame` |
| `/frame` | Define value, scope, exclusions, and metrics | `/design` or `/architecture` |
| `/design` | Create/select visual direction, master and derived screens, or apply approved UX; resolve design-to-code for visual work | `/design` for unfinished visual scope, then `/architecture` |
| `/architecture` | Discuss structural alternatives and record choice/delegation before dependent detail | `/plan` |
| `/plan` | Discuss useful delivery scope, then milestones and near-term tickets; stay conditional on open decisions | `/ready` |
| `/ready <ticket>` | Verify scope, DoD, dependencies, contract, and tests | `/implement <ticket>` |
| `/implement <ticket>` | Deliver a coherent slice with focused tests | `/review <ticket>` |
| `/review <ticket>` | Review diff, architecture, contracts, tests, and risks | `/verify` or `/implement` |
| `/verify <ticket>` | Run documented checks and assess evidence | `/integrate <ticket>` |
| `/integrate <ticket>` | Prepare a PR/merge under repository policy | `/next` |
| `/correct-course` | Address a scope change or invalidated decision | `/architecture` or `/plan` |
| `/next` | Resume from real status and select the next slice | appropriate command |
| `/status` | Distinguish planned, in progress, PR, merged, and deployed | `/next` or `/correct-course` |
| `/handoff` | Create a concise checkpoint for another session or agent | `/next` |

## Responsibility and minimal context

Start from the canonical mission/plan locations in the existing profile; see [mission context](mission-context.md). Read applicable rules and the current task first, then only the decisions, sources and evidence needed for this command. Do not regenerate the profile or read every previous stage document on each invocation.

- `status` reports actual state, evidence gaps and blockers without changing records or executing checks. `next` reconciles the canonical record with real state and selects the next authorized slice; it does not start implementation merely because a candidate exists.
- `explore`, `frame`, `design` and `architecture` add only missing decisions to their existing owner. `plan` owns task decomposition, dependencies and executable criteria, reusing the current plan. Neither creates a new status ledger or proves delivery.
- `ready` assesses the selected task's scope, dependencies and checks without executing them or starting implementation. Under an implementation request, this assessment can happen inline and continue without another user turn when ready.
- `implement` maintains the affected task and evidence through its implementation loop. `review` inspects the identified diff and evidence, recording findings without silently fixing code unless fixes were requested. `verify` runs missing or invalidated checks and updates criterion evidence. Reuse unchanged evidence whose inputs and environment still apply; do not rerun solely because a new stage was invoked.
- `handoff` records a compact snapshot with links to canonical state. `correct-course` updates only affected decisions, scope and dependent evidence. `integrate` records the actual authorized delivery result with its reference.

For prose-only changes, inspect accuracy, links and diff; do not invent `npm run quality` or trigger an application build by habit. Follow stricter repository gates when documented, and explain once why they apply. Report executed checks, never planned checks as success.

## Discovery, decisions and delivery dialogue

- `explore` follows [existing solutions research](exploration.md): dated evidence, uncertainty and a conversation about continuing, repositioning, reducing, deepening or abandoning. Skip irrelevant research for isolated fixes.
- `frame` records need, scope, success criteria and business rules in the product owner, referring to research. `design` continues to follow the unchanged design-to-code workflow and approved directions.
- `architecture` resolves decision-architecture and presents alternatives in conversation before dependent detail. Record a clear choice or scoped delegation; a PROPOSED document alone is insufficient. Silence, an ambiguous “ok” or invoking `plan` does not adopt it.
- `plan` follows [delivery planning](delivery-planning.md), invites scope edits and records priorities/milestones under current delegation. Open architecture means a conditional plan. An omitted architecture exchange resumes directly in `architecture`.

## Response

At the end of every command, provide:

1. **Done**: concrete outcome and available evidence.
2. **Not done / uncertain**: limits, assumptions, and blockers.
3. **Recommended next command**: exactly one command, with the ticket when present.
4. Ask for authorization only before a merge, deployment, publication, message, or external action that was not already authorized.

## Ready ticket

A ready ticket contains its objective, scope and exclusions, acceptance criteria, Definition of Done, ADRs/contracts to respect, dependencies/blockers/milestone, and test strategy. An unresolved dependency blocks dependent work and returns to the responsible stage (directly to `/architecture` for an open choice), never to an invented rule. Use `/correct-course` for an actual scope or accepted-decision change when useful.

Run `/ready <ticket>` before the first implementation change in the slice. Read its real dependencies, not only its imported status. `/ready` and `/status` are assessments: they do not fix code or change an external tracker without a corresponding request. For a project already underway, assess the next slice and report earlier gates that were not observed.

When the user requests an audit or full test of the path, retain the output of each command at the time it runs with its inputs, evidence, and next command. Label later reconstructions; they do not prove that a control preceded the code.

## Implementation loop

`/implement` means build a slice, test what it touches, review the diff and boundaries, correct it, then run agreed checks. Distinguish local code, an open PR, merged code, and verified deployment.

A failed `/verify` returns to the relevant correction. If a gate is blocked by the environment, recommend `/correct-course` or `/handoff`, not `/integrate`. An explicit `/integrate` invocation with an unsatisfied gate may prepare a candidate, but must refuse acceptance. `/integrate` respects and names the actual authorized delivery mode (local, PR, or merge). At scope completion, `/next` records completion and offers `/status` as an optional consultation; it does not create new features or an automatic loop.
