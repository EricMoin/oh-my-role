---
name: escalate-recovery
description: Diagnose failed Emperor graph attempts without repeating side effects
---
# Recovery

Read graph_status for the intended graph/run/attempt with accepted result data,
controls, approvals and unsettled effects. Use graph_audit for storage or recovery
blockers. A missing report is a protocol failure, not inferred success.

- approval_required or clarification_required: resolve the exact scope/question;
  waiting does not spend repair rounds. Host approvals require separate authority.
- failed or blocked: preserve the partial report, identify the failed prerequisite
  or acceptance check and correct the affected closure in a fresh graph.
- Infrastructure, capacity or timeout: establish whether an execution exists and
  what effects occurred. Unknown is not absent. One transient retry is allowed only
  after safe repetition and available execution budget are established.
- Missing tools/evidence: use a repository-supported equivalent only with evidence
  of coverage; otherwise retain the concrete verification gap.

Follow graph-protocol.md. graph_control retry creates a new attempt or, for a
terminal run with accounted effects, a new run of the same immutable plan. It does
not reset all descendants, preserve a conversation or guarantee idempotence. Changed
scope/prompts require a new graph name. Do not reset request repair counts or consumed validate rounds.

If review or Validator remains unavailable after bounded transient recovery, report
unverified work. Never replace independent validation with the executor's or Emperor's
self-assessment. Stop repeated identical failures, cancel obsolete work through the
trusted control path and confirm effects. Do not clear an unreadable store or repeat
uncertain external operations to make a graph look complete.
