# Public maintenance fixtures: a derived protocol artifact

This package supports local review and reproduction of three maintenance fixtures, independent checks and authored solution witnesses. It contains no native A/B outcome and no agent-authored regression result. The coordinator stopped readiness before JSONL output (exit 1 / EPERM); no A/B or correction candidate was admitted after that stop. That host observation belongs to the parent run record, not the deterministic fixture calibrations here.

The archive avoids committing hundreds of duplicated witness files. `suite-public.tar.gz` contains the public workers, 18 references (3 healthy and 15 mutations), evaluator and historical protocol files. It omits every `.git` directory and the reserved transfer contents. Do not expose controls/evaluator to a future worker. No further native call is authorized by this package.

## Integrity and privacy

The original V3 full freeze digest is `e206b6ee525c23a0c3bf4960cedbbe2e69a1bb3178d414de76552aa5038ac604`. `provenance/original-v3-FREEZE.json` preserves that complete original record, including hashes for withheld transfer files; its file digest is reproducible, but its full listed population is **not** reconstructible or verifiable from this export. Original V1/V2 full freeze records are retained similarly. No transfer contents are distributed.

The public subset has its own `FREEZE.json`, digest and outer `EXPORT.json` inventory. It is an explicit derivation, not a claim of original full-population integrity. Two public files differ: the resume baseline observation's `argv[0]` is replaced with `<NODE_24_EXECUTABLE>`; its initial-state HEAD/base-tree fields consequently refer to a fresh public baseline commit. All other distributed suite payload files are byte-identical to the original public files. The resume initial diff/status are byte-identical, so partial contributor work and the separate user CSS edit retain their attribution. No assertions, expected values, product inputs, task text, source/checker pins or observed outcomes changed. `provenance/derivation.json` records original/public digests and Git identities.

Historical root README/PROTOCOL/CORRECTION files inside the archive are retained evidence and describe private authoring, including full freeze and original setup semantics. This public README overrides those distribution/adoption claims: use the companion, the public inventory and the explicit omissions here. The supplied domain log remains an actual historical author observation with an anonymized executable path, not a newly run result.

`evidence/` keeps V1, V2, V3 and adoption observations with host paths normalized. Original byte digests are recorded separately; these are derived readable logs, not falsely labeled original raw bytes. New public reproduction logs are labeled independently. Timing is measured once in the recorded environment and is not a speed or user-benefit estimate.

## Reproduce locally

Requires Node 24.18.0, Git and tar; no package installation, network, server or model is needed. Run from this package directory, using a new scratch directory outside the package:

```sh
node scripts/verify.mjs
mkdir /absolute/scratch-suite
tar -xzf suite-public.tar.gz -C /absolute/scratch-suite
node scripts/verify.mjs /absolute/scratch-suite
node portable/test-adoption.mjs /absolute/scratch-suite /absolute/new-adoption.json
node scripts/reproduce.mjs /absolute/scratch-suite /absolute/new-v3-results.json v3
node scripts/reproduce.mjs /absolute/scratch-suite /absolute/new-v2-results.json v2
node --check history/v1-verify-freeze.mjs
```

The last command is expected to exit 1 with `SyntaxError: Unexpected end of input`; V1's verifier lacked a closing brace. V1 performed no behavioral calibration. `reproduce.mjs` invokes 21 fixed cells per version, compares each status/verdict map with its historical public counterpart, preserves every failure and writes fresh stdout/stderr/exits/durations. V2 reproduces 18 classified cells and three interruptions where valid titles raised TaskError. V3's only assertion-reporting repair wraps valid title calls with doesNotThrow; all 21 cells then match expected healthy/fault behavior. A starting fixture or mutation failing is an expected check outcome, not failure of this reproduction. Each reproduction uses 21 outer evaluators and 30 separate store-probe processes, bounded to 10 seconds / 256 KiB per outer evaluator. These 42 calls are deterministic Node subprocesses, not native model calls.

For one criterion run, use `node /absolute/scratch-suite/evaluator/evaluate.mjs CASE /absolute/candidate`. Exit 0 means only automatic checks passed, 1 is an observed assertion failure, 2 is technical/unclassified. Manual attribution, truthful handoff, evidence reuse and proportionality remain separate. VM UI probes do not establish browser appearance/accessibility. These authored references calibrate the evaluator; they do not establish agent-test sensitivity or method effectiveness.

For a clean trial input, use `node portable/setup.mjs /absolute/scratch-suite CASE /absolute/new-worker`. Exact public HEAD/index/diff/status are verified. The coordinator must separately pin the companion and runtime, apply budgets, verify evaluator/sibling read isolation, and obtain applicable admission. The package itself grants none.

Parent export review found an incomplete temporary-path normalization in two nested stdout logs: the `/var/folders` alias escaped the initial scan. The original `export-validation.json` absence claim is retained as a mistaken historical check. `evidence/export-review-correction.json` records the correction and before/after public digests; private originals, archive, bundles and case verdicts are unchanged. Local reproduction/adoption is verified on macOS with Node 24.18.0; no Windows portability claim follows.
