# DevMethod and BMad: an evidence-based direction

Reviewed 2026-09-12. DevMethod baseline: [`758491c`](https://github.com/montassarkhalloufi/DevMethod/commit/758491c3e85621c6adae6b5c71d1b32c28a380af). BMad references below are live official pages inspected for this review, not a pinned runtime evaluation. No head-to-head model benchmark has been executed.

## Assessment

DevMethod has a compact reusable engineering method and a tested installer. Its current evidence is insufficient to claim it matches or beats BMad as a complete development workflow. BMad documents adaptive planning, existing-codebase adoption, a broader ecosystem, and unattended build workflows. Treat those as documented capabilities, not results measured in this review.

| Area | DevMethod baseline | BMad documented capability | DevMethod priority |
|---|---|---|---|
| Daily small changes | Fourteen stages, limited guidance on which to skip | One-session build path | Make quick/standard/major selection explicit |
| Existing repositories | Profiles, accepted decisions, conservative adoption | Existing-codebase guidance and project context | Show adoption without repeated full documentation |
| Distribution | Six modules, three host export layouts, offline installer | Skills and plugin installation routes | Add diagnostics, then version-aware update previews |
| Verification | Installer tests and written evidence rules | Review/test workflows and test architect module | Link criteria to checks; publish behavioral evaluations |
| Resumption | Markdown checkpoints | Build/spec state and project context | Test stale checkpoints before adding a state engine |
| Automation | Host-driven steps; no background scheduler | Build Auto worker and orchestration options | Keep bounded delivery; introduce orchestration only after evaluation |
| Specialization | React boundaries, UI fidelity, AI evidence/jobs | Broad software lifecycle and specialist modules | Demonstrate these engineering strengths on real changes |

Sources: [BMad repository](https://github.com/bmad-code-org/BMAD-METHOD), [planning paths](https://docs.bmad-method.org/plan/choose-a-planning-path/), [existing codebases](https://docs.bmad-method.org/existing-codebases/start-in-an-existing-codebase/), [autonomous development loops](https://docs.bmad-method.org/build/autonomous-development-loops/). Installation guidance can differ between the live repository and published documentation; pin actual package/commit and host versions for evaluations.

## A position worth testing

**A compact engineering workflow for verifiable changes in existing repositories.** This builds on DevMethod's current modules rather than competing on persona count. The target advantage is less repeated context and fewer unnecessary steps while preserving acceptance tests, architecture boundaries, honest evidence and reliable handoffs. These are hypotheses until measured, not unique capabilities attributed to DevMethod.

For solo developers and small teams, evaluate the complete experience: installation, first useful change, interruption, review and update. Quality of generated code matters more than volume of documents. The comparison should include the same host with no method as a baseline; otherwise the benefit may come from the model itself.

## Prioritized additions

1. **Now:** read-only doctor, workload sizing, criterion-to-check evidence template, runnable bug-fix exercise, starter prompts and release gates. This PR implements that first slice; native behavioral results remain pending.
2. **Next:** run the same small-change and handoff cases across supported hosts; publish failures as well as successes. Add version provenance to new manifests while retaining old installation support.
3. **After evidence:** safe update preview and project-context drift checks. Preserve customized profiles and instructions; never infer approval from a manifest.
4. **Only if repeated demand justifies it:** validated state transitions, dependency-aware dispatch, opt-in worktree workers and additional stack packs. Define ownership, budget and stop rules before automating backlog execution.

Do not add a large agent roster, dashboard, vector database, paid backend or telemetry merely to resemble another product. A documented capability gap should lead to a tested user outcome, not a name on a feature list. See [the evaluation protocol](EVALUATION.md) and [roadmap](ROADMAP.md).
