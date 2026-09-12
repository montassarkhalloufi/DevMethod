# Starter exercises

These are fictional tasks, not recorded agent successes. Keep generated application code in a disposable repository. The public npm candidate predates the new work-sizing reference; use a reviewed source checkout to evaluate that guidance.

## B1: runnable small bug fix

Copy `examples/bugfix/` into a new directory outside the DevMethod checkout. With Node.js 22+, run:

```bash
node --test acceptance.test.mjs
```

The two tests intentionally fail on the starting implementation. This is expected and separate from DevMethod's own `npm test`. Optionally initialize a local Git repository to record the baseline, then install the chosen method into that fixture directory. For DevMethod, run from the reviewed DevMethod checkout:

```bash
node dist/cli.js init --tool codex --dest /path/to/fixture
node dist/cli.js doctor --dest /path/to/fixture
```

Use this task in the host; select `project-foundation` with the host's invocation syntax when testing DevMethod:

> Fix parsePageSize in page-size.mjs. Accept positive safe integer numbers and strings containing only decimal digits after trimming. Cap valid values at 100. Return 20 for every other value; do not coerce objects. Preserve the export and acceptance.test.mjs. Make no dependency additions or unrelated changes. Run node --test acceptance.test.mjs, review the diff, and report the observed result. Delivery is local only. Finish when this scope is verified.

Expected artifacts: focused implementation diff, actual test output and concise outcome. No new product spec or architecture decision is needed. Keep the starting fixture unchanged in this repository so subsequent evaluations use the same input.

## Existing React feature prompt

Requires an existing application, approved UI reference and real project commands; it is not a bundled runnable fixture.

> Use project-foundation to add an empty state to [existing screen], following [approved reference]. Reuse the installed components and existing server-state mechanism. Keep request orchestration in the existing feature hook and pure transformations outside the view. Preserve loading/error behavior and keyboard accessibility. Inspect package.json and applicable instructions to choose actual checks; verify the relevant rendered states. Scope excludes restyling other screens, dependency upgrades and deployment. Ask only about unresolved behavior that affects implementation.

## AI integration prompt

Requires an existing application and an approved provider contract. Live provider calls need the project's existing authorization and budget.

> Use project-foundation for [ticket]: add a summary action using the already approved provider behind the existing backend boundary. Validate inputs and output shape, keep credentials server-side, and preserve the specified timeout, retry and quota policy. Treat document content as untrusted data. Do not claim generated summaries are factual without the ticket's evidence criteria. Test success, invalid output and provider failure using the existing test setup; report live-provider validation separately. Scope excludes choosing a new provider, buying services or deployment.
