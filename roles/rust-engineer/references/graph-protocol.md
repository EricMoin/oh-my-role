# Rust Graph v3 execution protocol

The parent owns investigation, design, graph composition and final acceptance. Domain
nodes own production implementation and repairs. Read the current registered tool
schemas; the examples in [graph-patterns.json](../skills/rust-graph-workflow/references/graph-patterns.json)
are complete declarations, not tasks ready to run without their actual briefs.

## Declare a researched stage

Submit one complete `graph_declare({declaration: ...})` with version 3, a fresh
request-scoped name, finite root `budget.max_executions`, scoped worker nodes,
explicit completion/outcomes, edges and any bounded loop groups. The graph name is
its identity. Set node timeouts to the actual work; 300 seconds is a sample.
Do not author max_retries, install approval policies or invent validators to make
an unsupported draft executable. Node tools metadata does not grant or restrict
permissions. A report schema reference does not install content validation.

For every payload a node needs, declare an input `{from, outcome}` in addition to
the scheduling edge `{from, to, outcome}`. Fan-in of required evidence uses
`join: {strategy: "all"}`. Edges carry declared accepted outcomes, never assumed
success. A failed or blocked implementation must not release its success consumers.

## Repair loops

Start from rust-specialist-loop for one domain, rust-multi-specialist-loop for serial
expert stages, or rust-evidence-loop for parallel snapshot evidence. Adapt them to the
actual responsibility boundaries rather than invoking every expert.

- One dedicated read-only convergence reviewer declares pass, revise and escalate. It
  alone routes repairs; only the implementation expert changes source on the revise edge.
- Its revise edge targets the first responsible implementation stage. That node declares
  `{from: "review", outcome: "revise", when: "triggered"}` so feedback is not required
  initially but is required and bound to the actual accepted review attempt on repair.
- Put every node that must rerun after a repair in one `loop_groups` entry, with
  positive max_traversals (normally 2), continuation_outcome revise and exit_outcome pass.
  Every continuation edge stays inside the group; pass has a valid terminal path.
- If initial work depends on a design-selection node and repairs arrive from review,
  use join strategy any for those scheduling alternatives, retaining ordinary required
  design inputs and triggered revision input. Never make feedback unconditional and
  accidentally prevent the first implementation from starting.
- Serial domain implementers forward complete accepted feedback and source attempt in
  their implementation reports. Later stages address their own items; the next review
  checks the integrated final snapshot. Read-only evidence branches never start repairs.

Budget for every stage on the initial and allowed repair traversals: a two-node loop
with two repairs needs up to 6 executions; four nodes need up to 12. These are sample
budgets, not mandatory node counts. Exhaustion stops the run and leaves unresolved
work visible; it cannot establish pass or authorize a fresh identical budget.

## Parallelism and snapshots

Parallelize independent investigations and stable-snapshot evidence. A read dependency
is not a reason to serialize unrelated questions. Sequence writers that share files,
caller contracts, generated artifacts or Cargo outputs. Parallel implementation needs
exclusive source scopes, explicit integration and isolated check outputs. The graph
does not supply filesystem isolation or enforce source-read-only modes.

A review uses a dedicated read-only reviewer role, a separate node ID and a session
that never implemented the change. Writing experts cannot become reviewers or independent
evidence producers by changing modes. Reviewers never repair source. Give them requirements
and the actual final diff, including dirty/new files, rather than the implementation
conversation or a conclusion they are expected to endorse. Do not edit files under active review.
A source report may precede implementation and answer a design premise, but never
certifies unwritten behavior. Reuse prior evidence only while its assumptions and
snapshot remain applicable; changed evidence branches rerun in the loop.

## Inspect start and collect outcomes

Inspect both the persisted plan and `start.kind` returned by graph_declare. Only
started or resumed confirms dispatch; saved, blocked and refused do not. Diagnose
startup refusal rather than declaring duplicate work. There is no separate run tool
or dry run. After confirmed startup, yield for the real completion/blocked notification;
use a status read for diagnosis or a missing notification, not a polling loop.

Read `graph_status({graph_id, scope: "all", format: "json", include_output: true,
include_history: true})`. Identify the intended run_id and node_id, then inspect
`attempts[].accepted` and `attempts[].result`. The report contracts live in
[schemas.md](schemas.md). Check actual loaded skills, changes, commands, snapshots,
negative evidence and unresolved items. A complete phase can carry failed, blocked,
revise, escalate or partial reports. Done and report are not product acceptance.

## Recovery and final acceptance

Repair format errors in the same unsettled worker attempt when possible. Do not repeat
the task solely because a submission was refused. Diagnose timeouts, stopped groups
and actual side effects before any recovery. A changed topology or remaining objective
requires a focused new declaration with a fresh name; declarations are immutable.
Preserve issue ids, prior artifacts, attempted approaches and remaining execution effort.
For a failed implementation stage, inspect its diagnostics and declare focused remaining
work when a repair is supported within scope; one failed check alone is not a reason to
abandon an actionable objective. Do not rerun an unchanged failed approach indefinitely.

The parent never patches production source as a fallback. Confirm superseded workers
cannot still write before replacing them. Required missing evidence or unresolved
blocking defects remain partial/blocked; do not manufacture acceptance from a finished
run, exhausted cap or self-review. A supported pass over the final snapshot plus
required checks establishes behavioral acceptance; mechanical edits use their scoped
implementation/check evidence. Respect existing user authorization for external actions.
