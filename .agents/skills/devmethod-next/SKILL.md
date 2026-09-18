---
name: devmethod-next
description: Inspect real mission state and select the next authorized slice without starting it. Use for the DevMethod next command.
---

# DevMethod next

Execute the `next` stage now for the user's supplied ticket, mission, paths or revision. This is an agent workflow, not a shell command or a request for usage instructions. Do not ask the user to run npx or install a CLI to execute this stage.

Read [the stage contract](../project-foundation/references/operating-commands.md) and [project context routing](../project-foundation/SKILL.md), then apply only `next` and its relevant references. Preserve the supplied arguments, existing decisions, authorizations and stage scope. Reuse available context; clarify only a missing target that materially changes the work. Do not run other stages merely because they are suggested next.

Use [scoped-delivery](../scoped-delivery/SKILL.md) for this stage’s detailed procedure.

Return the concrete outcome and verification limits. Include a next action only when work remains, following the stage contract and existing continuation authorization.
