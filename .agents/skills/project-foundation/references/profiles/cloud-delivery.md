# GCP, Cloud Run, Docker and Terraform profile

Apply only to an authorized container/infrastructure change. Inspect Dockerfile stages, base image digest, runtime architecture, Cloud Run service configuration, Terraform CLI/provider constraints and lockfile, state backend, environment ownership and existing deployment workflow. Keep region, identity, network, resource and state conventions unless an accepted decision changes them.

For Cloud Run, verify the ingress container's port and interface contract, startup/shutdown, concurrency, ephemeral filesystem and request lifetime. Do not deploy the localhost-only fullstack fixture directly: its network, auth and operational contracts are intentionally incomplete. Review least-privilege service identity and secret delivery without copying credentials into context.

Pin container provenance; use a small runtime stage and preserve required assets. For Terraform, review planned replacements/destruction, unknown values, state locking and drift. A successful plan is neither approval nor an applied deployment. Plans/state can contain secrets; do not add them to generated context or Git.

Conditional project checks: `docker build` for the existing Dockerfile; `terraform fmt -check`, `terraform init -backend=false`, and `terraform validate` with approved locked providers; a reviewed `terraform plan` only in the correct state/identity context. Initialization can download providers and plans can call remote APIs. Never imply these checks are universally offline.

Evidence here: the fullstack example executes a digest-pinned local PostgreSQL Compose service. There is no application Docker image, Terraform fixture, GCP plan, Cloud Run deployment or provider validation: status **not run** for those capabilities.

Sources consulted 2026-09-13: [Cloud Run container contract](https://docs.cloud.google.com/run/docs/container-contract), [Docker build practices](https://docs.docker.com/build/building/best-practices/), [Terraform plan](https://developer.hashicorp.com/terraform/cli/commands/plan).
