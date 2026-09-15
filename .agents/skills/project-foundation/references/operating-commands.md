# Method commands

These commands describe a reusable work path. They are not shell commands and do not authorize any external action.

## Native invocation

Each documented stage has a discoverable `devmethod-<stage>` skill. In Codex invoke `$devmethod-review TASK-1`; in Claude Code or Cursor invoke `/devmethod-review TASK-1`. Select it in the host's skill menu and supply the target. No npx, terminal launcher or CLI installation is required to run the agent workflow after the skills are installed.

The equivalent `$project-foundation review TASK-1` (Codex) and `/project-foundation review TASK-1` (Claude Code/Cursor) remain supported. Table entries omit the host prefix: recommend the qualified `devmethod-<stage>` invocation when installed, otherwise the compatible `project-foundation <stage>` form. Never register bare `/review` or `/verify`, which may conflict with host commands. If the host is unknown, use `DevMethod review TASK-1` in natural language.

The default installation exposes all fourteen stages. Module subsets expose only commands whose procedure is installed; foundation commands remain available. Do not claim a missing module was loaded. These skills instruct the connected agent to do the work; they do not turn the installer into an autonomous executor.

An unknown stage displays available stages without starting work. With neither a stage nor an actionable objective, read the current state and apply `status`. When the user supplies an actionable objective without naming a stage, select the proportionate path for that objective and carry out the authorized work; do not downgrade a delivery request to `status`. Explicit stage-only requests retain their stated scope. Routing is an instruction to the model, not a deterministic parser or execution guarantee.

Every command starts by reading applicable instructions, accepted decisions, real status, and required sources. It produces a verifiable outcome without inventing missing data, business rules, or validation.

Use [work sizing](work-sizing.md) to select relevant stages. A quick change may assess readiness and complete implementation, review, and verification in one run. The stage list does not require separate user turns or documents for each stage. Explicit `status`, `ready`, or `review` requests retain their assessment scope.

| Command | Purpose | Suggested next step |
|---|---|---|
| `devmethod-explore` | Research existing solutions proportionately and discuss evidence and next direction | `devmethod-frame` |
| `devmethod-frame` | Define value, scope, exclusions, and metrics | `devmethod-design` or `devmethod-architecture` |
| `devmethod-design` | Create/select visual direction, master and derived screens, or apply approved UX; resolve design-to-code for visual work | `devmethod-design` for unfinished visual scope, then `devmethod-architecture` |
| `devmethod-architecture` | Discuss structural alternatives and record choice/delegation before dependent detail | `devmethod-plan` |
| `devmethod-plan` | Discuss useful delivery scope, then milestones and near-term tickets; stay conditional on open decisions | `devmethod-ready` |
| `devmethod-ready <ticket>` | Verify scope, DoD, dependencies, contract, and tests | `devmethod-implement <ticket>` |
| `devmethod-implement <ticket>` | Deliver a coherent slice with focused tests | `devmethod-review <ticket>` |
| `devmethod-review <ticket>` | Review diff, architecture, contracts, tests, and risks | `devmethod-verify` or `devmethod-implement` |
| `devmethod-verify <ticket>` | Run documented checks and assess evidence | `devmethod-integrate <ticket>` |
| `devmethod-integrate <ticket>` | Prepare a PR/merge under repository policy | `devmethod-next` |
| `devmethod-correct-course` | Address a scope change or invalidated decision | `devmethod-architecture` or `devmethod-plan` |
| `devmethod-next` | Resume from real status and select the next slice | appropriate command |
| `devmethod-status` | Distinguish planned, in progress, PR, merged, and deployed | `devmethod-next` or `devmethod-correct-course` |
| `devmethod-handoff` | Create a concise checkpoint for another session or agent | `devmethod-next` |

## Responsibility and minimal context

Start from the canonical mission/plan locations in the existing profile; see [mission context](mission-context.md). Read applicable rules and the current task first, then only the decisions, sources and evidence needed for this command. Do not regenerate the profile or read every previous stage document on each invocation.

- `status` reports actual state, evidence gaps and blockers without changing records or executing checks. `next` reconciles the canonical record with real state and selects the next authorized slice; it does not start implementation merely because a candidate exists.
- `explore`, `frame`, `design` and `architecture` add only missing decisions to their existing owner. `plan` owns task decomposition, dependencies and executable criteria, reusing the current plan. Neither creates a new status ledger or proves delivery.
- `ready` assesses the selected task's scope, dependencies and checks without executing them or starting implementation. Under an implementation request, this assessment can happen inline and continue without another user turn when ready.
- `implement` maintains the affected task and evidence through its implementation loop. `review` inspects the identified diff and evidence, recording findings without silently fixing code unless fixes were requested. `verify` runs missing or invalidated checks and updates criterion evidence. Reuse unchanged evidence whose inputs and environment still apply; do not rerun solely because a new stage was invoked.
- `review` resolves scoped-delivery and its review-workflow reference for technology-aware, source-backed inspection, structured results and derived reports. Preserve read-only assessment scope unless corrections were requested. UI reviews include real render/interaction checks; findings and checks remain distinct.
- `handoff` records a compact snapshot with links to canonical state. `correct-course` updates only affected decisions, scope and dependent evidence. `integrate` records the actual authorized delivery result with its reference.

For prose-only changes, inspect accuracy, links and diff; do not invent `npm run quality` or trigger an application build by habit. Follow stricter repository gates when documented, and explain once why they apply. Report executed checks, never planned checks as success.

## Discovery, decisions and delivery dialogue

- `explore` follows [existing solutions research](exploration.md): dated evidence, uncertainty and a conversation about continuing, repositioning, reducing, deepening or abandoning. Skip irrelevant research for isolated fixes.
- `frame` records need, scope, success criteria and business rules in the product owner, referring to research. Before handing it off, check that the first slice still serves the requested outcome and distinguish deferred capabilities from discarded ones. For a stateful core journey, walk a normal transition and a relevant changed-input or retry case: identify what happens to already saved or confirmed state, or mark that behavior unresolved before dependent implementation. Keep this check in the existing framing record, not a new approval stage. `design` continues to follow the unchanged design-to-code workflow and approved directions.
- `architecture` resolves decision-architecture and presents alternatives in conversation before dependent detail. Record a clear choice or scoped delegation; a PROPOSED document alone is insufficient. Silence, an ambiguous “ok” or invoking `plan` does not adopt it.
- `plan` follows [delivery planning](delivery-planning.md), invites scope edits and records priorities/milestones under current delegation. Open architecture means a conditional plan. An omitted architecture exchange resumes directly in `architecture`.

## Response

At the end of every command, provide:

1. **Done**: concrete outcome and available evidence.
2. **Not done / uncertain**: limits, assumptions, and blockers.
3. **Recommended next command**: exactly one command, with the ticket when present.
4. For merges, deployments, publications, messages, and other external actions, ask for authorization only when it is not already present. Separately, resolve material product, architecture, or visual choices that remain undecided and undelegated through their relevant module; do not request confirmation again for an existing choice or scoped delegation.

## Ready ticket

A ready ticket contains its objective, scope and exclusions, acceptance criteria, Definition of Done, ADRs/contracts to respect, dependencies/blockers/milestone, and test strategy. An unresolved dependency blocks dependent work and returns to the responsible stage (directly to `/architecture` for an open choice), never to an invented rule. Use `/correct-course` for an actual scope or accepted-decision change when useful.

Run `/ready <ticket>` before the first implementation change in the slice. Read its real dependencies, not only its imported status. `/ready` and `/status` are assessments: they do not fix code or change an external tracker without a corresponding request. For a project already underway, assess the next slice and report earlier gates that were not observed.

When the user requests an audit or full test of the path, retain the output of each command at the time it runs with its inputs, evidence, and next command. Label later reconstructions; they do not prove that a control preceded the code.

## Implementation loop

`/implement` means build a slice, test what it touches, review the diff and boundaries, correct it, then run agreed checks. Distinguish local code, an open PR, merged code, and verified deployment.

A failed `/verify` returns to the relevant correction. If a gate is blocked by the environment, recommend `/correct-course` or `/handoff`, not `/integrate`. An explicit `/integrate` invocation with an unsatisfied gate may prepare a candidate, but must refuse acceptance. `/integrate` respects and names the actual authorized delivery mode (local, PR, or merge). At scope completion, `/next` records completion and offers `/status` as an optional consultation; it does not create new features or an automatic loop.
