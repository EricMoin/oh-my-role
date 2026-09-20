---
name: escalate-recovery
description: Diagnose failed Emperor graph nodes and select a bounded recovery without repeating side effects
---
# Recovery

Read the current producer node's status, signal stream and full output. Missing or
invalid payloads are protocol failures; unavailable tools and missing dependencies
need a concrete correction. need_approval is a pending decision, not a retryable error.

Classify the cause before choosing recovery:
- Authorization/clarification: recover the original producer payload. Resolve the
  actual missing decision; a graph's normalized need_approval is not proof that a
  destructive operation needs permission. Do not spend repair rounds on waiting.
- Acceptance/scope failure: identify the violated condition, completed work and
  correction. Repair only the affected closure; revise scope/authorization if needed.
- Missing tooling/prerequisites: inspect repository-supported alternatives. Use an
  equivalent check only with evidence of coverage; otherwise report the exact gap.
- Infrastructure/capacity/timeout: inspect current node/task state and side effects.
  A timeout is not proof that nothing ran. One retry is allowed only if the cause is
  plausibly transient and repeating the operation is safe.
- Invalid/missing report: read full output once to recover a valid structured report.
  If absent or contradictory, treat as protocol failure, not an inferred success.

Follow references/graph-protocol.md. Acceptance failures use fresh revision DAGs,
with prior reports and affected downstream scope. Transient engine/node failures may
use one graph_run retry only after the whole reset scope is quiescent. That operation
resets the target and its transitive downstream; do not retry descendants separately.
Do not claim max_traversals bounds manual retries or that sessions are always reused.

If a reviewer or Validator cannot launch, retry once for a transient rejection after
settling any existing attempt. Never replace independent review/validation with the
executor's or Emperor's self-assessment. If still unavailable, report unverified
work and the concrete recovery needed. Do not reinterpret unavailability as pass.

Before repeating an operation inspect existing files and external effects. If the
outcome is uncertain and repetition is not safe, report unresolved work. Preserve
completed/remaining work for recovery. Stop on repeated failure or exhausted request
revision budget, cancel obsolete active work, and return an honest final answer.
