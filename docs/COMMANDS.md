# Run DevMethod in your agent

Version 0.4.0 exposes every documented workflow stage as a discoverable skill. Install the skills once using the existing installer. Afterwards select a command in the agent and supply its target; no npx invocation or running DevMethod service is needed.

| Workflow | Codex | Claude Code / Cursor |
|---|---|---|
| Explore | `$devmethod-explore` | `/devmethod-explore` |
| Frame | `$devmethod-frame` | `/devmethod-frame` |
| Design | `$devmethod-design` | `/devmethod-design` |
| Architecture | `$devmethod-architecture` | `/devmethod-architecture` |
| Plan | `$devmethod-plan` | `/devmethod-plan` |
| Ready | `$devmethod-ready TASK-1` | `/devmethod-ready TASK-1` |
| Implement | `$devmethod-implement TASK-1` | `/devmethod-implement TASK-1` |
| Review | `$devmethod-review TASK-1` | `/devmethod-review TASK-1` |
| Verify | `$devmethod-verify TASK-1` | `/devmethod-verify TASK-1` |
| Integrate | `$devmethod-integrate TASK-1` | `/devmethod-integrate TASK-1` |
| Correct course | `$devmethod-correct-course` | `/devmethod-correct-course` |
| Next | `$devmethod-next` | `/devmethod-next` |
| Status | `$devmethod-status` | `/devmethod-status` |
| Handoff | `$devmethod-handoff` | `/devmethod-handoff` |

The entry points load the existing [stage contract](../.agents/skills/project-foundation/references/operating-commands.md) and relevant procedure. They are not separate copies of the method. The old `project-foundation <stage>` syntax remains supported. No bare `/review` is registered over the host's own command.

A full installation exposes all fourteen commands. Foundation-only installs expose explore, frame, correct-course and status. Design requires design-to-code; architecture requires decision-architecture; plan, ready, implement, review, verify, integrate, next and handoff require scoped-delivery. Module selection and the manifest's six module names are unchanged. Other technical modules remain available when selected.

## Compare architecture before committing

Use `$devmethod-architecture` with the product or change to decide, or let `$project-foundation` route there. For a new service or a material capacity/availability change, the agent establishes the workload and operating constraints that could change the choice, including when technical decisions are delegated. Existing answers are reused; unknowns become focused questions or explicit provisional assumptions.

The [architecture procedure](../.agents/skills/decision-architecture/references/capacity-and-operations.md) compares credible options with diagrams, workload-linked trade-offs and estimated fixed/variable costs plus operating effort. Estimates identify units, source dates and uncertainty. It recommends an option and evolution triggers, then links capacity/recovery claims to milestone and ticket verification. A diagram, cost calculation or chosen component does not establish production capacity; unavailable measurements remain unverified. Accepted architectures and routine fixes do not reopen this comparison automatically.

For a detailed or presentation-quality architecture illustration, use `$devmethod-architecture` with the accepted contract and any graphic reference. The [architecture visual procedure](../.agents/skills/decision-architecture/references/architecture-visuals.md) separates system meaning from styling, composes a readable overview and relevant detail views, and preserves editable sources plus actual rendered previews. SVG with PNG is the default for a polished illustrated request, while supported inline Mermaid remains useful for simpler explanations. The agent checks visual legibility and contract fidelity independently; the graphic does not establish measured system capacity.

## Choose working mode and carry a study forward

For a new project, `$project-foundation` reuses the preference and delegation already supplied. If a material boundary remains undecided, it offers three working modes once:

| Mode | Choices and delivery | Human checkpoint |
|---|---|---|
| **Autonomous** | The agent explores, chooses within the reversible delegation, implements and verifies the authorized scope. | A decision outside that delegation, a required external-action authorization, or observed drift that cannot be resolved within the agreed bounds. |
| **DevAuto** | Structural product, design and architecture choices are discussed and accepted first; the agent then implements, verifies and makes bounded corrections within that scope. | A new or invalidated structural choice; acceptance already given is reused. |
| **Guided** | Material choices and acceptance of useful delivered slices are discussed; authorized implementation and checks still proceed without micromanaging commands. | The agreed choice and result checkpoints, after the agent has prepared a concrete, reviewable result. |

These are [agent collaboration contracts](../.agents/skills/project-foundation/references/working-modes.md), not additional commands or a universal execution service. For example, ask `$project-foundation continue in DevAuto with the accepted design and architecture`. Automatic continuation requires an available, authorized host executor; unavailable capabilities remain explicit. The modes share the same verification, review and repository gates. They do not add permission to merge, publish, spend or contact others.

Record the mode and its source in the existing profile, reuse them after interruption, and change them on request. A failure, repeated unsuccessful correction, invalidated context or unknown consumption is a factual signal to inspect the affected scope. It is not a numeric confidence score or an automatic reason to ask the user about everything. Continue independent work and request only the decision needed to resume the affected part. A routine fix does not reopen accepted architecture, repeat onboarding or require a full set of planning documents.

Ask `$project-foundation` or `$devmethod-handoff` to generate a complete project study in PDF or DOCX and an editable portable package. The agent first checks the actual agreed study: research, features/rules, architecture and costs, selected design assets where applicable, milestones and tickets. Missing required elements are addressed before producing a report labeled complete. Export requires document/rendering capabilities supplied by the host, not by the installer.

Supply that dossier to `$project-foundation` in a new project to reuse its decisions and assets, reconcile current constraints and resume the next useful work. The [portable-study procedure](../.agents/skills/project-foundation/references/portable-study.md) distinguishes a presentation document, editable sources and actual implementation evidence. External workspace import or team transmission remains a separately authorized action.

## Review actual work

For example, select `$devmethod-review` and add `the current uncommitted diff against HEAD`. The agent reads actual changes and relevant contracts, executes applicable checks and reports located findings, evidence and limits. A clear ticket, PR, revision or path selection can replace that target. An ambiguous scope is clarified only when it affects the review.

A review does not silently fix product code. Small reviews can stay in the conversation; substantial reviews use the existing tracker or the installed structured review format. Checks that were not run remain explicitly unverified. To inspect and view results in one request, use `$devmethod-review the current changes, then open the report`. The agent generates Markdown/HTML from its real JSON and opens the report using the installed offline renderer. It does not ask you to run npx. A small review may stay in the conversation unless a report is requested. The separate shell viewer only presents existing records and remains available for manual use; fictional demo results never replace your review.

## Adopt into an existing project

Install the candidate into a fresh staging directory with the same host and selected modules. Compare it with your existing installation. Copy the new `devmethod-*` folders and merge the relevant foundation/delivery resources, including scoped-delivery/scripts for offline report generation, preserving local customizations. Do not overwrite the filled project profile, instructions, mission records or a divergent skill. Keep the previous manifest until you have intentionally reconciled all adopted baseline files; never replace hashes merely to hide modifications. `update-preview` can classify changes read-only; it does not apply them.

Do not run `init` over a customized installation expecting it to upgrade: conflicts block all writes. Both legacy single-file missions and PLAN/tickets missions remain readable, with no automatic migration. If the host does not discover the added skills, reload/reopen its session and inspect its configured skill directory. As a fallback ask it to read the installed `devmethod-review/SKILL.md` directly. Discovery and model behavior need host-specific verification; file installation tests alone do not prove autocomplete behavior.
