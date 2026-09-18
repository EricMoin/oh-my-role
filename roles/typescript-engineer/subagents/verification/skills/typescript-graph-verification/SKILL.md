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

## Mode and signal

**evidence / investigation:** Complete the named investigation, report commands, results,
observations and gaps, and emit `answer` with `{assessment, observations, checks,
limitations}`. A successfully observed failing check is valid negative evidence, not a
passing product. These modes do not own repair routing. If the assigned evidence cannot
be obtained at all, escalate with the blocker. A read-only review can deliver findings
as observations without requiring a repair loop.

**review:** Independently assess the changed contract and required evidence. Run missing
focused checks when appropriate. Emit `answer` only when the required acceptance criteria
are supported. For concrete fixable defects, emit `revise_needed` with stable
`items: [{id, file, problem, required_change, evidence}]`. For missing required evidence or
scope/authorization blockers, emit `escalate` with the specific next step. Do not treat
optional untested environments as a failure of a narrower explicitly requested check;
report the limit honestly.

**synthesis:** Wait for the graph's join-all input and inspect every branch, including
negative/partial reports. For implementation evidence, ensure reports describe the current
change, reconcile conflicts with source/evidence and issue the review verdict above. Only
the final implementation review owns the repair back-edge; evidence branches never start
simultaneous repairs. Do not accept by majority voting or ignore failed packaging because
a type checker passed.

For design selection, assess candidate contracts and their shared caller examples against
the design-stage criteria. Emit answer with the selected contract and implementation
acceptance criteria, without claiming production behavior is verified. If a required
choice remains unresolved, escalate; this selection node has no implementation repair
back-edge and must not allow source-writing to start with an unresolved contract.

**approval-proposal:** Perform no external mutation. Produce the exact artifact/target,
command, scope and material effects for the user to decide, then emit `need_approval`.
This mode requires the parent to declare `needs_approval: true`. Approval completes this
node and releases a separate action node; do not expect to resume here to publish. If the
node was not declared as a gate, escalate rather than relying on a stray pausing signal.

Write the evidence report before the final/pausing signal. On an accepting answer, do not
include unresolved top-level `items`, `findings` or `unresolved` arrays: the engine treats
these as a repair request in a loop. Put advisory limits in `limitations`, and never move
an actual required defect there merely to obtain convergence.

For detailed engine semantics, read [the graph protocol](../../../../skills/typescript-graph-workflow/references/graph-protocol.md).
