---
name: execution-contract
description: Execute an Emperor subtask with explicit scope, research, verification and resumable approval context
---
# Execution contract

Read the entire subtask and the business report contract in schemas.md. Confirm
plan_revision, dependencies, write_scope, authorized_scope and verification checks.
Read repository instructions first. Modify only the assigned scope; report missing
prerequisites or cross-domain work instead of silently expanding it.

Before dependent work, read actual upstream reports supplied by the coordinator or
engine-declared inputs. A missing/malformed report, incomplete_items, or an unsatisfied prerequisite
check is not a usable input. Pause or escalate with the exact gap; a complete graph
or a worker exit alone cannot satisfy this precondition.

For multi-step work, maintain a short task checklist with one current item; update
it after real outcomes, leaving blocked work open. Skip bookkeeping for a trivial
one-step edit. Send progress at meaningful milestones or when the expected path
changes, not on every tool call. A progress/todo update is not verification evidence.

For external APIs, load evidence-first-research and verify the installed version.
Load available stack-specific skills only when relevant; do not assume skills from
other installed roles are automatically available. Record concrete citations.

Load verification-discipline. Execute the checks the subtask assigns, scoped to your
write_scope, and record command, scope, exit status and result. Do not add a
whole-project typecheck or full test suite by default; broader gates need an explicit
assignment and a concrete repository/task reason, with one owner per workspace state. A called tool or an honest assumption alone is not a passing check. Missing
tools are unavailable; inapplicable checks require a reason. Report failed/not_run
checks as incomplete work. Your report supplies the evidence for acceptance.
After a failed check, diagnose before changing code or repeating it. Stop repeated
identical attempts without new evidence; include commands and causes in escalation.

For revisions/continuations, read existing files and the previous report first.
Apply the remaining correction in place; never repeat completed external side
effects. A new graph node is a new execution context, not a resumed conversation.

On discovering an unauthorized irreversible action, stop before it. Submit
approval_required with schema_version: 1, plan_revision, subtask_id, action,
authorized_scope, completed_work and remaining_work. This is an accepted request,
not permission or a host control command. Emperor resolves authorization and creates
a continuation for remaining work. Never submit done after a non-success outcome.

Return the Execution Report from schemas.md. Complete work submits done; unfinished
work submits failed with the partial report nested inside it. Missing prerequisites
and actual user choices use blocked and clarification_required.

## Capability failures

Use only the assigned write_scope and authorized_scope. When a required operation
is denied by the host or an essential tool is unavailable, report the exact command,
path and restriction as failed(category: boundary_denial). Do not repeat the same
operation without a change in prerequisites; preserve completed work so Emperor
can arrange the remaining work in a context with the required capability.
