---
name: scoped-delivery
description: Turn an authorized software scope into a bounded implementation, meaningful verification, review and resumable handoff. Use for delivery workflows, agent coordination or continuing a ticket; skip trivial text edits and do not start unrelated backlog work.
---

# Scoped Delivery

Complete authorized scope without reinventing the project, multiplying reviews, or confusing status with evidence.

## Before acting

Read `CONTRIBUTING.md`, accepted decisions, applicable instructions, the decision/ticket, and the real code/PR state. Identify owned files and existing user changes. Preserve project policy on branches, worktrees, CI, and required skills.

Scope is ready when objective, exclusions, contracts, dependencies, and success criteria are sufficiently defined. Use [the slice record](assets/SLICE.md) for a substantial ticket, without bureaucracy for a clear fix. A contradiction blocks only work depending on that trade-off.

## Deliver

- One coherent intent per slice; prefer a useful vertical slice to disconnected layers.
- One writer per branch/surface by default. Subagents run only when session/environment authorize them and bounded work justifies it.
- When parallel work is authorized: isolated worktrees/branches, a single owner for contracts/migrations/lockfiles, explicit dependencies and merge order. Reviews are read-only.
- Use focused tests during implementation, then verify affected surfaces. Do not repeat an unchanged green check or write a test that merely compares implementation with itself.
- For a substantial slice or handoff, use [the verification record](assets/VERIFICATION.md) to connect acceptance criteria to executed checks and the inspected revision. For small changes, keep this evidence inline.
- Read [verification and cost](references/verification-and-cost.md) for review criteria and costs.
- For a PR, keep it draft while code changes. Review an identified commit; a later change invalidates affected evidence. Group corrections, then conduct focused review.
- Merges, deployments, messages, and external-document updates follow current authorization, never an old copied prompt. If the final action is not authorized, prepare a concrete verified result before asking.
- After authorized integration, verify real status. Continue only backlog explicitly included in the mission, respecting project budget and limits.

## Resume

Record [a checkpoint](assets/CHECKPOINT.md) for long work: source versions, scope, commit, validation, blockers, next action. Do not copy Notion/Drive spaces or the full tool registry. On resumption, verify only items that may have changed.

Update affected decisions, public contracts, tests, and real implementation status together. Run documented project quality commands; never weaken a test or lint to obtain green. Review the diff for secrets, personal data, and unintended changes. Respect existing publication and migration policy.

## Report

State what works, verification evidence, material limitations, and what remains required. Distinguish locally implemented, PR, integrated, deployed, and production-verified. A “Done” status proves none of those states.
