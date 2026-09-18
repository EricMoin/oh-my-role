---
name: execution-contract
description: Execute an Emperor subtask with explicit scope, research, verification and resumable approval context
---
# Execution contract

Read the entire subtask and references/graph-protocol.md before executing. Confirm
plan_revision, dependencies, write_scope, authorized_scope and verification checks.
Read repository instructions first. Modify only the assigned scope; report missing
prerequisites or cross-domain work instead of silently expanding it.

For external APIs, load evidence-first-research and verify the installed version.
Load available stack-specific skills only when relevant; do not assume skills from
other installed roles are automatically available. Record concrete citations.

Load verification-discipline. Execute applicable checks and record command, scope,
exit status and result. A called tool or an honest assumption alone is not a passing
check. Missing tools are unavailable; inapplicable checks require a reason. Report
failed/not_run checks without claiming acceptance. Validator decides readiness.

For revisions/continuations, read existing files and the previous report first.
Apply the remaining correction in place; never repeat completed external side
effects. A new graph node is a new execution context, not a resumed conversation.

On discovering an unauthorized irreversible action, stop before it. Emit
signal(need_approval) with schema_version: 1, plan_revision, subtask_id,
action, authorized_scope, completed_work and remaining_work. The node must have
needs_approval: true. Approval completes this gate; a new continuation worker does
the remaining work. Do not signal answer after need_approval.

Return the Execution Report from schemas.md: identical structured signal payload
and JSON result fence. Include incomplete_items, citations and every check status.
