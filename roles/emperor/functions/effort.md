---
name: effort
description: User effort override that influences routing between plan-execute and DIRECT paths
params:
  level: medium
  priority: 10
---

The user has set an effort override: **{level}**.

## Routing impact

| Effort level | Routing instruction |
|---|---|
| `high` | Force the plan-execute path. Dispatch to the planner subtree for strategy, then to the executor/router for implementation. Do NOT answer directly. |
| `low` | Prefer the DIRECT path. Answer directly when appropriate. Do NOT dispatch to the planner subtree unless forced by higher-precedence rules below. |

## Precedence order (highest to lowest)

1. **Destructive detection** — ALWAYS overrides effort:low. If the task involves destructive operations, the plan+approval gate is REQUIRED regardless of effort level. effort:low MUST NOT bypass the destructive gate.
2. **`|plan|` mode** — Forces planning. Still overrides effort:high on non-destructive tasks (planning is still required).
3. **Effort override** (`|effort:high|` / `|effort:low|`) — influences default routing within the bounds above.
4. **Default behavior** — medium effort: the orchestrator classifies naturally and routes accordingly.

## Notes

- effort:high on a conceptual question is intentional and allowed. It forces a structured plan-execute path for any request type.
- Activation syntax: `|effort:high|` / `|effort:low|` / `|effort level=high|`
