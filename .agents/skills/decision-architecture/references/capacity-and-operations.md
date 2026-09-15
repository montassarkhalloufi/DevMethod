# Capacity and operating decisions

Use for a new service, a material workload change, or a performance, availability or scaling decision. Reuse accepted requirements and measurements. A local fix without capacity or operating impact does not reopen this analysis. Technical delegation permits decisions; it does not supply missing workload facts or turn proposed service targets into accepted promises.

## Establish the decision envelope

Connect the important journeys to their workload and failure consequences before committing to infrastructure. Select the unknowns that could change the decision; do not demand every metric for every project:

- Load: active versus simultaneous users, usual and peak request/job rates, burst duration and frequency, read/write mix, payload size, fan-out and retries. Identify concentration on one tenant, key, event or partition; an average can hide the limiting contention.
- Data: existing and growing volume, retention, working set, useful indexes, history and replication/backup overhead. Separate logical estimates from measured storage and I/O.
- Guarantees: acceptable response/completion time, error rate, freshness, ordering and consistency; availability and acceptable data loss/recovery time where the outcome depends on them. Link guarantees to business failures, including duplicate work, oversubscription and stale authorization.
- Operation: budget, team skills, incident coverage, deployment/migration constraints, dependencies and who can restore service. Confront service objectives with the actual support model; a managed component alone does not establish the application's recovery guarantee.

Reuse answers already supplied. Ask a novice about busy periods, people acting together and the consequences of delay or lost work; derive provisional ranges with explicit assumptions. For an expert, expose units, distributions, thresholds and uncertainties directly. Group only the decision-changing questions and continue independent modeling or conditional tickets. Missing measurements may justify a proposed envelope or discovery task; do not invent an accepted target, choose an unexplained default, or block all progress waiting for exact traffic.

Record facts, estimates, proposed targets and unknowns distinctly in the existing decision record. Show the few calculations that change the choice, with units and horizon: sustained/burst demand, retained data and amplification, or backlog accumulation and drain capacity. Counts of users alone do not determine requests per second; average monthly traffic is not peak demand. Arithmetic or a vendor limit is not a benchmark of the proposed application.

## Compare and visualize viable architectures

For an open structural decision, present the credible options in the conversation before detailed commitment, honoring existing delegation. Usually a small set suffices; do not invent weak options or reopen an accepted architecture solely to fill a quota. Keep the same workload, guarantees and cost assumptions across options, including the current solution when viable.

Give each viable option a comparable diagram at the level needed for the choice: actors/entry points, synchronous versus asynchronous flows, data owners, transaction/consistency and relevant failure boundaries. Use a supported rendered format such as Mermaid or SVG; do not rely only on component names in prose or claim a diagram was displayed when only source was produced. Label external dependencies and provisional components. Diagram complexity is not evidence of capacity.

Apply [architecture visuals](architecture-visuals.md) for the diagram's semantic model, graphic hierarchy, detail views and render checks. Keep alternatives comparable without copying the technology choices of a supplied visual reference.

Explain the limiting resource or coordination point, expected behavior at saturation/failure, and how each option preserves the required invariants. A cache needs an ownership/freshness/invalidation and miss-path story; a broker needs the delivery/recovery contract in [backend boundaries](backend-boundaries.md). Redis, Kafka, replicas or service splitting must solve an identified constraint rather than serve as proof that the architecture scales. Compare estimated infrastructure and operating costs using [product and operations decisions](product-decisions.md).

Recommend an option with its current scope, trade-offs and unknowns. State a measurable trigger for an evolution, the evidence required before it, and migration/rollback consequences. An option can be selected under delegation while its capacity claim remains unverified; do not present “chosen” as “proven under load”.

## Turn the claim into verification and delivery

For each material capacity or recovery objective, link an observable verification to the decision and relevant milestone/ticket. Specify the representative data/workload, normal and adverse condition, measurement, pass condition and environment limitations. Exercise the relevant risk: hot-key contention, retry storm, cold cache/cache loss, consumer interruption or backlog recovery, dependency outage, restore, or rolling versions. Choose applicable cases rather than running a universal infrastructure checklist.

A proposed load test must say what is sent and measured, including duration, arrival/concurrency model and error classification where meaningful. Distinguish rejected business requests from system failures. Report latency percentiles, throughput, resource saturation or backlog/restore time according to the actual objective; a green unit test or short in-memory simulation cannot establish production capacity.

Run experiments only within the requested scope and available resources. If implementation, tooling, budget or measurements are absent, record the capacity/recovery claim as unverified and create conditional or evidence-gathering work. Keep data invariants and authorization checks testable independently. Re-evaluate affected decisions and evidence when the workload, service target, dependency behavior or operating budget changes.
