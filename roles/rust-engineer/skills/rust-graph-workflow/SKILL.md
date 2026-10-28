---
name: rust-graph-workflow
description: Plan and execute Rust repository work through specialist Graph v3 nodes, evidence dependencies and bounded implementation/review loops. Load before composing a repository change, substantive investigation or review.
---

# Specialist Rust execution

Investigate the actual repository before committing the plan: inspect affected behavior,
callers, ownership, versions and available checks. Read domain guidance that changes the
design. Resolve unknowns blocking decomposition yourself or through focused investigation
nodes; do not launch a speculative implementation and hope review supplies its contract.

## Compose the smallest useful graph

| Task | Starting topology |
| --- | --- |
| Mechanical edit without a behavior/contract change | One relevant domain implementer with a focused check |
| Behavior change, feature or substantive refactor | Domain implementation -> independent review; revise -> implementation in a bounded loop |
| Several domains own parts of the implementation | Scoped specialist stages with real dependencies, then convergence review; return revisions to the first responsible stage |
| Independent evidence is needed after implementation | Implementation -> parallel domain evidence -> join-all review; one repair route |
| Design premise or exact-version behavior remains unknown | Targeted investigation nodes, then synthesis or parent reconciliation before implementation |
| Review of existing code | Read-only domain review or parallel evidence feeding one reviewer |

[graph-patterns.json](references/graph-patterns.json) contains complete executable shapes,
not a required task sequence. Replace their briefs, expert choices, scopes, graph names,
timeouts and execution budgets. A two-node loop is a useful starting point, not a quota.
Use [rust-domains.md](../../references/rust-domains.md) to choose experts by responsibility.

## Give experts their working context

Use [node-contract.md](../../references/node-contract.md). Every node needs an explicit
mode, objective, source/scratch scope, current snapshot, relevant constraints, its own
readable skills, required evidence and declared inputs. Select the domain specialist
whose implementation skill addresses the change; safe private logic belongs to the
ownership/API expert too. Generic verification covers behavior, architecture and tests.

Each implementation node loads its domain implementation skill before editing. Each
review node loads its review criteria; verification loads rust-testing. Root skills do
not automatically become worker instructions. Pass explicit resource paths or their
content; workers may read the linked shared guidance in this role tree.

## Bind execution and repairs

Read [graph-protocol.md](../../references/graph-protocol.md) for the actual v3 transport.
Use explicit outcomes, finite execution/time budgets and declared input delivery. An edge
schedules work; `inputs: [{from, outcome}]` delivers the accepted report. Real fan-in uses
`join: {strategy: "all"}`. Keep independent questions parallel rather than inventing edges.

Put repair cycles inside a `loop_groups` entry with positive `max_traversals` (normally 2),
`continuation_outcome: "revise"` and `exit_outcome: "pass"`. A repair entry node consumes
`{from: "review", outcome: "revise", when: "triggered"}`: absent initially, required on
that repair route. With initial and repair predecessors use `join: {strategy: "any"}`;
ordinary required inputs still bind the initial contract. Never remove required feedback
to make a declaration compile. If the installed engine cannot execute the required
contract, report that limitation and keep source read-only.

One convergence reviewer owns the repair route. Evidence nodes return `report`, including
negative findings, and never trigger simultaneous writers. Recheck every evidence branch
whose snapshot or premise changed. In multi-writer stages, serialize shared-source edits
and forward the accepted revision context through implementation reports to later stages.
Parallel writers require exclusive source scopes and isolated check outputs; the graph
does not supply isolation. Independent review must use another node session and inspect
the final snapshot, even when its agent has the same domain expertise as the implementer.

## Reconcile the run

Inspect `graph_declare`'s persisted plan and start kind, yield after a confirmed start,
then read accepted outcomes on notification. No parent production edits or ad hoc dispatch
substitute for graph execution. Inspect report content and actual checks, not just a
complete phase. Only a supported final review pass satisfies behavioral acceptance.

Keep stable issue ids across repairs. Diagnose loop exhaustion or an unchanged failure
instead of reopening the same work with a fresh budget. A changed objective/topology
needs a focused successor graph and an explicit remaining budget. Report partial work
and essential gaps honestly; stop expanding research once acceptance has adequate evidence.
