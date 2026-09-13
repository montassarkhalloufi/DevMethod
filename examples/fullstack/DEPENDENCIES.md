# Fixture dependency security decision

On 2026-09-13, `npm audit --json` reported three high-severity dependency entries: `multer`, `@nestjs/platform-express`, and `@nestjs/core`. The Nest entries propagated the vulnerable transitive multer dependency; they were not three independent application flaws. Nest platform-express 12.0.1 pins multer 2.2.0 in its published npm metadata.

The following maintainer advisories identify multer 2.3.0 as the patched release:

- [Crafted multipart field names](https://github.com/expressjs/multer/security/advisories/GHSA-wc9g-mqfw-jrwm).
- [File descriptor leak on aborted uploads](https://github.com/expressjs/multer/security/advisories/GHSA-qfvm-cv95-jqjf).
- [Async fileFilter size-limit bypass](https://github.com/expressjs/multer/security/advisories/GHSA-qvfw-j98x-7q72).
- [Oversized array indices in field names](https://github.com/expressjs/multer/security/advisories/GHSA-535w-7cp7-47q4).

Sources were consulted on 2026-09-13, together with `npm view @nestjs/platform-express@12.0.1 dependencies --json` and `npm view multer@2.3.0 engines version --json`. The published patched package supports this fixture's runtime range.

Applicability assessment: the fixture installs the adapter but configures no Multer middleware or Nest file-upload interceptor. Its task controller expects JSON; the HTTP suite checks that a multipart request is rejected before persistence. The current routes therefore do not activate the affected upload parser, based on source inspection and this boundary check. This is not a claim that the original dependency was safe for an application adding uploads.

The fixture applies a narrow npm override from `@nestjs/platform-express` to `multer: 2.3.0`, preserving the Nest/React/Next major versions. The lockfile records the patched resolution. Do not use an automatic forced framework downgrade suggested by audit. Remove the override when the deliberately selected Nest adapter version natively resolves a patched compatible multer; then regenerate the lockfile and rerun the relevant checks.

Validation for this change: a clean lockfile install, npm audit, domain/HTTP/web-model tests and the production Next/Nest/PostgreSQL end-to-end suite. Their actual results belong to the commit review and mission evidence. This fixture has no upload feature, so it does not claim validation of file upload behavior or a complete security audit. Audit results are time-bound and do not prove absence of all vulnerabilities.
