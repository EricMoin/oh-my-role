# Inter-agent contracts (schema_version: 1)

Role-authored outcome data is a JSON object with `schema_version: 1`. Check the
version, required fields, identities and status/outcome consistency before using
it. These are role contracts, not an installed engine JSON Schema validator.
The engine validates declared outcome identity; the lead and consuming worker
validate the content. Reject unknown contract versions and incompatible payloads.

## Engineering brief (prompt-embedded contract)

A brief is review context, not graph outcome data. Every review request identifies
its goal, scope, snapshot, concrete question, read-only boundaries and available
verification. Include additional facts only when relevant; leave unknowns explicit.
A source investigation may precede implementation and must identify that limit.

| Field | Content |
| --- | --- |
| goal | Concrete intended behavior and the decision the reviewer can improve |
| user_visible_behavior | What the user or downstream caller observes |
| scope | Affected files, crate/module/items and relevant callers |
| out_of_scope | Boundaries needed to prevent unrelated changes |
| snapshot | Revision plus local diff/artifact identity; include dirty and new files, not HEAD alone |
| invariants | Properties that must remain true on success, failure, cancellation and teardown as applicable |
| ownership | Data/resource owners, lifetime and transfer/release boundaries |
| design_decisions | Chosen approach, meaningful alternatives and compatibility costs |
| risk_domains | Relevant entries from `unsafe-ffi`, `async-concurrency`, `public-api`, `performance-hotpath`, `cross-platform`; explain their connection to this change |
| cargo_workspace | Root, affected members and consumer packages |
| edition / msrv | Actual per-crate configuration and supported toolchain; unknown is valid |
| async_runtime | Actual runtime and resolved version, or none/unknown |
| unsafe_surface | Changed unsafe operations/wrappers, invariants, FFI ownership and ABI obligations |
| concurrency_model | Task owner, synchronization, cancellation, backpressure and shutdown |
| public_api_changes | Affected consumer contracts and compatibility analysis |
| performance_context | Workload, measured baseline if available, cost mechanism and target metric |
| cross_platform_context | Affected targets, feature sets, native dependencies, build scripts and CI support |
| dependencies_affected | Resolved versions, relevant features and proposed dependency changes |
| verification_plan | Proposed commands, scenarios and properties, with environment needs |
| verification_results | Actual checks and outcomes, plus missing checks and reasons |
| open_questions | Unresolved facts or decisions and who/what can resolve them |

The dispatch adds the exact reviewed object, accessible source/artifact paths,
prior issue ids where applicable, and permitted command outputs. No reviewer can
certify compilation, implementation or tests that do not yet exist.

## Gate report (accepted outcome data)

All fields below are required except `advisory_notes` and
`engineering_state_patch`. Use empty arrays where no issues/revisions apply.

| Field | Content |
| --- | --- |
| schema_version | `1` |
| outcome_id | `pass`, `revise` or `escalate` |
| gate | `safety`, `async-audit`, `api`, `perf` or `cross-platform` |
| status | `pass`, `fail` or `needs-user-input` |
| reviewed_snapshot | Revision/diff actually inspected, including dirty and new files |
| evidence | Inspected file:line or source citations and actual command outputs, with version/target scope as needed |
| blocking_issues | Concrete failure mechanisms with stable issue ids, trigger, consequence and supporting evidence; nonempty for `fail` |
| required_revisions | Actionable resolution for each blocker, retaining its id without prescribing incidental implementation |
| advisory_notes | Optional preferences or non-blocking improvements |
| verification | Checks actually performed and outcomes; missing evidence and proposed checks clearly labeled |
| engineering_state_patch | Optional fact corrections to the brief; the lead verifies and merges them |

| Report status | Outcome | Meaning |
| --- | --- | --- |
| `pass` | `pass` | No supported blocker in the assigned scope, with essential evidence available |
| `fail` | `revise` | Concrete correctable blockers with stable required revisions |
| `needs-user-input` | `escalate` | Essential evidence or intent unavailable; name the smallest question/recovery action and who can resolve it |

The legacy status name `needs-user-input` also covers evidence that the lead can
obtain locally. It does not automatically require asking the user or stopping
unrelated work. Advice without a blocker is a pass with advisory notes. There is
no conditional pass. Inability to assess essential behavior cannot become a pass.
A pass is scoped review evidence, not proof of the entire change.

`engineering_state_patch` is not read or merged by the engine. Reports cannot
change shared state, authorize writes or override the brief's read-only scope.

## Source evidence report (accepted outcome data)

All fields below are required. Both a complete answer and a partial investigation
settle the declared `report` outcome. This role never submits a product verdict.

| Field | Content |
| --- | --- |
| schema_version | `1` |
| outcome_id | `report` |
| kind | `source-evidence` |
| status | `complete` or `partial` |
| reviewed_snapshot | Inspected workspace revision/diff or supplied artifact identity, including relevant dirty/new files |
| question | The concrete source, dependency, compiler or platform question assigned |
| version_scope | Applicable dependency/compiler versions, features and targets; unknowns explicit |
| findings | Array of objects with `claim`, `evidence`, `limits`; separate documented guarantees, observations and inference |
| verification | Actually performed checks and results, plus clearly labeled unexecuted checks and limitations |
| open_questions | Remaining questions, missing evidence and the actor/check that can resolve each; empty when none remain |

`complete` means the assigned question was answered within its scope, even if the
answer disproves an assumption. `partial` means some assigned evidence remains
unavailable. A downstream gate checks snapshot/version/target applicability and
actual findings, not merely the producer's completion status. It may pass with an
irrelevant residual unknown only after explaining why that unknown cannot affect
its decision. Missing essential evidence requires escalation or further research.

## Outcome and identity rules

Five reviewer agents declare `pass`, `revise`, `escalate`. The source tracer
declares only `report`. Example node ids `async` and `performance` correspond to
report gates `async-audit` and `perf`; do not confuse node identity with gate type.
Source nodes may have distinct ids for independent questions using the same agent.

A settled graph may contain revisions, escalations or partial evidence. The lead
inspects accepted attempt identity and payload, integrates supported findings,
owns repairs, and decides whether the requested behavior is adequately verified.
Changing the reviewed snapshot invalidates acceptance for affected findings and
requires fresh evidence; a new graph name never erases unresolved issue history.

## Contract maintenance

Keep definitions here and reference them from producers/consumers. Update both
sides together for a contract change; version incompatible changes. Optional new
fields must not silently change existing field meaning. Never claim conformance
from a prose example or stubbed runtime test: check the actual accepted payload.
