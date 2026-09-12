---
name: decision-architecture
description: Resolve product or engineering trade-offs, record ADRs, and design or review domain, application and infrastructure boundaries. Use for architecture choices, backend slices or changes to accepted contracts; skip cosmetic and routine changes without a decision or boundary impact.
---

# Decision Architecture

Start from real constraints and decisions. Preserve accepted project choices; this skill's recommendations are adaptable defaults, never a reason for a wholesale migration.

Read `CONTRIBUTING.md` and accepted decisions before editing. For TypeScript, preserve strictness, validate untrusted input, use explicit identifiers, and centralize meaningful business/configuration constants. Apply SOLID through small consumer-defined ports, without speculative factories or inheritance.

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
