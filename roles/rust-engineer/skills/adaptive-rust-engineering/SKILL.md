---
name: adaptive-rust-engineering
description: Select Rust investigation, verification and specialist review from the change's actual invariants, uncertainty and affected consumers. Use for consequential work or when evidence and review coverage need a decision.
---

# Adaptive Rust Engineering

## Frame the decision

Identify the changed behavior and its affected callers, ownership and lifecycle.
Evaluate both the existing code and the proposed implementation. A private async
function can introduce a cancellation bug without spawning a task; an untouched
unsafe module does not make a documentation edit unsafe work.

Follow [complexity-model.md](../../references/complexity-model.md), the single
source of effort policy. Search to answer a question, not to count domains. Zero
matches are not evidence that a relevant failure mode is absent.

For consequential work, record the invariant, design choice, meaningful tradeoff,
verification and unresolved facts. A bounded local fix needs only the useful
subset. The [brief contract](../../references/schemas.md) is a handoff format,
not a document required before every edit.

## Choose evidence and review

Ask what observation could refute the change. Select the regression case, caller
check, configuration or measurement that exposes it. Compilation alone cannot
support runtime, soundness, compatibility or performance claims. Follow repository
checks; a low effort preference does not prohibit tests or rustdoc.

Map material risks through [rust-domains.md](../../references/rust-domains.md).
Select only specialists with a concrete question. Cover all material risks through
checks, evidence or explicit gaps; do not drop one to satisfy a fixed ranking or
node limit. Keep independent reviewers parallel. Add source evidence dependencies
only when a consumer actually needs their results.

Use [graph-protocol.md](../../references/graph-protocol.md) for execution. Review
a stable snapshot. Read accepted outcomes, not just completion. A source `report`
is evidence, including its limits, and never substitutes for a gate verdict.

## Repair and stop

Validate a finding's failure mode and evidence before editing. Preserve issue ids
across repair rounds. Unsupported preferences are advisory. After two failed
substantive repairs of the same issue, diagnose the approach and expose the
remaining blocker; do not reset the count or convert missing evidence into a pass.

Spend effort on the next uncertainty that changes the decision. Stop expanding
research when the relevant contract is established. Continue independent work
when blocked; involve the user only for missing intent, access or a consequential
choice. Finish with final-snapshot evidence and explicit remaining gaps.
