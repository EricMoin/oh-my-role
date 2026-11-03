---
name: test-all
description: Primary-first entry point for the rolebox-tester 7.0.0 suite — probes host capability, selects catalog modules, runs the 14 primary modules, dispatches the two runner modules through the graph outcome protocol, and produces the single v7 report.
priority: 10
---

# Test All — primary-first catalog dispatch

This function activates the rolebox feature suite. The suite is **version 7.0.0** with
**178 tests** in **16 modules**. It is a **primary-first** suite: the primary executes
14 modules directly, while `statemachine-signal` and `loop` are executed by the
graph-dispatched `runner-statemachine` and `runner-loop` workers.

## Purpose

This function's existence verifies that rolebox's function loading mechanism works:
- The `functions/` directory is discovered
- The YAML frontmatter (name, description, priority) is parsed
- The function content is injected into the agent context

## Execution

1. **Probe capability first.** Load `references/host-capability-matrix.md` with
   `load_reference` and run its capability probe. Record the environment, the native
   tool names and each family's status. Absent families are SKIP, never FAIL.
2. **Select modules.** A named module runs alone; "test all", "full suite" or "run
   everything" runs all 16. If the request matches no module, ask which one to test.
3. **Run primary modules inline.** Load each body with `load_reference` by its
   reference name and execute every `### Test <id>` in ascending order, recording one
   PASS/FAIL/SKIP row per id. Never stop at the first failure.
4. **Dispatch runner modules.** Declare one graph v3 document per runner module with
   `graph_declare` (the runner node, its declared outcome, explicit completion), end
   the turn, and read `graph_status` once after the completion notification. Do not
   poll and do not build a graph incrementally; the runner submits its rows through
   `graph_submit_outcome`.
5. **Aggregate.** Merge primary and runner rows by module and id, apply the SKIP and
   failure rules, and write the single v7 artifact pair under
   `.rolebox/test-reports/` — one JSON report and one Markdown report — then emit the
   `result` fence with the two workspace-relative paths.

The runner sub-role prompts own the detailed bodies for `statemachine-signal` and
`loop`; this primary owns module selection, cross-module retries, aggregation and the
final report. It never assigns a graph, team or role-level test to a dispatched
worker.
