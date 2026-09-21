# Public evidence derivatives

Source commit: `3fd13e84c59f5519b5a07aa077049a8a8e662df0`. Before editing, the four original files were preserved byte for byte in the private evaluation archive, with a separate hash manifest. Those private copies are not distributed.

The public derivatives replace only the recorded personal home-directory prefix with `/recorded-home`. This is an explicit placeholder, not an executable location. Every other byte—including diagnostics, assertions, outcomes, timestamps and reported results—is unchanged. No check was rerun and no historical result is upgraded by this transformation. Original hashes identify the retained source bytes; public hashes identify the distributed derivatives.

## prompts.json

File: [docs/missions/creation-experience/design/prompts.json](../../creation-experience/design/prompts.json). 5 prefix replacement(s).

- Original SHA-256: `0d4ba8088814588887e52ee073bacb7800575c4c4e36d9c171c7834395a65e14`
- Public derivative SHA-256: `2bc08ca870ebefd5db25c6390b36b6ebd5ba70d9e139ab2145d43ef068954614`

## test-first-failure.log

File: [docs/missions/creation-experience/evidence/react-studio/test-first-failure.log](../../creation-experience/evidence/react-studio/test-first-failure.log). 17 prefix replacement(s).

- Original SHA-256: `4750ded075b7f8e0645ddaa38e614f377a42637596dcd9b4f4b47085ee489d0a`
- Public derivative SHA-256: `6599990adbeb3cc8588ec8a6539dacabdc69fd2e83d4498d756fbe991f7f2f7a`

## handoff-review.md

File: [docs/missions/product-alternatives/evidence/continuity/handoff-review.md](../../product-alternatives/evidence/continuity/handoff-review.md). 1 prefix replacement(s).

- Original SHA-256: `d1ff842059f7b963c8df374815490d9359ef4e30bdc84f8d82e8b6cf05c35afb`
- Public derivative SHA-256: `1f1404732feb5c24f2ab155a41e38895b5da02a8aa3aea5e8fa189ff89cec711`

## results.json

File: [evaluation/evidence-restart/results.json](../../../../evaluation/evidence-restart/results.json). 12 prefix replacement(s).

- Original SHA-256: `6df928d20cf772a665f83da223c48e55ac02f9dd6a24a7a82f173662321d40c9`
- Public derivative SHA-256: `d7a3cbc151e7432fc791f8eaaed950bc97fb8b2017395187514fb4ba1c08169c`

The companion [React validation index](../../creation-experience/evidence/react-studio/validation.json) now identifies its distributed log with the public hash, retains `originalSha256`, and links to this note. No old hash is attributed to modified bytes.

## Portable Git fixtures

The three bundles in [the portable fixture manifest](../../../../evaluation/maintenance-fixtures/portable/portable-manifest.json) were inspected without executing their contents:

- `resume-filter.bundle`: one commit, `d175a2606ac06d6590541bedb76973ff579dbc6c`, 17 files; subject “Public maintenance baseline with anonymized evidence command”.
- `title-policy.bundle`: one commit, `ae3f2717f2941e424bdb4923648946985dc18a8e`, 16 files; subject “Neutral maintenance starting point”.
- `trim-boundary.bundle`: one commit, `1510059db22e80ff955aceb1909da1851a89d88e`, 15 files; same neutral-baseline subject.

Each commit is authored by `Fixture Author <fixture@example.invalid>`. Their trees contain the authored maintenance exercise, task, handoff and small application—not a retained production repository history. This matches the [fixture provenance](../../../../evaluation/maintenance-fixtures/provenance/derivation.json): resume is an explicitly anonymized public baseline; the other two bundles preserve their original fixture baselines. All three bundle hashes match the portable manifest. A bounded scan of their complete HEAD trees found no personal home paths or private-key/provider-token markers; this is not a general secret-detection guarantee. No bundle was modified and no native execution was performed.

## Lovable account label

Source commit: `9ecf22b79d9afa758eed8e0846646e6335d79d55`. A targeted visual review found a personal connection label in the historical Brevo empty-key screenshot. The original PNG and DOM observation file are retained byte for byte in the private evaluation archive. The screenshot is withheld from the public tree; no edited or generated image replaces it.

- Original PNG SHA-256: `a3dff28ad50e3b559d50df2054704b88f46f6d6e396872f6f676ca52d48fbc90` (110,673 bytes).
- Original DOM observations SHA-256: `fcdcc2a2173df531625b6773889590339b8b980709c1ee005c097da58671c427`.
- Public [DOM observations](../../creation-experience/evidence/lovable-connectors/guided-scenarios/observations.json) SHA-256: `608340e35cfb103239290f3b86fbb9f2c96f03a220c898ff360d01965c496665`.

The DOM derivative replaces exactly four occurrences of the same personal connection label with `[redacted connection name]`; every other byte is unchanged. The observed empty-key validation and its limits are preserved in the [scenario record](../../creation-experience/evidence/lovable-connectors/SCENARIOS.md). No new Lovable action or native DevMethod check was performed. Of the 122 images in the inspected diff, 11 were inspected visually based on provenance and risk; no other concrete disclosure was identified in that bounded review. This is not an exhaustive audit of every image or embedded metadata field.

The original screenshot was added after the public PR38 head and remains in the local working branch's history. Removing it from the current tree alone would not remove it from a push of that history. The dedicated review branch must therefore start from public `main` and carry the reviewed current tree as a new commit; the local working branch and existing published histories remain unchanged. A tree comparison must establish equivalence before that review branch is submitted.
