# Product and operations decisions

## Test value before adding complexity

Identify the user, job to be done, current alternative, friction, and success signal. For an AI/comparison product, ask what it provides beyond a public prompt: authorized/fresh data, verifiable calculation, durable context, history, simulation, monitoring, or workflow execution. This does not require all those functions in an MVP.

Preserve validated exclusions, business criteria, and contracts. Do not turn “autonomous” into a “zero human operation” promise: describe exceptions, alerts, recovery, and expected operator time. Choose an architecture the current team can operate.

## Total cost

Compare at least fixed monthly costs and minimum thresholds; billed units (calls, tokens, images, jobs, storage, transfers); amplification (retries, fallback, refresh, polling); CI and development-agent usage; and operations, backup/restore, and provider dependency. Use verified pricing for a concrete economic decision. Separate assumptions from measurements. Define a budget and the action on breach: limit, defer, serve an authorized previous result, or fail explicitly. A cache is neither free nor always shareable.

## Technical choices

Keep the accepted stack until a demonstrated problem justifies change. In a new project, compare a simple solution and justified alternatives. Do not impose NestJS, Next.js, Cloudflare, GCP, PostgreSQL, D1, a monorepo, or microservices by inheritance.

Service splitting is justified by isolation, ownership, or deployment constraints, not by the number of business nouns. Formalize an observable scaling trigger, then defer what is not needed today.

## Sources of truth by question

Documentation describes intent; the ticket describes scope; the visual reference describes approved appearance; code and tests describe delivered behavior. Resolve divergence explicitly. A recent date alone does not turn a proposal into a canonical decision.
