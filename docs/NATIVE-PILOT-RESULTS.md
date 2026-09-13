# Native pilot results — 2026-09-13

Six actual authenticated Codex invocations completed on macOS using CLI 0.147.0, gpt-5.6-sol and low reasoning effort. Dispatch was sequential, with a 12-invocation maximum, 120-second termination deadline and 2 MiB output limit. The 500000-token threshold is checked between invocations: the sixth invocation brought reported input plus output to **549327 tokens**, including cached input. Six remaining repetitions were not run. Dollar cost is unavailable; no purchases or usage resets were made.

| Run | Reported tokens | Objective outcome | Independent assessment |
| --- | ---: | --- | --- |
| B1 no method, calibration | 80041 | Passed | Excluded: isolation settings changed afterward; independently rechecked |
| B1 no method, matched | 50248 | Passed | Correct bounded fix, preserved tests |
| B1 DevMethod, matched | 136469 | Passed | Relevant skills used, bounded fix and handoff, 2/2 tests |
| B1 BMAD 6.12.0, matched | 37157 | Failed | No changes or handoff; worker reports UV/temp blocker, but no UV invocation is evidenced in retained transcript |
| B3 DevMethod | 106828 | Passed | Unresolved ADR dependency recognized, no contract invented, handoff, 1/1 test |
| B4 DevMethod | 138584 | Passed | Initial failure recorded, stale checkpoint corrected against current contract, 1/1 test |

BMAD's reported environmental cause is **unconfirmed**, so this outcome is not evidence of method inferiority. Only one matched repetition per arm completed, instead of three. No statistical comparison or broad superiority is established. B4 explicitly requested initial tests and used a supplied stale checkpoint in a fresh invocation; it does not prove a complete two-session native chain. The original broader comparative protocol remains incomplete.

The optional fixture dispatcher now has native evidence for this pinned Codex/macOS scope. Admission, duplicate prevention, timeout, cancellation, unavailable hosts, output limits and environment filtering have focused deterministic tests. Independent fixture checks run in a macOS sandbox that denies network and writes; a separate adversarial check verifies denied sibling reads, writes and loopback access. This is a local fictional-fixture boundary, not universal hostile-code isolation. General planner dispatch, Claude/Cursor and Windows child-tree cancellation remain unvalidated.

Method/fixture source revision: `385c56f55691c2904d96a3360ed0d38ce3ecb535`. Setup records for the five invocations after calibration retain exact driver hashes, arguments, prompt and baseline; calibration has no driver hashes. Later hardening moved admission before worktree setup; the retained hashes distinguish the executed driver from the final source. [Machine-readable results](../evaluation/native-pilot-results.json) preserve usage and evidence digests. Raw transcripts and worktrees remain local outside the repository; they are not included in the package.

Reproduction settings and limits are in [the pilot contract](NATIVE-PILOT.md). A larger campaign requires a separately bounded budget and a new equally configured matched series, including verified BMAD prerequisites; do not retry only the failed arm and call it comparable.

Final local verification: `npm test` passed 63/63 tests; `npm run check:docs` passed; `npm pack --dry-run` passed with 142 files, using a disposable npm cache because the default cache was not writable. No package was published. Independent review covered supervisor boundaries and the retained B1/B3/B4 transcripts.
