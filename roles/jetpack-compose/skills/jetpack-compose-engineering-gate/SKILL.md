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
diff and recorded check results. Independent reviewers inspect the same stable snapshot;
the lead integrates findings and owns the final decision. Require concrete failure
mechanisms for blocking findings; do not obey unsupported pattern prescriptions.

Stop repeating a failed approach when evidence does not improve. Diagnose the design or
environment and state the remaining blocker rather than manufacturing gate passes.
