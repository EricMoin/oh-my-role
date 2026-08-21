---
name: test-all
description: Master test function that maps test requests to per-module runner sub-roles and drives dispatch-and-aggregate execution across the sharded suite.
priority: 10
---

# Test All

This function activates the rolebox feature test registry. As of **v5.0** the 164-test
suite is **sharded across per-module runner sub-roles** and this primary role is a **thin
dispatcher**. The agent identifies which module(s) the user requested from the Test Module
Catalog in PROMPT.md, dispatches the matching `rolebox-tester--runner-*` sub-role(s) via the
Graph Engine v2, collects each runner's per-test results, and assembles ONE consolidated
v5.0 report. If the user says "test all" or "full suite", dispatch ALL runners (one node per
runner in a single multi-node graph, run in parallel) and aggregate.

## Purpose

This function's existence verifies that rolebox's function loading mechanism works:
- The `functions/` directory is discovered
- The YAML frontmatter (name, description, priority) is parsed
- The function content is injected into agent context

## Execution (dispatch-and-aggregate)

Upon activation, check the user's request:
- If they named a module (e.g., "test dispatch", "test graph", "test memory"), consult the
  Test Module Catalog in PROMPT.md, look up the module's `rolebox-tester--runner-<x>` sub-role
  id, and dispatch it as a Graph Engine v2 node:
  `graph_create` → `graph_add_node(agent="rolebox-tester--runner-<x>", prompt="run your module")`
  → `graph_run` → (await `[GRAPH COMPLETE]`) → `graph_status(include_output=true)`.
- If they said "test all", "full suite", or "run everything", add one node per runner sub-role
  to a single graph (no edges → parallel roots), `graph_run` once, await completion, then read
  all node outputs and consolidate. This covers all 164 tests (Tests 1–172; the legacy
  `150–162` loop-tool range was REMOVED in v5.0 — coverage moved to Graph Engine v2 loop
  groups in Tests 163, 165, 169).
- If unclear which module, ask the user which module they want tested.

The runner sub-roles hold the detailed test bodies and emit per-test PASS/FAIL tables plus a
trailing JSON line; this dispatcher consolidates them into the single v5.0 report table and
JSON artifact described in PROMPT.md. It does NOT execute test bodies inline.
