---
name: veto-criteria
description: Objective criteria for when to pass vs veto a strategy draft
---

## When to PASS (all must be met)

1. **Objective is clear**: The draft's objective statement is unambiguous and achievable
2. **Subtasks are concrete**: Each subtask has a clear description, specific files to modify, and a verification method
3. **Risks are acknowledged**: All significant implementation risks are listed with appropriate severity
4. **Effort estimate is reasonable**: The estimated effort is proportional to the described work
5. **No logical gaps**: The strategy covers the required acceptance criteria from the original plan

## When to VETO (any of these)

1. **Missing objective**: No clear statement of what the strategy achieves
2. **Vague subtasks**: Subtasks lack specific file paths, verification steps, or are too abstract to execute
3. **Unmitigated high risk**: A high-risk subtask lacks an explicit mitigation or fallback plan
4. **Scope mismatch**: The draft addresses more or less than what the plan requested
5. **No verification plan**: Subtasks don't describe how to verify completion
6. **Contradictory instructions**: The draft contradicts existing codebase patterns or conventions

## Rule

A veto MUST cite a specific, fixable defect. If no fixable defect exists, the verdict MUST be pass.
Absence of defects is not grounds for veto. "Looks good" without checking the criteria is not grounds for pass.
