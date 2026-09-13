# Independent review findings

Reviewed only the supplied case files under `/private/tmp/devmethod-041-detection-run`, following TASK.md and the installed devmethod-review, project-foundation routing/stage contract, scoped-delivery and review-workflow references. Node runtime: v23.10.0. No case files changed. No external calls, browser opening, fixes, or other workflow stages executed. PROJECT_PROFILE.md is an unfilled template and adds no accepted requirements. No manifest, lockfile, CONTRIBUTING.md or AGENTS.md was found in the bounded discovery.

## Confirmed defects

### DET-A-001 — Credential and personal data escape through the failure detail

- Case/location: case-a, `case-a/sensitive.mjs:5-8` (construction at line 5; sinks at lines 6–8).
- Classification: confirmed defect; severity P1 (credential exposure); confidence high; status open.
- Trigger: provider rejects after receiving a token, including a rejection whose message contains credential material.
- Expected/observed: failure reporting should avoid propagating raw credentials and unnecessary personal data. Instead, the raw token, email, and unrestricted provider message are copied into log, telemetry and returned response body.
- Evidence: `review-probes.mjs` invokes the real function with synthetic sentinel credentials and an independently marked provider error. `probe-results.json:a` records tokenExposed, emailExposed and providerMessageSecretExposed as true for every sink. These booleans are computed against original captured application output before any report sanitization.
- Concrete impact: any consumer of logs, telemetry or the error response receives the original credential. Provider messages can add further sensitive content, so removing only the explicit token field would leave another exposure path. Actual recipients/retention are not supplied.
- Proposed correction: construct an allowlisted public error response and separately sanitized diagnostic event; omit token and unnecessary email, and redact or replace untrusted provider messages before sinks. Preserve a safe correlation/error code for diagnosis. Trade-off: less raw diagnostic detail requires deliberate safe diagnostics.
- Resolution verification: repeat the three-sink sentinel check, covering explicit fields and provider messages; all exposure flags should be false while failure reporting remains usable.

### DET-B-001 — Simultaneous submissions pass the same deduplication check

- Case/location: case-b, `case-b/submission.mjs:2-5`, especially the awaited charge at line 3 before reservation.
- Classification: confirmed defect; severity P1 (duplicate charge invocation); confidence high; status open.
- Trigger: two calls submit the same absent key before either awaited charge completes.
- Expected/observed: the same-key state check implies duplicate submissions should reuse one result. Both calls observe absence and independently invoke charge and notify; only their final receipts are written to one map slot.
- Evidence: a deferred Promise in `review-probes.mjs` deliberately holds the first charge, starts a second submit with the same key, then releases both. `probe-results.json:bConcurrent` shows 2 charges, 2 notices, distinct sequence receipts, and stateSize 1.
- Concrete impact: the function dispatches duplicate charge requests and notifications while its state retains only one receipt. Actual duplicate billing depends on whether an unseen provider independently deduplicates the supplied key.
- Proposed correction: atomically reserve/share the pending same-key operation before charge. For multiple processes use a durable uniqueness/reservation mechanism, plus provider idempotency with the same operation identity. Define failure recovery so an ambiguous effect is not blindly reissued. Trade-off: reservation lifetime and recovery require explicit handling.
- Resolution verification: repeat the controlled interleaving and assert exactly one charge and consistent returned receipt for both callers.

### DET-B-002 — Notification failure discards knowledge of an already successful charge

- Case/location: case-b, `case-b/submission.mjs:4-5`.
- Classification: confirmed defect; severity P1 (unsafe retry after partial success); confidence high; status open.
- Trigger: charge succeeds but notify rejects, followed by retry using the same key and state.
- Expected/observed: the successful financial effect should remain recorded so retry can recover notification without recharging. Because state is updated only after notify, the first call rejects with no saved receipt and the retry invokes charge again.
- Evidence: `probe-results.json:bRetry` reports sizeAfterFailure 0 and charges 2 after an injected notification exception and one retry.
- Concrete impact: an ordinary notification outage causes duplicate charge requests and loses the recovery reference to the first successful receipt. Actual duplicate billing remains conditional on provider behavior, but the missing local record and repeated invocation are reproduced.
- Proposed correction: durably record charged status/receipt at the successful charge boundary, track notification status independently and retry that step. Combine with DET-B-001's reservation and provider reconciliation for charge timeouts. Simply caching before notify must not silently suppress the outstanding notification forever. Trade-off: additional state/status handling.
- Resolution verification: inject notify failure after a successful charge; retry should preserve the first receipt, charge exactly once, and finish notification recovery.

### DET-C-001 — Response rename breaks the existing consumer and persisted order shape

- Case/location: case-c, changed `case-c/compatibility.mjs:2`; existing context `case-c/consumer.mjs:1-2`.
- Classification: confirmed compatibility defect; severity P1 (existing monetary calculation unavailable); confidence high; status open.
- Trigger: pass existingOrder through orderResponse then invoiceTotal; also reproduced with a new totalCents-shaped order.
- Expected/observed: existing consumer expects amountCents and the supplied existing record stores amountCents. The changed response reads and exposes only totalCents. Existing records lose the amount entirely (undefined; omitted by JSON serialization), and the consumer returns NaN for both old and new response shapes.
- Evidence: `probe-results.json:c` shows baselineTotal 12.5 for the unchanged consumer and fixture; oldResponse contains only id when serialized; newResponse contains totalCents 1250; oldConsumerNaN and newConsumerNaN are both true.
- Concrete impact: existing invoice totals become NaN rather than 12.50, and serialized responses for stored records no longer carry the monetary value. Only compatibility.mjs is proposed change, so a presumed coordinated consumer/data migration cannot justify the break.
- Proposed correction: preserve amountCents for existing consumers and read existing stored amountCents (optionally add totalCents and a carefully defined fallback if new records must be supported). Alternatively perform an explicitly coordinated/versioned migration of data and consumers, outside the supplied change. Trade-off: a compatibility alias temporarily maintains two names.
- Resolution verification: test unchanged invoiceTotal(orderResponse(existingOrder)) equals 12.5; include new-format records only if that additional format is an accepted requirement.

## Case-d: no confirmed defect

`case-d/control.mjs:1` expressly requires trimming strings and rejecting non-strings, with no layering mandate. Lines 2–4 satisfy that contract. Executed checks cover surrounding whitespace, whitespace-only input, already trimmed text and eight non-string values (including a boxed String); all passed. An extra architectural layer or rejecting an empty trimmed result would introduce a preference/new requirement, not correct an observed defect.

## Risks and limits, separate from confirmed defects

- Case-a: nested SDK error fields other than message are not serialized by this supplied function and are not a separate demonstrated leak. Real provider errors, actual sink redaction, access controls and retention were not available. Verify integration sinks and representative safe synthetic SDK errors to assess the full deployed exposure; no claim of actual credential compromise is made.
- Case-b: provider-side idempotency, cross-process state consistency, restart durability, and charge-success-then-timeout ambiguity are unknown. The supplied key is passed to charge and might enable downstream deduplication, but no such implementation is supplied. Verify with an idempotency-aware provider stub/integration and fault injection before asserting actual duplicate billing. Notification retries might also duplicate delivered notifications if failure occurs after delivery; not exercised here.
- Case-c: no migration policy or alternative consumer exists in the supplied scope. Findings rely on the explicitly supplied existing consumer/record, not inferred external clients.
- Case-d: no length, emptiness, Unicode normalization or layering requirements are given; none are imposed.
- No external documentation consulted because the assignment forbids external calls. These conclusions rely on small local ECMAScript modules and executed behavior, not version-dependent third-party APIs. No UI exists in scope. No repository suite or CI gate is provided. This is bounded evidence, not production verification.

## Executed checks

1. Read TASK.md, all five source modules with numbered lines, relevant installed review references, and local profile; bounded file discovery for rules/manifests/lockfiles. Manual source inspection covers every supplied case source line and the case-c interaction.
2. Read runtime with `node --version`: v23.10.0.
3. Ran `node review-probes.mjs > probe-results.json`: exit 0. Assertions confirm reproduced defects, so exit 0 means the reproductions behaved as documented, not that case-a/b/c passed correctness checks.
4. Case-a: three captured failure sinks, direct credential/email and provider-message sentinel checks; confirmed exposure in all sinks.
5. Case-b: deterministic simultaneous same-key submission and a separate successful-charge/failed-notification/retry sequence; both demonstrate repeated charge calls.
6. Case-c: unchanged consumer baseline and old/new stored-shape response paths; baseline 12.5, both transformed paths NaN.
7. Case-d: 3 string examples and 8 non-string rejection checks passed.

Artifacts: `review-probes.mjs` (synthetic executable reproduction), `probe-results.json` (captured results), and this requested `raw-findings.md`. No report UI was generated/opened. All four cases were evaluated independently; no external answer material was inspected.

Recommended next command (not executed): `devmethod-implement` for the confirmed corrections, after authorizing that scope.
