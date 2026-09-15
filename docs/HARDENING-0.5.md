# 0.5 hardening: scope, provenance and evidence

This ledger preserves all 27 workstreams requested in the discussion. It is not a claim that all 27 are complete, nor permission to publish. Existing mechanisms are retained; additions must remain optional and backward compatible. A release may ship a bounded improvement while explicitly leaving native validation or larger mechanisms pending. Publication remains subject to [the exact-candidate release checklist](RELEASE-CHECKLIST.md).

## Research provenance and interpretation

The following publications were inspected in the preceding research discussion. They motivate questions and evaluation cases; they do not certify DevMethod or establish causal improvements. LinkedIn comments are anecdotal feedback. Comment names and attribution from that discussion have not been independently revalidated in this ledger, and no employment claim about a commenter is made here.

- **A — Outer-loop judgment:** [Addy Osmani's post](https://www.linkedin.com/posts/addyosmani_the-engineer-of-the-future-is-the-person-activity-7483407592921370624-st0l). Discussion themes: obsolete instructions, smaller reviewable changes and independent acceptance.
- **B — Understanding and review load:** [Software factories](https://www.linkedin.com/posts/addyosmani_software-factories-light-and-dark-activity-7485581933964357632-edT3). Discussion themes: human decision bottlenecks and defining verification before generation.
- **C — Skills evaluation:** [Philipp Schmid, Testing Skills](https://www.philschmid.de/testing-skills). Questions: usable outcome, instruction compliance, efficiency and negative trigger controls. [Related discussion](https://www.linkedin.com/posts/philipp-schmid-a6a2bb196_just-finished-my-talk-on-why-do-senior-activity-7448014916797796352-r-8Z) raised representation of context.
- **D — Observable behavior:** [Google Developers, anatomy of harness engineering](https://developers.googleblog.com/the-anatomy-of-harness-engineering-how-to-evaluate-iterate-and-guard-ai-coding-agents/). Questions: executed checks, flexible valid paths and repeatability rather than one final score.
- **E — Evaluator calibration:** [Anthropic, Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps). Questions: agreement on acceptance, independent evaluation, reviewer leniency and preserving useful iterations. [Related earlier discussion](https://www.linkedin.com/posts/anthropicresearch_effective-harnesses-for-long-running-agents-activity-7399550329031180288-xR_w) raised continuity, logs and retry policy.
- **F — Narrow, inspectable workflow:** [Adobe, Experience Modernization Agent](https://blog.developer.adobe.com/en/publish/2026/03/how-the-experience-modernization-agent-migrates-sites-to-edge-delivery-services). Question: validate a defined end-to-end workflow and disclose unsupported integrations.
- **U — User audit:** the 27-item scope agreed in this conversation, including the earlier supplied infographic/comments. These are requirements and observations, not externally verified claims.

These sources do not require a new autonomous runtime, rigid tool sequence, compulsory extra reviewer, paid service or universal multi-agent workflow. Changes are justified by an observed failure mode and evaluated at the appropriate layer.

## Complete workstream ledger

Local integrated validation on 2026-09-15 passed 167 tests. Authored cases and deterministic fixture results are not native-agent evidence. Archive identity and external CI belong to the exact candidate PR record.

| # | Workstream / source | Observed gap or risk | Existing mechanism or bounded hardening | Evidence status / remaining gate |
|---|---|---|---|---|
| 1 | Positioning — U, F | Instructions and fixture supervisor can be mistaken for enforcement | Host capability matrix; clarify pilot versus normal skill use | Documentation revised; current native capabilities pending |
| 2 | Proportional workflow — U, B | Unnecessary questions, artifacts and reviews | Retain Quick/Standard/Major and delegated mode; apply checks proportionately | Guidance reviewed; integrated tests pass; native task efficiency unmeasured |
| 3 | Mission contract — U, B | Tests can omit the actual user objective | Existing mission criteria, exclusions and authority; optional explicit closure coverage | Closure checks pass; semantic adequacy still requires review |
| 4 | Context selection — C, U | Hashes cannot identify omitted or irrelevant sources | Require purpose/provenance and explicit missing context; scenario coverage | Selection quality needs native cases and independent review |
| 5 | Instruction maintenance — A | Rules survive changes that invalidate their assumptions | Reassess instructions after relevant code/decision changes | Guidance hardening; no automatic semantic rule updater |
| 6 | Context budget — C, U | Logs and summaries crowd out important inputs | Progressive loading, referenced logs, decision-preserving handoff | Guidance; actual token/summarization-loss evidence pending |
| 7 | Correction loop — D, E, U | Blind repeat without diagnosis or new information | Bounded diagnosis/correction/verification record; stagnation/stop checks | 14 closure/loop tests pass, including historical stagnation; no loop executor |
| 8 | Evidence-based closure — D, E, U | Process exit or green tests treated as completion | Explicit required criteria, outcomes and unresolved blockers | Deterministic false-closure checks pass; native cases pending |
| 9 | Evidence relevance — B, D | Intact evidence may test the wrong behavior | Link evidence to criteria and distinguish claimed, executed and reviewed results | Rule checks cannot certify semantic relevance; independent review needed |
| 10 | Cross-session resumption — E, U | Stale state and partial actions | Existing pinned checkpoints/Git inspection; reconcile actual state before continuing | Existing deterministic mechanism; changed candidate native resumption pending |
| 11 | Reviewer quality — E | Second agent can agree with a defective result | Seed known defects and clean controls; record misses and false positives | Offline cases delivered; one independent Work Mode review found seeded concurrency defect; broader calibration pending |
| 12 | Human verification load — A, B | Large changes and reports obscure decisions | Coherent reviewable increments and compact decision/evidence handoff | Guidance; intervention and review-time measurements pending |
| 13 | Host-specific controls — D, U | Host features inferred from a brand or exported layout | Evidence-layer matrix; current executable absence disclosed | Matrix delivered; hooks/current native controls unverified |
| 14 | Execution limits — E, U | Inter-run threshold misrepresented as strict cap | Preserve historical bounded fixture supervisor; distinguish run/time/token/cost limits | Historical scoped pilot only; universal budget enforcement unavailable |
| 15 | Authority to act — U | Technical success treated as permission to publish | Preserve delegated scope; verify authority at consequential action | Guidance; runtime enforcement depends on tested host boundary |
| 16 | Inputs/tool security — U | Untrusted text treated as instruction; secrets exposed | Existing path/pin safeguards plus trust-boundary guidance and malicious-input cases | Local path and pin checks pass; obvious labeled injection fixture only; no complete injection defense claim |
| 17 | Observability — D, E | Final status hides attempts and causal evidence | Preserve versions, outputs, diagnostics, stop reasons; offline report assessment | Report validation tests pass; no general automatic trace collector |
| 18 | Multi-agent coordination — B, U | Declared worktrees mistaken for isolation | Existing ownership graph; inspect actual isolation and integrate sequentially | Deterministic planner exists; arbitrary graph dispatch remains unavailable |
| 19 | Skill evaluation — C | Only happy-path invocation is tested | Explicit/implicit trigger, negative controls, useful result, instruction compliance | 18 pinned cases and offline scorer delivered; native skill campaign pending |
| 20 | Behavioral evaluation — D | Written scenario confused with observed behavior | Record meaningful observable checks without requiring one exact tool sequence | 47 preparation/scorer tests pass; authenticated native traces still required |
| 21 | Reproducible comparison — C, D | Small/incomplete pilot presented as superiority | Retain matched tasks/settings, repetitions, failure evidence and confounders | Historical comparison incomplete; no general superiority claim |
| 22 | Harness maintenance — D, E | Rules accumulate without measured benefit | Tie each rule to failure case; reevaluate after model changes; remove unsupported complexity | Procedure guidance; repeated ablation results pending |
| 23 | Technical depth — F, U | Generic guidance mistaken for proven stack expertise | Existing React/Node/data/AI profiles; risk-relevant concurrency, migration and error cases | Existing guidance; representative native technical campaign pending |
| 24 | Product/design/architecture — F, U | Attractive artifact without valid behavior/contracts | Existing journeys, design alternatives, interaction checks and architectural fidelity | Prior guidance remains; current end-to-end validation is scoped, not universal |
| 25 | Portable dossier — E, U | PDF becomes stale competing source of truth | Existing complete-study gate, revision/provenance and reconciliation on import | Guidance; real changed-project dossier resumption pending |
| 26 | Installation/update/version — U | Old package digest reused for changed source | Existing conflict preservation/doctor/update comparison; exact archive gates | Extracted candidate layout checks pass; exact-source platform CI recorded in candidate PR |
| 27 | Public documentation/demos — F, U | Claims outrun reproducible evidence | Capability matrix, full ledger, visible limits and exact candidate release evidence | Docs revised; native demos and publication remain separate gates |

## Candidate evidence record

The integrator must replace pending values only with actual execution results and reference retained logs or reports. Record the final source revision after integration; record the archive hash after all packaged edits. This section is not a fixed promise to finish a missing authenticated external run by simulation.

| Evidence layer | Current candidate status | Required record |
|---|---|---|
| Source and generated output | TypeScript build passed; generated output included | Exact revision is the candidate PR head; version 0.5.0 |
| Deterministic tests | `npm test`: exit 0, 167 passed, 0 failed | Linux, Node v24.19.0, npm 11.9.0; includes 14 closure/loop checks |
| Offline behavioral fixtures/report scorer | 47 preparation/scorer tests pass within full suite | 18 cases; 36 native slots not run; pass rate among native completions null |
| Documentation consistency | `npm run check:docs` and `git diff --check` pass | Local file links checked; external URLs/anchors not certified |
| Packed archive | `npm pack --dry-run` and actual pack passed | Final 0.5.0 archive SHA-256/SHA-512 retained in candidate PR record |
| Extracted archive smoke | `node scripts/package-smoke.mjs ARCHIVE`: exit 0 | All three layouts, subset/customization preservation, doctor, closure, loop, scorer and preparer |
| Current OS CI | Pending external validation | Run URL, revision and per-platform results |
| Current native Codex/Claude/Cursor | Blocked locally: executables absent | Authenticated current-host discovery/edit/failure/resumption evidence |
| Historical native pilot | Available, restricted to recorded revision/settings | [Native results](NATIVE-PILOT-RESULTS.md); not transferred to this candidate |
| Exact-candidate maintainer review | Pending | Reviewed revision and archive integrity |
| Registry publication | Pending, not implied by work | Authorized tag, downloaded registry integrity and archive verification |

## Review evidence and corrections

Independent CLI review found that a later successful attempt could erase an earlier stagnation limit. Prefix checks now retain historical limit crossings; the reviewer reproduced the fix. Independent scorer review found pooled fixture revisions and uninvoked blocked records included in attempted metrics; both were corrected, and bounded report/artifact reads added. Final independent preparation/scorer review passed 47 tests with no blocking finding in that scope.

A separate [Work Mode review exercise](../evaluation/work-mode-review/README.md) found a seeded capacity-one concurrency defect despite a passing sequential test. The controlled probe reproduced two confirmations and replacement of the first reservation. This is one real worker observation, with reproducible in-memory evidence; it is not a native CLI run, clean-control calibration or comparative improvement result. The deliberately failing fixture is retained as evaluator material, outside the green suite.

## Release interpretation

A passed deterministic suite supports the behavior of local validators and packaging. A passed authored evaluation fixture supports a scorer's implementation. Neither demonstrates that an agent selected the right context, obeyed a skill, stopped honestly, or produced a sound design. Those require actual observed runs and review. Native gaps can remain openly pending only if the release does not claim those capabilities; they block corresponding compatibility or superiority claims.

Implementation references for this candidate: [closure and loop inspectors](CLOSURE-AND-LOOPS.md), [offline behavioral evaluation](../evaluation/behavioral/README.md), [host capability matrix](HOST-CAPABILITIES.md). These additions remain subject to the integrated results above.

No changes in this ledger authorize deployment, account changes, purchases, telemetry, automatic migration or unrestricted execution. Prepare the concrete verified candidate first; leave exact-candidate review and authorized publication as explicit final gates.
