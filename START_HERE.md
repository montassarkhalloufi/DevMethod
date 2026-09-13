# Start the kit

DevMethod offers six independent modules; this installation contains the modules you selected. If this is a staging directory, review and copy its installed skill folder into the project while preserving existing files. If you installed directly into the project, the selected skills are already in place. If a version already exists, compare changes before updating it. Keep `PROJECT_PROFILE.md` and complete the stack, commands, scope, deployment permissions, and data requirements from the project before adoption. `ENGINEERING_POLICY.template.md` retains the included policy; merge it with `CONTRIBUTING.md` and existing instructions.

In Codex, start with `$devmethod-status`; for a review select `$devmethod-review` and add a ticket, PR or changed paths. In Claude Code or Cursor use `/devmethod-status` or `/devmethod-review`. All fourteen documented stages are exposed by a full installation. Module subsets expose stages backed by installed procedures. Once installed, run stages directly in the agent: no npx is needed. Existing `project-foundation <stage>` invocations still work. For an open-ended request:

> Use the `project-foundation` skill for this project. Read existing instructions and sources, complete the profile without reinventing decisions, then deliver the following scope: [my objective]. Apply only relevant modules. Preserve the approved mockup, architecture boundaries, and React rules. Progress to a verified result within this scope.

The installer copies the method and its blank templates, not the adopted project's context. Keep the completed profile, decisions, tickets, and instructions separately. The manifest describes the initial installation: local adaptations normally change its hashes. To update, install into a fresh folder and compare changes.

If skills are not discovered automatically:

> Read `.agents/skills/project-foundation/SKILL.md` and only its relevant references, then complete: [my objective].

`AGENTS.foundation.md` provides a fragment to merge into existing instructions. It never replaces an `AGENTS.md`. The kit does not include third-party Vercel skills: apply versions already approved by the project; adding them is separate.

Examples:

- “Resume this ticket and deliver its complete slice.”
- “Here is the approved mockup: implement this page and verify desktop/mobile.”
- “Compare these two architectures against my budget and propose an ADR.”
- “Fix the view/hooks/business separation of this feature without a global rewrite.”

This kit reduces repetitive framing; it does not by itself prove application quality or production readiness.

For a new product, `explore` researches existing solutions and discusses the findings before framing. `architecture` discusses structural options before dependent detail; `plan` discusses delivery scope and stays conditional on open decisions. Keep accepted choices, delegations and approved design. For substantial work without conventions, propose a mission PLAN with tickets and a dated REPRISE; keep existing single-file missions usable.
