# Compare API candidates before implementation

Use when a new or redesigned API has a consequential unresolved choice: who owns state,
where validation happens, how cancellation travels, or what callers must know. Skip this
exercise when the user has chosen the signature or the existing contract determines the
fix. Two names for the same signature are not meaningfully different candidates.

## Define the comparison once

Create a common caller brief from the task and actual repository: current callers,
compatibility limits, representative operations and expected failure behavior. Include a
small fixed set of calls covering the common case, an invalid combination and an extension
or lifecycle case that matters. Candidates must solve the same problem under the same
support policy. Do not make one appear cheaper by omitting required behavior.

For example, a background export facility may accept each request through stateless
functions or allocate an owned session with explicit close/cancel. The important difference
is resource ownership and how partial failure is handled, not whether a method is named
start or create. Include both the short-lived caller and an interrupted export in the
comparison. This example is a decision aid, not a required architecture.

## Fit exploration into the existing graph

The parent authors this optional prefix inside the request's one graph:

`candidate-a + candidate-b → choose → change → review`

The candidates use the verification worker in investigation mode with different design
hypotheses and identical caller requirements. They may write isolated prototype/type-test
files, but may not change production source. Give each a separate scratch directory.
Use synthesis mode with `join: {strategy: "all"}` for choose. The synthesis brief sets
design-stage criteria explicitly; it must not certify code that has not been implemented.
Only after selection does the change-applier write the production implementation.

The implementation/review back-edge remains bounded around change and review. Ordinary
repair does not regenerate the candidates. If evidence disproves a selected design's
premise, escalate the decision back to the parent instead of repeatedly repairing the
implementation or silently changing the selected contract. No nested graphs or alternate
dispatch mechanisms are needed. The graph patterns include an api-design example.

## What a candidate must show

Provide its public signature, the common caller examples, invalid-call behavior and the
runtime obligations behind the types. Identify ownership of data/resources, side effects,
validation and errors. Explain which existing callers need an adapter or migration and
what remains unknown. Compile the prototype when type precision is part of the choice;
record unexecuted examples as proposals rather than evidence.

## Select by observable tradeoffs

| Criterion | Concrete question |
|---|---|
| Caller effort | What must the ordinary caller supply, store, await and clean up? |
| Invalid states | Which illegal combinations are rejected, and which require runtime checks? |
| Change cost | Which callers, mocks, adapters and published types must move? |
| Implementation obligations | What state, lifetime or failure mode does the signature commit us to? |
| Diagnostic quality | Does a rejected call identify the caller's mistake? |
| Future requirement | Can the likely extension fit without exposing today's internals? |

Eliminate candidates that violate hard requirements first. Explain the decisive tradeoff
using the shared calls; avoid invented numeric scores or preference voting. The selection
report includes the chosen signature, accepted costs, rejected alternatives and checks the
implementation must pass. Existing authorization covers ordinary engineering choices.
Ask the user only when a remaining choice changes product semantics or compatibility in a
way the task does not resolve.
