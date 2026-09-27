# Emperor

A read-only coordinator for scoped execution and independent verification.
Version 3.1 targets the current rolebox Graph v3 implementation in Pi and dsh.

Emperor owns graph_declare, graph_control, graph_status and graph_audit. All
dispatched agents submit their own explicit graph_submit_outcome. Chancellor
produces a Strategy and review recommendation; Emperor schedules Reviewer, Drafter
and optional Finalizer directly. Known domains go directly to the eight departments;
Jinyiwei executes unknown-domain work or returns a routing suggestion.

Read-only questions stay direct. Clear changes use execution plus validation;
uncertain scope gets planning first. Dependencies route only on accepted done
outcomes, and consumers declare the upstream inputs they need. Failed, blocked,
clarification_required and approval_required never release done-only consumers.
Reports remain subject to independent Validator checks of the current workspace.

Validation runs once per batch: after the initial validation of an approved set, a
validation graph follows a revise whose corrections have landed, or a change to the
approved item set. Each Validate Result item carries a basis of rerun or carried, and
the coordinator does not rerun a check the Validator already recorded for the same
revision digest.

Approval preparation persists the exact request, not permission. Emperor honors
existing authorization and records the actual user's decision in the next stage.
Host-enforced approval separately requires the installed principal-approval policy
and authorized approver session. A control decision neither submits an outcome nor
performs the operation. Missing host authority must not be bypassed.

Every declaration has an execution ceiling and explicit completion. Defect repairs
use fresh graphs and a preserved request repair count; validate rounds have a finite
validate_limit (default 3) with a preserved consumed count; approval/clarification
continuations have their own counter and spend neither. Runtime retries create new attempts/runs and
require safe side-effect recovery. Notifications are wakeups to read committed
state; duplicate notifications are not new work. Unreadable state is a blocker.

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
python scripts/sync_emperor.py --check
python scripts/validate.py
python -m unittest discover -s scripts/tests -p 'test_emperor_contract.py' -v
bun test --isolate scripts/tests/emperor-rolebox.test.ts
```

The Bun tests use a sibling rolebox checkout and its installed dependencies; set
ROLEBOX_DIR for another location. They exercise the real loader/resolver, strict v3
parser, SQLite acceptance store, worker boundary and control tools with scripted
dispatch. They make no model calls and do not certify live model behavior.
See [evals/README.md](evals/README.md) for behavioral coverage and its limits.

After editing departments.json or canonical shared skills under Jinyiwei, run
`python scripts/sync_emperor.py`. Validation rejects stale generated copies,
unreachable departments, worker orchestration permissions and obsolete completion
conditions. No rolebox full test suite is required.
