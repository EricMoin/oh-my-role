---
name: execution-contract
description: Execute an Emperor subtask with explicit scope, research, verification and resumable approval context
---
# Execution contract

Read the entire subtask and references/graph-protocol.md before executing. Confirm
plan_revision, dependencies, write_scope, authorized_scope and verification checks.
Read repository instructions first. Modify only the assigned scope; report missing
prerequisites or cross-domain work instead of silently expanding it.

Before dependent work, read actual upstream reports supplied by the coordinator or
engine. A missing/malformed report, incomplete_items, or an unsatisfied prerequisite
check is not a usable input. Pause or escalate with the exact gap; a COMPLETED node
or an inferred answer alone cannot satisfy this precondition.

For multi-step work, maintain a short task checklist with one current item; update
it after real outcomes, leaving blocked work open. Skip bookkeeping for a trivial
one-step edit. Send progress at meaningful milestones or when the expected path
changes, not on every tool call. A progress/todo update is not verification evidence.

For external APIs, load evidence-first-research and verify the installed version.
Load available stack-specific skills only when relevant; do not assume skills from
other installed roles are automatically available. Record concrete citations.

Load verification-discipline. Execute applicable checks and record command, scope,
exit status and result. A called tool or an honest assumption alone is not a passing
check. Missing tools are unavailable; inapplicable checks require a reason. Report
failed/not_run checks without claiming acceptance. Validator decides readiness.
After a failed check, diagnose before changing code or repeating it. Stop repeated
identical attempts without new evidence; include commands and causes in escalation.

For revisions/continuations, read existing files and the previous report first.
Apply the remaining correction in place; never repeat completed external side
effects. A new graph node is a new execution context, not a resumed conversation.

On discovering an unauthorized irreversible action, stop before it. Emit
signal(need_approval) with schema_version: 1, plan_revision, subtask_id,
action, authorized_scope, completed_work and remaining_work. The node must have
needs_approval: true. Approval completes this gate; a new continuation worker does
the remaining work. Do not signal answer after need_approval.

Return the Execution Report from schemas.md, including incomplete_items, citations
and every check status. Complete work emits answer(report); unfinished work emits
escalate with the report nested inside it. Emit the identical signal object in the
JSON result fence, including its failure wrapper when present. Clarification and
prerequisite pauses use the distinct contracts in schemas.md; never answer afterward.
