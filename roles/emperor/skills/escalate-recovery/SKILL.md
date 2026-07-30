---
name: escalate-recovery
description: Failure detection, retry, and honest escalation for graph-node results — load when a node result appears corrupted, empty, timed out, or error-bearing
---

> **Why a skill, not a function?** The orchestrator cannot detect graph-node failure from prompt alone — there is no built-in failure event to observe. Escalate is therefore loaded on-demand when a node result looks wrong, rather than wired as a fixed function.

## Failure signal recognition

A graph node result has failed if any of these are true:

1. **Result fence missing or empty.** The node returned nothing useful.
2. **Error/exception in result.** Text contains stack traces, error JSON, or explicit "I could not complete..." language.
3. **Node status is `timeout`/`escalate`.** The engine marked the node failed — its `timeout_ms` elapsed or it escalated (read via `graph_status(graph_id, node_id=…)`).
4. **The executor/router or review stage reports incomplete.** A quality gate rejected the output.

If none of these signals fire, the result is presumed good. Do not invent failures.

## Retry once

You get exactly one automatic retry. Not two. Not three. One.

When retrying:

- Re-run the node with a **narrower, more specific prompt** (`graph_run(graph_id, node_id=…, retry=true, modify_prompt="…")`). If the original was vague, sharpen it. If it was too broad, split into a smaller node.
- Retry re-opens the failed node's session (checkpoint context auto-injected — the subagent picks up where it left off). The loop group's `max_traversals` bounds the cycle; no unbounded retry loops.
- If the original timed out, break the work into smaller pieces for the retry.
- If it was a logic error, fix the prompt wording before re-running.

After one retry, stop. Do not loop.

## Still fails: honest report

If the retry also fails, write a `final_answer` fence that explains:

1. **What failed.** Name the node/agent, the task it was given, the failure signal observed.
2. **What was attempted.** Describe the retry: what you changed in the prompt, whether you used node continuation.
3. **Recommended next step.** Suggest what the user (or a different agent) could do. Maybe the task needs manual intervention, a different tool, or a fundamentally different approach.

Never pretend success. Never silently drop the failure. Never retry a third time.

## Timeout vs logic failure

These two categories need different responses:

| Signal | Meaning | Retry strategy |
|--------|---------|----------------|
| Timeout | Node took too long | Break into smaller subtasks, reduce scope, increase specificity |
| Logic failure | Node hit an error or produced garbage | Fix the prompt, add constraints, clarify expected output format |

A timeout does not mean the work is impossible. It means the chunk was too big or the subagent got lost exploring. Shrink the scope.

A logic failure means the instructions were wrong or the subagent lacked context. Rewrite the prompt with better guardrails.

## Stale-node detection

The engine maps a vanished dispatched task to `timeout` (and re-emits an `escalate` signal). To assess whether a long-running node is genuinely busy or silently stalled, query its lifecycle:

- `graph_status(graph_id, node_id=…, include_progress=true)` — the node's latest `progress` signal payload. A node reporting steady progress is busy; one silent on progress while taking significant wall-clock time is likely stuck.
- `graph_status(graph_id, node_id=…, stream=true, since=…)` — the node's timestamped signal-event history, for a finer progress trace.

Use these checks before deciding to cancel (`graph_cancel(graph_id, node_id?)`) or retry a long-running node. Steady progress deserves more time; silence does not.

## Rules

- Maximum 1 automatic retry per failed node.
- Always write `final_answer` on unrecoverable failure.
- Never mask a failure behind vague language ("partial results" when you got nothing).
- Never rely on internal gate or state machinery. This is pure prompt disposition.
- Cost explosion prevention: the one-retry cap exists because unbounded retries burn tokens and time with no convergence guarantee.
