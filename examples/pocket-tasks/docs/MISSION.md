# PT-1 — Pocket Tasks

## Foundation / frame / design / architecture / plan / ready — recorded before implementation

Inputs: BRIEF.md, CONTRIBUTING.md, installed project-foundation, decision-architecture and scoped-delivery skills and their work-sizing, operating commands, backend boundaries, HTTP contracts, verification references. Standard scope is explicit in BRIEF.

Outcome: a local single-user task manager implementing AC1–AC7. Exclusions: authentication, deployment, external services, multi-process storage, arbitrary files. The owner has delegated routine choices within the contract.

Design: light responsive centered workspace, add form, three pressed-state filter buttons, task checkboxes and explicit Edit/Delete actions, inline edit form, live status and alert errors. No external fonts or assets. No approved image reference exists; this direction is an implementation choice within the brief.

Plan: (1) validate task invariants and serialize atomic file transactions; (2) map HTTP contract and safe static allowlist; (3) implement accessible UI; (4) run domain/HTTP/persistence/failure tests and self-review; (5) hand off for independent acceptance and browser checks.

Ready assessment: contract, constraints, permission and test strategy are sufficient. No unresolved dependency. ADR-001 records persistence boundary. Done requires real automated evidence and owner browser acceptance; implementation worker cannot claim independent acceptance.

Next command at readiness: `$project-foundation implement PT-1`.
