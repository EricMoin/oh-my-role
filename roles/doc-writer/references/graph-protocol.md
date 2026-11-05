# Doc Writer Graph v3 protocol

Doc Writer declares a Graph v3 plan only when one document cannot carry the whole job:
a multi-domain documentation set, independent surfaces that can be drafted in parallel,
or a draft that needs an independent prose review. Single-file work stays direct.

The installed runtime's tool schemas are authoritative. This reference records the
contract Doc Writer writes against; re-check it when the host or rolebox version changes.

## Staging, gate and publish

A drafted surface is not a deliverable until a gate has passed on its staged bytes. The order is
Stage → Gate → Publish → Deliver.

1. Drafting nodes write their candidate to `<repo>/.rolebox/doc-writer/<task-slug>/`, keeping the
   final path's relative structure below the task directory, and return that staging path in the
   report. A drafting node never writes the final path, updates an MR/PR/issue, or commits. An MR,
   PR, or issue description is staged as `description.md` in the task directory.
2. The lead merges the accepted drafts into the same staging tree. Integration stays in staging and
   does not touch a final destination.
3. The gate is a separate single-node graph declared after staging, with the staging paths and
   their intended final destinations in the brief. It is a different graph from the drafting plan,
   never a node inside it. It is read-only and returns `pass`, `revise` or `escalate`, findings, a
   fact ledger, and a Reviewed table with the sha256 of every staged path it read.
4. The Reviewed hashes are the publish input. After `pass`, the lead recomputes the staging sha256,
   matches the Reviewed table, and only then publishes: copy each file to its final path, verify the
   published hash, delete the staging tree, and update MR/PR/issue descriptions with `gh`/`glab`. A
   `revise` returns to staging and needs a successor gate; a hash mismatch means the bytes changed
   after the gate and also needs a new gate. A second `revise` stops publication. `escalate` stops
   publication.

The declaration grammar, tool surface and recovery rules below are unchanged. Staging and the hash
hand-off are the only additions to the lifecycle.

## Tool surface

| Tool | Holder | Purpose |
| --- | --- | --- |
| `graph_declare({declaration})` | declaring session | Parse, compile, persist and start one complete plan. The only start path. |
| `graph_control(command, ...)` | declaring session | Lifecycle commands on a run or attempt: failure, timeout, cancel, budget-stop, retry. |
| `graph_status({...})` | declaring session | Read committed runs, nodes, attempts, accepted outcomes and controls. |
| `graph_audit({...})` | declaring session | Read-only store inventory for diagnosis. |
| `graph_submit_outcome({...})` | worker | Settle the caller's own attempt with one outcome its node declares. |

A worker holds only `graph_submit_outcome`, and only for its own node and attempt. The
lead never submits a worker's outcome, and a worker never declares or controls a graph.
There is no separate run tool and no dry-run tool: `graph_declare` persists and starts.
Inspect its result; `started` and `resumed` are a real start, while `saved`, `blocked`
and `refused` are not. Diagnose a refusal instead of declaring duplicate work.

## Declaration shape

Author one declaration object per request. The whole topology is fixed before any
worker runs, and a declaration is immutable; a changed topology needs a new name.

| Field | Required | Meaning |
| --- | --- | --- |
| `version` | yes | The literal `3`. |
| `name` | yes | Request-scoped identity; the name is the graph id, so keep it fresh and specific. |
| `budget` | no | `{max_executions}` run ceiling; every attempt spends one execution. |
| `nodes` | yes | Worker node declarations; ids are unique. |
| `edges` | yes | `{from, to, outcome}` control edges; may be empty. |

Every node declares:

- `id`: a short, stable stage name such as `api-reference`.
- `agent`: the role catalog id, for example `doc-writer--api-writer`.
- `prompt`: the complete node brief; worker sessions share no conversation with the lead.
- `outcomes`: `draft_ready`, `blocked` and `failed` for a drafting node; `pass`, `revise` and `escalate` for the final gate node.
- `completion`: `{mode: "explicit"}`, so every settlement is a submitted outcome.
- `budget`: `{timeout_ms: 900000}`, or the actual ceiling for that task.
- `inputs`: only when the node consumes an upstream accepted result.

Do not author `max_retries`; automatic retry has no semantics in this build. Do not copy the
runtime handoff into the prompt; the runtime injects attempt identity, credential and settlement instructions with each node session.

## Topologies Doc Writer uses

A single node is a one-element `nodes` array with `edges: []`. Multi-entry means independent
root nodes with no edges; each node's `blocked` and `failed` outcomes are terminal exits.
Sequence only when a later document consumes an earlier draft: add the scheduling edge and
the consumer's input, because the edge routes the accepted outcome while the input delivers.

```json
{
  "version": 3,
  "name": "doc-writer-webhooks-sequence-20261103",
  "budget": {"max_executions": 4},
  "nodes": [
    {
      "id": "api-reference",
      "agent": "doc-writer--api-writer",
      "prompt": "<complete node brief>",
      "completion": {"mode": "explicit"},
      "budget": {"timeout_ms": 900000},
      "outcomes": [{"id": "draft_ready"}, {"id": "blocked"}, {"id": "failed"}]
    },
    {
      "id": "setup-guide",
      "agent": "doc-writer--guide-writer",
      "prompt": "<node brief that reads the accepted API draft>",
      "completion": {"mode": "explicit"},
      "budget": {"timeout_ms": 900000},
      "outcomes": [{"id": "draft_ready"}, {"id": "blocked"}, {"id": "failed"}],
      "inputs": [{"from": "api-reference", "outcome": "draft_ready"}]
    }
  ],
  "edges": [
    {"from": "api-reference", "to": "setup-guide", "outcome": "draft_ready"}
  ]
}
```

## Outcomes

| Outcome | Meaning |
| --- | --- |
| `draft_ready` | The complete candidate at its assigned staging path, plus evidence and open questions. |
| `blocked` | A required input, authorization or decision is missing; name the exact gap. |
| `failed` | The assigned work cannot be completed. |

`draft_ready` is not approval. The lead merges the draft into staging, re-checks its evidence, and
owns the staged text until a gate passes.

The final gate is a separate single-node graph and declares `pass`, `revise` and `escalate`. It
reviews the staged bytes and reports findings, exact replacements and the Reviewed sha256 table
without editing; the lead applies them to staging and publishes only on a pass. See the Final
quality gate and Publish sections of `PROMPT.md`.

## Declare, end the turn, collect

After `graph_declare` returns a started plan, end the turn. Wait for the
`[GRAPH COMPLETE]` or `[GRAPH BLOCKED]` notification; do not poll and do not declare a
duplicate graph because startup looks slow.

Read committed state once:

```text
graph_status({graph_id, scope: "all", format: "json", include_output: true, include_history: true})
```

Select the intended `run_id` and `node_id`, then read `attempts[].accepted` for the
outcome and `attempts[].result` for the accepted data. Only an accepted outcome is a
result. A completed phase can still contain blocked or failed nodes, so graph phase is
not business success and a settled node is not a passing result.

## Blocked outcomes and bounded repair

When a node reports `blocked` or `failed`, name the exact gap: a missing contract, an
undecided product fact, an unavailable command, a missing path or missing authorization.
Never fill the gap with invented prose.

Repair with one successor graph, not a loop:

- use a fresh request-scoped name;
- supply the missing input in the new node brief;
- preserve the original issue id and the accepted draft and evidence;
- set a finite budget covering the remaining work only.

If the successor is still blocked, report the verified parts and list the gaps. Nothing is
published from a blocked or failed plan. Do not re-declare the same plan.
