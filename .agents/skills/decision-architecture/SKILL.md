---
name: decision-architecture
description: Resolve product or engineering trade-offs, record ADRs, and design or review domain, application and infrastructure boundaries. Use for architecture choices, backend slices or changes to accepted contracts; skip cosmetic and routine changes without a decision or boundary impact.
---

# Decision Architecture

Start from real constraints and decisions. Preserve accepted project choices; this skill's recommendations are adaptable defaults, never a reason for a wholesale migration.

Read `CONTRIBUTING.md` and accepted decisions before editing. For TypeScript, preserve strictness, validate untrusted input, use explicit identifiers, and centralize meaningful business/configuration constants. Apply SOLID through small consumer-defined ports, without speculative factories or inheritance.

## Discuss structural choices before detailing architecture

For a structural choice that is neither accepted nor explicitly delegated, collect the relevant constraints: team skills, budget, operations, hosting, deadlines and preferences. Separate product requirements, accepted decisions, assumptions and recommendations. Present a concise comparison **in the conversation** before elaborating one option into the reference architecture. Explain credible alternatives, decisive trade-offs, your recommendation, its limits and conditions; do not invent weak alternatives.

Invite the user to challenge, propose another option, choose or explicitly delegate. Evaluate user alternatives on the same criteria and revise the recommendation when warranted. If the recommendation is refused, explore the objection and remaining viable options; do not keep implementing it as the baseline. Record the explicit choice or scoped delegation, its source/date, rationale and revisit conditions in the decision owner, then detail dependent boundaries and contracts. A clear choice needs no ceremonial reconfirmation.

A PROPOSED label in an ADR does not replace this exchange. Silence, an ambiguous “ok”, a generic continuation or invocation of `plan` does not imply adoption. Clarify only ambiguity that materially changes the next step. If planning is requested with choices open, provide an explicitly conditional plan and continue independent authorized work. An omitted exchange resumes directly in `project-foundation architecture`, without a mandatory `correct-course` detour.

Preserve accepted choices and delegations within their scope; routine reversible details do not need individual validation. When replacing an accepted decision, link the replacement, affected contracts/tickets and evidence that needs rechecking. Resolve only dependent blockers.

## Proportionate trade-off

- Restate the concrete decision, owner, blocking constraint, and decision date.
- Distinguish verified fact, assumption, founder preference, proposal, and accepted decision.
- Verify current official sources when versions, prices, contracts, or rules may change. A regulated recommendation requires appropriate sources and competence; this skill does not provide legal validation.
- Compare viable options on decisive criteria: user value, total cost, implementation/operating time, reversibility, data integrity, and migration risk. Include keeping the existing solution when viable.
- Give a recommendation, its conditions, and the signal that would justify revisiting it. Do not invent a numerical score for artificial precision.
- Create an ADR only for a structural choice or durable exception. Use [the template](assets/ADR.md). Infer acceptance only from an explicit decision, never from an agent recommendation.
- If an accepted decision prevents the request, explain the conflict precisely and propose its replacement; block only dependent work.

For product framing and economics, read [product decisions](references/product-decisions.md). For HTTP APIs, read [API contracts](references/api-contracts.md) before retries or async work. For backend or data, read [backend boundaries](references/backend-boundaries.md).

## Expected output

Produce a usable decision/action connected to evidence and scope. For design work: boundaries, contracts, invariants, errors, migration, and required checks. For an implementation request, continue implementing authorized scope once it is sufficiently defined; do not stop at a diagram.
