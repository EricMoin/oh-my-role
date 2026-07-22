---
name: escalate-recovery
description: Failure detection, retry, and honest escalation for dispatch results — load when a dispatch result appears corrupted, empty, timed out, or error-bearing
---

> **Why a skill, not a function?** The orchestrator cannot detect dispatch failure from prompt alone — there is no built-in failure event to observe. Escalate is therefore loaded on-demand when a dispatch result looks wrong, rather than wired as a fixed function.

## Failure signal recognition

A dispatch result has failed if any of these are true:

1. **Result fence missing or empty.** The subagent returned nothing useful.
2. **Error/exception in result.** Text contains stack traces, error JSON, or explicit "I could not complete..." language.
3. **Sync timeout.** The configured dispatch timeout elapsed and the task did not finish in time.
4. **The executor/router or review stage reports incomplete.** A quality gate rejected the output.

If none of these signals fire, the result is presumed good. Do not invent failures.

## Retry once

You get exactly one automatic retry. Not two. Not three. One.

When retrying:

- Re-dispatch with a **narrower, more specific prompt**. If the original was vague, sharpen it. If it was too broad, split into a smaller subtask.
- Pass `session_id` from the failed task to preserve conversation context (the subagent picks up where it left off).
- If the original timed out, break the work into smaller pieces for the retry.
- If it was a logic error, fix the prompt wording before re-sending.

After one retry, stop. Do not loop.

## Still fails: honest report

If the retry also fails, write a `final_answer` fence that explains:

1. **What failed.** Name the subagent, the task it was given, the failure signal observed.
2. **What was attempted.** Describe the retry: what you changed in the prompt, whether you used session continuation.
3. **Recommended next step.** Suggest what the user (or a different agent) could do. Maybe the task needs manual intervention, a different tool, or a fundamentally different approach.

Never pretend success. Never silently drop the failure. Never retry a third time.

## Timeout vs logic failure

These two categories need different responses:

| Signal | Meaning | Retry strategy |
|--------|---------|----------------|
| Timeout | Task took too long | Break into smaller subtasks, reduce scope, increase specificity |
| Logic failure | Task hit an error or produced garbage | Fix the prompt, add constraints, clarify expected output format |

A timeout does not mean the work is impossible. It means the chunk was too big or the subagent got lost exploring. Shrink the scope.

A logic failure means the instructions were wrong or the subagent lacked context. Rewrite the prompt with better guardrails.

## Stale-task detection

Beyond the 5-minute `backgroundStaleTimeoutMs`, use these tools to assess whether a background task is genuinely busy or silently stalled:

- `dispatch_status(task_id)` — non-throwing liveness check. A task with no recent activity and no status change is stale sooner than one steadily reporting progress.
- `dispatch_stream(task_id)` — queries accumulated progress events. A task emitting no progress events while taking significant wall-clock time is likely stuck.

Use these checks before deciding to cancel (`dispatch_cancel`) or retry a long-running task. Steady progress deserves more time; silence does not.

## Rules

- Maximum 1 automatic retry per failed dispatch.
- Always write `final_answer` on unrecoverable failure.
- Never mask a failure behind vague language ("partial results" when you got nothing).
- Never rely on internal gate or state machinery. This is pure prompt disposition.
- Cost explosion prevention: the one-retry cap exists because unbounded retries burn tokens and time with no convergence guarantee.
