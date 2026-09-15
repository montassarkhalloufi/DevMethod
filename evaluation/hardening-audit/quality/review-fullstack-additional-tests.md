# Additional fullstack boundary tests

Commit: `d965f380b53f8a9e2b4dc06a8b250e2ad77f4a3f`, on the isolated `application-quality` worktree after `898bc26e112ac3c9feb84a955105206df8896732`. Only `examples/fullstack/tests/http.test.cjs` and `examples/fullstack/tests/postgres.test.cjs` changed. Both were formatted with the requested Prettier version and options. No implementation, dependency, lockfile, infrastructure, or deliberately defective fixture changed.

The inspected contract specifies **title then UUID ID**, with at most 100 rows. It does not specify `createdAt` ordering.

## Implemented checks

1. A valid JSON POST reaches a failing insertion port exactly once. The real Nest server must return status 500 with only the generic error representation. This covers the POST exception branch independently of the pre-existing GET failure test.
2. A real PostgreSQL test inserts 105 rows through `PostgresTasks`. Three repeated titles and interleaved UUIDs distinguish title ordering from UUID ordering, while reverse insertion distinguishes sorted results from insertion order. The expected first 100 rows are constructed from the contract, without reproducing the SQL query. A temporary copy of the migrated table on one dedicated connection isolates the dataset and is removed by rollback, without deleting existing application rows.

## Executed evidence

- `npm test`: **7/7 passed**, including actual Nest HTTP requests and API TypeScript compilation.
- In a scratch copy, replaced the POST catch branch's ordinary rethrow with an HTTP 500 exception exposing `error.message`. The previous two HTTP checks still passed; the new POST test failed because `private-insert-credential` appeared instead of the generic response. Restoring the unmodified implementation yielded the 7/7 result above. Evidence: `test-quality-audit/additional-boundaries/http-error-mutant-red.txt`, `fullstack-green.txt`, and `results.json`.
- PostgreSQL test JavaScript syntax check and `git diff --check`: passed.

**PostgreSQL execution remains pending.** This worker has no `DATABASE_URL`, PostgreSQL binaries, or Docker. No database pass, migration pass, SQL mutation-killing result, or load/concurrency result is claimed. The existing PostgreSQL 17 CI job must run the new test on the integrated final commit. Changing `.limit(100)` to `.limit(200)` is a concrete proposed SQL mutant: with the asserted 105-row fixture it must disagree with the 100-row oracle, but that mutation has not been executed here. Removing either sort key is another relevant future sensitivity check; no new infrastructure is required.

The example README's pre-existing statement that `npm test` runs six tests now needs to read seven when the parent integrates this tests-only commit. The parent owns that documentation integration. Earlier audit recommendations concerning these two missing checks are superseded by this addition, subject to the explicitly pending database execution.
