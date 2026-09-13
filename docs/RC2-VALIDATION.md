# rc.2 validation and remaining gates

Historical rc.2 record. For the current supported scope and validation, read [the 0.1.0 release record](RELEASE-0.1.0.md).

Candidate source, not npm publication. Baseline and acceptance scope: [EVOLUTION.md](EVOLUTION.md). Core commit `e3971fe`; fullstack commit `80bdf58` with title-contract correction `de25702` and dependency correction `170f16d`. Resolve the final packaging revision with `git log -1 -- package.json`; later modifications invalidate affected evidence.

| Capability / acceptance | Verification actually executed | Result and revision | Practical limit |
|---|---|---|---|
| Safe mission/context records, Git changes, legacy checkpoints, dependencies, blocked/complete states | Root `npm test` | 56 passed on core source | Explicit pins and declarations; not semantic discovery |
| Update customization/conflict handling | Root installer/update regression tests | passed, core source | Read-only preview; no automatic apply |
| Generic bounded planner | Root graph/ownership/recovery tests | passed, core source | Manual planning only; no dispatch adapter |
| Title/API/pure web boundaries | Fixture `npm test` | 6 passed, corrected fixture source | Native loopback tests, not coding-host behavior |
| Migration replay, constraints, persistence | Fixture `npm run test:db`, PostgreSQL 17.6 | 1 passed, fullstack source | Disposable local Docker database |
| Real API/database → Next production HTML, unavailable API, NUL rejection | Fixture `npm run test:e2e` | 1 passed after correction | Browser hydration not exercised |
| Independent review | Separate read-only reviewer | Core fixes and fixture boundaries reviewed | Not a native-host evaluation |
| Candidate clean package and documentation | `npm pack`, `node scripts/package-smoke.mjs` with candidate and actual rc.1 tarballs; `npm run check:docs` | passed locally; final candidate smoke repeated before delivery | Export/CLI behavior, not native host behavior |
| Mission → executed unit evidence → resume | `node scripts/fullstack-mission.mjs`, `resume` | passed / ready with unchanged fixture inputs | AC-TITLE only; database/e2e separate |
| Fixture dependency advisories | Clean install and `npm audit` after targeted Multer override | zero known vulnerabilities on 2026-09-13 | Time-bound advisory check, not a complete security audit |

The review reproduced Git fsmonitor side effects, unknown metadata leakage, zero-attempt cancellation rejection and title U+0000 acceptance. The implementation corrected them and added focused regressions. Failed intermediate attempts were retained in the working logs; no failed test was reclassified as passed without correction. Independent review then found no remaining core blocker. The fixture database consequence of NUL was initially inferred; the corrected real HTTP/e2e check confirms 400.

## Runtime and host observations

On 2026-09-13: Codex CLI 0.147.0 and Claude Code 2.1.238 responded to version probes; Cursor/agent executables were not on PATH. The current Codex task used the skills and a read-only reviewer, but this is not an isolated native benchmark or full fourteen-stage validation. Authenticated comparative runs are **pending** run/token/USD budget, exact model, enforceable host caps and reviewed transcripts. No repeated model batch was launched; tokens and cost are unavailable, never zero.

Use [the native protocol](../COMPATIBILITY.md#native-smoke-protocol) for each host and [matched comparison](../evaluation/COMPARISONS.md) for none/DevMethod/BMAD with identical fixtures, prompts, permissions, models and budgets. The fullstack example is executable fixture evidence, not a substitute for the original approved-screen B2 native protocol. Cursor remains pending an accessible executable/session. No cloud/broker/MongoDB profile was executed. Existing CI results refer to older revisions until exact-candidate jobs finish.

## Precisely blocked scope

- Native host behavior and repeated comparisons: awaiting explicit budget/model/caps and isolated authenticated runs; Cursor unavailable on PATH. Continue with prepared protocols, not simulated successes.
- Automated orchestration: native discovery/edit/failure/resumption evidence, reviewed dispatch/cancellation/recovery adapter and enforceable limits remain missing. Only the generic manual planner is implemented.
- Publication/integration: draft PRs and candidate are prepared for maintainer review; this mission authorizes neither main merge, npm publish nor deployment.

No BMAD superiority, universal host execution or production readiness claim is supported by this candidate.

## Platform CI and packaging observations

Core PR #6 passed Linux, macOS and Windows installation/test jobs in [run 34728170280](https://github.com/montassarkhalloufi/DevMethod/actions/runs/34728170280). This verifies its exact core revision, not later packaging changes. The final candidate PR adds separate PostgreSQL/Next fixture CI and packed CLI/documentation checks; inspect its jobs before release. Results of that later run must not be inferred from this earlier one.

The clean tarball smoke executes all three host layouts plus a subset, preserves filled profiles, validates mission/context, observes actual changed-contract reverify and checks manual plan candidates. The optional real rc.1 archive test detects conflict after upstream and local skill changes while preserving project data. Package inspection found no node_modules, Next build outputs, runtime evidence or logs. Public local-only database fixture credentials are intentionally documented and are not production secrets.

The first fullstack evidence capture reported reverify despite six passing tests because evidence/ was not Git-ignored; the ignore rule was corrected. A concurrent documentation edit also correctly invalidated a subsequent snapshot. The script keeps executed command outcome separate from freshness. The stable-source rerun produced passed/ready. Later dependency/commit changes require recapture, never silent reuse of that earlier checkpoint.

## Candidate handoff

Draft PR order: #6 core → #7 profiles/fixture → candidate packaging PR. Keep each PR's base until prerequisites integrate, then retarget deliberately. Do not merge or publish under this record. Completed local implementation includes mission/context, compatible resumption, explicit update conflicts, fullstack profiles/example, deterministic fixtures, manual planner and public candidate docs. The remaining gates above are native evidence/budget, native dispatch adapter, exact-candidate maintainer review and publication authorization.

To resume this same mission: inspect Git status and the three PR diffs/jobs, read current ADR statuses, retain any new changes, and resolve only the missing native budget/model/host prerequisites. No new backlog or external authorization comes from this handoff. Recommended next stage: `$project-foundation status` for evidence-only review; use correct-course only for the remaining named gates.

Exact candidate `23b8321` passed the PostgreSQL/Next CI in [run 34728735109](https://github.com/montassarkhalloufi/DevMethod/actions/runs/34728735109) and Linux/macOS jobs in [run 34728735080](https://github.com/montassarkhalloufi/DevMethod/actions/runs/34728735080). Its Windows package smoke failed because GNU tar interpreted the drive-letter archive path as a remote host. The smoke harness now feeds archive bytes through stdin instead of a drive path; check the subsequent PR #8 run for Windows confirmation. This was a test-harness portability defect, not a passed Windows candidate result.
