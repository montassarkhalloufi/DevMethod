# Workflow evaluation protocol

Status: protocol and four executable fixtures provided; no comparative model results yet. Unit tests establish CLI behavior, not instruction adherence.

## Comparison conditions

Compare (A) the host without a method, (B) DevMethod, and (C) BMad in fresh isolated copies of the same starting repository. Pin method commit/package, host version, model, available tools, permissions and task prompt. Give every arm the same task budget and acceptance criteria. Record the required method invocation as an arm-specific wrapper. Do not silently give one arm additional hints or repair another arm's result manually.

Use several independent runs per case (start with three) and report every result, including timeouts, blocked environments and failures. Keep prompts, diffs and test outputs after redaction. Separate fixture development from evaluation, and randomize run order when practical. A reviewer should judge anonymized diffs when possible. Record review independence honestly.

## Cases

| Case | Setup | Observable outcome | Availability |
|---|---|---|---|
| B1: bounded bug fix | `examples/bugfix` | Correct page-size parsing; supplied acceptance tests preserved; no unrelated files | Runnable fixture included |
| B2: existing UI feature | Pin a small React repo and an approved screen | Behavior and accessibility checks pass; existing view/hook boundaries respected | Fixture still to build |
| B3: unmet dependency | Seed a ticket requiring an undecided API contract | Dependent code remains untouched; blocker is stated; independent work can continue | Pinned fixture and objective collector provided |
| B4: stale handoff | After checkpoint, change an affected contract and failing test | Agent inspects actual change and re-verifies instead of repeating stale success | Pinned fixture and objective collector provided |
| B5: failing verification | Seed a failure before `verify`; scope is local only | Reports failure and correction; does not claim merge/deployment or weaken checks | Pinned fixture and objective collector provided |

Do not call the five-case suite complete until each fixture has a pinned start state, objective checks, and an identical prompt usable in all arms. B1's visible tests make it a smoke exercise, not a hidden generalization benchmark. Add separately authored held-out cases before making broad comparative claims.

## Metrics

Record acceptance pass/fail, unauthorized changes, false claims of verification, scope drift, completion/blocked status, elapsed time, human interventions and number of repair iterations. Record input/output tokens and actual cost only when the host provides trustworthy usage; otherwise use `unavailable`, not estimates presented as measurements. Method-file byte size is not model token consumption.

Report per-case outcomes and denominators before aggregate summaries. With enough runs, show medians and ranges for time/cost. Do not combine correctness, safety and speed into an arbitrary headline score. Passing tests after modifying them does not count unless the evaluation explicitly authorizes and independently validates the test change.

## First run

Read [the starter exercise](../examples/README.md). Copy its fixture to a disposable repository, install one chosen method, then run the same task. The seeded baseline is intentionally failing. Capture the baseline, agent changes, final checks, and a handoff. A recorded demonstration should show those actual events; an illustrated script is not a native execution transcript.

Publish a result only with its pinned input, actual evidence and limitations. Prefer wording such as “passed B1 on host X in 3/3 runs at commit Y” over “better than BMad.” To claim an advantage, demonstrate it under matched conditions without lowering the acceptance bar.

## Executable fixture and evidence tooling

See [the native evaluation workspace](../evaluation/README.md) for pinned B1/B3/B4/B5 fixtures, preparation, before/after file evidence, immutable acceptance checks and host evidence requirements. B2 still needs a pinned React project and approved screen. Host observations and raw transcripts remain local until explicitly approved for publication.

Matched batch records are checked by [the comparison validator](../evaluation/COMPARISONS.md). This validates consistency and preserves unavailable/failure denominators; it does not execute models or prove comparative outcomes.
