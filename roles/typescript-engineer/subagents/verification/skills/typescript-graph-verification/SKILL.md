---
name: typescript-graph-verification
description: Verify TypeScript graph work using focused evidence, an independent review verdict, fan-in synthesis or a non-mutating approval proposal.
---

# Graph verification

Read the mode and acceptance criteria in the brief, then inspect the source and artifacts
that bear on them. Sessions have separate histories, not necessarily separate filesystems.
Do not assume a baseline exists, that HEAD contains the user's initial edits, or that a
previous branch's pass describes the current source snapshot.

Production source and tests are read-only for this worker. Scratch consumers, temporary
configs and build/test outputs are allowed where the brief permits them. Isolate commands
that share output paths with another branch. Never stash/reset user changes to construct a
baseline or alter assertions to force a pass. A read-only source contract is not a claim
that compiling or packing writes no files.

## Select the evidence

| Concern | What to establish | Shared guidance |
|---|---|---|
| Type contract | Effective options, intended accepted/rejected calls and useful inference | [Types](../../../../skills/typescript-type-system/SKILL.md) |
| Runtime | Relevant success/failure/cleanup on supported available hosts | [Runtime](../../../../skills/typescript-runtime-semantics/SKILL.md) |
| Package resolution | Actual built/packed consumer paths and declaration formats | [Packaging](../../../../skills/typescript-modules-and-packaging/SKILL.md) |
| Workspace | Affected consumers and build boundaries; comparable performance if changed | [Monorepo](../../../../skills/typescript-monorepo-engineering/SKILL.md) |
| Test/refactor | Checks cover the changed behavior, not just transpilation or mocks | [Engineering](../../../../skills/typescript-engineering-gate/SKILL.md) |
| Public API | Consumer-direction compatibility and emitted surface where relevant | [API](../../../../skills/typescript-api-design/SKILL.md) |

Read only relevant guidance. Do not repeat a deterministic check just to reprint a result
already provided for the same source state. Independent source/test review, consumer
resolution and a suspected inadequate check are good reasons to gather new evidence.
Attribute failures by cause: upstream changes can break untouched consumers. Distinguish
new failures, established baseline failures and uncertain attribution.

## Mode and outcome

The node brief names the mode and the outcome ids the declaration gives this node; submit one
of those ids with `graph_submit_outcome({graph_id, node_id, outcome_id, credential, data})`,
using only the attempt credential your dispatch carried. Only the decision `accepted` (verdict
committed or replayed, with no refusals) settles the node. A refusal or rejection writes
nothing and leaves the attempt open, so repair the payload or the missing evidence and
resubmit; never print the credential and never fabricate an outcome. The declaration names the
ids; your dispatch passes them.

**evidence / investigation:** Complete the named investigation and submit the declared report
outcome with commands, results, observations and gaps. A successfully observed failing check
is valid negative evidence, not a passing product, and the report is still the correct
outcome. These modes do not own repair routing; record evidence you could not obtain as an
explicit gap rather than an affirmative verdict.

**review:** Independently assess the changed contract and the required evidence, running
missing focused checks when appropriate. Submit the declared pass outcome only when the
required acceptance criteria are supported. For concrete fixable defects submit the declared
revise outcome with stable `items: [{id, file, problem, required_change, evidence}]`. This
node owns the only repair route, so use it rather than starting a repair yourself. Report
missing required evidence or scope/authorization blockers as an explicit blocking item or
limitation in the outcome your dispatch declares. Do not treat optional untested environments
as a failure of a narrower explicitly requested check; report the limit honestly.

**synthesis:** Wait for the graph's join-all inputs and inspect every branch, including
negative and partial reports. For implementation evidence, ensure the reports describe the
current change, reconcile conflicts with source/evidence and issue the review verdict above.
Only the final implementation review owns the repair route; evidence branches never start
simultaneous repairs. Do not accept by majority voting or ignore failed packaging because a
type checker passed.

For design selection, assess candidate contracts and their shared caller examples against the
design-stage criteria. Submit the declared selection outcome with the selected contract and
its implementation acceptance criteria, without claiming production behavior is verified. If a
required choice remains unresolved, submit the outcome your dispatch declares for an
unresolved premise; this selection node has no implementation repair route and must not allow
source-writing to start with an unresolved contract.

**approval-proposal:** Perform no external mutation. Produce the exact artifact/target,
command, scope and material effects for the user to decide, then submit the declared
`approval_required` outcome — a request, never permission. It releases only the separate
downstream action node the declaration binds to it; it does not resume this worker to publish.
If the declaration did not give this node that outcome, report the missing gate instead of
relying on prose.

Write the evidence report before submitting. On an accepting outcome, do not contradict that
outcome: unresolved arrays at top level are ambiguous downstream. Put advisory limits in
`limitations`, and never move an actual required defect there merely to obtain convergence.

For detailed engine semantics, read [the graph protocol](../../../../skills/typescript-graph-workflow/references/graph-protocol.md).
