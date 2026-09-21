# ADR 013: An optional application evidence lab

Status: experimental implementation selected under the user's delegated reversible R&D scope, 2026-09-15. Not a release decision. Baseline: `6f31552ac3f68c70ee1caa7b4bffb1181341a336`.

## Decision and observed problem

Keep the existing six skills, inspectors and behavioral guard intact. Add a separate, dependency-free local application evidence lab. The agent host still builds the product. The lab runs explicitly authorized Node adapters, challenges their criterion verdicts against healthy and known-fault controls, and records whether that evidence is current after code or requirement changes.

The initial wedge is **finding reasons not to trust a passing check, then carrying the demonstrated checks through maintenance**. It is useful for small applications with costly rule violations and an owner for acceptance criteria. It is not a replacement IDE, a product planner, a universal agent supervisor, a mandatory fourteen-stage process, or a certificate of correctness.

The current behavioral guard cannot evaluate arbitrary applications: ADR 012 intentionally fixes its scorer and strict native-report contract. Extending that contract would mix method evaluation with product evaluation. A separate opt-in boundary is easier to inspect and preserves old acceptance semantics. Existing mission criterion IDs can be reused in the sidecar; the lab neither migrates missions nor promotes its results to guard acceptance. Plain tests and inline Quick work remain appropriate.

## Alternatives and evidence that selected this direction

The [research designs](research/evidence-designs-2026-09-15.md) develop three distinct alternatives: a generic lifecycle controller; an evidence challenge layer; and a radical replacement of fixed progression with competing product experiments chosen by decision value. The [landscape](research/evidence-landscape-2026-09-15.md) records close prior art and available comparators.

The [preregistered local experiment](../evaluation/evidence-lab/PROTOCOL.md) executed 92 bounded evaluator processes on capacity and invoice fixtures. Candidate-only checking accepted 6/20 known faulty combinations. Calibration accepted 2/20, but withheld 6/10 healthy combinations under unusable oracles. Partial checks passed their controls and still missed an unrepresented fault. With strong checks alone, both approaches accepted no seeded faults: independent tests are a serious simpler alternative.

The three-candidate portfolio made no wrong selection in its ten cells because the fixed ordering put the healthy candidate first in both domains. It changed no selection outcome over that first candidate and used three checks rather than one. This does **not** refute product search, useful alternative generation, or a better judge. It tests only a small fixed-pool selection mechanism. The radical mixed-initiative design still needs actual stakeholder preference evidence and a native matched budget; that experiment is not claimed executed.

These observations select an **optional diagnostic**, not a mandatory completion gate. Calibration-as-certification is explicitly refuted. Building a distributed scheduler, provider router or learned uncertainty controller has no demonstrated benefit in this experiment.

## Contract and ownership

- The candidate root contains the product; an external evaluator directory contains reviewed criteria, Node entrypoints, control implementations and expected observations. They are separate ownership boundaries, not OS security isolation.
- A fixed Node invocation uses an entrypoint from the evaluator directory plus candidate root, mode and check ID. No shell command text is interpreted. The adapter is trusted arbitrary local code; `plan` must be inspected before `run` with its current permit digest. Existing user/host execution authority remains required. A digest is not an authentication credential.
- Verdicts have an exact declared criterion mapping. An import failure, timeout, malformed output or process error never counts as killing a fault. A healthy control must pass; each targeted fault must fail its declared criterion; the candidate must pass. Missing controls remain unchallenged.
- The receipt binds declared candidate files, contract, evaluator and runtime. Declared inputs are bounded snapshots; hashes establish byte identity, not completeness, independence, authorship, or semantic truth. Undeclared dependencies, external services and unobserved environment state remain outside the claim.
- Pending intent precedes execution; a private atomic journal and local lock protect cooperating processes. Each explicit run admits one attempt. Interrupted execution requires reconciliation; there is no automatic retry, stale-lock reclamation or reset.
- Two consecutive identical criterion failure signatures halt persistently. Finite attempt and no-progress budgets also stop changing failures without demonstrated reduction. Diagnosis and adjustment notes are required for correction but cannot clear a halt. A new permit may explicitly adopt a changed requirement/evaluator within the same scope while preserving history; it cannot erase the stop.
- The process budget concerns owned local checks. It is not a token budget, a provider billing limit, or a guarantee about external side effects. Execution support is limited to the tested process-control profile; unsupported profiles refuse execution while retaining inspection.

## Tradeoffs and conditions for reversal

Controls cost authoring, execution and maintenance effort. They can be unrealistic, overfitted or mistaken. A separate agent is not automatically an independent semantic authority. A healthy product can remain unverified because its checks are poor. The product UI and user task completion therefore need their own verification and human assessment.

Conservative full declared-input invalidation is selected instead of a speculative dependency inference engine. It can repeat checks unnecessarily, but it does not infer relationships it cannot establish. Later selective invalidation must outperform this simple baseline on real maintenance workloads before adding complexity.

Prefer ordinary independent tests plus Git when they deliver the same correctness, freshness and reviewability more cheaply. Remove or simplify the lab if a matched native campaign shows no useful reduction in false completion, or its setup/maintenance/interruptions outweigh that reduction. The held-out faults are reported even when they pass. No general superiority or research novelty is asserted.

## Verification and next decision

See [the runnable guide](EVIDENCE-LAB.md), [selection results](../evaluation/evidence-lab/README.md), and [the research checkpoint](EVIDENCE-LAB-CHECKPOINT.md). Runtime tests exercise actual subprocesses and persistent state; the demonstration exercises a real local application. Neither is a current Codex/Claude Code/Cursor comparison or an external adoption study. Release acceptance still requires maintainer review of the identified candidate.
