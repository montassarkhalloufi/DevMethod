# Independent review of capacity guidance additions

Date: 2026-09-15. Reviewed commit: `b2636e56de09e8577d2d15eb13080322f3b4ba52`; tree `4657e195eadf856b6dd92c261916df21d5ee0464`, worktree `/workspace/scratch/0182c7a94d20/quality-guidance`.

Scope: the exact six-file commit only, read without modification, compared with the primary-source research and conditional recommendations in `research-scale.md`. The reviewer authored that research but did not implement this guidance patch.

Verdict: **no blocking technical error or unjustified universal prescription identified** in this bounded review.

The additions cover selected resource limits, backpressure, query-plan evidence, traversal semantics, dependency capacity, cache/tenant behavior, messaging backlog, recovery and telemetry. They preserve the existing workload/risk triggers and Quick-work exceptions. No new database/broker topology is required and no native or large-scale experiment is claimed.

The technically sensitive distinctions were checked explicitly:

- Offset versus keyset/cursor remains an access-pattern choice; unique ordering is required, and a cursor alone supplies neither authorization nor snapshot consistency.
- The PostgreSQL paragraph states that `EXPLAIN ANALYZE` executes its statement, uses an appropriate authorized target, distinguishes planner cost units from elapsed time, and calls for separate client-visible measurements.
- The Node paragraph inspects the whole buffering chain and explicitly rejects a fixed-memory claim based solely on using a stream API. Slow consumers, large individual rows and cancellation are selected checks.
- Shared dependency capacity accounts for instance/pool multiplication, deployment/reconnect bursts and other clients. An autoscaling ceiling is not treated as proof of protection.
- Cache miss coalescing, expiry staggering, tenant fairness and partition/replica checks are conditional on an actual dependency or topology.
- Failover, restoration and migration recovery are separated, with business-state verification and observed recovery results required only for the claimed guarantee.
- Messaging retains existing delivery/idempotency/ordering boundaries, adding resource and backlog checks rather than promising exactly-once effects.
- Telemetry limits, useful-output cost and failure diagnosis are connected to the objective; no benchmark numbers or unverified service defaults were imported from the sources.

The six retained primary sources match the research. The guidance correctly points to installed-version facilities and explicitly rejects transferring vendor examples or historical timings into this project's guarantees.

Validation in this review was semantic, read-only review of `git show` for the exact commit. The implementer's link/skill/package checks were reported separately and were not repeated here. This review does not establish that a coding agent will select or obey these instructions, or that a project built with them has demonstrated production capacity.
