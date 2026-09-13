# Pocket Tasks

A fictional, local single-user task manager built from BRIEF.md using installed DevMethod 0.1.0 skills. Add, rename, complete/reopen, filter and delete tasks. Titles are rendered as text, including HTML-looking input.

## Run

Requires Node.js 22 or newer and npm. There are no runtime or development npm dependencies; no install step is needed.

```sh
npm start
```

Open http://127.0.0.1:4318. The direct startup command always binds to loopback. Stop with Ctrl+C. Optional shell variables:

```sh
PORT=4320 DATA_FILE=/absolute/path/tasks.json npm start
```

The default data file is `data/tasks.json` beneath this project. It is created on the first successful mutation. Use one server process per file. No cloud service, account or authentication is involved; anyone with local access to the app can change its tasks. Do not expose it using a proxy or public bind.

## Use

Type a task and choose Add task. Use its checkbox to complete/reopen, Edit to change its title, Save or Cancel to finish editing (Escape also cancels), and Delete to remove it. All/Active/Completed filters affect the displayed list. Deletion is immediate. The interface supports keyboard navigation and small screens; status and error messages are announced. If a change fails over the network, use Reload tasks to reconcile saved state before retrying; the server may have already saved it.

## Test

```sh
npm test
```

Node's test runner exercises domain boundaries, actual loopback HTTP CRUD, invalid and oversized input, restart persistence, concurrent writes, malformed-storage protection and static-file restrictions. HTTP tests need permission to bind ephemeral loopback ports. No remote requests are made. Browser interaction and narrow viewport checks are separate acceptance work; see `docs/VERIFICATION.md` for current evidence.

## Data, backups and recovery

Tasks persist as a JSON array of `{id,title,done}` records. Mutations serialize in this process, fsync a sibling temporary file, then atomically rename it over the live file. This is not a multi-process database or a universal power-loss durability guarantee.

Back up the data file while the app is stopped, and keep backups private. A missing file represents a new empty collection; an unreadable, malformed, or invalid existing file causes a JSON 500 error without silently resetting or replacing it. To recover: stop the server, copy the affected file to a safe backup, inspect it and restore a known-good backup or repair the JSON/schema, ensure the file and parent directory are readable/writable, then restart. Only deliberately replace it with `[]` when loss of all current tasks is intended. Stale `.tmp` siblings from an interrupted write are not loaded; inspect and remove those only while the server is stopped. If the port is occupied, stop the other process or select a different PORT.

## Boundaries and API

`src/domain.mjs` validates titles and input shapes; `src/store.mjs` serializes persistence; `server.mjs` maps HTTP and explicitly allowlists three static assets; `public/` contains presentation and interaction. Exported `createTaskServer({dataFile})` returns an unstarted server for embedding/tests; callers choose their listener. Direct CLI startup binds 127.0.0.1.

The canonical route/status/validation contract remains `BRIEF.md`. GET/POST `/api/tasks`, PATCH/DELETE `/api/tasks/:id`; errors use `{error:string}`. Body limit is 16 KiB. POST/PATCH require `Content-Type: application/json` (optional charset allowed); other media types receive JSON 415. Every request must use Host `127.0.0.1:<actual server port>`; other hosts receive JSON 403. Mutations reject external or null Origin and `Sec-Fetch-Site: cross-site` with JSON 403. Same-origin browser requests and CLI requests without Origin remain supported. These browser-boundary checks do not authenticate local clients. Unsupported routes/methods return 404. No authentication, deployment, external integration, telemetry or dependency updates are included.
