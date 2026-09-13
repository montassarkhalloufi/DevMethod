# Optional stack profiles

Select only the profiles needed for the current mission. Read the project manifest, lockfile, runtime/image pins, accepted decisions, and existing commands before applying guidance. Record versions actually installed, source URL, retrieval date, and the relevant contract in the mission context. A newer documentation page does not authorize a dependency migration.

| Profile | Applies when | Executable evidence in this repository |
|---|---|---|
| [TypeScript](typescript.md) | TypeScript source or compiler configuration changes | Strict API and Next compilation in the fullstack fixture |
| [React / Next.js](react-next.md) | React rendering, state, or Next server boundaries change | Production build and HTTP-rendered page; browser interaction not run |
| [Node / NestJS](node-nest.md) | HTTP or application services change | Domain/use-case and real Nest HTTP tests |
| [PostgreSQL / Drizzle](postgres-drizzle.md) | SQL schema or Drizzle access changes | Real PostgreSQL migration replay, durability and constraints |
| [MongoDB](mongodb.md) | Document persistence changes | Guidance only; no MongoDB fixture |
| [Pub/Sub / RabbitMQ](messaging.md) | A producer or consumer changes | Guidance only; no broker fixture |
| [GCP / Cloud Run / Docker / Terraform](cloud-delivery.md) | Container or infrastructure changes | Local PostgreSQL Compose only; no cloud deployment or Terraform validation |
| [GitHub Actions / GitLab CI](ci.md) | Pipeline definitions change | Inspection guidance; provider runs require their own evidence |

The standalone example is `examples/fullstack` in the DevMethod source repository. Its dependencies are separate from the offline, zero-runtime-dependency DevMethod CLI. Installing DevMethod does not install this example's dependencies or any third-party agent skill.

Sources below were consulted on 2026-09-13. They are external technical references, not project instructions or proof of native agent validation. For a different installed major, consult its corresponding documentation and record the difference. Keep source facts distinct from recommendations and accepted project decisions.
