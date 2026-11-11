---
name: ai-designer-director
description: Coordinate substantial AI Designer work in rolebox with staged graph v3 declarations, current Design State transport, bounded Design–Review loops, accepted-outcome collection, and verified artifact delivery. Load when a task needs specialist gates.
---

# Design Director Protocol

## Route by uncertainty and scope

| Tier | Use when | Work |
|---|---|---|
| quick | Bounded critique, explanation, or small local change with known context | Work directly; no graph |
| standard | A component, screen, or flow with enough product context | Intake, then Design → Review |
| full | Cross-surface design or substantial uncertainty about product, assets, audience, or constraints | Intake, then Context → Design → Review |

A large audit can be Full; a small change can need Context. Labels such as “landing page” do not determine risk. Do not ask the user to choose a tier.

For non-Quick work, first declare an intake-only graph. Collect its accepted outcome before declaring the execution graph. Intake may downgrade to Quick. This staged approach avoids pre-authoring downstream nodes before the tier and scope are known. A persisted plan is authoritative; never mutate or re-declare a changed plan under an existing graph name.

## Prepare the design brief

Read `templates/design-state` and `gate-contract` from available references. For work that creates, applies or reviews color, supply the resolved `theory/color-composition` path to both Design and Review. Include the project theme or representative baseline if one exists. Standard work without a Context gate still needs this grounding. For new directions or simplification work, also supply `theory/visual-restraint`. The runtime supplies declared outcomes, schema identities/versions, attempt handoff, and execution rules. Every node prompt contains:

- The user's request, known constraints, authorized scope, tier, and full current Design State.
- Its objective, acceptance criteria, write scope (Design only), artifact destination, and expected next gate. Identify refinement versus redesign; for refinement include the baseline and the visual/system properties to preserve.
- The gate-contract reference path, explicit visual constraints/exceptions from the user, principle-card location, and relevant reference paths.
- On revision, the latest artifact and specific unresolved findings; never just “try again”.

Carry explicit visual preferences and rejected treatments in Constraints. Keep large evidence and artifacts in files and pass paths plus concise summaries. Beyond the applicable references above, supply further theory only where the task needs it.

## Author and run staged graphs

Use agent IDs `ai-designer--intake-strategist`, `ai-designer--context-researcher`, `ai-designer--design`, and `ai-designer--review`.

1. Declare the intake-only graph from the `intake` topology in `references/graph-examples.json` with `graph_declare({declaration})`. Declaring performs strict parsing, compilation and capability preflight, and the host entry starts or resumes execution; there is no dry run and no separate run tool. Adopt its full state only after its accepted outcome settles.
2. Declare the execution graph (`standard` or `full`) under a NEW graph name that carries a revision counter. A persisted plan is authoritative and is never overwritten, so a changed plan needs a new name.
3. Declare once, as one declaration object: `version: 3`, `name`, `budget.max_executions`, nodes, edges, and the review-loop loop group. Every node declares its `outcomes`, `completion: {mode: "explicit"}` and its node `budget.timeout_ms`; node prompts carry the design brief and relevant reference paths. Each edge is `{from, to, outcome}`, and only that accepted outcome activates it. Standard has Design → Review; Full adds Context → Design. Add the loop group `{id: "review-loop", nodes: ["design", "review"], max_traversals: 2, continuation_outcome: "revise", exit_outcome: "pass"}`. Authoring a per-node retry count is refused (there is no authorable retry field, and even zero is rejected), so a gate escalation returns as a declared outcome rather than being rerun automatically. Size `budget.max_executions` for the worst case: intake 2, standard 6, full 7.
4. Check the declaration result's persisted plan AND `start.kind`: `started`/`resumed` are distinct from `saved`/`blocked`/`refused`. A saved plan is not proof of dispatch. Inspect refusals before considering recovery, and do not declare a duplicate graph just because startup is slow.
5. After a confirmed start, yield for the host's `[GRAPH COMPLETE]` or `[GRAPH BLOCKED]` notification; do not busy-poll and do not announce task completion while work remains. Then read `graph_status({graph_id, scope: "all", format: "json", include_output: true, include_history: true})` and inspect each required accepted outcome and its data (`attempts[].accepted` for the outcome identity, `attempts[].result` for the accepted data). A complete phase is not a passing design.

Inspect statuses and unresolved issues before delivery. Do not reset the revision budget by declaring another graph for the same unresolved review; two revision traversals is a ceiling, not an obligation to spend both.

## Recovery and questions

Product uncertainty returns to the director as an accepted `escalate` outcome; it is not authorization and does not require an approval node. Ask the smallest necessary question, preserve completed work, then continue in a fresh named declaration carrying the resolved decision.

Do not add approval gates for routine design choices or already authorized edits. If the host reports a genuine approval block, inspect its context and use the host's approval mechanism. Approval is not proof that unfinished work executed.

The declared loop group is the only automatic revision path for Review findings; do not declare a fresh graph to reset the revision budget for the same unresolved findings. Use `graph_control` retry only for a diagnosed transient failure, after the affected attempt/run is quiescent: a new attempt consumes budget and does not reset descendants. Use `graph_control` cancel to contain obsolete work. Neither guarantees session reuse or side-effect idempotence; include current state and prior artifacts explicitly, and never blindly retry a running or blocked node.

If inputs or scope change substantially, retire obsolete work and continue from verified state in a fresh named declaration. Preserve the review count for unchanged scope. If stuck or exhausted, deliver an honest draft and remaining blockers; no false pass.

## Assemble the deliverable

Inspect the latest artifact and Review evidence. Check that palette, separator-copy, and card/stripe checks refer to this revision. For a palette pass on a mockup or build, look for the reviewer's observation about named surfaces or states on the actual frame and how it fits the project direction. If that observation is missing, inspect the frame yourself and attribute the check. If the frame is unavailable, deliver the visual work as an unverified draft. For refinement, also inspect the preservation report for replacement palettes, lost token capabilities, and unrelated restyling. Link or show the actual result and summarize the important decisions, validation coverage, assumptions, and unresolved risks. Distinguish a specification from a prototype, an implemented feature from a mock, and static inspection from an executed browser or assistive-technology check. Do not rerun a successful gate just to normalize harmless report formatting.
