# Backend boundaries

A pragmatic default, adapted to existing contracts.

## Responsibilities

- Presentation: trusted identity, transport validation/mapping, use-case call, and result/error presentation.
- Application: use cases, business authorization, transactions, idempotency, required ports, and domain orchestration.
- Domain: invariants, state transitions, rules, and business errors independent of frameworks, HTTP, ORM, broker, or AI provider.
- Infrastructure: port implementations, persistence, messages, storage, providers, and representation mapping.
- Composition: concrete assembly, with no hidden business rules.

Dependencies are Presentation → Application → Domain. Infrastructure depends inward and implements ports; Composition assembles the edges. The domain does not depend on an SDK. Do not hide cycles behind barrels.

I/O ports required by use cases belong in Application by default, including persistence. Preserve a different inner convention if it is already accepted; do not move ports under the banner of generic DDD.

Domain Entity, Persistence Row, DTO, and Integration Event are distinct contracts. Do not add four identical mappers ceremonially; separate representations where responsibilities diverge. No default GenericRepository, BaseEntity, or catch-all service.

## Design a slice

State an intent, inputs/outputs, preconditions, effects, stable errors, and owner. Identify the invariant and where it is guaranteed under concurrency. A client-side check protects neither rights nor quotas.

For a material state-changing flow or architecture audit, keep a compact chain in the existing contract or review: failure scenario → invariant → authoritative enforcement and commit point → guarantee scope → check and observed result. Identify the responsible code/data boundary and whether the guarantee holds within one process, across concurrent instances, after restart, or after retry/expiry. Reuse criterion IDs and evidence links; do not create another status ledger. A small change can keep this inline.

Verify that guarantee at its actual boundary with a representative interleaving or injected failure. A sequential test or an in-memory port does not establish a multi-instance database guarantee. State the tested topology, data/workload and revision; keep untested guarantees explicit with the missing check. Select architecture and decomposition for these requirements, without making microservices, extra layers or a particular pattern mandatory.

For data, specify owner, transaction, uniqueness, useful indexes, concurrency, migration, and restore/forward-fix. Do not rewrite an applied migration. Prefer expand/migrate/contract when versions coexist.

For messages, specify producer, consumer, contract/version, acknowledgement, redelivery, idempotency, backoff, poison message, and recovery. Do not promise “exactly once” through a broker alone. Use outbox/inbox only when atomicity and recovery need it.

Do not access another service's database or private code. Use its accepted contracts. A rebuilt projection must not rewrite historical evidence of a decision.

## Verify

Use domain tests for invariants; use-case tests with faked ports; real integration tests for transactions, constraints, and concurrency; contract/HTTP tests for transport. Rely on existing import checks; if an architecture gate is needed, cover aliases, type-only imports, and every relevant package. Text search alone does not prove forbidden dependencies are absent.
