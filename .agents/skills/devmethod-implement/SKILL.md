---
name: devmethod-implement
description: Implement an authorized ticket, run relevant checks and review the resulting change. Use for the DevMethod implement command.
---

# DevMethod implement

Execute the `implement` stage now for the user's supplied ticket, mission, paths or revision. This is an agent workflow, not a shell command or a request for usage instructions. Do not ask the user to run npx or install a CLI to execute this stage.

Read [the stage contract](../project-foundation/references/operating-commands.md) and [project context routing](../project-foundation/SKILL.md), then apply only `implement` and its relevant references. Preserve the supplied arguments, existing decisions, authorizations and stage scope. Reuse available context; clarify only a missing target that materially changes the work. Do not run other stages merely because they are suggested next.

Use [scoped-delivery](../scoped-delivery/SKILL.md) for this stage’s detailed procedure.

Return the concrete outcome, verification limits and one next command from the stage contract.
