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

## Review actual work

For example, select `$devmethod-review` and add `the current uncommitted diff against HEAD`. The agent reads actual changes and relevant contracts, executes applicable checks and reports located findings, evidence and limits. A clear ticket, PR, revision or path selection can replace that target. An ambiguous scope is clarified only when it affects the review.

A review does not silently fix product code. Small reviews can stay in the conversation; substantial reviews use the existing tracker or the installed structured review format. Checks that were not run remain explicitly unverified. A browser viewer is optional: the shell command `devmethod review --review ...` validates and displays recorded results, but cannot conduct the review. The agent must not ask you to run npx as a prerequisite to inspection or launch fictional demo results instead of reviewing your code.

## Adopt into an existing project

Install the candidate into a fresh staging directory with the same host and selected modules. Compare it with your existing installation. Copy the new `devmethod-*` folders and merge the relevant foundation/delivery resources, preserving local customizations. Do not overwrite the filled project profile, instructions, mission records or a divergent skill. Keep the previous manifest until you have intentionally reconciled all adopted baseline files; never replace hashes merely to hide modifications. `update-preview` can classify changes read-only; it does not apply them.

Do not run `init` over a customized installation expecting it to upgrade: conflicts block all writes. Both legacy single-file missions and PLAN/tickets missions remain readable, with no automatic migration. If the host does not discover the added skills, reload/reopen its session and inspect its configured skill directory. As a fallback ask it to read the installed `devmethod-review/SKILL.md` directly. Discovery and model behavior need host-specific verification; file installation tests alone do not prove autocomplete behavior.
