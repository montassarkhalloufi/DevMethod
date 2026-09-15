# Experimental application evidence lab

The lab asks two concrete questions: **does this check reject the known wrong behavior, and is its result still current?** It is optional. Start with ordinary tests for a small low-risk change. Use this experiment when a mistaken green result would be expensive and you can supply meaningful healthy and faulty controls.

This branch adds application checks without changing `devmethod guard`, which still evaluates DevMethod's behavioral campaign. The lab does not build an application by itself. Your existing agent creates the product and interprets the results.

## Try the complete local example

The [volunteer application](../examples/evidence-lab/app/README.md) has real reservations, capacities, cancellation and file persistence. No accounts, network services, purchases or real personal data are needed.

From this source checkout after `npm ci` and `npm run build`:

```sh
node scripts/evidence-demo.mjs
```

The script creates a fresh temporary workspace, prints its locations, verifies the application with independently authored checks, demonstrates rejection of a vacuous checker, changes the requirement and code, inspects stale evidence, and verifies the changed candidate. It preserves its intermediate reports and exact files. It does not reset halted sessions. Read its output to distinguish asserted behavior, failed checks and observed results.

To use the application directly:

```sh
node examples/evidence-lab/app/server.mjs --port 4177 --data /tmp/devmethod-volunteers.json
```

Open `http://127.0.0.1:4177`. This fictional demo is single-process local software, not a production multi-user service. See the application's own limits before reusing its storage.

## Use your own existing checks

Put a contract and a small Node adapter in a reviewer-owned directory outside the candidate root. The adapter may invoke a project's tests, API or integration scenario, but must produce the exact verdict protocol. It is executable code: review it and its controls with the same care as another local script.

```sh
node dist/cli.js evidence plan --dest ./my-app --evaluator ./app-checks --contract ./app-checks/contract.json
node dist/cli.js evidence run --dest ./my-app --evaluator ./app-checks --contract ./app-checks/contract.json --session ./app-evidence --permit HASH_FROM_PLAN
node dist/cli.js evidence status --dest ./my-app --evaluator ./app-checks --contract ./app-checks/contract.json --session ./app-evidence
```

`plan` does not execute adapters. Its permit identifies the reviewed current contract/evaluator/runtime. `run` is an explicit execution request within existing authority; it executes at most one bounded attempt. An agent can inspect the plan and run it under an existing delegation without asking the user to copy a hash or approve again. `status` rechecks the receipt in a new process without rerunning checks. JSON output is suitable for host adapters; no provider SDK is required.

The session directory must be outside the candidate and evaluator roots. Preserve it for later correction and resumption. After an ordinary failed attempt, use `--diagnosis "observed cause" --adjustment "specific distinguishing change"`. After a persistent halt, preserve the record and reconcile with the human; neither a new permit nor a new process removes it. A different root is not a continuation of the original session.

## Minimal adapter contract

See [the complete example](../examples/evidence-lab/evaluator/contract.json). The essential fields are:

| Field | Meaning |
| --- | --- |
| `id`, `intent`, `criteria` | The delegated outcome and stable criterion IDs/descriptions; reuse existing mission IDs when helpful |
| `candidateInputs` | Explicit relative files whose bytes determine freshness; include source, assets, relevant lockfiles/configuration and data fixtures |
| `evaluatorFiles` | All declared adapter/control/expected-value files, relative to the external evaluator directory |
| `checks[].runner` | Node entrypoint included in evaluator files |
| `checks[].criteria` | Exact criterion IDs reported by that entrypoint |
| `checks[].healthy` | Healthy-control mode, when supplied |
| `checks[].faults` | Control mode IDs and each targeted criterion |
| `limits` | Bounded attempts, stagnation, child/attempt time and output size |

The runner receives `[candidateRoot, mode, checkId]`. `mode` is `candidate`, the healthy mode or a declared fault ID. Standard output contains exactly one JSON object, with exit 0 for all-passed or exit 1 for semantic failed verdicts:

```json
{"format":1,"check":"booking","verdicts":{"capacity":"passed","idempotency":"failed"}}
```

Only deliberate, meaningful criterion assertions should become `failed`. Unexpected exceptions must remain execution errors. Printing a fabricated failed verdict can fool a trusted local adapter boundary; the lab does not prove that an assertion really ran. Controls cannot establish all possible behaviors and must not be derived solely from the candidate's own assumptions.

## Read the result

| Status | What it permits you to conclude |
| --- | --- |
| `supported` | The declared checks passed on these candidate bytes and discriminated their declared controls |
| `failed` | Inspect criterion status: `calibration-failed` concerns the checker/controls; `failed` concerns the candidate. Candidates with invalid calibration are not run. |
| `unchallenged` | Required control coverage is missing; ordinary test success is insufficient for calibrated support |
| `stale` | Code, requirement, checker or runtime inputs differ from the receipt; reverify the changed scope |
| `halted` | A persistent stop or interrupted attempt requires reconciliation; no automatic retry |
| `not-run` | There is no completed applicable execution |

Exit 0 means a valid plan or a supported result. Run/status return 1 for unsupported/stopped states; malformed invocation/input returns 2. No status means user acceptance, merge, deployment or release.

## Practical limits

This experimental execution profile is POSIX-only; Windows execution refuses rather than claiming unverified descendant cancellation. Host installation layouts remain unchanged. Current native command discovery and behavior in Codex, Claude Code and Cursor are not tested by these runs. Here the Cloud Browser blocked the local URL; DOM-to-HTTP interaction tests are recorded separately and do not certify layout, responsive rendering, accessibility or CSP enforcement in a browser.

The lab limits its own local subprocess groups and output. It does not sandbox arbitrary adapter code, intercept host tools, prevent external writers, undo side effects or enforce provider/token/dollar budgets. Keep candidate and evaluator quiescent during verification. Local files are trusted state; an owner able to rewrite them can falsify history. A separate path is not a security boundary against hostile code.

Declared-file coverage is deliberately explicit. Undeclared dependencies, live databases, environment variables, toolchain contents and remote systems need additional scoped evidence. Controls and their authoring cost are part of the approach's overhead. Visual quality, accessibility and usefulness still need direct product/user assessment.

The [research decision](ADR-013-application-evidence-lab.md) and [results](../evaluation/evidence-lab/README.md) describe both gains and losses. A partial oracle passed calibration and missed another fault. This experiment does not establish that DevMethod outperforms an excellent model with good tools and independent tests.
