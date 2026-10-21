# Emperor

A read-only coordinator for scoped implementation and behavior-focused testing.
Version 4.0 targets the current rolebox Graph v3 implementation in Pi and dsh.

Emperor owns graph_declare, graph_control, graph_status and graph_audit. All
dispatched agents submit their own explicit graph_submit_outcome. Chancellor
produces a Strategy and review recommendation; Emperor schedules Reviewer, Drafter
and optional Finalizer directly. Known domains go directly to the eight departments;
Jinyiwei executes unknown-domain work or returns a routing suggestion.

Read-only questions stay direct. Clear changes use a compact Strategy and workers
that own the relevant checks; uncertain scope gets planning first. Dependencies route
only on accepted done outcomes, and consumers declare the upstream inputs they need.
Failed, blocked, clarification_required and approval_required never release done-only
consumers. Required checks and incomplete work are explicit in Execution Reports.

There is no mandatory post-execution Validator. Use the Test department when a change
needs dedicated regression cases, fixtures or integration coverage. It writes and runs
behavior-focused tests and returns a normal Execution Report. Small changes with
adequate existing coverage can finish through their implementation worker. Keep
cohesive implementation and tests together, or assign separate Test work explicit
file ownership and acyclic dependencies.

Test reads the diff and affected callers, designs assertions that detect relevant
defects, and reproduces the original regression when feasible. It runs selected
cases/files or affected packages by default, expanding only for concrete impact or
explicit repository/user requirements. Full suites are exceptional; shared required
gates have one owner and run once for the relevant inputs. Reuse recorded current
checks without another session or workspace-wide digest bookkeeping. See
[test-design](subagents/jinyiwei/subagents/test/skills/test-design/SKILL.md).

Upgrade from 3.x: remove `emperor--validator` nodes and Validate Result consumers.
Assign actual missing test work to `emperor--jinyiwei--test` with normal execution
outcomes; do not rename a judge node into Test. Stop emitting validate_limit,
validate_limit_reason and consumed validation-round counts. Defect repairs still
preserve their request-wide budget.

Approval preparation persists the exact request, not permission. Emperor honors
existing authorization and records the actual user's decision in the next stage.
Host-enforced approval separately requires the installed principal-approval policy
and authorized approver session. A control decision neither submits an outcome nor
performs the operation. Missing host authority must not be bypassed.

Every declaration has an execution ceiling and explicit completion. Defect repairs
use fresh graphs with a preserved request repair count; approval/clarification
continuations have a separate counter and do not spend repair rounds. Runtime retries
create new attempts/runs and require safe side-effect recovery. Notifications are
wakeups to read committed state; duplicate notifications are not new work. Unreadable
state is a blocker.

Execution requirements are part of the contract: a dispatched worker on a
command-only host holds only graph_submit_outcome and graph_worker_exec, with writes
confined to the workspace and a disposable environment that has no credentials and
no host caches. A plan that needs a credential, a push, a publish, a deployment or
any other host state states that as a requirement and is not dispatched as though the
worker could perform it. Such a refusal is reported as failed(category:
boundary_denial) naming the exact path, command and restriction; the coordinator
recovers the work in a context that holds the capability instead of retrying it
inside the same boundary.

The graph.orchestration selector is omitted: the current loader recognizes only the
old graph_v2 spelling and gives it no runtime effect. It does not select declaration
version 3. Old incremental graph tools and signal-based completion are unsupported.
Historical notes live outside the discoverable references directory in archive/.

The protocol is in [graph-protocol.md](references/graph-protocol.md), business
payloads in [schemas.md](references/schemas.md), department IDs in
[departments.md](references/departments.md), and topology templates in
[graph-examples.json](references/graph-examples.json). Supply full task contracts
before executing templates. Host schemas/validators must be installed separately;
these role assets do not make self-reported verification engine-trusted.

## Validation

From the repository root (Python requires PyYAML):

```sh
python3 scripts/sync_emperor.py --check
python3 scripts/validate.py
python3 -m unittest discover -s scripts/tests -p 'test_emperor_contract.py' -v
bun test --isolate scripts/tests/emperor-rolebox.test.ts
```

The Bun tests use a sibling rolebox checkout and its installed dependencies; set
ROLEBOX_DIR for another location. They exercise the real loader/resolver, strict v3
parser, SQLite acceptance store, worker boundary and control tools with scripted
dispatch. They make no model calls and do not certify live model behavior.
See [evals/README.md](evals/README.md) for behavioral coverage and its limits.

After editing departments.json or canonical shared skills under Jinyiwei, run
`python3 scripts/sync_emperor.py`. Validation rejects stale generated copies,
unreachable departments, worker orchestration permissions and obsolete completion
conditions. No rolebox full test suite is required.
