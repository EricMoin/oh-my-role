---
name: broken-dep
description: Synthetic function with an unsatisfied requires dependency for testing function_graph disconnected node detection and asset_validate missing-dependency reporting.
requires:
  - nonexistent-function
priority: 1
---

# Broken Dependency Function

This function has a `requires: [nonexistent-function]` dependency that cannot be satisfied
because `nonexistent-function` does not exist among the loaded functions.

## Purpose

- **function_graph (dependencies mode)**: Shows a `broken-dep --requires--> nonexistent-function`
  edge, proving the dependency is tracked even when the target is missing.
- **asset_validate**: Reports a missing-dependency error for `broken-dep` referencing
  `nonexistent-function`.

## Execution

This function is intentionally broken and should NOT be activated during normal test
execution. It exists solely as a probe for graph and validation tools. Tests 117 and
120 reference this function.
