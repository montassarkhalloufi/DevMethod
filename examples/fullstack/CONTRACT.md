# Task slice contract

Status: implemented fixture contract, owned by the fullstack slice. This fictional local example demonstrates one feature; it is not a production service architecture recommendation.

| Boundary | Observable contract |
|---|---|
| `POST /tasks` | JSON object with only `title`; normalize with JavaScript `trim`; require 1–120 UTF-16 code units and reject U+0000 anywhere in the title; generate UUID; return `201` and `{ id, title }` after insertion |
| Invalid creation | `400` for missing/non-string/empty/too-long title or U+0000, array body or unknown fields; no persistence call |
| Unsupported creation media | `415` unless Content-Type is `application/json` (optional charset allowed); form, text and multipart bodies never reach persistence |
| `GET /tasks` | `200` with at most 100 `{ id, title }` rows sorted by title then ID using PostgreSQL ordering; no cursor/pagination |
| Infrastructure failure | `500` with generic Nest response; driver connection details are not exposed to callers |
| Next initial read | Server-only HTTP request with no cache and 3-second timeout; validate shape and omit unknown fields before sending props to the client |
| UI filter | Case-insensitive substring search in the currently loaded rows; trims search text; no mutation or fetch |
| API unavailable | Render a readable alert; this demonstration page returns HTML successfully and is not a health endpoint |

No authentication, authorization, tenant separation, updates, deletion, business uniqueness, idempotency keys, events or production deployment are in scope. The API, web commands and database bind to loopback. A repeated POST creates another task; do not automatically retry an ambiguous mutation. There is no third-party call or paid operation.

The domain owns title normalization and validation, including rejection of U+0000 before persistence because PostgreSQL text cannot store that character. `Tasks` is the use case and owns the consumer-defined `TaskStore` port. Nest handles transport, `PostgresTasks` handles Drizzle, and composition assembles them. The client model is a separately validated HTTP representation; no client import reaches API internals. `useTaskFilter` owns only query state and calls a pure transformation.

Persistence uses one SQL INSERT per creation, already atomic in PostgreSQL. UUID primary-key uniqueness, SQL nonempty-space checks and a varchar length limit provide database safeguards. JavaScript trims more whitespace and counts UTF-16 code units differently from PostgreSQL character length; the application remains authoritative for the full title rule. No cross-row invariant requires a multi-statement transaction in this scope.

Migration `0000_tasks.sql` creates the table; Drizzle's journal records application. Apply with `npm run db:migrate` against an isolated database. Replaying the migrator must not recreate the table. Do not edit an applied migration; add a forward migration. There is no tested production rollback/backup/restore policy. Destroying the local Compose fixture is the documented reset, never a production recovery procedure.

Acceptance evidence is mapped in [README](README.md). Code, schema/migration, versions, environment or this contract changing invalidates the affected result. A passing HTTP test with an in-memory store does not prove PostgreSQL behavior; the real database and end-to-end suites establish their own narrower claims.
