# From-zero validation — Pocket Tasks

Recorded 2026-09-13. Scope: a fictional single-user local task manager, from an empty application repository through brief, readiness, architecture, implementation, tests, independent review, actual browser acceptance and handoff. No deployment, paid service or real user data was involved.

## Frozen input and method use

The coordinator installed the project-foundation, decision-architecture and scoped-delivery modules from DevMethod 0.1.0 source before application code existed. The baseline commit in the isolated experiment was `0cf3474bfd777299873e51a2789829692c648130`. The frozen [brief](../examples/pocket-tasks/BRIEF.md) has SHA-256 `574ff435d8ac66f39cad76d0318c6476afea061737b0c217599c0e401c541125`. Neither the brief nor installed skills changed during the experiment. The builder filled the profile and recorded readiness, decisions and plan before implementation. The coordinator authored separate API acceptance before the implementation was available; the builder did not read or edit that harness.

This used the current Codex workspace with a builder and a separate reviewer. It was not an isolated native-host benchmark or a matched BMAD trial. Host/model usage was not separately metered, and fourteen-stage universal coverage is not claimed. The public example preserves application sources and project records, excluding the private Git repository, installed skill copies, runtime data and conversation logs.

## Findings and corrections

Independent review reproduced a real defect: a JSON-shaped text/plain POST from an untrusted browser origin could mutate the loopback service. The builder added exact Host checks, mutation Origin/Sec-Fetch-Site validation, JSON media-type checks and non-mutation regression tests, preserving legitimate same-origin and Origin-free CLI requests. Architecture guidance now explicitly requires browser trust boundaries for local HTTP services. The observed app correction was review-directed; this experiment does not isolate the effect of the new guidance on a fresh agent.

Browser acceptance also found a misleading error: a definitive validation rejection demanded reload as though save status were unknown. The UI now retains input and permits immediate correction for 4xx; network/5xx failures retain reconciliation guidance. Independent final review found no remaining blocker in these corrections.

The initial sandbox denied HTTP listeners. Checks were rerun with authorized loopback access. An early independent Host assertion failed because fetch normalized its Host header; the harness now uses raw HTTP and verifies the transmitted header. No acceptance criterion was removed. The worker's own transport-framing correction and storage-error correction remain recorded in [worker evidence](../examples/pocket-tasks/docs/VERIFICATION.md).

## Actual acceptance

- Application tests: 9 passed, covering domain, HTTP, persistence, concurrent writes, corrupt-data preservation, browser trust checks and UI error recovery.
- Independent tests: 9 passed, including seven nested contract cases plus the parent and the separate trust-boundary test. API creation/edit/completion/reopening/deletion, invalid/oversized bodies, persistence across restart, concurrent creates, static restrictions and hostile request non-mutation passed.
- Real in-app browser: add with keyboard; edit/save; complete, filter, reopen; delete; restart and reload with persisted data; HTML-looking title remained literal with zero injected images; 390 × 844 layout inspected without horizontal overflow. Validation-only input retained focus and text, then accepted a corrected title without reload.
- Actual initial local runtime: Node v23.10.0 on macOS. Node 22 platform execution is tracked by the release CI, separately from these local observations.

## Reproduce

```sh
npm run test:greenfield
cd examples/pocket-tasks
npm start
```

Open `http://127.0.0.1:4318`. Tests use disposable files and ephemeral loopback listeners. The [application guide](../examples/pocket-tasks/README.md) explains backups, corruption recovery and single-process limits. The [independent acceptance](../evaluation/greenfield/acceptance.test.mjs) and [trust checks](../evaluation/greenfield/security.test.mjs) can target another copy using `PROJECT_DIR`. Package smoke also executes the application and independent suites from the extracted archive.

A passing fictional local app supports this bounded delivery path. It does not establish production readiness, authentication, distributed storage, universal native compatibility or superiority over BMAD. Future comparisons still require both methods to execute correctly under the published evaluation protocol.
