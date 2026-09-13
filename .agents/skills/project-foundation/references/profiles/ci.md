# GitHub Actions and GitLab CI profile

Apply to CI configuration changes. Inspect provider, runner OS/image, workflow includes/reusable workflows, action references, lockfile, toolchain setup, protected environments, concurrency, cache keys and token permissions. Preserve existing required checks and release boundaries. Pin reusable code to reviewed immutable revisions where project policy supports it.

Treat pull-request content as untrusted input. Keep it out of interpolated shell code and privileged publish jobs. Scope job permissions and secrets; separate validation from publication. Define cancellation behavior and unique artifact names for concurrent runs. Caches are performance aids, not trusted build outputs or proof a check executed.

Check checkout/build inputs, generated-file drift, clean install, test exit propagation, artifact provenance and approval rules. Run the repository's local commands first. For GitHub, validate the actual workflow run, commit and each matrix job conclusion. For GitLab, use its CI Lint with resolved includes under the appropriate project context and retain the pipeline/job IDs after execution.

This profile adds no provider workflow and has no GitLab native execution evidence: status **not run**. Existing DevMethod CI has separate evidence; merely reading workflow YAML does not validate a host or OS. Local fullstack checks are documented separately and are not coding-agent behavior evaluations.

Sources consulted 2026-09-13: [GitHub secure workflow use](https://docs.github.com/en/actions/reference/security/secure-use), [GitLab CI YAML reference](https://docs.gitlab.com/ci/yaml/). Recheck the project's provider version and included templates before adopting new syntax.
