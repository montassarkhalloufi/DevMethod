# PT-1 — resumable handoff

Archived worker record at handoff. Subsequent coordinator acceptance, browser checks and final review are recorded in [the consolidated validation](../../../docs/GREENFIELD-VALIDATION.md). “Outstanding” below describes the worker handoff, not current release status.


Done: local app implemented; nine automated tests pass with loopback permission. Method sources and BRIEF were preserved. No commit, publication, purchase, deployment or extra worker was performed. Source hashes, actual runtime and limitations are in VERIFICATION.md; baseline commit is `0cf3474bfd777299873e51a2789829692c648130`.

Dirty state: PROJECT_PROFILE.md updated; README.md, package.json, server.mjs, src/, public/, tests/ and docs/ created. Owner may be running a separate browser instance with its own data file; coordinate before restarting or changing these frozen source files. Worker never read or edited the sibling independent verification directory.

Outstanding: owner independent API/browser acceptance including real keyboard, filtering, injection and narrow viewport. Independent review found missing local HTTP browser boundaries; worker corrected Host/Origin/MIME checks and added a non-mutation regression test. Evidence is in VERIFICATION.md. The coordinator owns any resulting method guidance evolution. This single fictional project cannot establish superiority over another method, universal reliability, or production readiness.

Resumption: inspect actual source/hash and owner acceptance results; fix specific findings within BRIEF if any, invalidate/re-run affected evidence, then record acceptance. Work beyond this app or integration remains owned by the coordinating agent. Single-process file storage and lack of auth/deployment are explicit scope boundaries.

Next command: `$project-foundation verify PT-1`.

Latest correction: owner browser observation of misleading HTTP 400 feedback resolved. Client preserves input and permits immediate correction for 4xx; network/5xx retain reconciliation. Two VM-based UI regression tests added; browser confirmation belongs to the owner. Source app.js hash updated in VERIFICATION.md.
