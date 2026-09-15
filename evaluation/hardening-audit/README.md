# Deterministic follow-up audit probes

These are bounded, fictional, offline observations from 2026-09-15. They are separate from the native behavioral campaign. They do not invoke a model, mutate the original deliberately defective review fixture, or certify general agent reliability.

## Partial-observation experiment

`loop-probe.mjs` was frozen before correction (SHA-256 `d4952425809602d756cceeac42082a4dc0fba5b8e73459f821e7cb73ea6ff3cb`). From the source checkout:

```sh
node evaluation/hardening-audit/loop-probe.mjs
```

It enumerates every length-1–3 history over `[null, 0, 199, 200, 201]`, with threshold 200. An independent BigInt lower-bound oracle counts omitted diagnostics. The script reports observations; exit 0 alone is not an acceptance verdict.

| Observation | Baseline | Corrected |
|---|---:|---:|
| Traces | 155 | 155 |
| Traces containing unknown tokens | 71 | 71 |
| Traces missing a known final threshold | 49 | 0 |
| Traces missing a known post-limit attempt | 20 | 0 |
| Unknown histories incorrectly eligible | 0 | 0 |

Baseline: remote commit `8c23c0e921c12ebfade2ab7efe6a8e9734dc7309`, [output](loop-baseline.json), SHA-256 `bf870265f78276e2f89ae08ffc7bedffdf86fbac14ec8c5973f158eaa20a5532`.

Independent corrected replay: local correction commit `394f82338759f7bf9e19a867c9223282ade8e49e`, [output](loop-corrected.json), SHA-256 `2a5e3f8d2c2494400a1fa61d532af67e30180a9b44c051d8e769782f2a251fbd`. Reviewed source `src/loop.ts` SHA-256 `fed81f40f0f718b4134b9b8731fe2fd60be56894a7e9afaf5a4e1c4ce33938f4`, generated `dist/loop.js` SHA-256 `177a60e1a7bf79ee592dc6d3a59d0d9494ceaf294475fa49a9b00db9198bfcbb`. Source hashes identify these bytes even if sequential integration uses a different commit.

The missing-diagnostic categories overlap. The baseline already refused eligibility for unknown usage; the correction retains known facts without pretending the exact total is known. This finite test does not establish general temporal-logic model checking or runtime enforcement. See [scientific hypotheses, sources and limitations](../../docs/HARDENING-0.5-SCIENCE.md).

## Semantic evidence boundary

```sh
node evaluation/hardening-audit/semantic-probe.mjs
```

Fixed contract: a 20% increase on 100 returns 120. Two fictional implementations (seeded defect and healthy control) receive the same weak type assertion and a separate exact contract assertion. Each weak check actually runs, and all declared source/evidence hashes and revisions are honest. Expected observations were fixed before execution: both weak checks pass; only the defective implementation fails the contract oracle; `closure` returns `supported` for both records.

[Actual result](semantic-result.json) preserves those observations. The probe exits nonzero if an expected boundary changes. This supports a precise limit: structural coverage cannot certify assertion relevance. It is not a learned reviewer evaluation, general mutation score, recommendation to run mutation testing on every edit, or claim that all healthy code is accepted.

## Independent code reviews

[Controls/adapter compatibility review](review-controls.md) and [evaluation/oracle review](review-evaluation.md) identify inspected commits and file hashes, executed probes, findings resolved before integration and remaining limitations. The [evaluation differential output](review-evaluation-probe.json) contains constructed inputs, not native trials. The loop review is in the linked scientific record. Root documentation/integration and exact-candidate maintainer review remain separate scopes.
