# Engineering policy

Read CONTRIBUTING.md and accepted architecture decisions before editing. Follow the requested scope. Do not introduce speculative infrastructure.

- Preserve inward backend dependencies: domain, application, adapters, infrastructure. Domain is pure and framework-free; wire dependencies explicitly at the composition root.
- Use strict TypeScript and validate untrusted input at boundaries. Keep functions cohesive, complexity bounded and identifiers explicit. Centralize meaningful business/configuration constants.
- Apply SOLID pragmatically through small consumer-owned ports and composition. Introduce patterns only for concrete variation or persistence needs.
- Organize React by feature. Keep network effects in API modules and query/mutation hooks. Effects synchronize external systems; do not store derived state or add blanket memoization.
- Use shared UI primitives, semantic tokens and localized product copy. Preserve keyboard access, focus, error announcements, reduced motion and narrow-screen usability.
- Document HTTP semantics, errors, limits and idempotency before adding retries or asynchronous operations. Never imply exactly-once execution without an explicit guarantee and scope.
- Treat model output and imported documents as untrusted. Validate structure and evidence separately. Preserve uncertainty, bound cost/time and report real evaluations separately from offline tests.
- Protect secrets and personal data. Use fictional fixtures and allowlisted telemetry. Document storage, deletion and retention limits.
- Run the project's documented quality commands. Never weaken tests or lint to claim success. Report checks not run and unresolved failures honestly.
- Update decisions when architecture changes, implementation status when behavior changes, and public contracts/tests together.
- Review diffs for secrets and unintended changes. Follow the project's approved publication and migration policy.

Before adopting this template, define the project-specific stack, commands, scope, deployment permissions and data handling requirements. Skills are optional procedures; they do not replace policy, decisions, tests or review.
