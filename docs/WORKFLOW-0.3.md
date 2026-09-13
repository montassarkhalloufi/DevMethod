# Research, decisions and mission ownership

DevMethod 0.3.0 keeps six skills, fourteen workflow stages and the existing JSON inspector schemas. The `design-to-code` module is unchanged. This update changes model guidance, not a deterministic conversational engine.

## Before committing to a solution

`explore` researches direct, adjacent and informal alternatives when product uncertainty warrants it. Use dated traceable sources, distinguish facts, interpretations and hypotheses, and separate testimonials from demonstrated trends. Not finding a feature is not proof of absence or opportunity. Discuss a synthesis and whether to continue, reposition, reduce, deepen or abandon. Unavailable research must be disclosed; a technical fix does not inherit a competitive-study requirement. See [exploration guidance](../.agents/skills/project-foundation/references/exploration.md).

`frame` owns the resulting need, scope, success criteria and business rules. Preserve approved design and its existing workflow.

`architecture` collects constraints and compares credible options in the conversation before detailing dependent architecture. The user may challenge, supply alternatives, choose or explicitly delegate. Record the choice/delegation and rationale in the decision owner. Silence, an ambiguous “ok”, invoking `plan` or a PROPOSED label does not replace this exchange. Preserve accepted decisions, scoped delegations and autonomy for routine reversible details.

`plan` discusses the first useful outcome and learning, actual scope alternatives, benefits, exclusions, risks, dependencies and uncertain effort. Record priorities, milestone demonstrations, exit and continuation conditions under current authorization. Detail near-term vertical slices. With open architecture, make the plan conditional and resume the discussion directly in architecture. Changed decisions require reassessing dependent tickets and evidence. See [delivery planning](../.agents/skills/project-foundation/references/delivery-planning.md).

## Proposed storage, only without an existing convention

For substantial work, [mission context](../.agents/skills/project-foundation/references/mission-context.md) defines the full proposed tree: compact PROJECT_PROFILE; docs/exploration/{EXISTANT,OPPORTUNITES}; docs/produit/{CADRAGE,REGLES}; docs/missions/<mission-id>/{PLAN,REPRISE,tickets/,preuves/}; design/; architecture/decisions/.

Each fact has one current owner. The profile links context; research owns sources and hypotheses; product owns need and rules; PLAN owns mission outcome, milestones/order and ticket links; tickets own scope, dependencies, status, acceptance and revision-labelled verification. REPRISE is the latest dated handoff, not a second status register. Bulky artifacts go in preuves when needed. Any status table is generated from tickets and labelled with its revision/time, never maintained independently. Do not create empty documents by ritual.

Read progressively: profile, active mission, active ticket, necessary references. Compare actual code and changed dependencies with evidence before resuming. A plan, ready ticket, verified implementation, integration and deployment are distinct states.

## Non-destructive migration

Existing `docs/missions/<mission-id>.md` records, inline Quick work and existing trackers remain valid. No automatic move, rewrite or JSON schema migration occurs.

1. Install the new kit into a fresh staging directory and compare using `update-preview` and a content diff. Keep customized skills, filled profiles and existing instructions; divergent files still block init before writes.
2. Keep the legacy mission as the active entry until extraction is useful. Inspect candidate target paths for existing content. Reconcile divergence intentionally; never overwrite it.
3. Extract outcome/milestones into PLAN, executable task fields and evidence into tickets, and the dated handoff into REPRISE only as needed. Keep stable criterion IDs, exact source links and historical revisions. Replace extracted live fields in the old location with links so ownership stays unique.
4. Verify links, criteria and the active ticket from the new entry. Update the profile's entry link after the comparison. Git retains history; avoid a duplicate live status table.

Installed resources live under each selected skill's assets/references. They are templates, not files automatically scaffolded into docs. Foundation includes the research/product resources even when delivery is not selected; resolve scoped-delivery by name when its templates are needed. The three host profiles transform skill paths and generate integrity manifests from the full selected payload. No manifest format change is needed.

The CLI `mission`, `context`, `context-check`, `resume` and `plan` still take explicit JSON paths. They do not parse Markdown mission directories, accept decisions or execute tickets. See the [fictional linked mission](../examples/mission-dialogue/PROJECT_PROFILE.md) and [verification scenarios](WORKFLOW-0.3-VALIDATION.md).
