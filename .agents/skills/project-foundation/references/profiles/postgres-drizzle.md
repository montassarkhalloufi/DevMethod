# PostgreSQL and Drizzle profile

Apply to relational persistence, migrations or transaction boundaries. Inspect actual server version, extensions, ORM and driver locks, schema definitions, migration journal/history, connection limits and backup/restore procedure. Preserve established SQL naming, identifiers and migration tooling.

Separate domain objects from persistence details where responsibilities differ. Enforce data invariants in the database when concurrency can bypass application checks. Specify transaction ownership, uniqueness and lock behavior for the operation. A single INSERT is already atomic; do not add a transaction wrapper without a multi-statement invariant. Retry only identified transient failures with bounded attempts and a known outcome/idempotency contract.

Never edit an applied migration. Review old/new application coexistence, backfills, data loss, index locks and recovery. Prefer a forward fix for an applied faulty migration; demonstrate restore before claiming rollback safety. A schema file compiling does not prove the migration matches it.

Executable example: `examples/fullstack` pins PostgreSQL 17.6 image by digest, Drizzle 0.45.2 and pg 8.23.0. `npm run test:db` requires an isolated `DATABASE_URL`, applies the real migration twice and checks durable reads, unique IDs, title length and nonempty constraints. It fails when configuration is absent rather than silently skipping. `npm run test:e2e` uses the same real adapter. This is not a multi-writer transaction or restore test.

Source: [Drizzle PostgreSQL drivers](https://orm.drizzle.team/docs/get-started-postgresql), consulted 2026-09-13. Schema and migration are both committed in the fixture; one owner changes them together.
