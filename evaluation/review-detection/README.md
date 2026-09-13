# Review detection cases

This extends the existing [workflow evaluation protocol](../../docs/EVALUATION.md) for review quality. It is not another delivery workflow. Four small cases contain five known defects and a correct control. All credentials and personal data in these fixtures are synthetic.

## Cases and expected findings

The evaluator-owned [oracle](oracle.json) records expected findings and their scope. The [reproduction tests](reproduce.test.mjs) demonstrate application behavior directly, before any report masking:

| Case | Expected | Evidence |
|---|---|---|
| SENSITIVE | LEAK: token/email and provider error reach logs, telemetry and API output | Captured synthetic outputs contain the sentinel values |
| SUBMISSION | RACE, PARTIAL, TIMEOUT: duplicate effects under interleaving, interrupted notification, or effect-before-timeout | Controlled gates and injected failures observe two effects for one key |
| COMPATIBILITY | CONTRACT: changed response breaks existing stored data and an unchanged consumer | Missing total and NaN invoice result |
| CONTROL | No defect under its stated trim/reject contract | Contract tests pass; adding an architecture layer is a preference, not a blocking defect |

Run `node --test evaluation/review-detection/reproduce.test.mjs`. These tests deliberately assert the presence of seeded defects: a green result means the evaluation input is reproducible, not that the application is correct or a model detected anything. They are included in npm test through tests/review-detection.test.mjs.

## Conduct a detection evaluation

Use fresh isolated projects and the existing protocol's pinned method/host/model, equal budgets, permissions and transcript requirements. Give the reviewer only the case's fixture files, the relevant project contract and this neutral task: “Review these changes and affected interactions. Report evidence-backed defects, impact and unverified risks; do not fix code.” For COMPATIBILITY identify compatibility.mjs as changed and keep consumer.mjs available as unchanged context. For CONTROL preserve the comment's accepted contract. Do not provide oracle.json, reproduction tests, expected IDs or this case table to the reviewer. Keep the oracle outside the review workspace; editing seed files invalidates the run.

Save the original findings before consulting the oracle. A separate evaluator compares scenarios, locations, evidence and impact, not keywords. Link each confirmed finding to one or more expected defect IDs only when the reproduction and impact support the match. A risk still awaiting verification is not a confirmed detection. Treat a duplicate description of the same defect as one detected defect. Classify unsupported blockers (including personal architecture/style preferences on the control) as false positives. Do not automatically call a new, unmatched finding false: investigate and mark unresolved until adjudicated; update the oracle only with independent evidence and version the change.

Use [scoreDetection](score.mjs) with expected IDs, the original findings' IDs/confidence and separate evidence-based adjudications. Record per-case detected/missed IDs, false positives, unresolved and unadjudicated findings, plus elapsed time and scope. Attach the actual reviewed evidence and impact justification; booleans in a scoring input are attestations, not proof. Report the control separately (zero expected defects means recall is unavailable, not 100%). Preserve failed, interrupted and empty runs in denominators. Test calibration deliberately includes misses and a false positive to check accounting, not to claim model performance.

## Evidence and limits for 0.4.1

Fixture development and oracle-aware inspection establish five reproducible defects and the bounded control contract. Scorer calibration verifies that three misses and one false positive remain visible in a constructed input; duplicate matches cannot inflate detected counts. This is runtime/oracle verification, not a blind review campaign. A [single independent review run](observed-0.4.1/README.md) confirmed 4/5 expected defects with no observed false positive; the timeout case remained unverified. No improvement over 0.4.0/BMAD or general detection rate is established. Written review guidance, valid JSON, report redaction and report opening prove none of those claims.

Coverage is deliberately bounded: synthetic local functions with injected collaborators; no real providers, production telemetry settings, process-kill crash recovery, database isolation or complete contract migration matrix. Add relevant cases when actual changes expose those risks; do not require this entire suite for every small project edit.
