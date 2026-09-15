# Independent review of memory-quality

Reviewed commit: `b5df071815d7a842f2aa1c604473b1a1e4f96da0` in the isolated `memory-quality` worktree. This was a read-only review of the source, generated output, documentation, and relevant tests. The reviewed worktree remained clean.

**Conclusion:** no concrete correction is required within the documented contract. The implementation bounds the payload hashing buffer, rejects oversized manifests before parsing, avoids reading mismatched-size initialization targets, and preserves public diagnostic and update classifications. This is a bounded code and deterministic-test conclusion, not a process-memory benchmark or a guarantee under concurrent filesystem mutation.

| Area | Evidence and conclusion |
| --- | --- |
| Streaming SHA-256 | `src/filesystem.ts` reads through a 64 KiB buffer and updates the hash with the actual byte count. Empty files, short reads, and a 16 MiB payload are covered. Buffer reuse cannot include unread trailing bytes. |
| Initialization sizes | `src/init.ts` rejects an existing manifest above 1 MiB before parsing. For other existing candidate files it rejects a size mismatch before reading their contents. Same-size comparisons and bounded legacy manifest compatibility remain supported. |
| Update inspection | `src/update.ts` reuses hashes from the one inspection instead of hashing the same inspected payload twice. Added or otherwise unrecorded candidate files still receive an explicit filesystem check and hash. Missing files and customized/conflicting content retain their previous classifications. |
| Public diagnostics | `src/doctor.ts` keeps internal manifest/hash metadata behind `inspectInstallation`; public `diagnose` returns the report. The refactor preserves public findings and severity behavior in the inspected paths and regression suite. |
| File descriptors and rollback | The hashing descriptor is closed in `finally`, including short-read and injected read-failure paths. An additional descriptor-type rejection probe confirmed closure after `fstat` rejection. An injected installation write failure also closed the newly opened descriptor and removed the newly created destination. |
| Filesystem races | The implementation assumes a quiescent directory, as the updated documentation states. Path checks plus ordinary file opens do not constitute a filesystem snapshot, an OS sandbox, or protection against arbitrary concurrent replacement or in-place writes. Those guarantees are outside this contract; no additional locking or platform-specific open policy is requested by this review. |

## Verification

- `node --test tests/payload-memory.test.mjs tests/install.test.mjs tests/doctor.test.mjs tests/update.test.mjs tests/json-errors.test.mjs`: **31 passed**, no failures or skips. Output: `memory-review-tests.txt`.
- Compiled the reviewed TypeScript to a separate scratch output directory. The four changed JavaScript outputs (`doctor`, `filesystem`, `init`, `update`) match the committed `dist` files byte for byte. Evidence: `memory-review-generated.json`.
- `git show --check b5df071`: passed.
- Extra deterministic failure probes: `memory-fd-probe.json` and `memory-init-failure-probe.json`. These deliberately inject failure conditions in disposable directories; neither is evidence of a real concurrent filesystem race.

The new tests exercise meaningful risks: whole-file payload reads, repeated payload hashing, short reads, oversized manifest parsing, and cleanup after failure. The 64 KiB maximum-read assertion deliberately tests the documented buffer constraint; hash and classification assertions additionally check observable behavior. These are not empty assertions or a second implementation of SHA-256. Fault injection has a narrow purpose and does not replace normal filesystem success-path tests.

The review does not establish whole-process constant memory: trusted bundled candidate payloads are still buffered. Hashing time remains proportional to file size. No RSS benchmark, native-host campaign, concurrent-writer guarantee, or deployment result is claimed.
