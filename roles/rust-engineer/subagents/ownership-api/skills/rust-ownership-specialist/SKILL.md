---
name: rust-ownership-specialist
description: Implement safe Rust logic, ownership and borrowing, trait/error design and consumer compatibility. Inspect caller-visible behavior even for private functions. Use within a Rust ownership-api implementation, review or evidence node.
---

# Ownership API specialist

Read your mode, scope, acceptance criteria and declared inputs first. Follow the
[node contract](../../../../references/node-contract.md) and
[report contract](../../../../references/schemas.md).

- **implement:** Read [rust-ownership-and-api](../../../../skills/rust-ownership-and-api/SKILL.md)
  before editing. Implement safe Rust logic, ownership and borrowing, trait/error design and consumer compatibility. Inspect caller-visible behavior even for private functions. Run the focused checks that can expose the changed failure
  mode. On repair entry address the accepted issues; forward the complete revision
  context and remaining issue owners to any later implementation stage.
- **review:** Read [rust-api-gate](../rust-api-gate/SKILL.md) and independently inspect the assigned
  final snapshot and caller contract. Return pass, revise or escalate with supported
  findings. Do not modify source or approve your own implementation attempt.
- **evidence:** Read the implementation or gate guidance needed for the concrete
  question. Return report with complete/partial evidence, including negative findings
  and version/target limits. This mode does not own the repair verdict.

When choosing or modifying regression coverage, read
[rust-testing](../../../../skills/rust-testing/SKILL.md) before designing the checks.

Record the actual skills read. Keep source frozen in read-only modes. A preferred
pattern alone is advisory; concrete behavior, invariants and evidence decide acceptance.
