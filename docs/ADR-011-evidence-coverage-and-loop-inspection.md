# ADR 011: Optional coverage and correction-history inspection

Status: proposed for exact-candidate maintainer review, 2026-09-15. Implementation is within the user's authorized 0.5 hardening scope; merge/release acceptance remains separate.

## Problem and decision

An intact checkpoint proves neither that the declared user criteria are covered nor that a retry changed anything. The existing mission, checkpoint and planner formats already own criteria, file pins and task state. Retain them and add two opt-in, dependency-free, read-only commands: `closure` joins a mission to its checkpoint; `loop` inspects a bounded correction history. Markdown and inline Quick work stay supported without these records.

Closure requires the exact mission, its selected context sources and each criterion's changed files to be pinned. Supporting evidence must name that criterion, depend on the mission and affected files, match the verification kind, and identify the checkpoint's inspected Git commit. Existing selective invalidation and Git reassessment run first. Every criterion in the selected mission is required; deferred work belongs outside that mission. Report `supported`, never certify semantic completion. Multiple checks can be recorded, but each supporting item must declare the criterion's complete changed-file dependency set; over-invalidation is preferable to inferred coverage.

Loop histories preserve failed attempts, diagnostics, adjustments, explicit unknown consumption and stop motives. They identify missing reconciliation and exhausted/stagnating histories. A completed loop requires separate closure assessment. A passing final attempt at its attempt limit can be assessed without authorizing another run. Observed token/duration totals are not hard runtime caps.

## Alternatives and boundaries

Changing legacy schemas or silently strengthening `resume` would break existing workflows. An automatic dispatcher would introduce host, budget and authorization contracts that are not validated here. Relying on prose alone remains appropriate for small tasks but cannot give reusable deterministic coverage diagnostics.

Neither inspector executes commands, writes trackers, authorizes actions, verifies that evidence is honest, detects every semantic omission, or protects against a rewritten history. Inspect a quiescent directory; pins do not prevent concurrent replacement. External effects must be reconciled separately. The hypothetical next action remains untrusted data. In particular a source hash cannot prove a test examines the right behavior or that a mission contains all of the user's requirements.

## Acceptance and research

Test uncovered criteria despite green logs, mismatched kinds/revisions/dependencies, stale source and mission pins, blockers, malicious paths, interrupted histories, unknown usage, stagnation and false complete labels. Validate the extracted package and retain legacy test results. Native agent behavior needs separate observed evaluations.

The [research and 27-workstream ledger](HARDENING-0.5.md) records the source publications and public-comment themes motivating these hypotheses. No source establishes DevMethod superiority or requires a universal autonomous runtime.
