# Pub/Sub and RabbitMQ profile

Apply when a producer, consumer, queue/topic or message contract changes. Select the broker actually used. Inspect client/server versions (or managed service configuration), schema version, acknowledgement mode/deadline, retention, dead-letter policy, ordering, concurrency, permissions and deployment shutdown behavior.

Preserve event ownership and envelope/version compatibility. Define producer success separately from consumer completion. For RabbitMQ, publisher confirms and consumer acknowledgements cover different boundaries. For Pub/Sub, inspect push/pull subscription semantics and supported guarantees instead of translating queue settings by name.

Record the acknowledgement point, duplicate key scope and retention, transaction boundary, bounded backoff, poison-message handling and replay procedure. Test redelivery after a crash between side effect and acknowledgement. If persistence and publication must be atomic, assess an outbox/inbox with a clear owner; do not introduce it automatically. Never promise exactly-once business effects solely from a broker capability.

Bound consumer concurrency/prefetch and replay work against downstream capacity. Observe oldest-message age, live arrival rate and recovery drain, not queue length alone. Where backlog recovery matters, check replay alongside current traffic while preserving the existing idempotency/ordering contract.

Project-local controls: run a pinned local RabbitMQ fixture or the approved Pub/Sub emulator for supported behaviors, then provider integration tests for guarantees the emulator lacks. Inject duplicate/out-of-order/poison messages and shutdown during processing. No broker fixture, emulator or provider execution is included: status **not run**. No cloud permissions or paid work is implied.

Sources consulted 2026-09-13: [RabbitMQ acknowledgements and confirms](https://www.rabbitmq.com/docs/confirms), [Pub/Sub subscription types](https://docs.cloud.google.com/pubsub/docs/subscriber). Check installed versions and configuration before recommending a guarantee.
