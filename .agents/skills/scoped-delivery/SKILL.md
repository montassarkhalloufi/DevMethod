---
name: scoped-delivery
description: Turn an authorized software scope into a bounded implementation, meaningful verification, review and resumable handoff. Use for delivery workflows, agent coordination or continuing a ticket; skip trivial text edits and do not start unrelated backlog work.
---

# Scoped Delivery

Complete authorized scope without reinventing the project, multiplying reviews, or confusing status with evidence.

## Before acting

Read `CONTRIBUTING.md`, accepted decisions, applicable instructions, the decision/ticket, and the real code/PR state. Identify owned files and existing user changes. Preserve project policy on branches, worktrees, CI, and required skills.

Use [the mission record](assets/MISSION.md) for substantial work; keep Quick records inline. Scope is ready when objective, exclusions, contracts, dependencies, and success criteria are sufficiently defined. Use [the slice record](assets/SLICE.md) for a substantial ticket, without bureaucracy for a clear fix. A contradiction blocks only work depending on that trade-off.

Reuse the existing tracker/plan before creating any record. For substantial work without conventions, propose `docs/missions/<mission-id>/PLAN.md`, `tickets/<ticket-id>.md`, and a dated `REPRISE.md` when handing off. Use [PLAN](assets/PLAN.md), [TICKET](assets/TICKET.md) and [REPRISE](assets/REPRISE.md); create `preuves/` only for needed bulky artifacts. The plan owns mission outcomes, milestones and ticket order/links; tickets own scope, dependencies, status, criteria and revision-labelled evidence. Other records link to owners. Aggregated statuses must be derived from tickets, never independently maintained. A checkpoint is a historical snapshot, not another current status source. Existing `docs/missions/<mission-id>.md` records remain usable with [MISSION](assets/MISSION.md); never move or overwrite them automatically. Quick work stays inline.

Before fixing tickets, discuss the first useful outcome, learning, scope trade-offs, effort uncertainty and milestone demonstrations. Respect the user’s scope changes and existing delegations. Keep plans conditional where decisions remain open; a proposed plan proves neither readiness nor implementation.

For `review`, use [evidence-backed review](references/review-workflow.md) to detect actual versions, verify official sources and distinguish checks, confirmed findings and risks. Structured results own review evidence; reports, UI, tickets and plans reference or derive it.

## Deliver

- One coherent intent per slice; prefer a useful vertical slice to disconnected layers.
- One writer per branch/surface by default. Subagents run only when session/environment authorize them and bounded work justifies it.
- When parallel work is authorized: isolated worktrees/branches, a single owner for contracts/migrations/lockfiles, explicit dependencies and merge order. Reviews are read-only.
- Use focused tests during implementation, then verify affected surfaces. Do not repeat an unchanged green check or write a test that merely compares implementation with itself.
- For a substantial slice or handoff, use [the verification record](assets/VERIFICATION.md) to connect acceptance criteria to executed checks and the inspected revision. For small changes, keep this evidence inline.
- Read [verification and cost](references/verification-and-cost.md) for review criteria and costs. When a check fails, progress stalls or an execution is interrupted, apply [bounded correction](references/bounded-correction.md); retain the diagnosis in the existing ticket or inline Quick record.
- For a PR, keep it draft while code changes. Review an identified commit; a later change invalidates affected evidence. Group corrections, then conduct focused review.
- Merges, deployments, messages, and external-document updates follow current authorization, never an old copied prompt. If the final action is not authorized, prepare a concrete verified result before asking.
- After authorized integration, verify real status. Continue only backlog explicitly included in the mission, respecting project budget and limits.

## Resume

Record [a checkpoint](assets/CHECKPOINT.md) for long work: source versions, scope, commit, validation, blockers, next action. Do not copy Notion/Drive spaces or the full tool registry. On resumption, inspect actual source and evidence changes, then repeat affected checks. Optional content hashes and explicit evidence dependencies make this selective: invalidate evidence that depends on changed or unavailable sources/artifacts, including dependent reviews, while retaining independent results. Age alone is not staleness. Never replace hashes merely to preserve an old success. Existing Markdown checkpoints continue to work manually. A completed checkpoint authorizes no new work.

Update affected decisions, public contracts, tests, and real implementation status together. Run documented project quality commands; never weaken a test or lint to obtain green. Review the diff for secrets, personal data, and unintended changes. Respect existing publication and migration policy.

## Report

State what works, verification evidence, material limitations, and what remains required. Lead with the user outcome and decisions needing attention; explain the important changed behavior and why the cited checks establish it. Link bulky logs instead of making the reviewer reconstruct the work. Distinguish locally implemented, PR, integrated, deployed, and production-verified. A “Done” status proves none of those states.

Keep compatibility claims consistent in the README and usage instructions as well as the final report. Distinguish the declared or inferred minimum version from the environment actually tested; cite the basis for a minimum and label untested targets instead of implying that a successful run covers them.
