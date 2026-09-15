# Large-workload engineering audit for DevMethod 0.5

Date: 2026-09-15. Baseline: `0fff7d10bb1cf15fa4af6012eaad5755021e2fe2` in `/workspace/scratch/0182c7a94d20/DevMethod`. Read-only guidance audit and public-source research; no code changes, infrastructure provisioning, load generator, database benchmark, or native model session was executed.

## Finding and scope

DevMethod already requires workload assumptions, simultaneous users, request/job rates, bursts, data growth, invariants, recovery, cost comparisons, failure scenarios, and qualified evidence. It also already rejects the idea that Redis, Kafka, replicas, or microservices prove scalability. Replacing this foundation with a generic enterprise checklist would add repetition rather than evidence.

The concrete gap is technical specificity at selected bottlenecks: memory-bounded exports and backpressure; representative query plans and deep pagination; bounded in-flight work and connection pools across instances; cache stampedes and tenant isolation; and operational evidence connecting saturation, failover, restoration, and costs to the user journey. Short conditional additions can address these gaps without requiring every mechanism in every project.

“Millions of users” and “billions of records” are scope labels, not a workload or demonstrated capacity. Distinguish registered users, active users during a stated window, simultaneous active sessions, in-flight requests, arrival rate, request mix, payloads, and retained versus queried data. The existing guide covers most of this distinction. No numeric SLO, traffic assumption, production size, hardware capacity, or expected speedup is inferred for an unseen project.

This is a systematic review of the requested risk families, not a claim that every possible scalability concern has been enumerated. Applicability depends on the project's traffic, invariants, topology, team, budget, and failure consequences.

## Existing coverage inspected

| Existing file | What is already covered | Specific remaining gap |
|---|---|---|
| `decision-architecture/references/capacity-and-operations.md` | Workload, skew/hot keys, latency percentiles, throughput/resources, recovery, cost, cache miss path, adversarial scenarios, explicit unverified claims | Executable resource bounds, per-path SLO window/denominator, fairness, observability cost, failover versus backup restore |
| `decision-architecture/references/backend-boundaries.md` | Invariant enforcement under concurrency; transactions, uniqueness, indexes; coexistence/migrations; broker semantics and conditional outbox/inbox | Scale-sensitive access paths and global resource ownership; avoid duplicating the separate proposed risk-to-evidence contract |
| `decision-architecture/references/api-contracts.md` | Inputs and size limits, scoped idempotency, ambiguous outcomes, safe errors, ordered/bounded collections | Deep-page traversal, stable unique order, cursor scope and live-data semantics; bounded expensive query/export endpoints |
| `project-foundation/references/profiles/postgres-drizzle.md` | Actual versions/topology, connection limits, database invariants, bounded retry, migration/backfill/index-lock/restore review | Representative statistics and query-plan evidence; selectivity/skew, scanned versus returned rows, query memory and pool multiplication |
| `project-foundation/references/profiles/mongodb.md` | Document invariants, atomic updates/transactions, indexes, concerns, bounded queries, topology, backfill/recovery | Same access-pattern/skew/partition questions, to be resolved with the selected MongoDB version; no reason to duplicate SQL tuning recipes |
| `project-foundation/references/profiles/messaging.md` | Confirms versus acknowledgements, duplicate/redelivery, ordering, outbox conditionality, replay, poison messages, shutdown | Consumer in-flight bounds, backlog age/drain under live traffic, replay competing with live work |
| `project-foundation/references/profiles/node-nest.md` | HTTP contracts, input limits, cancellation/cleanup, database availability, readiness | End-to-end stream backpressure, bounded async concurrency, event-loop delay, memory behavior under slow consumers |
| `project-foundation/references/profiles/cloud-delivery.md` | Actual deployment settings, Cloud Run concurrency/lifecycle, identity, Terraform state/plans, explicit untested infrastructure | Instance count multiplied by pool sizes; dependency capacity and scaling ceilings; observed failover/restore and rollout disruption |
| `decision-architecture/references/product-decisions.md` | Fixed/variable costs, billing units, amplification, transfer/backup/operations, estimated versus measured totals | Cost attribution per accepted useful operation and per tenant when these change the decision; telemetry cardinality/retention as workload |

Paths in this table are under `.agents/skills/`.

## Six selected primary sources

These establish mechanisms or operational experience, not DevMethod results. Proposed experiments and repository gaps below are this audit's engineering inferences.

1. **Google SRE, “Handling Overload,” Alejandro Forero Cuervo, edited by Sarah Chavis.** The chapter explains why request counts can conceal very different resource costs, and describes resource-aware protection and per-customer limits. Its particular CPU signals and quotas are examples from Google's environment, not universal defaults. [Primary chapter](https://sre.google/sre-book/handling-overload/).
2. **Marc Brooker, Amazon Builders' Library, “Timeouts, retries, and backoff with jitter,” 2019 PDF.** Timeouts retain resources until expiry; retries can amplify overload; independent retry layers multiply attempts; jitter spreads correlated bursts. The web article redirected to an unreadable page in this environment, so the readable official PDF was used. [Official AWS PDF](https://d1.awsstatic.com/builderslibrary/pdfs/timeouts-retries-and-backoff-with-jitter.pdf).
3. **Amazon Builders' Library, “Caching challenges and strategies.”** A cold or unavailable cache can overload a dependency that was sized for warm-cache traffic. The article discusses request coalescing, consistency, cache poisoning, and isolation-related risks. This is practitioner experience, not a benchmark transferable to a new application. [Primary article](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/).
4. **PostgreSQL 17 documentation, “Using EXPLAIN.”** Plans expose scan/join/sort work and estimates; `EXPLAIN ANALYZE` executes the query and reports observations. Planner costs are not elapsed milliseconds, and measurements omit client-network delivery and add overhead. Use matching installed-version documentation. [Versioned official documentation](https://www.postgresql.org/docs/17/using-explain.html).
5. **PostgreSQL 17 documentation, “LIMIT and OFFSET.”** Predictable subsets need a unique ordering; skipped offset rows still require server work. This motivates comparing traversal strategies under actual access patterns, not automatically banning offset pagination. [Versioned official documentation](https://www.postgresql.org/docs/17/queries-limit.html).
6. **Node.js official guide, “Backpressuring in Streams.”** A faster producer can accumulate data behind a slower consumer; respecting stream backpressure and pipeline error handling addresses this class of pressure. Its historical example timings and buffer defaults are not copied as project guarantees or current-version tuning values. [Official guide](https://nodejs.org/en/learn/modules/backpressuring-in-streams).

All sources were consulted on 2026-09-15. No vendor price or current service quota was needed for this guidance audit; obtain those only when estimating a concrete authorized architecture.

## Risk → mechanism → evidence → applicability matrix

The following are selectable checks. A proposed mechanism remains unverified until exercised in the relevant implementation and environment. “Already covered” means guidance exists, not that a load or recovery experiment has run.

| Risk | Mechanism or decision | Observable evidence / proposed experiment | Applicability and present coverage |
|---|---|---|---|
| User count mistaken for load; averages hide failure | Per-journey arrival/concurrency model, request mix, explicit service objective and measurement window | Hold workload definition fixed; report delivered rate, accepted/rejected/timed-out work, tail latency and resources | All material capacity choices. Mostly already covered; clarify SLO denominator/window |
| Load generator masks overload by waiting for responses | Declare open-arrival versus closed-concurrency model; measure generator capacity and dropped scheduling | Compare intended arrival schedule with actual send/completion times and generator CPU | Benchmarks making capacity claims. Existing arrival-model guidance needs this caveat |
| High fan-out or expensive payloads dominate request cost | Bound work per request, batch size, recursion/fan-out and CPU-intensive work | Mix cheap/expensive operations; measure event-loop delay, CPU, heap/RSS, completion and rejection | Public/variable-cost requests and large jobs. Limits exist, cost-sensitive cases underspecified |
| Index exists but query still scans or sorts too much | Access-pattern-driven index/query choice; representative data and current statistics | Compare plans and actual rows/buffers/spills at realistic selectivity/skew; measure complete client-visible operation separately | Data-heavy paths. Add to data profile; no blanket index prescription |
| Partition/shard count hides a hot key or costly redistribution | Identify partition key, concentration, cross-partition work, owner and rebalancing limits | Concentrate traffic/data on one key or tenant; compare saturation and migration impact | Only when partitioning/sharding is used or proposed. Hot keys covered; mechanism details conditional |
| Deep pages become expensive or unstable | Unique deterministic order; compare offset with keyset/cursor where traversal requires it; define snapshot/live visibility | Read near the end of the dataset; interleave inserts/updates/deletes; check declared traversal semantics and cost | Large ordered collections. Keyset does not itself guarantee a snapshot; new specific guidance needed |
| Large export succeeds only because all rows fit in memory | Bounded chunks/driver fetch, backpressure through each stage, bounded transforms, cancellation cleanup | Slow sink and large individual row, then disconnect; measure maximum buffers/RSS and source/connection cleanup | Exports/imports/files/large result sets. Streaming is absent from current Node profile |
| Queue, pool or in-flight work grows without bound | Admission limits, bounded queues/concurrency, deadlines/cancellation, explicit rejection/degradation | Drive beyond intended capacity, slow a dependency, verify bounded resource use and recovery after load falls | Work with finite shared dependencies. Add explicit bounds; autoscaling alone is insufficient evidence |
| Horizontal scaling exhausts a shared database | Budget aggregate connections/jobs across maximum instances and operators; constrain deployment surge | Simulate permitted instance/pool counts and reconnect bursts; observe database wait/connection saturation | Pooled/serverless/autoscaled services. Current profile mentions connection limits, not aggregate accounting |
| Cache expiry/cold start causes a miss storm | Coalesce equivalent misses, consider staggered expiry, bound cache/miss concurrency, define freshness and fallback | Expire a hot key or remove cache; count origin requests, waits, errors, stale responses and recovery | Material cache dependency. Miss-path testing exists; stampede controls are underspecified |
| One tenant consumes capacity or receives another tenant's cached result | Server-authoritative tenant/authorization scope; quotas/fair scheduling; isolated keys and bounded pooled state | One hot tenant alongside a normal tenant; alternate tenants on reused connections/cache keys and verify isolation | Shared tenant resources. Noisy-neighbor and cross-tenant checks need explicit mention |
| Retry/failover storm duplicates effects or blocks recovery | One accountable retry policy, bounded budget, backoff/jitter, deadline propagation; durable idempotency/reconciliation | Inject ambiguous timeout and correlated transient failure; count attempts at each layer and durable effects | Remote operations. Idempotency is strong already; retry amplification/deadline coordination can be sharpened |
| Broker acknowledgement mistaken for completed business work | Preserve current producer/consumer/outbox contracts; bound consumer prefetch/in-flight; separate live/replay capacity | Crash after durable side effect and before acknowledgement; replay duplicates; restore consumer while live traffic continues, measure oldest message age and drain | Message workloads only. Correctness mostly covered; backlog/replay resource sharing less explicit |
| Replica or failover breaks a consistency-critical decision | Assign authoritative reads/writes per invariant; define tolerated lag, fencing/ownership and ambiguous-write reconciliation | Fail writer/dependency during an operation; compare acknowledged durable state, stale reads and reconciliation | Replicated/failover topologies. Do not mandate a new topology; specify guarantees for the selected one |
| Backup exists but usable recovery is unproven | Restore data plus required schema/config/keys in an isolated target; verify business state and measured recovery/loss | Recover a known checkpoint, validate representative reads/writes, record recovery duration and last recoverable point | Where recovery matters. Already required broadly; distinguish restore from failover/replication |
| Migration/backfill blocks live traffic or cannot resume | Existing expand/migrate/contract; bounded/resumable batches, live-version compatibility, observed locks and abort/recovery | Run old/new clients during backfill, interrupt/restart and measure latency/locks/replication impact | Material data/schema changes. Existing guidance strong; emphasize live-load interference |
| Telemetry misses a local bottleneck or becomes the bottleneck | Per-journey latency/error/throughput plus selected saturation, pool wait, queue age, lag and trace correlation; bounded labels/sampling/retention | Use one relevant failure and confirm alert/diagnosis; measure telemetry volume and sensitive-field exposure | Production/operating claims. Metrics are generic today; add a small selected set, not all signals everywhere |
| Architecture meets throughput only at unacceptable cost | Cost per accepted useful outcome, rejected/retried work and growth scenarios; include compute, storage/indexes/backups, I/O/scan, transfer and telemetry | Attribute a representative run's measured units; compare with the same workload/SLO and verified rates | Material cost decisions. Most categories already covered; add useful-output denominator if relevant |
| Scale bypasses security through expensive or cross-boundary operations | Preserve authorization in workers, caches, exports and data access; cap payload/query/fan-out; avoid leaking identifiers through logs | Untrusted expensive request plus normal traffic; retry/replay with changed authorization; cross-tenant negative case | Public or tenant-bearing services. Existing input/auth guidance needs these propagation checks |

## Proportionate guidance patches proposed to the integrator

Do not introduce a new universal release gate or a compulsory scale study for Quick work. Keep the current capacity guide as the entry point, and apply the additions only to a workload or failure mode that changes the decision. Reuse the separate backend risk/invariant/enforcement/evidence contract proposed by the guidance-review worker rather than duplicating it.

### 1. Capacity guide: bounded resources and operational evidence

Proposed short insertion after the limiting-resource paragraph:

> When the workload makes it relevant, bound in-flight requests/jobs, queue depth, batch/fan-out, memory and buffers, and connection pools through the actual dependency chain. Account for maximum instance counts and deployment/reconnect bursts when pools share a database. Define what is rejected, delayed or degraded at saturation and which invariants and authorization decisions remain authoritative. A cache needs protection against synchronized misses and correctly scoped keys; shared tenant resources need an isolation and fairness policy. Select these controls from observed or plausible failure consequences; do not add every pattern by default.

Proposed refinement of verification:

> State the objective's operation, population, time window and treatment of failures/rejections. A load generator's own saturation or response-paced workload can conceal demand; retain intended versus delivered arrival rate. Include the few signals needed to identify the limiting resource and recover service, with bounded telemetry cost and sensitive data handling. Separate failover, backup restoration and migration recovery: verify whichever guarantee is claimed against the selected topology and exact revision.

### 2. Node profile: streams and bounded asynchronous work

> For large results, exports or imports, inspect buffering from the database/client through transforms to the final consumer. Prefer the established streaming/pipeline facilities with bounded chunks and concurrency where suitable; a streaming HTTP response does not help if an upstream adapter first materializes the whole dataset. Propagate backpressure, error and cancellation, and release source cursors/connections on disconnect. Verify a slow consumer and a large individual record while observing memory and event-loop delay; do not claim a fixed memory cap merely from using a stream API.

This is the most clearly missing runtime-oriented paragraph. It is relevant to the user's known large-export experience but does not transfer a former employer's measurements to DevMethod.

### 3. Data profile and API collections: prove the selected access path

PostgreSQL paragraph:

> For material query-volume or data-size decisions, retain representative cardinality, row widths, selectivity/skew, concurrent writes and data/statistics state. Inspect the selected queries' plans and measured execution work before adding indexes, partitions or replicas; include write/storage and migration costs. Use `EXPLAIN ANALYZE` only on an authorized isolated or otherwise appropriate target: it actually executes the statement. Measure client-visible transfer and serialization separately when they matter. Record why the dataset and topology support the limited claim; a small in-memory fixture does not establish production-scale capacity.

API collection sentence:

> For deep or long-lived traversal, define a unique order and compare bounded offset versus cursor/keyset access against the query plan and requested navigation. Scope cursors to the relevant identity/filter and define behavior under changing data; a cursor alone guarantees neither authorization nor snapshot consistency.

For MongoDB, point to the same workload/access-path questions using its installed version's explain/topology facilities; do not transplant SQL index or transaction recipes.

### 4. Messaging/cloud: sharpen existing controls without repeating the contract

Messaging addition:

> Bound consumer concurrency/prefetch and replay work against downstream capacity. Observe oldest-message age, live arrival and recovery drain, not queue length alone. Test whether replay/backfill competes safely with current traffic and preserves the existing idempotency/ordering contract.

Cloud addition:

> Compare maximum instances, per-instance concurrency/pools and deployment surge with shared dependency capacity. Verify startup/readiness and shutdown/drain against the chosen topology; include the observed failover or restore procedure only when such a guarantee is claimed. Proposed managed-service settings remain unverified until exercised.

These are optional follow-ons to the more immediate capacity/Node/data/API patches. They do not warrant new infrastructure or paid experiments during this audit.

## Experiments to schedule only when an implementation warrants them

Two reusable experiment shapes are sufficient to start; choose the one associated with the actual bottleneck. Neither was run here.

- **Data path experiment:** same revision/query/contract and declared dataset distributions; compare the simplest existing implementation with one proposed access-path or bounded-stream change. Include a deep page or selective/skewed query, large row and slow client where relevant. Capture correctness relative to declared visibility semantics, full-operation duration, plan work, memory and connection cleanup. Reject the added complexity if it fails the objective or merely relocates buffering/work.
- **Saturation/recovery experiment:** same accepted workload and resources; increase offered load, inject the selected cache/dependency/consumer failure, then restore it. Observe useful accepted work, rejected/timed-out work, tail latency, bounded resources, durable invariants and recovery. Include a hot tenant only for a shared-tenant system. Compare with the simplest bounded admission/retry policy before adding adaptive control. Measure both normal and failure-mode cost.

Each run needs exact code/configuration, data generator and seed or retained dataset identity, infrastructure limits, warm/cold state, duration, arrival model, pass criteria, logs and confounders. An observed result at one scale supports that scenario; extrapolation to billions of rows or millions of simultaneous users needs additional justified modeling and representative evidence. Lack of authorized infrastructure or measurement leaves the claim unverified, not silently satisfied by local unit tests.

No new scalability runtime, database engine, broker, sharding system, or blanket checklist is recommended. The deliverable from this research is improved decision and verification guidance, with unresolved production-scale evidence stated plainly.
