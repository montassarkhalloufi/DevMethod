# Exploratory Work Mode review: green tests, broken capacity invariant

One real isolated-context worker was given the raw fictional contract, implementation and sequential test, plus the candidate scoped-delivery skill. Its task was read-only integration-readiness review. The prompt did not disclose the seeded defect or intended verdict. This was a Work Mode worker, not Codex CLI, Claude Code or Cursor. No comparison arm or general success rate is inferred.

The worker reported corrections required and constructed a controlled concurrent probe: both callers receive confirmation, then the second stale save overwrites the first confirmed reservation. The sequential test passes. The probe was independently reexecuted by the integrator and fails both relevant assertions. Implementation bytes stayed unchanged during review.

```sh
node --test evaluation/work-mode-review/reservations.test.mjs
node --test evaluation/work-mode-review/probe.mjs
```

Expected for this intentionally defective input: the first command passes one test; the second exits 1 with two failing assertions for one underlying race. This exercise is not part of the package's green test suite. A real fix requires atomicity across all writers and verification against the actual store; an instance-local mutex is not a universal solution.

[Result and artifact hashes](result.json) and [actual probe output](probe-output.txt) preserve the reproducible observation. Captured output has trailing whitespace removed; assertion content is unchanged. Worker verdict is an attributed observation, not a full raw transcript. Model usage and cost are unavailable. This evidence is kept separate from the [native behavioral campaign](../behavioral/README.md), whose unexecuted slots remain unexecuted.
