# Workflow and review delivery — 0.3.0

Owner: current implementation session. Authorized scope: improve explore, architecture, plan, mission ownership and review; deliver a functional browser review interface, package, PR, merge after checks, GitHub release and npm publication. Preserve approved design behavior, existing project conventions and user files. The user supplied a validated visual direction for the review screen; its example findings are not real evidence.

This repository already uses single-file mission records, so retain that convention for this delivery. The user added the review scope before publication; PR #19 remains the same delivery. Existing checks for the earlier commit are historical, not validation of the added interface.

## Executable scope and ownership

- Workflow guidance and mission templates: implemented; evidence and migration details in [workflow validation](../WORKFLOW-0.3-VALIDATION.md) and [migration](../WORKFLOW-0.3.md).
- Review record, derived report, browser interface and CLI: active. Acceptance: validated versioned records; consistent counters/filters; finding/check separation; evidence and official-source provenance; safe rendering; list/detail and direct links; export/reopen; explicit empty/invalid/partial/historical states; responsive keyboard use; distribution independent of the source checkout.
- Delivery: [PR #19](https://github.com/montassarkhalloufi/DevMethod/pull/19). CI/package proofs belong in the PR and release record. The actual review results are owned by [review.json](workflow-0.3-reviews/interface/review.json), with a generated report; do not duplicate finding status here.

Exclusions: whole-project dashboard, remote hosting, automatic discovery/installation/execution of third-party skills, automatic code review execution, arbitrary filesystem browsing, destructive migration, changes to the approved design workflow.

Current architecture question: static self-contained HTML versus loopback server; recommended static report under the dependency-free offline contract, presented to the user before dependent implementation. Preserve their forthcoming choice/delegation in the relevant ADR.

Next action: verify the final delegated offline-opening integration, merge and publish under current authorization. The user explicitly delegated the opening-mode choice on 2026-09-13; ADR 008 records the selected standalone HTML and optional OS opening command. Shared model, report/export, CLI presentation and browser UI are implemented. The file:// browser reopening limitation remains documented; do not bypass the browser tool policy or claim that check passed.
