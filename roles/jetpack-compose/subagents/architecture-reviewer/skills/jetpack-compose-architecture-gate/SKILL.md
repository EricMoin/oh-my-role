---
name: jetpack-compose-architecture-gate
description: Review invariants, ownership, lifecycle, cohesion, dependency direction, and production API boundaries in Compose changes.
---
# Architecture review

Load `references/schemas.md` and `references/compose-architecture.md`. Review the full
affected call chain against the supplied invariants and project constraints. During
consultation, assess the proposed design; during implementation review, inspect the actual
diff and callers. Do not equate a named architecture pattern with correctness.

- Identify who owns state, decisions, resources, identity and lifecycle. Check initialization,
  cancellation, remount/recreation, and cross-screen sharing where relevant to this change.
- Assess cohesion, dependency direction and API surface together. A new abstraction should
  own a meaningful responsibility. Reject test-only wrappers, visibility widened solely
  for tests, and flags that leak one feature’s policy through unrelated shared layers.
- Compare the chosen design with a smaller local change when extraction adds indirection.
  Conversely, identify duplicated policy or mixed lifetimes that warrant a real boundary.
- Judge ViewModel scope from shared state and lifetime; one-per-screen is not a universal
  rule. Judge TextField ownership from validation, persistence and business behavior;
  a field in a ViewModel is not intrinsically an antipattern.
- Judge Flow collection and sharing policies against actual lifecycle and freshness needs.
  A timeout or a specific collection API is not proof that these needs are satisfied.
- Follow actual module, DI, navigation and model contracts. Do not mandate new domain
  layers, DTO copies, NavGraphBuilder extensions, or modules by file-length thresholds.
- Inspect cleanup and interop against the API/version used; verify uncertain API claims
  before reporting them as defects.

Blocking findings need a concrete failure mechanism, file:line evidence, and an outcome
that fixes the issue. Preferences are advisory. Do not prescribe a replacement design
without considering its callers, lifetime and total complexity.

## Submission

Submit this gate report as the node's outcome, not as prose. Read and check only through
`graph_worker_exec`, stay read-only, finish the report, then settle the node by submitting
the declared outcome id the dispatch names through `graph_submit_outcome` with only the
attempt credential that dispatch carried. Carry the report as `schema_version: 1` data
following `references/schemas.md`. Only an accepted decision (verdict committed or replayed,
with no refusals) settles the node; a refusal writes nothing, so repair the payload or the
missing evidence and resubmit. Never declare, control, query or audit graphs and never create
child graphs: the declaring lead session owns orchestration, synthesis, repair and acceptance.
This gate settles `pass`, `revise` or `escalate` — `escalate` when essential evidence or user
intent is unavailable, never a fabricated pass. The gate report carries
`status: pass | fail | needs-user-input` per `references/schemas.md`; the settled outcome id is
submitted separately (clean -> `pass`, fail with concrete blockers -> `revise`,
needs-user-input -> `escalate`).
