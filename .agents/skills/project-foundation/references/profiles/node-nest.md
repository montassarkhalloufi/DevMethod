# Node.js and NestJS profile

Apply to Node runtime services or Nest HTTP changes. Inspect runtime engine and deployment image, lockfile, Nest adapter/version, module composition, validation/error handling, authentication, request limits and shutdown hooks. Preserve existing transport and dependency injection conventions.

Controllers validate input and translate errors. Application services enforce use cases using consumer-defined ports. The domain must not depend on Nest, an ORM or a broker; infrastructure implements the persistence/provider boundary. Add layers only for a real responsibility. Keep authorization authoritative at the server; client checks are insufficient.

Write the method/path, input limits, status, stable errors, identity and retry contract before implementation. Check invalid input, failure disclosure, cancellation, resource cleanup and database availability. Do not automatically retry an ambiguous mutation. Validate readiness against required dependencies rather than equating a listening socket with readiness.

For large results, exports or imports, inspect buffering from the source/driver through transforms to the consumer. Use established streaming/pipeline facilities with bounded chunks and asynchronous concurrency where suitable; an HTTP stream cannot undo an upstream adapter materializing the whole dataset. Propagate backpressure, errors and cancellation, and release source cursors/connections on disconnect. Check a slow consumer, a large individual record and cancellation while observing heap/RSS, buffers and event-loop delay. A stream API alone proves no fixed memory cap. Consult [Node's backpressure guide](https://nodejs.org/en/learn/modules/backpressuring-in-streams), checked 2026-09-15, and the installed runtime's API documentation; its historical timings and buffer defaults are not project guarantees.

Executable example: `examples/fullstack` pins Nest 12.0.1. `npm test` compiles TypeScript and executes domain/use-case plus loopback Nest HTTP tests. The fixture has no authentication and listens only on loopback; it is not deployable as a public service. `npm run test:e2e` exercises the real adapter. Runtime tested locally is recorded in the fixture README, not inferred from its engine range.

Source: [Nest first steps](https://docs.nestjs.com/first-steps), consulted 2026-09-13; exact runtime/peer requirements were also read from the pinned package's npm metadata. Production deployment needs a supported runtime and its own evidence.
