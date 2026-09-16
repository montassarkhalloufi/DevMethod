# Common Ground — local volunteer demo

A fictional volunteer day with two published roles, capacity-aware reservations,
cancellation, visible reservation references, and restart-safe local data. The
interface uses plain browser HTML/CSS/JavaScript; the server uses Node built-ins.
No installation, service account, network dependency or personal data is needed.

Requires Node.js 24+. From the repository root:

```sh
node examples/evidence-lab/app/server.mjs --port 4177 --data /tmp/demo-state.json
```

Open `http://127.0.0.1:4177`. Use a dedicated data filename whose parent directory
already exists. The file is created lazily on the first successful store operation
(server startup reads availability). Stop with Ctrl-C and run the same command to
resume. Use a new filename for a fresh fictional event; do not delete data to
conceal a failed check.

## Demonstration

1. Choose two welcome-desk places and reserve. The role becomes full; the
   reservation and its durable reference appear below.
2. Refresh the page. The same reservation remains and capacity stays at zero.
3. Stop and restart the server with the same data path. The reservation remains.
4. Cancel it. Two places return. Cancelling or replaying its original request
   through the API does not create or resurrect a reservation.
5. Reserve a garden place. Both the available-place total and role count update.

Every reservation is visible and cancellable by anyone using this local demo.
There are no accounts, real identities, permission roles, editable event slots,
emails, deployment or production claims. The coordinator's publication is the
two pre-seeded roles; an editing workflow is outside this demonstration.

## Contract and checks

`store.mjs` exports synchronous `createStore(filePath)`, returning:

| Method                              | Result                                       |
| ----------------------------------- | -------------------------------------------- |
| `listSlots()`                       | `{id,title,capacity,remaining}[]`            |
| `reserve({slotId,requestId,seats})` | `{id,slotId,requestId,seats,status}`         |
| `cancel(id)`                        | The same reservation with status `cancelled` |
| `listReservations()`                | All active and cancelled reservations        |

The seed identifiers are `welcome` (2 places) and `garden` (3 places). Slot
definitions are persisted when a new event file is created. Existing files retain
their own capacities if a later application version changes the new-event seed;
there is no automatic migration.
`requestId` must be a nonempty string of up to 128 characters. `seats` must be a
positive safe integer. Identical requests return the original booking; changing
parameters for a used request identifier produces `REQUEST_CONFLICT`. The
browser reuses an uncertain request identifier while its page remains open.
Refreshing availability preserves an unsubmitted quantity. If it is no longer available, the quantity stays visible and submission is disabled until a valid selection is made. After a browser reload, inspect the reservation list before booking again.

HTTP: `GET /api/state`, `POST /api/reservations` with JSON booking arguments, and
`POST /api/reservations/:id/cancel`. Success is HTTP 200; bad requests are 400,
unknown identifiers 404, and booking conflicts 409. Errors include `error` and
`message`. The server binds only to `127.0.0.1`, requires that Host address, and
rejects a differing Origin. It is intentionally unavailable via `localhost` or
remote reverse proxies without an explicit hosting design change.

```sh
node --test examples/evidence-lab/app/*.test.mjs
```

These focused tests exercise the real store and HTTP server, including concurrent
attempts and restart. They are application tests authored with the application;
they do not constitute independent evaluation or a comparative model benchmark.
Browser rendering and interaction require separate observation.

## Local storage decision and limits

For one Node process and a small fictional event, synchronous read/validate/write
operations serialize each mutation. The file has a format marker and validated
reservation identities, quantities, statuses and capacity invariants. A corrupt
or unrelated file fails closed. A final-path symbolic link is refused. Each
successful mutation writes an exclusive temporary file, flushes it and renames it
over the destination. Domain validation fails before modifying durable state.

This is local filesystem atomic replacement, not a multi-process lock, database,
distributed transaction or power-loss certification. Use one server per data
file and keep its directory under the local operator's control. Unexpected
temporary files after interruption are retained for inspection; the store does
not recover or delete them automatically. The whole file is read per operation;
the prototype is intended for small datasets. Moving to simultaneous processes,
untrusted users, larger events or a network filesystem requires a separate
storage and authorization design.

The choice of dependency-free modules keeps the demonstration inspectable and
runnable without installing a framework. It is not a recommendation to replace
the project's TypeScript conventions in the maintained DevMethod engine.
