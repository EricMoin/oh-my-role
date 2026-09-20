# Emperor

A read-only coordinator for planning, scoped execution and independent verification.
Version 2.12 uses staged rolebox graph_v2 graphs and versioned JSON task contracts.

Read-only requests are answered directly. Clear changes use a compact execution
Strategy plus validation, even across files when dependencies are clear. Uncertain
work goes to Chancellor, which drafts once and requests independent review for
unresolved assumptions, shared invariants or consequential effects. Drafter handles review
corrections; Finalizer is optional reconciliation, not a mandatory extra hop.

Known domains dispatch directly to one of eight department workers. Jinyiwei is the
general executor and fallback router. The canonical department list is generated
from [departments.json](references/departments.json); see [departments.md](references/departments.md).

The runtime flow is plan if needed → approve if needed → execution DAG → validation.
Each stage has its own graph. Failed acceptance uses a fresh DAG containing the
failed and transitively affected items. The coordinator records a task-appropriate
finite repair limit before execution (default two); approval/clarification
continuations have their own counter and do not spend repair rounds. Every round
assesses all approved items against the current workspace, including regressions.
Unchanged checks may reuse recorded independent Validator evidence only when all
relevant inputs remain unchanged; worker self-reports cannot replace it.
Only transient low-level failures use graph_run retry; that operation resets the
target and its downstream, so dependents are not individually retried again.

Approval is durable graph state bound to a plan_revision and action scope. Existing
explicit authorization is honored. An approval gate performs no mutation. Runtime
risk discovery stops the worker before the action; resolving that gate completes
it, so remaining work runs in a fresh continuation after descendants are retired.
Approval is never reported as evidence that an operation executed.

Execution and validation functions require explicit outcome signals, not only a
result fence. Incomplete work escalates with its partial report so answer-only
consumers do not start. Graph BLOCKED can also represent a missing prerequisite or
clarification; recover the producer's original question before resolving it.

All department workers explicitly enable execution tools and load portable shared
research, execution-contract and verification skills. Graph mutation tools are
disabled on leaves. Verification follows repository instructions and applicable
checks; prose work does not require fabricated LSP or test evidence.

The protocol is in [graph-protocol.md](references/graph-protocol.md), payloads in
[schemas.md](references/schemas.md), and executable topology examples in
[graph-examples.json](references/graph-examples.json). Examples show topology only;
replace their prompts with the actual full contracts before live execution.

## Validation

From the repository root (Python requires PyYAML):

```sh
python scripts/sync_emperor.py --check
python scripts/validate.py
python -m unittest discover -s scripts/tests -v
```

With a sibling rolebox checkout and its dependencies installed:

```sh
bun test --isolate scripts/tests/emperor-rolebox.test.ts
```

Set ROLEBOX_DIR for another checkout location. Integration tests use rolebox's real
loader, resolver and graph engine with a fake dispatch port; they do not launch
models or external operations. Behavioral prompts are in evals/evals.json and
require a separate model evaluation run. No full rolebox test suite is required.
See [evals/README.md](evals/README.md) for the decision review and behavioral test
scope. Passing engine tests alone does not establish model quality or latency gains.

After editing departments.json or canonical shared skills under Jinyiwei, run
`python scripts/sync_emperor.py`. Validation rejects stale generated copies and
unreachable/misconfigured departments.
