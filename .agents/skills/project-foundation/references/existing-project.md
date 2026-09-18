# Adopt an existing project

Use when bringing an existing product into DevMethod without sufficient method context. Installation and adoption are separate: `init` distributes skills and templates; it does not inspect the application, recover its decisions, migrate its data or import it into Studio. A project can use the method with its existing repository, stack and tracker.

## Reconstruct useful context from evidence

Start with the requested outcome and authorized repository, branch and paths. Identify the inspected revision and relevant uncommitted work; preserve user changes. Inspect applicable instructions, manifests/lockfiles, entry points, existing product/design documents, decisions and relevant tests before inferring what is missing. Follow only the journeys, data owners and external contracts that affect this work. A local correction does not require a complete repository inventory or a retrospective product study.

Reuse the existing owners. Fill missing fields in the project profile or a concise adoption note only when they guide the next work. For each material reconstructed statement, retain its source path/URL and revision/date, what was inspected, and its status: observed, reported, inferred or unknown. Record acceptance separately, with its actual authority. Code can show a current implementation or dependency; it cannot establish why it was chosen, whether a user approved it, or whether it meets a business need. An executable test is evidence of its asserted contract only within the behavior actually checked.

Recover the affected product outcome, journeys, domain rules, accepted UI, architecture/data boundaries, commands and delivery constraints to the extent the sources support them. Keep conflicting documents, code and observed behavior visible; resolve the conflict for the dependent scope rather than silently declaring the newest artifact authoritative. Do not manufacture a historical PRD, approval, ADR or missing business rule. Ask only for a decision-changing unknown and continue independent work. Existing accepted decisions need no ceremonial reapproval.

## Establish what must survive

Identify the current behavior to preserve: relevant public interfaces and clients, stored data/schema, authorization boundaries, important workflows and existing operational constraints. Distinguish an intended contract from a known defect. Inspect the current test strategy and run the available, authorized baseline checks that cover the planned change; keep existing failures and missing capabilities explicit. A successful build does not establish a usable screen, a compatible API, a safe migration or a working integration.

For a material stateful change, trace one representative existing journey through its persisted state and affected consumers, including a relevant failure/retry case. Reuse those observations in the acceptance criteria and verification strategy. Resolve new boundaries with `decision-architecture` when available; do not silently replace the architecture, framework, provider, lockfile or data model because the kit contains another example. Destructive migration, live data access and external changes retain their current permission boundaries.

Inspect capabilities through the host's exposed tools and the project's commands, dependencies and nonsecret configuration. Separate what an agent can invoke from services the application itself needs. Record only relevant capabilities, their actual availability, permissions and unresolved prerequisites; a package, endpoint name or connector in a catalog is not an executed integration. For an open tool/service choice, resolve `decision-architecture` and its tool-and-service selection guidance; if unavailable, state that limit and continue the inventory without inventing a selected provider.

## Enter delivery without starting over

Summarize what is preserved, which context is now sourced, what remains unknown and the smallest useful next slice. Join exploration only for unresolved product value, architecture only for an open structural choice, or implementation when the change is already authorized and ready. Do not replay every stage because no DevMethod files existed. Preserve existing working-mode delegation; reconstruction does not grant additional authority.

Use [mission context](mission-context.md) for source ownership and resumption, and [work sizing](work-sizing.md) for the amount of process. Keep reconstruction and baseline observations tied to the inspected revision. A later change to code, a source contract or a capability invalidates only the evidence that depends on it; unchanged independent knowledge remains usable. Reuse the existing decision/ticket record for correction and subsequent checks rather than keeping a second adoption tracker.
