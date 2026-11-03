---
name: test-all
description: Transition target for the runner-statemachine state-machine probe. It carries the module's aggregate-report instructions and executes no dispatch of its own.
priority: 10
---

# Test All (runner-statemachine transition target)

This function exists so the `state-machine` probe's `transitions` entry has a real
activation target (`activate: [test-all]`) and a real deactivation target
(`deactivate: [transform]`). The runner owns the 14 `### Test` bodies in its prompt;
this function adds no dispatch and no graph work of its own.

When it becomes active, confirm in the next prompt that `test-all` is listed in the
`## Active functions` block and that `transform` is no longer listed. That activation
change is the observable evidence for the transition test.

This runner never declares, controls, reads or audits a graph: it executes its test
bodies, settles its declared node outcome through `graph_submit_outcome`, and ends the
turn. The primary role owns module selection, aggregation and the single v7 report.
