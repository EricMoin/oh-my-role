# Investigation depth and graph selection

This document governs effort and coverage. Graph execution belongs to the graph skill
and protocol; report fields belong to schemas. Scope effort to the actual change and
consumers rather than repository keyword counts, file counts or a fixed reviewer quota.

## Investigate enough to choose the experts

Establish intended behavior, affected callers, ownership and release, failure/cancellation
paths, compatibility and version/target constraints. Read code, diagnostics and relevant
skills until the design, responsible experts and meaningful checks can be specified.
Use focused investigation nodes when unresolved premises need separate expertise or can
be examined independently. Stop research once another lookup will not change the plan.

## Choose the execution depth

| Work | Execution and acceptance |
| --- | --- |
| Direct explanation or initial read-only scoping | Parent may answer from inspected evidence; no production edits |
| Mechanical repository edit with unchanged behavior/contract | One domain implementation node with the relevant focused/project check |
| Behavior fix, feature or substantive refactor | Relevant domain implementer, independent verification and a bounded repair loop |
| Interacting domain boundaries or consumers | Scope the specialist implementation stages; gather independent evidence where needed and converge on one repair verdict |
| Existing-code investigation or review | Read-only specialist nodes, with fan-in only for real evidence dependencies |

A private parser fix needs a regression input; it does not need an unsafe expert merely
because the crate contains unsafe code. An async operation can need cancellation expertise
without spawning a task. Build-script changes require host/target analysis even when no
production Rust file changes. Public-contract changes require actual downstream analysis.

## Coverage and efficiency

Select specialists by a concrete implementation responsibility or evidence question.
The ownership/API specialist also handles ordinary safe Rust. Verification covers general
correctness, architecture and regression quality; it is not restricted to the five special
risk domains. All material risks need evidence or an explicit unresolved gap.

Parallelize independent research and frozen-snapshot evidence. Sequence shared-source
writers; use parallel implementation only with exclusive source scopes and isolated
outputs. A node is a coherent responsibility, not each individual shell command. Reuse
relevant current evidence and checks rather than rerunning them to fill a report.

Use package-scoped checks when sufficient; broaden to consumers, workspace, features and
targets when the change or repository policy requires it. No effort preference prohibits
regression tests, rustdoc or a needed specialist. `|effort:quick|`, `standard` and `deep`
change investigation breadth and reporting, not whether repository execution uses graphs
or whether a behavior change needs independent verification.

## Budgets and stopping

Choose a finite execution budget covering the declared stages and allowed repair traversals.
Use task-appropriate timeouts; no arbitrary three-expert cap applies. Normally permit two
repair traversals for the same unresolved mechanism. Exhaustion requires diagnosis and a
partial/blocked result, never automatic acceptance. A new graph name does not erase effort.

Continue independent useful work when one premise is blocked. Involve the user only for
missing intent, access or a consequential choice. Accept when required checks cover the
final snapshot, the independent review supports the changed behavior and no supported
blocking issue remains. Mechanical work can finish from its implementation/check evidence.
