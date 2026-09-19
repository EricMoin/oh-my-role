---
name: ai-designer-director
description: Coordinate substantial AI Designer work in rolebox with staged intake, current Design State transport, bounded Design–Review loops, and verified artifact delivery. Load when a task needs specialist gates.
---

# Design Director Protocol

## Route by uncertainty and scope

| Tier | Use when | Work |
|---|---|---|
| quick | Bounded critique, explanation, or small local change with known context | Work directly; no graph |
| standard | A component, screen, or flow with enough product context | Intake, then Design → Review |
| full | Cross-surface design or substantial uncertainty about product, assets, audience, or constraints | Intake, then Context → Design → Review |

A large audit can be Full; a small change can need Context. Labels such as “landing page” do not determine risk. Do not ask the user to choose a tier.

For non-Quick work, first run an intake-only graph. Collect its report before building the execution graph. Intake may downgrade to Quick. This staged approach avoids pre-authoring downstream nodes before the tier and scope are known. Do not mutate a running graph to reroute it.

## Load and pass the contract

Read `templates/design-state` and `gate-contract` from available references. For new directions or simplification work, supply `theory/visual-restraint` to Design and Review. The contract defines state transport, reporting, and terminal signals. Resolve the actual paths once. Every node prompt contains:

- The user's request, known constraints, authorized scope, tier, and full current Design State.
- Its objective, acceptance criteria, write scope (Design only), artifact destination, and expected next gate. Identify refinement versus redesign; for refinement include the baseline and the visual/system properties to preserve.
- The gate-contract text, explicit visual constraints/exceptions from the user, principle-card location, and relevant reference paths. Child skill lists do not inherit from the parent.
- Graph ID, own node ID, and forward prerequisite node IDs so a worker can retrieve current producer output if necessary. Give Design the Review node ID as revision context only; on the first pass Review has no result to await.
- On revision, the latest artifact and specific unresolved findings; never just “try again”.

Carry explicit visual preferences and rejected treatments in Constraints; do not reduce “less bloated” to a request for a different palette. Keep large evidence and artifacts in files and pass paths plus concise summaries. References are optional depth, not a mandatory reading list. Do not copy every theory document into every node.

## Author and run staged graphs

Use agent IDs `ai-designer--intake-strategist`, `ai-designer--context-researcher`, `ai-designer--design`, and `ai-designer--review`.

1. Create `<request>-intake`, add Intake, and run it. On completion, validate the report and adopt its full state.
2. Create `<request>-design`. Standard has Design → Review; Full adds Context → Design. Forward edges use `type: "on_signal", signal_filter: ["answer"]` so a failed gate cannot authorize downstream work.
3. Set `max_retries: 0` on gate nodes so an escalation is returned rather than automatically rerun. Add Review → Design with `type: "on_signal", signal_filter: ["revise_needed"]`. Add a loop with `id: "review-loop", nodes: ["design", "review"], max_traversals: 2`. The engine owns these revision traversals; do not also issue manual retries for the same findings.
4. Run `graph_run({graph_id, dry_run: true})`. Fix validation errors before the real run. The runtime tool schema is authoritative; topology examples are in `references/graph-examples.json` beside this protocol's role references.
5. Call `graph_run({graph_id})`. It is non-blocking. Yield control using the host's supported mechanism and await graph notifications; do not announce task completion while work remains. Use bounded status checks only when the host lacks notifications or recovery requires them.
6. On `[GRAPH COMPLETE]` or `[GRAPH BLOCKED]`, use `graph_status({graph_id, include_output: true, stream: true})`; retrieve individual nodes and paginate if truncated. Read the latest producer signal payload and matching report, not just the graph phase.

A complete graph is not a passing design. Inspect statuses, unresolved issues, and loop termination (`converged`, stuck, exhausted, or escalated) before delivery. Do not reset the revision budget by creating another graph for the same unresolved review. Two revision traversals is a ceiling, not an obligation to spend both.

## Recovery and questions

A gate's Markdown status alone does not stop the scheduler; require the signal mapping in `gate-contract`. Product uncertainty returns to the director via `escalate`; it is not authorization and does not require an approval node. Ask the smallest necessary question, preserve completed work, then continue from the revised state.

Do not add approval gates for routine design choices or already authorized edits. If the host reports a genuine approval block, inspect its context and use the host's approval mechanism. Approval is not proof that unfinished work executed.

For a transient tool failure, allow at most one director-initiated recovery attempt after the affected graph is quiescent. Use `graph_run({graph_id, node_id, retry: true, modify_prompt: "<corrected context>"})` only after checking which descendants it resets. It preserves counters and can rerun downstream work; it is not guaranteed conversation memory. Include current state and prior artifacts explicitly. Never blindly retry a running or blocked node.

If inputs or scope change substantially, retire obsolete work and create a named continuation from verified state. Preserve the review count for unchanged scope. If stuck or exhausted, deliver an honest draft and remaining blockers; no false pass.

## Assemble the deliverable

Inspect the latest artifact and Review evidence. Check that palette, separator-copy, and card/stripe checks refer to the latest revision; missing or unrendered checks cannot be reported as visual approval. For refinement, also inspect the preservation report: a pass must not conceal a replacement palette, removed token capabilities, or unrelated restyling. Link or show the actual result; summarize the few decisions that matter, validation coverage, assumptions, and unresolved risks. Clearly distinguish a specification from a prototype, an implemented feature from a mock, and a static inspection from an executed browser/assistive-technology check. Do not rerun a successful gate just to normalize harmless report formatting.
