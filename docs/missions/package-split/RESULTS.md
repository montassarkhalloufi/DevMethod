# Package split verification — 2026-09-25

Decision: [ADR 029](../../ADR-029-independent-packages.md).
Scope and status: [mission plan](PLAN.md).

## Delivered behavior

- `devmethod-ai` contains method skills, templates, dependency-free CLI/review files
  and the small resources used by existing commands. No Studio code, compiler,
  UI, production/optional/peer dependency, or implicit installation is included.
- `devmethod-studio` owns the Studio distribution and runtime dependencies. Its
  independent `devmethod-studio` executable works without the method package.
- `devmethod studio` still works in the checkout and when both packages are explicitly
  installed together. Method-only installation explains the split and exits 2.
- Build prepares 509 canonical Studio resources; prepack checks file presence,
  content, version, dependency alignment, MIT notice and receipt freshness.
- CI now inspects and exercises both archives. Existing workspace formats and
  licensing are unchanged. Root GitHub method installation still uses committed JS.

## Executed verification

Environment: macOS arm64, Node.js 24.18.0, npm 11.16.0. Base revision and exact
archive measurements/digests: [archive evidence](evidence/archives.json). These are
working-tree candidates, including existing concurrent README/package-script work;
no assertion is made that they are published or identical to a clean release commit.

| Check | Observed result | Evidence |
| --- | --- | --- |
| `npm test` | 1,115 passed, 0 failed, 0 skipped; includes both archive boundaries and stale Studio rejection | [full output](evidence/tests.log) |
| `npm run lint` | Passed, including the final concurrent handbook edits | [output](evidence/lint.log) |
| `npm run format:check` | Passed | [output](evidence/format.log) |
| `npm run check:docs` | Passed | [output](evidence/docs.log) |
| `npm ci --ignore-scripts --offline` | Clean copied manifests installed 319 development packages in an isolated real-path directory with Node 24 | [output](evidence/clean-install.log) |
| Actual method archive | Installed offline with an empty cache; only `devmethod-ai` in node_modules; executable, three hosts, subset, review, update preservation, context, guard and evidence restart passed | [output](evidence/method-install.log) |
| Actual Studio archive | Independent install, executable, server/assets, ESM edit, syntax rejection, adoption, persisted draft/restart, export/restore and actual strict React compilation passed; explicit combined install forwards the old command | [output](evidence/studio-install.log) |
| Archive/source comparison | Every regular archive file matched its current canonical or generated payload after the final build | [digests](evidence/archives.json) |
| `git diff --check` | Passed | Checked before commit |

Method: **286,816 bytes compressed**, 943,751 unpacked, 224 entries.
Studio: **10,624,569 bytes compressed**, 25,143,247 unpacked, 511 entries.
Dependency downloads are additional for Studio; the method has none.

## Corrections and review

The initial regression failed because the old method manifest declared Studio
production dependencies. After the split, the method archive boundary passed.
The first unrestricted full suite found one packaging defect: prepack printed its
status on stdout and corrupted `npm pack --json`. Status now goes to stderr; the
focused package tests and final full suite passed. Earlier HTTP failures came from
sandbox denial of local listeners; rerunning with the required local permission
resolved them. No provider calls were performed.

The isolated npm-ci probe initially used /tmp with --prefix, which npm treated as a
linked root; running from the real /private/tmp directory with the explicit supported
Node 24 executable passed. An intermediate global lint failure belonged to concurrent
handbook work; after that work changed, the final global check passed.

Reviewed the package allowlists, runtime import/resource paths, explicit CLI forwarding,
MIT notices, dependency alignment, workflow commands, archive bytes and preserved user
changes. Removed package-smoke assertions for repository-only labs/docs; their source
checks remain in the repository suite/CI. Studio smoke coverage moved to its archive.

## Limits and handoff

No npm publication, push, provider access or commercial feature was performed.
Registry availability/ownership of `devmethod-studio`, maintainer review of the exact
release archives and remote Linux/Windows/macOS CI remain publication work. Native
coding-agent behavior and browser layout are not newly certified by these checks.
Edit canonical sources, run `npm run build`, create both archives, and verify their
bytes again if any shipped input changes. Generated Studio payloads are ignored by Git.
