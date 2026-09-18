---
name: devmethod-review
description: Review actual code changes, contracts and evidence, execute relevant checks and report actionable findings. Use for the DevMethod review command.
---

# DevMethod review

Execute the `review` stage now for the user's supplied ticket, mission, paths or revision. This is an agent workflow, not a shell command or a request for usage instructions. Do not ask the user to run npx or install a CLI to execute this stage.

Read [the stage contract](../project-foundation/references/operating-commands.md) and [project context routing](../project-foundation/SKILL.md), then apply only `review` and its relevant references. Preserve the supplied arguments, existing decisions, authorizations and stage scope. Reuse available context; clarify only a missing target that materially changes the work. Do not run other stages merely because they are suggested next.

Use [scoped-delivery](../scoped-delivery/SKILL.md) for this stage’s detailed procedure.

Follow [the review workflow](../scoped-delivery/references/review-workflow.md): inspect the actual diff and relevant interactions, execute applicable checks, and report findings with locations, impact, evidence and proposed corrections. Distinguish checked, failed and uninspected scope. Do not modify product code unless corrections were requested. Review artifacts may be written as part of the requested review.

For a substantial review, use [the review record](../scoped-delivery/assets/REVIEW.md) and complete [the report delivery procedure](../scoped-delivery/references/review-report.md). Produce the real JSON, derived Markdown and interactive HTML as one flow; open the HTML when the user asks to view/open the report. A request such as “review these changes, then open the report” authorizes generation and local opening, with no extra confirmation. Keep a small review concise unless a report is requested. Never substitute fictional demo data for actual findings or ask the user to run a terminal command.

Return the concrete outcome and verification limits. Include a next action only when work remains, following the stage contract and existing continuation authorization.
