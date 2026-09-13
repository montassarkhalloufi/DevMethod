# PT-1 — implementation verification

Archived worker record at handoff. Subsequent coordinator acceptance, browser checks and final review are recorded in [the consolidated validation](../../../docs/GREENFIELD-VALIDATION.md). “Outstanding” below describes the worker handoff, not current release status.


2026-09-13. Worker-authored checks; not an independent review. Inspected baseline commit `0cf3474bfd777299873e51a2789829692c648130` plus uncommitted files below. Runtime actually used: Node v23.10.0 on macOS; Node 22 was specified as minimum but not separately executed here.

## Execution and correction

The pre-code readiness/design/plan outputs were recorded in MISSION.md before source creation. Implementation followed the domain/store/HTTP/UI slice. Self-review found that invalid persisted titles could leak the domain's HTTP 400 error classification; changed stored-record validation to throw a storage error (500) and added an empty persisted-title fixture. No contract weakening.

First `npm test`: 1 domain test passed, 5 HTTP tests could not bind because the outer sandbox denied loopback (EPERM). Second run with authorized loopback: 6/6 passed. After the stored-title correction, final `npm test` with loopback permission: 6/6 passed, 0 skipped/failed, 300 ms reported duration. No tests were disabled. The SHA utility failed due to host locale configuration; Node crypto computed the hashes below instead.

## Acceptance evidence

| Criterion | Worker evidence | Remaining acceptance |
|---|---|---|
| AC1 CRUD/filtering | HTTP CRUD/reopen/delete tests pass; client filter implementation inspected | Owner real browser actions and filters |
| AC2 invalid input | Bad types, null/array, empty/overlong title, empty patch, malformed JSON, >16 KiB rejected; stored bytes unchanged | Independent harness |
| AC3 restart persistence | Close/recreate server sees saved record; deletion persists; 20 concurrent creates retained | Independent restart check |
| AC4 safe title rendering | HTML-looking string round-trip; title uses textContent, no innerHTML; CSP | Owner real browser injection check |
| AC5 keyboard/narrow | Semantic forms/buttons/labels, checkbox labels, pressed filters, live status, responsive CSS inspected | Owner keyboard/narrow browser check |
| AC6 tests/recovery | Six Node tests executed; README commands and explicit backup/repair instructions | Owner startup acceptance |
| AC7 context/handoff | Filled profile, mission readiness, ADR, this evidence and HANDOFF | Owner method-path assessment |

The reviewer is the implementation worker here; no independent review is claimed. Native browser evidence belongs to the owner and is not reconstructed into worker evidence. No deployment or production use was tested.

## Evidence identity (SHA-256)

- BRIEF.md: `574ff435d8ac66f39cad76d0318c6476afea061737b0c217599c0e401c541125`
- server.mjs: `9791de6e7c63790ce837ed9ddd80f6f50edfc3465bc553621aaf8e529cd19ecd`
- src/domain.mjs: `0a65f1775d4de877985730a344857e84d359d4a9259c29cd43e5e3c991b606db`
- src/store.mjs: `abf87b665bbe34dca33dff02acdca4389d2a32063dfb55d61cbe9b6b6ae36208`
- public/index.html: `420e4d1cf29535298196a5da2ee43603662c7189908be9fed01a1e068d4316e9`
- public/styles.css: `a3868709460fb1cf522a56a65e8bcf132074c2fb8ed65ac5384d134bd5cde251`
- public/app.js: `38b2ad64ac707c94856f0808db11e96f0fb86f71a8bb888c2a97f1b82423eef0`
- tests/app.test.mjs: `c08c030b2232e2f6139f10db505e8fc089102a2cf7156a35c937cfa27aba7703`
- package.json: `92dd7058064ae4b18c0cfcabcb7585c526e50bf1bccd5e3e706cbf302878f1e3`

## Independent review correction — local browser boundary

The coordinator's independent review identified a real omission: loopback binding alone did not stop cross-origin simple requests or untrusted Host values. The original version accepted JSON-shaped bodies with text/plain and had no Host/Origin validation. This finding invalidates the original HTTP-boundary sufficiency claim; it does not change BRIEF or installed skills.

Correction: require the exact `127.0.0.1:<effective local port>` Host, reject duplicate Host; reject external/null Origin, duplicate Origin or Sec-Fetch-Site cross-site on POST/PATCH/DELETE; require application/json for POST/PATCH (415), preserve same-origin and Origin-free CLI clients. No authentication guarantee is claimed.

Added real HTTP test verifies 24 hostile Origin/Host mutation combinations, eight unsupported-MIME writes, a hostile read, unchanged persisted bytes, a valid same-origin update with charset, and an Origin-free CLI update. Its first run failed because the raw test client omitted Content-Length for DELETE/GET bodies (socket hang-up); corrected the test transport framing, without weakening assertions. Final `npm test`: **7/7 pass**, 0 failed/skipped, 1221 ms reported duration. Current source hashes above reflect this correction. UI sources remain unchanged. Owner independent harness/browser rerun remains separate.

Next command: `$project-foundation verify PT-1` for independent owner acceptance.

## Browser-found validation feedback correction

The owner browser check found that a whitespace title received HTTP 400 but the UI described it as an ambiguous save and requested reload. Updated the client to distinguish definitive 4xx rejection from network/5xx ambiguity. Validation now preserves add/edit input, restores an unsuccessfully toggled checkbox, focuses the editable input and permits immediate correction without reload. Network/5xx failures still offer reconciliation.

Added two tests executing the real client script in Node VM with a minimal DOM substitute: validation input preservation/immediate second submission, and network/server reconciliation messaging. These check control flow, not rendered browser accessibility. Final npm test: **9/9 pass**, 0 failed/skipped, 340 ms. Owner browser recheck remains separate.

- tests/ui-errors.test.mjs SHA-256: cb70e0628dfa78c33bd02b6d799bf533dfb0217cc009760d4f5ec24d63cdc70d

Next command: `$project-foundation verify PT-1` (owner browser check).
