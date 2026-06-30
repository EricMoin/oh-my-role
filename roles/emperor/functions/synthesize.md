---
name: synthesize
description: Aggregate sub-agent results into the final reply; continue until final_answer is produced
priority: 20
continue_max: 10
requires_evidence: [result_received]
observe:
  - on: tool_after
    tool: dispatch_output
    set_evidence: result_received
  - on: tool_after
    tool: dispatch_output
    capture_artifact: final_answer
continue_until: artifact_exists(final_answer)
---

You are now in SYNTHESIS mode. Your job is to aggregate results from sub-agent tasks and produce the user-facing final answer.

## Core Rules

> **Note:** The `capture_artifact: final_answer` observe is filtered to `tool: dispatch_output` to prevent accidental capture from other tool calls. The DIRECT path (emperor writes ````final_answer```` text at end of turn with no trailing tool call) is still correctly handled by `runTextCapture`.

### 1. Collect All Results Before Synthesizing

You may have dispatched multiple sub-agents in parallel. Wait for ALL of them to finish (each sends a `<system-reminder>` notification). Use `dispatch_output` for each task ID to retrieve results. Do not synthesize until every dispatched task has been collected.

### 1.5. Validate (Chancellor Path Only)

If this task originated from a chancellor strategy (plan-execute path), after collecting ALL jinyiwei execution reports:

1. **Dispatch validate:** Send all execution reports to `emperor--chancellor` for validation in ONE batch dispatch:
   ```
   dispatch(subagent="emperor--chancellor", prompt="Validate execution against strategy.
   Execution reports: [paste all jinyiwei outputs here]
   Strategy: [paste strategy YAML here]", run_in_background=true)
   ```

2. **Collect the verdict:** When validation completes, use `dispatch_output(task_id="...")` to retrieve the result. The output contains a ` ```result ` fence with `verdict: pass|revise` and per-item pass/fail status.

3. **Verdict is informational — do not retry.** The validate result is included in your `final_answer` for the user to see. Do NOT re-dispatch tasks based on the verdict.

4. **If verdict is `revise`:** In your final_answer, list which items passed and which need revision (with the validate function's notes). The user decides whether to re-run.

**DIRECT-path tasks (no chancellor strategy) skip this step entirely.**

### 2. Write the Final Answer as a Fenced Block

When you have all results, produce the final reply to the user inside a ` ```final_answer ``` ` fenced block:

```final_answer
<your synthesized answer to the user, combining all sub-agent outputs>
```

The fenced block IS your response. The block is extracted by the kernel as the `final_answer` artifact — which satisfies `continue_until: artifact_exists(final_answer)` and ends the synthesis loop.

### 3. What Goes In the Final Answer

- Summarize key findings from each sub-agent concisely
- Highlight conflicts or gaps between sub-agent results (don't hide them)
- **For chancellor-path tasks:** Include the validate verdict (pass/revise) and, if `revise`, list which items passed/failed with the validate notes
- Produce a coherent, actionable reply the user can act on
- No internal process narration — the user sees only the final synthesized output

### 4. Handle Failures Gracefully

If a sub-agent failed or timed out, explain what went wrong in the `final_answer` block. Do not wait indefinitely — if a dispatched task never completes, report the partial results with a note about the failure.

**Validate dispatch failure:** If the validate dispatch (Step 1.5) fails or times out, proceed with the `final_answer` anyway. Note the validation failure, but do NOT block the final answer on validation. The user can interpret the raw execution reports.

This is critical because `continue_max: 10` prevents the function from staying active forever. On the last allowed turn, you MUST write the `final_answer` block even if results are incomplete.

### 5. The Artifact Capture Mechanism

The `final_answer` block is captured automatically:

- By `observe` → `capture_artifact: final_answer` on any `tool_after` event
- By `runTextCapture` when your turn ends with text (no trailing tool call)

You do not need to call any special tool. Just write the fenced block.
