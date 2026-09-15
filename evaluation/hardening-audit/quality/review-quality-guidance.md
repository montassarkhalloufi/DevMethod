# Independent review: quality guidance

Reviewed commit: `04d3bf99d7b660e42fbf4707dcf12e073cb6f3c4`.
Date: 2026-09-15. Reviewer: evaluation/application-quality worker, separate from the guidance author. Read-only review of the exact four changed files and surrounding skill instructions; no reviewed file was edited.

**Conclusion: no concrete correction required within this four-file scope.** The changes connect accepted requirements, actual enforcement boundaries, appropriately chosen tests and retained evidence without asserting that documentation or green checks establish native-agent performance. This is a bounded content/contract review, not validation of downstream agents following the instructions.

Inspected files:

- `.agents/skills/decision-architecture/references/backend-boundaries.md`
- `.agents/skills/scoped-delivery/assets/VERIFICATION.md`
- `.agents/skills/scoped-delivery/references/review-workflow.md`
- `.agents/skills/scoped-delivery/references/verification-and-cost.md`

What was checked:

1. **Risk and boundary match.** The new architecture chain records the failure scenario, invariant, enforcement/commit point, scope and evidence. It explicitly distinguishes one process, multiple instances, restart and retries. A database guarantee cannot be established by an in-memory port or sequential test. The guidance does not mandate microservices, extra layers or another status ledger.
2. **Test ordering stays conditional.** Reproducible corrections use a relevant observed red failure before the fix where execution is possible. Missing dependencies or a broken harness are not accepted as behavioral red evidence. Green-baseline refactoring, bounded discovery and documentation/formatting/static-layout exceptions are explicit. A policy preference for small red–green increments is not presented as universal scientific superiority.
3. **Assertion relevance and scope.** Requirements determine expected behavior; expected values must not be computed through the production helper being tested. Overlap across layers is justified only by another boundary. Targeted mutation is optional and intended to add information, rather than inflate counts. The warning about call counts/snapshots is conditional on whether they can expose the requirement violation; it does not forbid useful no-write or unchanged-state assertions.
4. **Tools and complexity are measured, not invented.** The guidance calls for actual installed versions/configurations and distinguishes unavailable, unrun, blocked and failed checks. Cognitive complexity is not replaced by cyclomatic complexity or line counts. It requires a consistent analyzer/method/scope for comparisons and prohibits treating a metric as correctness or capacity evidence. Tool setup applies to delegated new-project engineering; existing conventions and one formatting owner are preserved.
5. **Template stays proportionate.** The verification table adds useful enforcement and topology/workload fields while permitting inapplicable details to be omitted for small changes. It links existing criteria/evidence and preserves red/green or the concrete blocker; it does not create another authoritative task ledger.

Scientific source checks were independently performed on 2026-09-15:

- [Fucci et al., A Dissection of the Test-Driven Development Process](https://arxiv.org/abs/1611.05994): its abstract separates sequencing, granularity, uniformity and refactoring effort. The study associates outcomes more strongly with fine-grained, regular cycles than sequencing. The guidance's narrow description is supported and does not generalize the study to DevMethod agents.
- [Nagappan et al., four industrial teams](https://research.ibm.com/publications/realizing-quality-improvement-through-test-driven-development-results-and-experiences-of-four-industrial-teams): the primary publication page describes industrial case studies comparing TDD-adopting projects with similar projects. Its reported outcomes do not make this a randomized DevMethod-agent experiment. The guidance correctly preserves that distinction.
- [SonarSource Cognitive Complexity specification](https://www.sonarsource.com/docs/CognitiveComplexity.pdf): the accessible document is version 1.7, dated 29 August 2023, by G. Ann Campbell. It defines a distinct metric and detailed increment/nesting rules. The guidance refers to the analyzer's actual semantics without claiming an independently validated universal threshold.

Deterministic checks: `git show --check 04d3bf9` passed; all four local Markdown links in the four exact commit files resolved in that commit. SHA-256 pins and link-check results are retained in `/workspace/scratch/0182c7a94d20/quality-guidance-review-checks.json`.

Limits: no skill invocation, model behavior, load result, cognitive-complexity measurement, install/package result or final CI result was inferred from this guidance review. These instructions require downstream empirical validation and exact-candidate distribution checks owned by the integrator. No additional content changes are requested by this reviewer.
