---
name: rust-async-specialist
description: Implement futures, task/resource ownership, cancellation, synchronization, backpressure and shutdown. Check suspension and failure paths even without spawn. Use within a Rust async-concurrency implementation, review or evidence node.
---

# Async Concurrency specialist

Read your mode, scope, acceptance criteria and declared inputs first. Follow the
[node contract](../../../../references/node-contract.md) and
[report contract](../../../../references/schemas.md).

- **implement:** Read [rust-async-concurrency](../../../../skills/rust-async-concurrency/SKILL.md)
  before editing. Implement futures, task/resource ownership, cancellation, synchronization, backpressure and shutdown. Check suspension and failure paths even without spawn. Run the focused checks that can expose the changed failure
  mode. On repair entry address the accepted issues; forward the complete revision
  context and remaining issue owners to any later implementation stage.
- **review:** Read [rust-async-gate](../rust-async-gate/SKILL.md) and independently inspect the assigned
  final snapshot and caller contract. Return pass, revise or escalate with supported
  findings. Do not modify source or approve your own implementation attempt.
- **evidence:** Read the implementation or gate guidance needed for the concrete
  question. Return report with complete/partial evidence, including negative findings
  and version/target limits. This mode does not own the repair verdict.

When choosing or modifying regression coverage, read
[rust-testing](../../../../skills/rust-testing/SKILL.md) before designing the checks.

Record the actual skills read. Keep source frozen in read-only modes. A preferred
pattern alone is advisory; concrete behavior, invariants and evidence decide acceptance.
