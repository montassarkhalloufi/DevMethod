# Pocket Tasks — greenfield acceptance contract

Build a complete local task manager from this empty project. The owner delegates routine implementation decisions within this contract. Use the installed DevMethod skills to frame, plan, implement, verify, review and hand off. Scope is Standard. No deployment, external services, purchases or authentication.

A user can add a task, edit its title, complete/reopen it, filter all/active/completed, delete it, and retain tasks across application restart. Interface: responsive light layout, labeled task input, readable list, visible empty/loading/error states, keyboard-operable buttons, clear active filter and status announcements. Render user text safely, including HTML-looking strings.

Implementation constraints: Node.js >=22 built-ins, no runtime npm dependencies; ordinary HTML/CSS/browser JavaScript. Keep domain validation, durable storage, HTTP and UI responsibilities separate. Bind only 127.0.0.1. JSON file persistence is sufficient for this single-process fictional application; atomic replacement, no silent data reset if storage is malformed. No databases or cloud providers are needed for this bounded test.

Export createTaskServer({dataFile}) from server.mjs, returning an unstarted Node HTTP server. A direct node server.mjs invocation starts on process.env.PORT or 4318, with process.env.DATA_FILE or data/tasks.json. npm start invokes server.mjs; npm test executes meaningful node:test checks authored with the application.

HTTP contract:
- GET /api/tasks -> 200 {tasks:[{id,title,done}]}
- POST /api/tasks JSON {title} -> 201 {task:{id,title,done:false}}
- PATCH /api/tasks/:id JSON {title? ,done?} -> 200 {task}; at least one supported field required
- DELETE /api/tasks/:id -> 204; unknown ID -> 404
- Trim title, require string length 1..120, reject invalid types; done must be boolean. Invalid input and malformed JSON -> 400, JSON error body. Invalid body container (null, array) -> 400. Request body >16KiB -> 413.
- Unsupported routes -> 404; never serve files outside the public asset directory.

AC1 CRUD and filtering usable in browser. AC2 invalid input rejected without changing state. AC3 persistence survives close/restart. AC4 no HTML injection through titles. AC5 keyboard and narrow viewport usable. AC6 automated tests and README startup/recovery instructions. AC7 DevMethod context, decisions, verification and resumable handoff reflect actual work.

Do not edit BRIEF.md or installed method sources. Fill PROJECT_PROFILE.md with actual project context. Create lightweight mission/decision/verification records; no empty template-only claim counts as completion. No Git commits by implementation worker. The owner supplies a separate acceptance harness and browser checks after implementation.
