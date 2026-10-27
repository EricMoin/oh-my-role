# Rust review graphs

Use the installed rolebox Graph v3 tools and their current schemas. The lead owns
production edits, review selection and acceptance. Specialists inspect a stable
implementation snapshot; the source tracer can also answer a specific pre-implementation
question, without approving unwritten code. Ordinary bounded work needs no graph.

## Select the evidence needed

| Role | Node ID in examples | Result |
| --- | --- | --- |
| `rust-engineer--safety-reviewer` | `safety` | Gate report: pass, revise or escalate |
| `rust-engineer--async-auditor` | `async` | Gate report: pass, revise or escalate |
| `rust-engineer--api-reviewer` | `api` | Gate report: pass, revise or escalate |
| `rust-engineer--perf-profiler` | `performance` | Gate report: pass, revise or escalate |
| `rust-engineer--cross-platform-checker` | `cross-platform` | Gate report: pass, revise or escalate |
| `rust-engineer--source-tracer` | `source-behavior`, `source-versions` | Source evidence report: report |

Choose reviewers for named material risks in the actual change and its affected callers.
Keywords, file counts and the number of domains do not mandate a graph or select a tier.
A single relevant gate is valid. Include additional gates when their independent review
adds necessary coverage; do not discard a material risk merely because three gates have
already been selected. Record how unreviewed risks are checked or remain unverified.

Independent questions stay independent roots with `edges: []`. Add an evidence producer
only when a specific unresolved fact affects a consumer's decision. Reuse already verified
facts when their snapshot, dependency version and target remain applicable. A report that
contains a negative finding or an essential unknown still settles `report`; it is not a
passing product review.

## Declare and inspect the actual start

The lead submits one complete declaration through `graph_declare({declaration: ...})`.
Use `version: 3`, a request/snapshot-specific `name`, explicit node completion, declared
outcomes and finite budgets. Set `budget.max_executions` to the planned dispatch count
plus any justified recovery allowance; each retry consumes another execution. The samples'
300-second node timeouts are examples, not a promise that every check fits that duration.
There is no `max_retries` field. These examples use no engine-managed repair cycle,
acceptance validator or approval node; the lead owns repairs and user-facing decisions.

Inspect both the persisted plan and `start.kind`. Only `started` or `resumed` confirms
actual dispatch; `saved`, `blocked` and `refused` do not. A saved declaration is not proof
that a worker ran. Follow the registered host's control/recovery interface after diagnosing
the reason; do not invent a separate run tool or declare duplicates while startup is slow.

Node `tools` metadata does not grant or restrict tools, and tool presentation does not
change authorization. Read-only scope and snapshot stability are worker/lead contracts,
not per-node filesystem isolation supplied by the graph. Follow the installed host's
actual permissions. Schema prose also does not install a runtime validator: these examples
check outcome identity through the engine, while the lead checks report content against
`references/schemas.md` before using it.

## Independent gate catalog

This executable sample exercises all five gate identities. It is a catalog, not a required
batch. For real work retain only relevant nodes, replace every prompt with the actual brief,
rename the graph and size its execution budget. A one-node selection keeps `edges: []`.

```json
{
  "version": 3,
  "name": "rust-review-sample-r0",
  "budget": {
    "max_executions": 5
  },
  "nodes": [
    {
      "id": "safety",
      "agent": "rust-engineer--safety-reviewer",
      "prompt": "Replace this template with the implemented snapshot identity, actual diff and readable source paths, the concise Engineering brief, check results, and one material question about unsafe and FFI contracts, pointer validity, ownership transfer, ABI and unwinding. Specify the read-only scope and any assigned commands with their permitted build outputs. Load rust-safety-gate. Use the Gate report in references/schemas.md. Return pass when the evidence supports no blocking issue in scope, revise for a concrete failure mechanism with stable issue IDs, or escalate for essential missing evidence. A preferred pattern alone is not a blocker. Do not edit source, manifests, lockfiles, fixtures or git state.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "pass"
        },
        {
          "id": "revise"
        },
        {
          "id": "escalate"
        }
      ]
    },
    {
      "id": "async",
      "agent": "rust-engineer--async-auditor",
      "prompt": "Replace this template with the implemented snapshot identity, actual diff and readable source paths, the concise Engineering brief, check results, and one material question about task ownership, cancellation, shutdown, synchronization and backpressure. Specify the read-only scope and any assigned commands with their permitted build outputs. Load rust-async-gate. Use the Gate report in references/schemas.md. Return pass when the evidence supports no blocking issue in scope, revise for a concrete failure mechanism with stable issue IDs, or escalate for essential missing evidence. A preferred pattern alone is not a blocker. Do not edit source, manifests, lockfiles, fixtures or git state.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "pass"
        },
        {
          "id": "revise"
        },
        {
          "id": "escalate"
        }
      ]
    },
    {
      "id": "api",
      "agent": "rust-engineer--api-reviewer",
      "prompt": "Replace this template with the implemented snapshot identity, actual diff and readable source paths, the concise Engineering brief, check results, and one material question about public contracts, downstream compatibility, error types, features and MSRV. Specify the read-only scope and any assigned commands with their permitted build outputs. Load rust-api-gate. Use the Gate report in references/schemas.md. Return pass when the evidence supports no blocking issue in scope, revise for a concrete failure mechanism with stable issue IDs, or escalate for essential missing evidence. A preferred pattern alone is not a blocker. Do not edit source, manifests, lockfiles, fixtures or git state.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "pass"
        },
        {
          "id": "revise"
        },
        {
          "id": "escalate"
        }
      ]
    },
    {
      "id": "performance",
      "agent": "rust-engineer--perf-profiler",
      "prompt": "Replace this template with the implemented snapshot identity, actual diff and readable source paths, the concise Engineering brief, check results, and one material question about the measured workload, baseline, allocation or contention mechanism and benchmark validity. Specify the read-only scope and any assigned commands with their permitted build outputs. Load rust-perf-gate. Use the Gate report in references/schemas.md. Return pass when the evidence supports no blocking issue in scope, revise for a concrete failure mechanism with stable issue IDs, or escalate for essential missing evidence. A preferred pattern alone is not a blocker. Do not edit source, manifests, lockfiles, fixtures or git state.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "pass"
        },
        {
          "id": "revise"
        },
        {
          "id": "escalate"
        }
      ]
    },
    {
      "id": "cross-platform",
      "agent": "rust-engineer--cross-platform-checker",
      "prompt": "Replace this template with the implemented snapshot identity, actual diff and readable source paths, the concise Engineering brief, check results, and one material question about the affected target and feature matrix, build-script target detection and portable behavior. Specify the read-only scope and any assigned commands with their permitted build outputs. Load rust-platform-gate. Use the Gate report in references/schemas.md. Return pass when the evidence supports no blocking issue in scope, revise for a concrete failure mechanism with stable issue IDs, or escalate for essential missing evidence. A preferred pattern alone is not a blocker. Do not edit source, manifests, lockfiles, fixtures or git state.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "pass"
        },
        {
          "id": "revise"
        },
        {
          "id": "escalate"
        }
      ]
    }
  ],
  "edges": []
}
```

## Optional evidence dependency

Use this pattern only when both the runtime behavior and the resolved dependency context
are unresolved and matter to the async review. If one fact is already established, omit
that producer and update the consumer's `inputs`, edges and brief together. If neither fact
needs independent investigation, use the ordinary async gate instead. The same pattern
can feed a safety, API, platform or performance gate when that is the actual dependency.

```json
{
  "version": 3,
  "name": "rust-evidence-review-sample-r0",
  "budget": {
    "max_executions": 3
  },
  "nodes": [
    {
      "id": "source-behavior",
      "agent": "rust-engineer--source-tracer",
      "prompt": "Replace this template with the snapshot identity, readable manifests, lockfile and dependency source paths, and a focused question about the cancellation or drop behavior of the exact runtime API used by the changed call chain. Load rust-source-tracing. Stay read-only and return the Source evidence report from references/schemas.md, with outcome_id report and status complete or partial. Cite the version and inspected evidence; preserve unknowns. report means the assigned investigation returned evidence, not that the product passed.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "report"
        }
      ]
    },
    {
      "id": "source-versions",
      "agent": "rust-engineer--source-tracer",
      "prompt": "Replace this template with the snapshot identity, readable manifests, lockfile and dependency source paths, and a focused question about the resolved runtime package version, enabled features, target and source revision governing that API. Load rust-source-tracing. Stay read-only and return the Source evidence report from references/schemas.md, with outcome_id report and status complete or partial. Cite the version and inspected evidence; preserve unknowns. report means the assigned investigation returned evidence, not that the product passed.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "report"
        }
      ]
    },
    {
      "id": "async",
      "agent": "rust-engineer--async-auditor",
      "prompt": "Replace this template with the implemented snapshot, changed task lifecycle, ownership and shutdown invariants, check results, read-only scope and the concrete async review question. Consume the declared source-behavior:report and source-versions:report inputs as evidence using references/schemas.md; match their snapshot and version scope to the reviewed code. A partial report is not a pass. If missing evidence is essential and cannot be resolved in the assigned scope, return escalate with the exact gap. Otherwise assess the supported findings using rust-async-gate and return pass, revise or escalate as a Gate report. Do not edit source, manifests, lockfiles, fixtures or git state.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "pass"
        },
        {
          "id": "revise"
        },
        {
          "id": "escalate"
        }
      ],
      "join": {
        "strategy": "all"
      },
      "inputs": [
        {
          "from": "source-behavior",
          "outcome": "report"
        },
        {
          "from": "source-versions",
          "outcome": "report"
        }
      ]
    }
  ],
  "edges": [
    {
      "from": "source-behavior",
      "to": "async",
      "outcome": "report"
    },
    {
      "from": "source-versions",
      "to": "async",
      "outcome": "report"
    }
  ]
}
```

An edge routes an accepted outcome; it does not itself deliver the payload. Each consumer
also declares the matching `inputs: [{from, outcome}]`. `join: {strategy: "all"}` waits
for both accepted reports in this example, including reports with `status: partial`.
The engine does not inspect that business status or decide whether evidence is sufficient.
The consumer checks snapshot identity, version scope, findings and unresolved questions.
An essential unresolved gap produces `escalate`; a supported defect produces `revise`.
Neither a partial report nor a completed graph authorizes acceptance by itself.

## Node briefs and snapshot ownership

Every prompt includes the goal, existing authorization, actual artifact/diff identity,
readable paths, concrete question, relevant project facts, invariants and recorded checks.
Use the concise Engineering brief and report contracts in `references/schemas.md`.
Include uncommitted changes in the snapshot; HEAD alone does not identify a dirty tree.
Provide a retained diff/artifact or digest sufficient to identify the reviewed contents.
Sessions do not inherit the lead's conversation; provide facts they actually need.

Workers do not edit source, manifests, lockfiles, fixtures or git state. The brief may
permit build artifacts under `target/` for assigned checks. Inspect command effects and
use the project's pinned toolchain; checks must not update dependency resolution, install
tools or trigger unapproved build-script side effects. Prefer existing results and cached
source for evidence collection when execution would exceed that scope. Missing evidence
must remain explicit.

Do not edit a running reviewer's target files. Continue unrelated work while it runs and
wait only when its result blocks the next decision. A changed snapshot needs a fresh
review declaration with a new name and updated brief. Before acceptance, confirm that the
reports and selected checks still cover the final code. Evidence from an earlier snapshot
can inform a repair but cannot certify the repaired behavior.

## Results, recovery and bounded repairs

On GRAPH COMPLETE or GRAPH BLOCKED, read committed state through
`graph_status({graph_id, scope: "all", format: "json", include_output: true, include_history: true})`.
Select the intended `run_id` and `node_id`; read `attempts[].accepted` for accepted outcome
identity and `attempts[].result` for its report. Notifications may be delivered more than
once and are not business reports. Narrow status by run/node if needed; poll only to
recover a missing notification, not as a busy loop.

Read every required report. Check schema version, required fields, snapshot and the
status/outcome mapping. `engineering_state_patch` is only a proposed fact correction;
the lead checks it before merging. Reconcile disagreements using concrete mechanisms and
project contracts. Unsupported preferences do not compel edits. Complete graph phase can
coexist with `revise`, `escalate` or partial evidence.

Use `graph_control` for diagnosed transient retry, superseded work, timeout or budget stop.
A retry creates a new attempt and spends execution budget; it cannot override a finding.
Confirm termination before reusing a worker's snapshot or starting overlapping work.
A stopped run may require run-wide recovery; follow the actual control result. Diagnose
storage problems with `graph_audit`, never delete graph state to clear a blocker.

The lead applies justified revisions and reruns affected checks. When independent review
is still needed, declare the changed snapshot with stable issue IDs and prior findings.
After two unsuccessful substantive repair attempts for the same mechanism, diagnose the
remaining blocker and report it; a new node, gate or graph does not reset that count.
Continue independent actionable work and ask the user only for unresolved intent or a
constraint they must decide. Never relabel an unresolved blocker as a pass to end the loop.

If graph execution is unavailable, the lead may perform the relevant review inline and
must disclose the missing independence. Finish when the requested behavior is supported
on final code with no supported blocker, or report the exact remaining verification gap.
