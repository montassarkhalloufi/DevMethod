# Numeric/temporal transfer case: shared equipment rental

Fictional construction fixture, authored after the discovery core was frozen at
`25809ad86e18865a0a4ed6a30b1e3fdf1670c4c6` (root cherry-pick `d3d94d8`).
Core SHA-256: `8b23e894b57013a943a6be2bd31c0bfe0da4d84e60e0e27b34daed14f64aa843`.
This domain and this brief are frozen before the first witness search. They are
not a validated market need, user study, independent unseen-domain generalization
result, or a comparison with an agent. The author knows both policies.

## Shared brief for an ordinary author and the machine adapter

A local equipment library considers two transparent ways to bill actual usage.
Each started 30-minute block costs 300 cents. Under `per-session`, each rental
session is rounded up independently. Under `daily-total`, actual rented minutes
are accumulated and only their total is rounded up. Neither is called better:
per-session can compensate setup between rentals; daily-total avoids charging
fragmented usage as though each fragment consumed a complete block.

The same equipment can be rented for 20, 40 or 60 minutes per action. A 20-minute
pause is also available; it advances the clock and costs nothing. Actions happen
sequentially within a two-hour window, cannot overlap and cannot cross its end.
There are no deposits, discounts, price caps, other customers, overnight use,
refunds or external payments. The day is not rolled over. Invoice observations
contain elapsed minutes, actual rented minutes, charged minutes and integer
cents; they deliberately omit policy labels. Comparison starts from zero usage.

Find a shortest legal sequence whose accumulated invoice differs between the
policies, show every intermediate invoice and explain the numerical difference.
A single rental is billed identically. Do not change rules to manufacture a
witness. An ordinary author receives this brief and `domain.mjs`, with ordinary
scripts/tests permitted; it does not need the discovery core or adapter.

## Ordinary executable domain

`initialRental()` returns fresh totals. `rentalActions(state)` returns currently
legal JSON actions `{kind: 'rent'|'pause', minutes}`. `executeRental(state, action)`
returns new totals, leaving its inputs unchanged, or rejects an unavailable
operation. `rentalInvoice(state, policy)` computes the actual numeric invoice.
`RENTAL` and `POLICIES` expose the declared constants. There is no server, UI,
provider, permission-role state machine or dependency on the search engine.
A browser can show action buttons, the elapsed window and both invoices using
these exports; previous steps can live in the UI's ordinary trace.

## Adapter and scope of its claim

`rentalMachine(policies = POLICIES)` wraps those ordinary domain functions.
Its state key keeps elapsed minutes, used minutes and independently rounded
session units. Those quantities determine all future actions and invoice values;
the individual rental history is unnecessary for these particular policies.
Passing `['daily-total', 'daily-total']` provides distinct comparison lane IDs
with identical policies, without changing the domain. The finite alphabet and
120-minute horizon make full exhaustion possible. A depth limit of one cannot
show a difference and must remain bounded while further actions are available.

The domain is genuinely numerical and temporal, but deliberately tiny and fully
specified. Transfer demonstrates adapter compatibility only. It cannot prove
that discovering the useful observables, writing the adapter, or understanding
a real customer's preference is automatic, cheap or improved. Charge calculations
can be checked independently with integer arithmetic; a good ordinary author is
allowed to find the same sequence directly.
