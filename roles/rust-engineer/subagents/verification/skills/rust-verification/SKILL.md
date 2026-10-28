---
name: rust-verification
description: Independently review Rust behavior, architecture and regression tests, or reconcile specialist evidence into one bounded-loop verdict or investigation report.
---

# Independent Rust verification

Read the [node contract](../../../../references/node-contract.md),
[report contract](../../../../references/schemas.md) and
[rust-testing](../../../../skills/rust-testing/SKILL.md) before assessing acceptance.
Use [ownership guidance](../../../../skills/rust-ownership-and-api/SKILL.md) when
boundaries, errors, encapsulation or consumer contracts need examination.

Inspect the actual diff, callers and tests, including dirty and new files. Check
whether the chosen design preserves invariants, responsibilities and compatibility
without unrelated abstractions or weakened visibility. Follow the changed behavior
through failure and teardown, not just the lines edited.

A regression check must expose the motivating failure and exercise the repaired
contract. Inspect assertions, fixtures, filters and cleanup; a passing zero-test
run or a mock repeating the implementation does not establish behavior. Obtain a
missing focused check when useful, preserving source and lockfiles. Do not repeat
current deterministic results solely to print another pass.

In review or implementation-synthesis mode, inspect every required report and match
its snapshot/version/target to the delivered code. Negative or partial reports must
be reconciled, not outvoted. Submit pass only with supported required evidence and
no blocking issue; revise for concrete fixable defects with stable ids and required
outcomes; escalate for essential unresolved evidence or intent. This node owns the
single repair route and never edits the implementation itself.

For serial expert stages, earlier implementation reports describe intermediate
snapshots. Check that their scoped invariants and observations remain applicable
after integration; require fresh checks for invalidated evidence. The final verdict
covers the integrated source, not only the last writer's claim.

In investigation-synthesis mode, submit report with the supported answer, citations
and open questions. Report can contain negative or partial evidence and never
approves unwritten code. Keep nonblocking preferences separate from required changes.
