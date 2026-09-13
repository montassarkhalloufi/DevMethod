# MongoDB profile

Apply only when a mission touches MongoDB. Inspect driver/ODM locks, server version and feature compatibility, replica-set/sharding topology, collection validators, indexes, read/write concerns and existing migration scripts. Preserve document boundaries and identifier representation; do not substitute MongoDB for an accepted SQL store.

State the aggregate/document invariant. Prefer a single-document atomic update when it expresses that invariant; evaluate transactions when several documents must change together. Check optimistic concurrency, unique indexes, missing/null distinctions, BSON/date serialization and bounded queries. Do not assume a local standalone server supports the same transaction behavior as a replica set.

Plan document-version coexistence, resumable backfill, index creation and forward recovery. Establish whether retries can repeat business side effects; a driver retry setting alone is not end-to-end idempotence.

Project-local controls: use the existing test command against an isolated matching topology; verify concurrent updates, uniqueness, failed transaction recovery and migration restart. Record exact server/driver versions and command results. No MongoDB executable fixture or run is supplied here: status **not run**, guidance only. Do not present proposed checks as validation.

Source: [MongoDB transactions](https://www.mongodb.com/docs/manual/core/transactions/), consulted 2026-09-13. Revisit the versioned documentation for the project's server and topology.
