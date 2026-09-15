# Short-intent behavioral evaluation

Use independent fresh agent sessions to check short requests against the installed method. This is an evaluation corpus, not an autonomous dispatcher or a completed cross-host benchmark. The requests are in [requests.json](requests.json).

## Conditions

Pin the method revision and file hashes, host/model where exposed, tools, permissions, input files and user request before each run. Start each scored attempt without conversation history and in a separate directory. A shared filesystem is not a security sandbox. Keep expected answers and previous findings out of worker prompts. Authorize and record the campaign scope before running it.

For comparisons, preserve the same request, available tools, starting files and installation route in each arm. Separate copied-skill smoke exercises from actual `init` installations: source skill folders alone do not include every installed runtime resource. Record environment assistance and coach-assisted corrections separately; do not overwrite the original outcome with a corrected retry. Tokens and cost are unavailable unless the host actually reports them.

## Observable outcomes

| Request | Independent acceptance |
| --- | --- |
| Menu/stock framing | Keeps automatic menu and shopping value; defines recalculation effects on confirmed state or explicitly leaves a decision open before implementation |
| Local AI workshop framing | Preserves the requested AI change loop; distinguishes local interface from network effects and future requirements from demonstrated protections |
| Book CLI delivery | Actual add/list/read-state journey persists across processes; input and storage failures do not fabricate success |
| Browser tasks delivery | Actual add/complete/filter/reload and keyboard behavior; DOM doubles or syntax checks alone cannot establish browser acceptance |
| Seeded review | Use the existing [review detection inputs and oracle](../review-detection/README.md); keep the oracle outside the worker workspace |
| Stale-checkpoint resumption | Change an accepted contract and its immutable acceptance test after a prior success; require the real current state to govern delivery |
| Delegated master/derived design | Produces the requested artifact set under the delegated choice, preserves scope and labels unperformed visual checks |
| Inventory CLI | Correct missing-quantity CSV output, quoted fields and unchanged input |
| Verify only | Reports an injected failing check and preserves application/test bytes instead of silently fixing them |
| Booking API | Real HTTP create/list/cancel, rejected overlaps, concurrent requests and persisted state after restart |
| Installed review report | With actual `init` resources, generates a report from real findings rather than sample data; opening and generation are distinct |
| Packing-list framing | Defines how duration changes affect already packed items, or records the unresolved behavior before implementation |
| Booking API review and repair | Demonstrates defects before correction; preserves booking rules and stored data; checks relevant raw HTTP responses |
| Notes API delivery | Real create/list/get/delete, persisted state after process restart, input rejection and accurately scoped HTTP claims |

For documentation, compare usage instructions with the actual tested runtime. A declared or inferred minimum version is not evidence of execution on that version. For completed code, reviewers should rerun the documented commands and inspect the implementation, not score only headings or the number of tests.

## Evidence and reporting

Retain the input, original output, artifact hashes, observed failures, independent checks, interventions and limits for every attempt. Agent-authored RESULT.md summaries are not a complete exported tool transcript and do not independently prove stage chronology. A model run, a deterministic fixture test, a static document check and a browser interaction are different kinds of evidence.

Host observations and raw transcripts remain private until publication is explicitly authorized, under [the repository evaluation policy](../../docs/EVALUATION.md). Do not publish broad reliability, perfection, productivity or comparative superiority claims from a few successful cases. A blocked browser or provider remains blocked in the outcome denominator; it is not a pass or a reason to bypass environment controls.

Use a narrow correction for an observed failure or conflicting instruction, then repeat affected cases in fresh sessions and add an unseen case. Stop the round at scoped acceptance with no unresolved material regression, or a concrete blocker; do not consume runs merely to reach an arbitrary count.
