---
name: schemas
description: Versioned inter-agent payloads and producer/consumer contracts
---
# Inter-agent contracts (schema_version: 1)

All role-authored contract payloads are JSON objects with schema_version: 1. A producer
emits identical JSON in signal payload and result fence. Strategy may additionally appear
in plan/draft/final_strategy fences; these are local artifacts, not cross-session
transport. Read node outputs/signals as specified in graph-protocol.md. Reject
conflicting channels, unknown versions, missing required fields and unknown IDs.
Runtime-generated signals (for example inferred answer or dispatch errors) may
lack this schema. Treat them as runtime events and inspect producer output; never
invent a valid report or mistake them for verified task completion.

## Strategy

Required: schema_version, plan_revision (nonempty string), objective (string),
subtasks (array), risk (low|high). Optional: notes (string).

Each subtask has:
- id: positive integer, unique, increasing from 1.
- description: concrete instruction.
- target: "jinyiwei" (logical executor family; actual agent comes from domain).
- domain: ui|backend|test|data|docs|quality|devops|security|unknown.
- dependencies: existing subtask IDs; no self-reference or cycles.
- acceptance: tool-verifiable done-condition.
- write_scope: array of repository-relative paths/globs; [] for read-only work.
- authorized_scope: array of concrete operations already authorized by the user;
  empty means ordinary reversible work only, not permission for irreversible actions.
- verification: array of {id, command, scope, required}; command can be null for a
  read-only structural inspection, scope is a string, required is boolean.
- research_required: boolean, default false.

Every execution prompt carries the whole subtask, plan_revision, prerequisite
reports and applicable authorization. Resolve missing scope before concurrent
writes. A changed task scope gets a new plan_revision and revised authorization.
Do not emit risks, final_notes or string subtask IDs.

```json
{
  "schema_version": 1,
  "plan_revision": "request-1-v1",
  "objective": "Document a configuration option",
  "subtasks": [{
    "id": 1,
    "description": "Document the timeout option in README.md",
    "target": "jinyiwei",
    "domain": "docs",
    "dependencies": [],
    "acceptance": "README describes the timeout units and default accurately",
    "write_scope": ["README.md"],
    "authorized_scope": [],
    "verification": [{"id": "option-doc", "command": null, "scope": "README.md and option definition", "required": true}],
    "research_required": false
  }],
  "risk": "low"
}
```

## Review Verdict

{schema_version: 1, verdict: "pass"|"veto", notes: string,
severity: "low"|"medium"|"high"}. A veto includes concrete corrections. An unavailable
review is not a pass; preserve uncertainty in strategy notes.

## Execution Report

Required fields:
- schema_version: 1
- plan_revision: the executed Strategy revision
- subtask_id: integer matching the assigned item
- summary: string describing actual outcome
- files_modified: string array of actual changed paths
- verification: array of {id, command, scope, status, exit_code, summary}
- incomplete_items: string array (empty only when nothing remains)
- research_evidence: array of {source, claim}; [] when no research was required

Check status: passed|failed|not_run|unavailable|not_applicable. exit_code is integer
or null (non-command checks/unexecuted commands). passed requires actual evidence;
not_applicable needs an explicit reason and cannot exempt a genuinely required
check. A nonzero exit is never passed. Report missing required checks as incomplete.
Include every planned check exactly once by id; additional checks have distinct IDs.
An assumption without supporting evidence does not satisfy required research.

Signal answer only when incomplete_items is empty, required checks are satisfied
and the assigned acceptance condition has supporting evidence. Otherwise emit
escalate with the partial report as defined below. Record any remaining requirement
in incomplete_items even when its check was omitted from the original plan.
The worker report enables dependency scheduling; independent Validator acceptance
is still required. A result fence alone is not permission to advance consumers.

## Validate Result

{schema_version: 1, plan_revision: string, verdict: "pass"|"revise",
items: [{id: integer, status: "pass"|"revise", note: string}]}.

Include every approved subtask exactly once, including previously passing items.
Aggregate pass requires every item pass and all required checks satisfied on the
current workspace. Excluded tasks are identified by the coordinator, not silently
omitted by Validator. Recheck affected integrations after revisions. Unavailable
verification is revise with a precise note, not a fabricated pass.
If relying on a prior independent check, cite its graph/node/check identity in note,
with the basis for unchanged inputs; retain actual command/output records for the
coordinator. If those records are missing, the check cannot be reused.
Signal answer for pass; revise_needed for revise. Both carry this same object.
The validator's local revise_items artifact is not visible in the parent session.

## Approval Request and Decision

Gate request: {schema_version: 1, plan_revision, strategy, proposed_ids,
action, authorized_scope}. Execution discovery: {schema_version: 1,
plan_revision, subtask_id, action, authorized_scope, completed_work, remaining_work}.
Strings/arrays must contain concrete scope, not blanket "all actions" approval.

Decision payload: {schema_version: 1, plan_revision, approved_ids, authorized_scope}.
Recover the request from the graph node before accepting a decision. Filter skipped
IDs and their transitive dependents. Graph approval completes the gate; a new worker
executes remaining work. Read graph-protocol.md before resolving runtime discovery.

For a resolved prerequisite/clarification pause, additionally record resolution:
{source, summary}. This is evidence resolving that blocker, not new authorization
for unrelated actions. The actual decision must match the producer's request.

## Other execution signals

Common fields: {schema_version: 1, plan_revision, subtask_id, reason,
completed_work: string[], remaining_work: string[]}. Use concrete evidence and
preserve actual changed paths in completed_work or a nested Execution Report.

| Signal | Additional fields | Meaning |
|---|---|---|
| blocked | blocker, needed_evidence | A concrete prerequisite is unavailable; pause and preserve work |
| need_clarification | question, options: string[] | A user decision materially affects correctness/scope; pause |
| escalate | category, attempts: string[], report: ExecutionReport or null | Cannot complete this run; terminate without releasing answer-only consumers |
| handoff | suggested_domain, context | Routing suggestion only; does not dispatch or complete work |
| progress | milestone, evidence: string[] | Informational progress only; does not establish completion |

category is acceptance_failure, prerequisite_failure, scope_mismatch, tool_failure
or protocol_failure. A partial report is required if any execution/checks occurred;
null is permitted only before work started. Missing required checks are failures of
acceptance even when the cause is unavailable tooling. Preserve both the gap and cause.
Do not issue answer after any pause/escalation. Handoff cannot substitute for a
terminal signal: if the assigned work cannot continue, emit escalate(scope_mismatch)
with the remaining scope. Leaf workers never dispatch their suggested replacement.
Routers preserve the child's payload and attach graph_chain: [{graph_id, node_id}]
from outer router to innermost worker; do not replace a child failure with answer.

These describe producer intent. Graph state may normalize a paused signal; follow
graph-protocol.md to recover its original cause and retire the paused node safely.

## Revision Context

Include plan_revision, revision_round and continuation_index (nonnegative integers),
repair_limit (finite nonnegative integer, default 2), limit_reason (required for a
non-default limit), complete original subtask and prior Execution Report. These
counters/limits are coordinator run context, not evidence that checks have passed.
A repair includes the worker
or validator finding and correction direction; a continuation includes resolution
of the blocker, any required authorization, and completed/remaining work.
Read existing files first;
never assume a checkpoint restores the original session or guarantees idempotence.
