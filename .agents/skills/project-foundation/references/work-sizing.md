# Choose the amount of process

Use this reference when starting a change or when scope changes. The fourteen stages are entry points, not fourteen mandatory conversations. Explain the selected path briefly; do not ask the user to choose a process label when the request and repository already settle it.

| Path | Use when | Minimum useful evidence |
|---|---|---|
| Quick | One clear, bounded change within accepted contracts | Inline scope and readiness, relevant check, diff review, outcome |
| Standard | A feature spans components or needs several sessions | Slice with acceptance criteria, relevant contracts, checks, checkpoint if interrupted |
| Major | Product intent, architecture, data migration, or cross-team dependencies need decisions | Resolve affected decisions, split work into ready slices, verify each slice and its integration |

Risk overrides apparent size: a one-line authorization, billing, or destructive migration change needs the relevant contract and failure checks. It does not automatically need unrelated product or UX documents. Existing repository gates apply to every path.

## Quick path

Read the affected code and applicable instructions. Perform `ready` inline: state the requested behavior, exclusions, and available verification. If ready under current authorization, continue through implementation, diff review, and verification in the same response cycle. A ticket ID, new profile, PRD, ADR, or separate approval turn is unnecessary for an already-clear small fix unless repository policy requires one. If no test is justified, explain the direct check instead of inventing one.

## Standard and major paths

Reuse an existing ticket or adapt the scoped-delivery slice when that module is available. Clarify only unresolved decisions that change implementation. Start at the relevant stage: an approved feature usually does not need `explore` again. A new UX direction goes through `design`; an API change resolves its contract before implementation. Major work ends in independently verifiable slices, not a single large specification followed by unbounded development.

## Existing repositories

Inspect the actual entry points, manifests, tests, applicable instructions, and accepted decisions for the affected area. Reuse current conventions. Record only missing context that changes future decisions; cite source paths and inspected revision. Do not create a complete repository inventory for a local bug fix. If documents and code disagree, describe that conflict and resolve only what the requested change depends on.

## Context and resumption

Load the current slice, its relevant decisions and the module needed for this step. Open deeper references when their condition applies. A handoff records the code revision, dirty files, evidence references, unresolved assumptions and exact next action. On resume, inspect changed files and dependencies before reusing evidence; a stale checkpoint is a clue, not current truth. Measure token use only when the host exposes it; otherwise record it as unavailable.

## Escalation and stopping

Move to a deeper path when discovery reveals a changed contract, dependency, migration, or meaningful uncertainty. Continue independent authorized work. Stop at completed scope, a concrete blocker, or the agreed time/cost limit. A recommended next command does not authorize another backlog item, a new worker, a merge, or deployment.
