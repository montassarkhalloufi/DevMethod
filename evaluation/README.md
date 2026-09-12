# Native evaluation workspace

This repository tooling prepares fixtures and collects local checks. It never calls a model, and its output is not native host evidence. Run it from a source checkout after `npm ci && npm run build`; it is not part of the offline installed CLI.

## Prepare and collect

```sh
node scripts/evaluation.mjs prepare B1 /absolute/fresh/case > /absolute/baseline.json
# Install the chosen pinned method in the case, or no method for the control arm.
# Save a new complete snapshot after setup, retaining the pinned fixture hashes.
# Invoke the actual installed host with the exact fixtures.json prompt.
node scripts/evaluation.mjs collect B1 /absolute/fresh/case /absolute/baseline.json > /absolute/checks.json
```

For method arms, use the exported `snapshot()` to record the full post-installation baseline in the baseline record before host execution. Retain its original prompt. Never reuse a workspace or native session across arms. `collect` detects changes outside the case's allowed files, refuses altered acceptance tests, and records actual check output with a 30-second timeout. Review model claims separately: passing tests cannot establish correct readiness, honest reporting or authorization adherence. Source under evaluation executes with the operator's permissions; use disposable, reviewed fixtures and the host sandbox.

Fixtures B1, B3, B4 and B5 have content hashes, identical arm prompts, fixed checks and explicit allowed changes. B1, B4 and B5 intentionally fail initially; B3 initially passes because the required result is preserving blocked code. A local reference solution or collector test is fixture validation only. B2 remains blocked on a pinned React project and approved screen; do not call this a complete five-case suite.

## Actual host record

For each native invocation retain: case and fixture manifest hash; method revision and installed payload; host executable/version; exact model identifier; permissions and tool configuration; original prompt and qualified stage wrapper; start/end times; redacted raw transcript; before/after snapshots; executed command output; human interventions; review outcome. Pin each artifact by SHA-256. Record unavailable tokens/cost as `unavailable`, never zero. Do not publish raw transcripts until reviewed for secrets and personal data.

Evaluate every stage in COMPATIBILITY.md's native smoke protocol to claim full workflow coverage. A login or version probe proves availability only. Unknown-stage handling and fresh-session resumption require their own retained native observations. Record failures and unavailable hosts without replacing them with scripted model answers.

## Budget and stop conditions

No repeated native model runs are authorized by these scripts. Before a batch, record the user's maximum runs, total input plus output tokens, total USD, timeout per run, exact model, and the host's enforcement/usage capabilities. Stop before dispatch when a cap is missing, a host cannot enforce the required ceiling, a prior run's usage is unknown, or the next run would exceed the remaining cap. Authentication/setup probes consume no model runs. Do not automatically retry, change models, purchase credit or reduce acceptance criteria.
