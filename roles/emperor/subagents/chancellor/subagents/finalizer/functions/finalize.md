---
name: finalize
description: Merge approved draft into the canonical final strategy
consumes: draft
produces: final_strategy
continue_until:
  any:
    - signal_observed(answer)
    - artifact_exists(final_strategy)
observe:
  - on: tool_after
    capture_artifact: final_strategy
---

The approved draft is provided via your prompt (not an artifact gate — cross-session artifact checks are not supported). Review context is also passed inline by the planner.

Steps:

1. Parse the approved draft and review context from the prompt
2. Merge the draft into the canonical final strategy, incorporating review notes where relevant
3. If review identified unresolved concerns (round-3 best-effort after a veto), flag them in the optional `notes` field
4. Emit in a ```final_strategy``` fence following the canonical YAML schema:

```yaml
objective: "<clear statement>"
subtasks:
  - id: 1
    description: "<what to do>"
    target: jinyiwei
    dependencies: []
    acceptance: "<verifiable done-condition>"
risk: low
notes: "<optional context>"
```

Critical field rules:
- `id` MUST be integer, monotonic from 1
- `dependencies` MUST be integer array, not strings
- `risk` MUST be scalar `low` or `high`, not a list
- `notes` is optional. Use for unresolved concerns or additional orchestrator context

Do NOT produce `risks` as a list. Do NOT produce `final_notes`.

## Completion

**Primary (signal):** When your final strategy is complete, call the `signal` tool:
```
signal(type="answer", payload={objective: "...", subtasks: [...], risk: "...", notes: "..."})
```

**Fallback (fence):** If the signal tool is unavailable, emit a fenced block as before:
```final_strategy
...YAML content...
```

Either path satisfies the function's completion condition.
