# Bounded correction

Read when an implementation/check fails, progress stalls or interrupted work resumes. Use the existing ticket/evidence owner or an inline Quick note; this procedure requires no separate journal, JSON record or approval stage.

## Decide the next attempt

Retain the observed result and relevant command/artifact, the affected criterion, the likely cause (or uncertainty), and what the next attempt will change or distinguish. Respect the current task's attempt/time limits. For open-ended debugging without a stated limit, choose a proportionate local bound before repeated attempts and reassess when it is reached; this is not permission for paid calls or additional scope.

- A failing test normally calls for a correction or a diagnostic probe. Rerunning unchanged is useful only when it tests a stated hypothesis, such as an intermittent dependency; retain the earlier failure.
- The same failure with no new information calls for a different diagnostic approach or `correct-course` when scope/decisions must change. Do not reset attempt history to manufacture another budget.
- After a timeout or interruption involving external or persistent effects, reconcile actual state before retrying. A missing response does not prove the operation did nothing. Available credentials or tools do not expand the user's current authorization.
- A correction changes the inspected revision. Link the original result, diagnosis and applied change to a new execution of the affected check, using the [verification evidence](verification-and-cost.md#code-quality-and-actual-tools); reassess the criterion from that result. A prior success does not verify the changed behavior. Do not rerun independent green checks without changed inputs, a concrete uncertainty or a required project gate.

For example, a reservation test failing on duplicate allocation justifies inspecting the transaction and exercising a controlled concurrent request. A second identical failure after no relevant change supplies no new evidence. If the environment cannot run that scenario, record it as blocked rather than interpreting a passing unit suite as proof of concurrency safety.

For tool/service feedback, identify whether the failure belongs to invocation/configuration, access, transport, the external operation or the application contract before changing product code. Keep the source revision, capability/interface version and relevant nonsecret environment identity with the original observation and recheck. A changed adapter, permission scope or service contract invalidates its dependent evidence; retain independent results and reopen an accepted choice only when the new constraint warrants it. Never overwrite the earlier failure with a later success or silently promote a reported result to an executed check.

## Learn at the right owner

Distinguish a local implementation defect, missing reusable guidance and an applicable rule that was not followed. Fix the local defect; change the canonical guidance only when the observed failure supports a transferable decision. For an ignored rule, investigate its activation or verification before adding another instruction. Keep the lesson with existing evidence and add a meaningful failure scenario when useful; every bug need not produce a new rule or record.

## Stop honestly

Distinguish objective verified, dependency/environment blocked, limit reached, interrupted, and user-ended scope. Preserve unresolved criteria and the exact authorized next action when applicable. An evaluator's approval, zero findings, intact evidence hashes or a successful process exit alone does not establish the user outcome. Explain what each check demonstrates and what remains unobserved.

These are instructions to the host agent. They do not dispatch agents, enforce budgets, intercept tools or prove the truth of recorded results. Independent review can improve coverage but still needs inspectable evidence; another model's agreement is not certification.

For a project that explicitly adopts the optional local guard, `docs/ADR-012-local-execution-guard.md` additionally applies: two consecutive identical evaluator failure signatures stop the session persistently, preserve declared input bytes and emit a JSON human-intervention report. No automatic retry or reset is permitted. A changed diagnosis does not erase this stop; human reconciliation must preserve the history. This stronger executable rule is limited to the controller's session and subprocess, not external host actions.

## Design provenance

Consult these references when revising or evaluating this procedure, not for every delivery. They motivate testable hypotheses, not additional project authority or compatibility claims:

- [Addy Osmani: agent harness engineering](https://addyosmani.com/blog/agent-harness-engineering/) — framing the surrounding execution and verification system.
- [Osmani: the engineer's role and public discussion](https://www.linkedin.com/posts/addyosmani_the-engineer-of-the-future-is-the-person-activity-7483407592921370624-st0l) — Neelam Borse's concern about obsolete rules and Nicolas Morandi's report about smaller changes motivate instruction-conflict checks and reviewable scope. These two comments were visible in the public subset inspected on 2026-09-15; their employers were not verified.
- [Osmani: software factories and public discussion](https://www.linkedin.com/posts/addyosmani_software-factories-light-and-dark-activity-7485581933964357632-edT3) — the post discusses verification capacity around autonomous work. Defining verification before generation and reducing review bottlenecks remain audit hypotheses; earlier individual comment attributions were not revalidated in the accessible subset.
- [Philipp Schmid: testing skills](https://www.philschmid.de/testing-skills) — evaluate observable outcomes, appropriate activation and efficiency; instruction presence alone is not evidence of agent compliance.
- [Anthropic: harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) — evaluate generator/evaluator behavior and retain meaningful intermediate results rather than assuming another iteration improves quality.

Public comments are practitioner observations, not controlled comparative evidence. Test these choices on representative tasks before claiming better reliability or lower cost.
