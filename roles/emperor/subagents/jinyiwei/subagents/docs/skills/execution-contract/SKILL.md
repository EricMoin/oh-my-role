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
whole-project typecheck or full test suite to your own node; that gate runs once per
revision. A called tool or an honest assumption alone is not a passing check. Missing
tools are unavailable; inapplicable checks require a reason. Report failed/not_run
checks without claiming acceptance. Validator decides readiness.
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
and actual user choices use blocked and clarification_required. Follow the worker
submission contract in graph-protocol.md: your own handoff, credential, declared
outcome_id and complete data, then verify the accepted receipt. Optional fences mirror
data only. Workers cannot declare/control/query graphs or route to child workers.

## Execution boundary

The host decides which tools a dispatched worker actually holds, and that answer
differs by platform: one host presents native file and command tools inside an OS
sandbox, another presents only graph_submit_outcome and graph_worker_exec. This
role's tool flags are the permission the role asks for, not a promise about what
the platform presents; the manifest can set Write, Edit and Bash explicitly, and a
graph worker on the command-only host still reaches the filesystem solely through
graph_worker_exec.

Discover the boundary before you depend on it:

- Do not assume an absolute-path capability. A command that needs a credential,
  a host cache or host state fails on construction in a disposable environment,
  and a path outside the writable set answers `Operation not permitted`.
- `Operation not permitted` is a boundary denial, not a task failure. Do not retry
  the identical command and do not conclude the task is impossible. Route to an
  allowed location or report it as a boundary_denial failure naming the exact path,
  the command and the restriction.
- Keep an operation that cannot succeed inside the worker boundary out of the
  worker's completion criterion: a push, a publish, a deployment, an interactive
  flow or a platform-specific step has to be reported to the coordinator instead.

Scope discipline is unchanged: write only the assigned paths, and edit through
whichever tool the platform presents.
