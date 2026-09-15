# Next.js / NestJS / PostgreSQL fixture

A fictional local task list demonstrates a complete server-rendered read path and a validated creation API. It includes an actual Next application, Nest HTTP server, strict TypeScript, a Drizzle adapter and a PostgreSQL migration. Dependencies and tests are isolated from DevMethod's offline CLI.

Read [the contract](CONTRACT.md) before changing the slice. The installed dependency versions are pinned in [package.json](package.json) and [package-lock.json](package-lock.json); PostgreSQL's image is pinned by digest in [compose.yaml](compose.yaml). Use the existing versions when evaluating a mission rather than installing current releases.

## Run from a clean checkout

Prerequisites: Node.js 22+ and npm, Docker with Compose and permission to bind local ports. The recorded run used Node 23.10.0, npm 10.9.2 and Docker 27.5.1 on macOS. That is observed fixture compatibility, not a recommendation to deploy that Node version. Install with a supported project runtime and record your own result.

From the DevMethod repository:

```sh
cd examples/fullstack
npm ci --ignore-scripts
export NEXT_TELEMETRY_DISABLED=1
npm test
docker compose -p devmethod-fixture up -d --wait
export DATABASE_URL=postgresql://fixture:fixture-local-only@127.0.0.1:55439/tasks
npm run test:db
npm run test:e2e
```

The password above is a deliberately public, local-only fixture credential, not a secret or production configuration. Use only a disposable database: these suites apply migrations and insert/delete their own test rows. `test:db` and `test:e2e` fail when `DATABASE_URL` is missing, rather than reporting a skipped test as passed.

`npm test` compiles the API and runs seven domain/use-case/HTTP/web-model tests. `test:db` verifies real migrations, replay, durability, database constraints and the title/UUID ordering with a 100-row bound. `test:e2e` builds API and Next production output, starts both HTTP servers on ephemeral loopback ports, creates a task through Nest, verifies its title in Next HTML, and verifies the API-unavailable rendering. It cleans up its task and HTTP processes.

To explore the feature after the tests, run in one terminal:

```sh
npm run db:migrate
npm run start:api
```

In a second terminal, still in this directory:

```sh
export NEXT_TELEMETRY_DISABLED=1
npm run start:web
```

In a third terminal create a fictional task and open the page:

```sh
curl --fail-with-body -X POST http://127.0.0.1:3101/tasks \
  -H 'content-type: application/json' -d '{"title":"Review the mission contract"}'
curl --fail http://127.0.0.1:3101/tasks
```

Open [the local task list](http://127.0.0.1:3100), type `review` into the labeled filter and verify only matching tasks remain. Clear the input and verify the list returns. This browser/hydration protocol is **not run** in the recorded evidence. Initial HTML and the pure filter function are tested separately. Creation is deliberately through HTTP; there is no creation form.

Stop the foreground API/web processes with Ctrl-C. Remove only this disposable Compose project's container, anonymous data volume and network when finished:

```sh
docker compose -p devmethod-fixture down -v
```

## Evidence and limits

Observed on 2026-09-13 for the candidate source tree committed with this example; use `git log -1 -- examples/fullstack` to resolve its introducing revision. These are automated fixture checks, not native Codex/Claude/Cursor behavioral evaluations or an independent design review.

| Acceptance criterion | Change | Executed verification | Result |
|---|---|---|---|
| Reject invalid titles before persistence | Domain and use case | `npm test` | passed |
| Preserve HTTP status/shape and hide infrastructure details | Nest controller | `npm test` | passed |
| Normalize filter and validate server data | Web model | `npm test` | passed |
| Apply migration once, replay safely, enforce SQL constraints and persist across connections | Drizzle adapter / SQL migration | `npm run test:db` | passed |
| Render a task created through the real API and database | Next server boundary | `npm run test:e2e` including production build | passed |
| Show a useful unavailable state | Next page | `npm run test:e2e` | passed |
| Browser hydration, keyboard filtering and visual quality | Client view/hook | Manual protocol above | not run |
| Production auth, deployment, transaction concurrency, restore | Outside slice | None | not run |

The first sandboxed HTTP run was blocked by loopback permissions and was rerun with local server access. An occupied initial database port was changed to 55439 without touching the existing service. Two test-harness issues (nested driver error comparison and cleanup order) were corrected before the final passing run; they were not product compatibility failures. Commands need network access for initial npm/image installation; the DevMethod CLI's offline contract does not extend to fetching example dependencies.

For a revision-specific evaluation, record the exact commit, command, environment, exit code and output in your mission evidence outside this source fixture. Re-run affected checks when source, contract, lockfile or environment changes. Never turn this historical table into fresh evidence for a later edit.

## Troubleshooting

- Port 55439 occupied: set `FIXTURE_DB_PORT` to an unused local port before Compose, and change the port in `DATABASE_URL` to match. Do not stop another project's service.
- Database test blocked: verify Docker is running, Compose is healthy and the URL points to this disposable database. An unavailable database is not a passing persistence check.
- Page unavailable: verify API/database startup and `TASKS_API_URL` (defaults to `http://127.0.0.1:3101`). The web server never needs database credentials.
- Migration/schema mismatch: inspect migration history and create a forward migration; do not erase a real database to satisfy the fixture.
- Missing package dependencies: run `npm ci --ignore-scripts` here, not at the DevMethod root. `npm run build` emits ignored runtime files; neither installation nor tests deploy anything.

Official technical provenance is recorded in the [optional stack profiles](../../docs/STACK-PROFILES.md), consulted 2026-09-13. A linked third-party skill is not installed or validated by this example.

## Mission, context, evidence and resumption

After installing this fixture's dependencies, run from the DevMethod repository root:

```sh
node dist/cli.js mission --dest examples/fullstack --mission mission.json --json
node scripts/fullstack-mission.mjs
node dist/cli.js context-check --dest examples/fullstack --context evidence/context.json --json
node dist/cli.js resume --dest examples/fullstack --checkpoint evidence/checkpoint.json --json
```

The walkthrough actually runs `npm test`, records its output and pins its inputs, and saves ignored metadata/evidence. A successful unchanged run reports ready. It records AC-TITLE only; database/e2e checks remain separate evidence in the table above. Tests are deterministic fixture checks, not a native agent transcript. The script never deploys, runs models or modifies a contract.

To exercise stale resumption in a disposable checkout, edit CONTRACT.md after the walkthrough and inspect resume again: source-changed and reverify must appear. Restore the exact bytes to return to the pinned content, or inspect the new contract and rerun affected verification. A branch change also requires reassessment; an unresolved dependency should remain in blockers until explicitly resolved. Completed scope sets nextAction to null and supplies no new task. Root mission/checkpoint tests reproduce these cases without mutating this example. If saving evidence itself changes Git status, restore the fixture's evidence/ ignore entry before recapturing context.
