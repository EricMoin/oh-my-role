# rolebox graph v3 protocol

These contracts follow rolebox's graph v3 outcome protocol. The active runtime's tool schema
is authoritative if its version differs. No shell command substitutes for calling the
engine's graph tools during role execution.

## Tools

| Tool | What it does | Who may call it |
|---|---|---|
| `graph_declare({declaration})` | Strict parse, compile, capability preflight, persist and start/resume one graph in a single call; returns the persisted plan and `start.kind` | The declaring session (this role's parent) |
| `graph_submit_outcome({graph_id, node_id, outcome_id, credential, data})` | Settles the caller's own attempt with one declared outcome; the host derives attempt, submission and compiled-revision identity | Every worker, for its own node and attempt only |
| `graph_control` | Out-of-band control decisions: failure, cancel, timeout, retry, budget-stop, approval-request, approve, reject | The declaring session |
| `graph_status` | Reads committed state: phase, nodes, attempts, controls, approvals, budget, unsettled effects | The declaring session |
| `graph_audit` | Diagnoses storage and recovery blockers without mutating state | The declaring session |

Workers use `graph_worker_exec` for reading, editing, checks and commands in their workspace
sandbox. Tool availability does not enlarge the role's or the node's scope.

## Declaration shape

`graph_declare` receives the whole object: `version: 3`, `name` (the graph id), a finite root
`budget.max_executions`, `nodes` and `edges`. Every node declares `outcomes`, `completion:
{mode: "explicit"}` and `budget.timeout_ms`; every edge is `{from, to, outcome}` and binds an
outcome its source node declares. A consumer declares `inputs: [{from, outcome}]` for each
upstream result it reads and `join: {strategy: "all"}` when every prerequisite must complete.
A repair target uses `{from: "review", outcome: "revise", when: "triggered"}` alongside any
ordinary required inputs. This reference must have a matching direct incoming edge. It is
inactive on entry or another route, and mandatory when that edge contributes to dispatch.
Its payload and artifacts come from the contributing attempt, and retries retain that binding.
A cycle exists only inside a `loop_groups` entry carrying `max_traversals`,
`continuation_outcome` and `exit_outcome`, and every edge carrying the continuation outcome
stays inside its group. At least one declared outcome stays unbound so the graph can
terminate. `max_retries` is rejected even as `0`, and `acceptance`, `contractRef` and
`completion_policy` require host-installed capabilities.

## Declared outcome vocabulary

| Node mode | Declared outcomes | Meaning |
|---|---|---|
| Change application | `done` | Requested edit and its local checks are recorded; independent review follows |
| Change application | `failed`, `blocked`, `clarification_required` | Work incomplete, prerequisite missing, or a user choice required; never a passing report |
| Evidence / investigation | `report` | Observation recorded, including a failing check; not a product verdict |
| Review / synthesis | `pass`, `revise` | Required criteria supported, or concrete correctable defects with stable items |
| Approval preparation | `approval_required` | A request prepared by a non-mutating proposal node; never permission |

Write the report before submitting it. Nothing else settles a v3 node: a prose answer, a
signal fence or an inferred completion is not an outcome, and only the declaration names the
outcome ids a node may submit.

## Acceptance semantics

- The only settling decision is `accepted` with verdict `committed` or `replayed` and no
  refusals. A rejection or refusal writes nothing and leaves the attempt open, so repair the
  payload or the missing evidence and resubmit.
- An identical retry after an uncertain delivery is idempotent; a conflicting submission
  cannot overwrite a settled attempt. Once accepted, stop work on that attempt.
- Routing follows accepted outcome ids, not payload keys: fields in a submitted data payload
  are inert data the engine never inspects. What bounds a repeated identical revision is the
  loop group's declared progress policy — the optional `{evaluator, version, subject,
  max_unchanged}`, whose `subject` names one outcome-data field compared across rounds. Keep
  the downstream discipline regardless: an accepting report should not carry unresolved arrays
  that contradict its own outcome, advisory limits belong in `limitations`, and the review
  node owns the routing verdict.
- An edge routes on exactly the accepted outcome bound to it, and a consumer is released only
  by the accepted results its declared inputs name. Node exit or graph phase proves neither.

## Controls

`graph_control` commands act on the plan, not on business data. `failure` records a failed
attempt out of band, distinct from the `failed` business outcome a worker submits. `retry`
mints a NEW attempt for a diagnosed transient failure and consumes budget. `cancel` contains
obsolete work and is not confirmed termination until state says so. `timeout` and
`budget-stop` record an exhausted node or run. `approval-request` raises host-enforced
approval for an IN-FLIGHT attempt and requires the installed policy plus the named approver
session. `approve`/`reject` record a control decision: they neither submit an outcome nor
perform the remaining action, and they do not resume an ended worker — the publication stays a
separate downstream action node. A control decision is not permission to skip a declared gate,
and a missing policy is a blocker.

## Reading state

Read `graph_status({graph_id, scope: "all", format: "json", include_output: true,
include_history: true})` and select the intended producer with `run_id`/`node_id`. Inspect
`attempts[].accepted` for the outcome identity and `attempts[].result` for the accepted data,
together with controls, approvals, budget and unsettled effects. JSON output is not paginated
by offset/max_chars; narrow by `run_id`/`node_id` if the host display truncates it. Graph
phase is not business success: a complete graph can still contain failed outcomes, an
exhausted loop group and unsettled effects. Use `graph_audit` for storage or recovery
blockers; never delete or recreate an unreadable store.

## Source locations for maintenance

In a rolebox checkout, verify protocol changes against:

- `src/graph/tools/graph-tools.ts` and `src/graph/tools/submit-outcome.ts`: tool schemas and
  the submission path for declare, submit, control, status and audit.
- `src/graph/compiler/parse-declaration-v3.ts` and `src/graph/compiler/compile.ts`: declaration
  grammar, compile rules, terminals and loop-group validation.
- `src/graph/outcome/runtime.ts` and `src/graph/outcome/acceptance.ts`: acceptance decisions,
  verdicts, refusals, attempt credentials and runtime budget.
- `src/graph/control/`: retry, stop, cancel and approval control commands.
- `src/graph/query/render.ts`: status and audit rendering, including JSON output.
- `src/loader/role-loader.ts` and `src/resolver/skill-resolver.ts`: child discovery, prompt
  loading and skill resolution.
