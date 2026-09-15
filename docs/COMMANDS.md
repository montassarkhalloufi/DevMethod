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

For a new project, `$project-foundation` offers guided or autonomous work when no preference/delegation is already known. The mode changes how decisions are discussed, not the quality requirements or authorized scope. Reuse it on resumption and change it when requested.

Ask `$project-foundation` or `$devmethod-handoff` to generate a complete project study in PDF or DOCX and an editable portable package. The agent first checks the actual agreed study: research, features/rules, architecture and costs, selected design assets where applicable, milestones and tickets. Missing required elements are addressed before producing a report labeled complete. Export requires document/rendering capabilities supplied by the host, not by the installer.

Supply that dossier to `$project-foundation` in a new project to reuse its decisions and assets, reconcile current constraints and resume the next useful work. The [portable-study procedure](../.agents/skills/project-foundation/references/portable-study.md) distinguishes a presentation document, editable sources and actual implementation evidence. External workspace import or team transmission remains a separately authorized action.

## Review actual work

For example, select `$devmethod-review` and add `the current uncommitted diff against HEAD`. The agent reads actual changes and relevant contracts, executes applicable checks and reports located findings, evidence and limits. A clear ticket, PR, revision or path selection can replace that target. An ambiguous scope is clarified only when it affects the review.

A review does not silently fix product code. Small reviews can stay in the conversation; substantial reviews use the existing tracker or the installed structured review format. Checks that were not run remain explicitly unverified. To inspect and view results in one request, use `$devmethod-review the current changes, then open the report`. The agent generates Markdown/HTML from its real JSON and opens the report using the installed offline renderer. It does not ask you to run npx. A small review may stay in the conversation unless a report is requested. The separate shell viewer only presents existing records and remains available for manual use; fictional demo results never replace your review.

## Adopt into an existing project

Install the candidate into a fresh staging directory with the same host and selected modules. Compare it with your existing installation. Copy the new `devmethod-*` folders and merge the relevant foundation/delivery resources, including scoped-delivery/scripts for offline report generation, preserving local customizations. Do not overwrite the filled project profile, instructions, mission records or a divergent skill. Keep the previous manifest until you have intentionally reconciled all adopted baseline files; never replace hashes merely to hide modifications. `update-preview` can classify changes read-only; it does not apply them.

Do not run `init` over a customized installation expecting it to upgrade: conflicts block all writes. Both legacy single-file missions and PLAN/tickets missions remain readable, with no automatic migration. If the host does not discover the added skills, reload/reopen its session and inspect its configured skill directory. As a fallback ask it to read the installed `devmethod-review/SKILL.md` directly. Discovery and model behavior need host-specific verification; file installation tests alone do not prove autocomplete behavior.
