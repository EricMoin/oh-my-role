---
name: escalate-recovery
description: Diagnose failed Emperor graph nodes and select a bounded recovery without repeating side effects
---
# Recovery

Read the current producer node's status, signal stream and full output. Missing or
invalid payloads are protocol failures; unavailable tools and missing dependencies
need a concrete correction. need_approval is a pending decision, not a retryable error.

Follow references/graph-protocol.md. Acceptance failures use fresh revision DAGs,
with prior reports and affected downstream scope. Transient engine/node failures may
use one graph_run retry only after the whole reset scope is quiescent. That operation
resets the target and its transitive downstream; do not retry descendants separately.
Do not claim max_traversals bounds manual retries or that sessions are always reused.

Before repeating an operation inspect existing files and external effects. If the
outcome is uncertain and repetition is not safe, report unresolved work. Preserve
completed/remaining work for recovery. Stop on repeated failure or exhausted request
revision budget, cancel obsolete active work, and return an honest final answer.
