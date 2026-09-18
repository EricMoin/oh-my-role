# Jetpack Compose role design

The lead owns design and production edits. Five read-only specialists supply targeted
evidence through rolebox graph v2. Ordinary bounded work stays inline. Significant work
starts with invariants, ownership, lifetime and a minimal coherent boundary; reviews
inspect an actual stable implementation snapshot. Early consultations resolve specific
uncertainties and do not approve unwritten code.

The previous workflow duplicated mandatory phases across the parent prompt, auto-injected
engineer function and gate skills. Tests were judged by ratios, per-component coverage
and framework prescriptions; architecture checks prescribed layers irrespective of need.
This encouraged mechanical compliance and provided no explicit protection against
visibility changes made solely for tests. The revised role tests production behavior,
preserves private details, and permits extraction only for a meaningful responsibility.

Independent reviews run concurrently as root nodes. Edges express real evidence
dependencies. They pass reports, not automatic shared-state patches. The lead synthesizes
findings and performs bounded repairs between review batches. There is no imaginary
writer in a cycle of read-only reviewers. A completed graph is not an accepted change.

Sources of truth:

- `PROMPT.md`: design judgment, encapsulation, workflow and specialist selection.
- `functions/engineer.md`: short per-message reminder, including continuation behavior.
- `references/schemas.md`: concise brief and evidence report.
- `references/graph-protocol.md`: engine semantics and recovery.
- Domain skills: contextual guidance loaded for the current decision.

Validation should distinguish loader/protocol compatibility from model behavior. Real
rolebox loader and graph-engine tests can establish the former; realistic task trials
are needed to establish whether code quality improves. Do not claim a prompt change
proves that future generated code is correct.
