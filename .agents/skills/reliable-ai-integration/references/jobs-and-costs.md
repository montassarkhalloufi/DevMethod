# Jobs, providers, rights, and costs

## Contract per capability

Describe inputs, validated output, configuration, consent, data policy, timeout, errors, cost, idempotency, and means of follow-up. Preserve accepted providers. Do not change model/version from memory.

## Admission and atomicity

Verify server-side identity/capability, access, consent, and quota before billable work. Reserve quota atomically with job creation or through an explicit compensation protocol. The browser, `success_url`, and `localStorage` are not purchase proof.

For an actual payment integration, use the relevant provider docs/skills and version; this document defines the boundary, not an SDK recipe. Distinguish payment, entitlement, and quota.

## Lifecycle

Define authorized transitions and their atomicity: queued, running, succeeded, failed, cancelled, and required intermediate states. Persist the provider identifier to resume without double billing after an ambiguous timeout.

A local timeout does not prove provider cancellation. Before retry, reconcile state when possible. Acknowledge events after the intended durability point; deduplicate webhooks and validate authenticity. Polling needs cadence, cap, and stop.

Fallback is only for admitted technical errors. Invalid input, security refusal, or missing consent/access do not trigger a provider workaround.

## Quota and cost

Separate reservation, consumption, and restoration. Address double submission, duplicate callback, late success after cancellation, crash between billing and persistence, possible refund, and reservation expiry. Restoration rules come from the product contract.

Measure cost per usable result, not only per call. Count retries/fallback, storage, and transfer. Respect budgets per action/user and globally. No infinite retry or unbounded autonomous search.

## Verification and operations

Meaningful tests include last-unit quota concurrency, duplicate delivery, late success, non-retryable error, provider unavailability, invalid schema, deletion, and forbidden cross-access. Add authorized live trials for real capability. Plan proportionate metrics, alerts, targeted disabling, and recovery runbook.
