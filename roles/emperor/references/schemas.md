---
name: schemas
description: Versioned inter-agent payloads and producer/consumer contracts
---
# Inter-agent contracts (schema_version: 1)

All role-authored business payloads are JSON objects with schema_version: 1.
Submit them as graph_submit_outcome.data using the declared outcome_id. Accepted
attempt results are the transport authority. Optional result/plan/draft/final_strategy
fences mirror data for readability only; they never release consumers. Credentials
must not appear in business data. Reject unknown versions, missing fields and IDs.
The Strategy plan_revision is separate from the engine's compiled plan_revision.
Host controls, failed executions and notifications are not business reports.

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
  read-only structural inspection, scope is a string, required is boolean. Keep the
  set proportional to write_scope: the narrowest command that establishes the
  condition for the changed paths and their direct callers. A whole-project typecheck
  or full test suite is a revision-level check, not an item check, and MUST NOT be
  added to every subtask.
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

Submit done only when incomplete_items is empty, required checks are satisfied
and the assigned acceptance condition has supporting evidence. Otherwise submit
failed with the partial report as defined below. Record any remaining requirement
in incomplete_items even when its check was omitted from the original plan.
The worker report enables dependency scheduling; independent Validator acceptance
is still required. A result fence alone is not permission to advance consumers.

## Validate Result

{schema_version: 1, plan_revision: string, verdict: "pass"|"revise",
workspace_digest: string,
items: [{id: integer, status: "pass"|"revise", basis: "rerun"|"carried", note: string,
check: {check_id: string, command: string, tool_path: string, tool_version: string,
exit_code: integer, input_digest: string, current_digest: string},
rerun_reason: string|null,
carried_from: {graph_id: string, node_id: string, check_id: string, command: string,
tool_path: string, tool_version: string, exit_code: integer, input_digest: string,
current_digest: string, unchanged_paths: string[]}|null}]}.

Include every approved subtask exactly once and give each one a current verdict.
Aggregate pass requires every item pass and all required checks satisfied on the
current workspace. Excluded tasks are identified by the coordinator, not silently
omitted by Validator. Recheck affected integrations after revisions. Unavailable
verification is revise with a precise note, not a fabricated pass.

basis is required. A rerun basis means the check ran in this round and requires a
nonempty rerun_reason naming the changed input or the uncertainty that forced it, plus
the executed check record in check. check is required on every item, carried or rerun,
and is the record a later round can carry: for a rerun it is the check executed in this
round; for a carried item it is the prior executed check the Validator re-verified,
with current_digest recomputed. It holds check_id, the command as run, the resolved
tool path and the tool's reported version, its exit code, input_digest of the inputs
the command read and current_digest for the revision the digest was recomputed
against. check records the check that establishes the item's verdict; when an item's
verification array declares several required checks, every one of them must satisfy
the carrier conditions, and the item's check input set is the union of their input
sets. A carried basis reuses prior independent evidence and requires the complete
carried_from record plus unchanged_paths, including the prior resolved tool path and
reported tool version; the Validator recomputes workspace_digest and current_digest
itself. Missing, incomplete or unverifiable carrier data is refused and becomes a
rerun, and a prior check that recorded no check record can never be carried. The
carrier eligibility rules, the digest construction and the coordinator
no-duplicate-checks rule are in graph-protocol.md.

Compatibility read: a Validate Result produced before this contract, whose items have
no basis and no check, is read as a rerun with no reusable record. Such an item can
still pass its round, but it establishes no carried evidence and grants no reuse; an
absent field never upgrades evidence. An unknown basis value is refused. schema_version
stays 1: this is a required field extension consumed only inside this role tree, and the
legacy read is conservative in the safety direction.

Submit pass or revise with this object as data. The parent reads the accepted
attempt result, not a local artifact.

## Approval Request and Decision

Gate request: {schema_version: 1, plan_revision, strategy, proposed_ids,
action, authorized_scope}. Execution discovery: {schema_version: 1,
plan_revision, subtask_id, action, authorized_scope, completed_work, remaining_work}.
Strings/arrays must contain concrete scope, not blanket "all actions" approval.

Decision record: {schema_version: 1, plan_revision, approved_ids, authorized_scope}.
Recover the exact request from accepted graph data. Filter skipped IDs and their
transitive dependents. Persist the actual user decision and request graph/run/node
identity in the continuation prompt. This business record is not a graph_control
argument and does not grant host approval authority. Host-enforced approval follows
graph-protocol.md; control decisions do not complete unperformed work.

For a resolved prerequisite/clarification request, also record resolution:
{source, summary}. This resolves that blocker, not authorization for unrelated work.

## Non-success execution outcomes

Common fields: {schema_version: 1, plan_revision, subtask_id, reason,
completed_work: string[], remaining_work: string[]}. Use concrete evidence and
preserve actual changed paths in completed_work or a nested Execution Report.

| Outcome | Additional fields | Meaning |
|---|---|---|
| blocked | blocker, needed_evidence | A concrete prerequisite is unavailable; pause and preserve work |
| clarification_required | question, options: string[] | A user decision materially affects correctness/scope; pause |
| failed | category, attempts: string[], report: ExecutionReport or null | Cannot complete this run; terminate without releasing done-only consumers |

Routing suggestions use failed(category: scope_mismatch) with suggested_domain and
context. Progress updates are prose only; they never settle an attempt.

category is acceptance_failure, prerequisite_failure, scope_mismatch, tool_failure
or protocol_failure. A partial report is required if any execution/checks occurred;
null is permitted only before work started. Missing required checks are failures of
acceptance even when the cause is unavailable tooling. Preserve both the gap and cause.
Do not submit done after another outcome settles. Workers cannot dispatch a
replacement or read sibling credentials. Only Emperor schedules remaining work.
These are distinct business outcomes; none is automatically normalized to approval
or interpreted as graph_control. The coordinator inspects the accepted outcome
and data, then follows graph-protocol.md for containment and continuation.

## Revision Context

Include plan_revision, revision_round and continuation_index (nonnegative integers),
repair_limit (finite nonnegative integer, default 2), limit_reason (required for a
non-default limit), validate_limit (finite nonnegative integer, default 3),
validate_limit_reason (required for a non-default limit), the consumed validate-round
count, complete original subtask and prior Execution Report. These counters/limits are
coordinator run context, not evidence that checks have passed.
A repair includes the worker
or validator finding and correction direction; a continuation includes resolution
of the blocker, any required authorization, and completed/remaining work.
Read existing files first;
never assume a checkpoint restores the original session or guarantees idempotence.
