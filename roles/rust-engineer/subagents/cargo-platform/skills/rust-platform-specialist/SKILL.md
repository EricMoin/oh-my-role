---
name: rust-platform-specialist
description: Implement Cargo/workspace features, build scripts, target configuration, MSRV and native integration. Separate host behavior from target behavior. Use within a Rust cargo-platform implementation, review or evidence node.
---

# Cargo Platform specialist

Read your mode, scope, acceptance criteria and declared inputs first. Follow the
[node contract](../../../../references/node-contract.md) and
[report contract](../../../../references/schemas.md).

- **implement:** Read [rust-cargo-platform](../../../../skills/rust-cargo-platform/SKILL.md)
  before editing. Implement Cargo/workspace features, build scripts, target configuration, MSRV and native integration. Separate host behavior from target behavior. Run the focused checks that can expose the changed failure
  mode. On repair entry address the accepted issues; forward the complete revision
  context and remaining issue owners to any later implementation stage.
- **review:** Read [rust-platform-gate](../rust-platform-gate/SKILL.md) and independently inspect the assigned
  final snapshot and caller contract. Return pass, revise or escalate with supported
  findings. Do not modify source or approve your own implementation attempt.
- **evidence:** Read the implementation or gate guidance needed for the concrete
  question. Return report with complete/partial evidence, including negative findings
  and version/target limits. This mode does not own the repair verdict.

When choosing or modifying regression coverage, read
[rust-testing](../../../../skills/rust-testing/SKILL.md) before designing the checks.

Record the actual skills read. Keep source frozen in read-only modes. A preferred
pattern alone is advisory; concrete behavior, invariants and evidence decide acceptance.
