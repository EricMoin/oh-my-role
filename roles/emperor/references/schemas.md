---
name: schemas
description: Versioned inter-agent payloads and producer/consumer contracts
---
# Inter-agent contracts (schema_version: 1)

All machine payloads are JSON objects with schema_version: 1. A producer emits
identical JSON in signal payload and result fence. Strategy may additionally appear
in plan/draft/final_strategy fences; these are local artifacts, not cross-session
transport. Read node outputs/signals as specified in graph-protocol.md. Reject
conflicting channels, unknown versions, missing required fields and unknown IDs.

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
An assumption without supporting evidence does not satisfy required research.

## Validate Result

{schema_version: 1, plan_revision: string, verdict: "pass"|"revise",
items: [{id: integer, status: "pass"|"revise", note: string}]}.

Include every approved subtask exactly once, including previously passing items.
Aggregate pass requires every item pass and all required checks satisfied on the
current workspace. Excluded tasks are identified by the coordinator, not silently
omitted by Validator. Recheck affected integrations after revisions. Unavailable
verification is revise with a precise note, not a fabricated pass.
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

## Revision Context

Include plan_revision, round (1 or 2), complete original subtask, prior Execution
Report, validator finding and correction direction. Runtime continuation also
includes explicit approval and completed/remaining work. Read existing files first;
never assume a checkpoint restores the original session or guarantees idempotence.
