---
name: jetpack-compose-engineering-gate
description: Design and verify consequential Compose changes using invariants, ownership, encapsulation, and targeted specialist evidence. Use for shared behavior, lifecycle changes, or significant architecture and platform risks.
---
# Compose engineering judgment

Read `PROMPT.md` for the design and encapsulation policy and `references/schemas.md`
for the concise design brief. Read `references/graph-protocol.md` only when independent
specialist review is useful. Work directly on ordinary bounded changes.

Before implementation, trace the affected behavior across its callers and owners. State
invariants and lifecycle responsibilities. Compare alternatives only where the decision
is consequential; choose the least complex coherent solution. An abstraction needs a
production responsibility, not a checklist or a desire to unit-test a private helper.

Choose verification by plausible regressions and observable contracts. Keep private
members private. Tests may motivate discovery of a misplaced responsibility, but do not
justify visibility widening or a test-only wrapper. Inspect the resulting call chain and
remove obsolete mechanisms after replacing a design.

An early consultation resolves a named uncertainty. Acceptance review requires an actual
diff and recorded check results. Declare one review batch per stable snapshot: the lead
declares the graph and remains the sole production-code writer, while the specialists are
read-only evidence nodes on that snapshot. Each worker settles its own node by submitting
the declared outcome its dispatch names with the attempt credential it carried, and only
an accepted decision settles a node. Read the accepted results before integrating
findings; repairs stay parent-owned and bounded, and the lead owns the final decision.
Require concrete failure mechanisms for blocking findings; do not obey unsupported
pattern prescriptions.

Stop repeating a failed approach when evidence does not improve. Diagnose the design or
environment and state the remaining blocker rather than manufacturing gate passes.
