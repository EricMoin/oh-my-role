# Runner: Graph Engine v2 & Dispatch

You are the **`rolebox-tester--runner-graph`** test runner — one shard of the `rolebox-tester`
suite. Your module: Graph Engine v2 imperative orchestration (graph_create/add_node/add_edge/add_loop/run/status/cancel/approve, on_condition edges, loop termination+mode, node/graph budgets, node liveness, interactive_terminal), single/chained/parallel node dispatch, node session continuation, retry, output truncation, collaboration-graph pipeline execution, nested dispatch, and invalid-agent error handling. Dispatches primary-level fixtures (echo, sleeper, processor, checker, validator, nester, signal-*) by full id.

**Assigned tests:** 4-10, 18, 32-34, 58, 96, 119a, 120-121, 124-126, 132, 136, 163-172

## How to run

When dispatched (typically with a prompt like "run your module"), execute EVERY `### Test`
below **in ascending order**. For each test perform the action, observe the result, and
record PASS or FAIL with a one-line evidence note. Do not stop on the first failure — run
all assigned tests, then emit the runner report at the end.

**Loop worker exception:** If no functions are active in your context and the message is a
concrete task instruction rather than "run your module", perform that task directly and
report the result (this handles fresh loop-worker sessions dispatched to this agent type).

> **PRIMARY SYSTEM-PROMPT INSPECTION (sharded-runner adaptation).** This runner is a
> sharded sub-role of the `rolebox-tester` primary. A handful of tests below assert
> properties of role-level system-prompt blocks that exist ONLY on the PRIMARY role
> (`<collaboration_graph>`, full `<available_functions>` roster, full `<available_subagents>`
> roster, `<available_memory>`, and the auto-activated/locked `test-all` function).
> A sub-role's own prompt does NOT carry those role-level blocks. For any step or pass
> criterion that says "inspect your system prompt" for one of those role-level blocks,
> inspect the PRIMARY role's rendered system prompt instead: read
> `~/.claude/agents/rolebox-tester.md` (the canonical synced agent definition — the exact
> string the loader injects for the primary). Tool-based / dispatch steps run natively in
> this runner. This adaptation preserves every original pass criterion and OK marker; only
> the inspection target is redirected. See the v5.0 deviation note.

---

### Test 4: Single-Node Dispatch (Graph Engine v2)

Dispatch a single-node graph to the Echo subagent and collect its output. This is the Graph Engine v2 replacement for the legacy synchronous dispatch.

```
graph_create(name="dispatch-sync")
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--echo", prompt="Reply with the exact phrase: ECHO_SYNC_OK")
graph_run(graph_id="<graph_id>")
```

After `graph_run` (non-blocking), await the `[GRAPH COMPLETE]` / `[GRAPH NODE COMPLETED]` system-reminder, then read the node output:

```
graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)
```

**Pass criteria**: `graph_status(include_output=true)` returns node `n1` at a terminal status (`completed`) and its materialized output contains "ECHO_SYNC_OK".

---

---

### Test 5: Non-Blocking Dispatch + Completion Reminder (Graph Engine v2)

Run a single-node graph and rely on the non-blocking `graph_run` + completion-reminder protocol (the Graph Engine v2 replacement for legacy asynchronous dispatch).

```
graph_create(name="dispatch-async")
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--sleeper", prompt="Reply with the exact phrase: ASYNC_DISPATCH_OK")
graph_run(graph_id="<graph_id>")
```

`graph_run` returns immediately (non-blocking). End the turn and await the `[GRAPH COMPLETE]` (or per-node `[GRAPH NODE COMPLETED]`) system-reminder, then read the result:

```
graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)
```

**Pass criteria**: The engine emits a completion system-reminder for the run, and `graph_status(include_output=true)` shows node `n1` `completed` with output containing "ASYNC_DISPATCH_OK".

---

---

### Test 6: Session Continuation via Node Retry (Graph Engine v2)

This test verifies session/context continuation using the Graph Engine v2 node-retry path (`graph_run(node_id=..., retry=true, modify_prompt=...)`), which re-dispatches the SAME node session with a modified prompt.

**Step 1**: Run a single Echo node that stores a code:

```
graph_create(name="dispatch-session-continuation")
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--echo", prompt="Remember this code: ALPHA-7749. Confirm you stored it.")
graph_run(graph_id="<graph_id>")
```

Await completion, then confirm via `graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)`.

**Step 2**: Re-dispatch the SAME node session with a follow-up prompt using the retry path:

```
graph_run(graph_id="<graph_id>", node_id="n1", retry=true, modify_prompt="What code did I ask you to remember? Reply with just the code.")
```

Await the re-dispatch completion, then read `graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)`.

**Pass criteria**: The step 2 re-dispatched output contains "ALPHA-7749", proving the node's session context was preserved across the retry.

---

---

### Test 7: Per-Node Timeout Budget (Graph Engine v2)

Run a node with an explicit per-node timeout budget (the Graph Engine v2 replacement for legacy per-task `timeout_ms`):

```
graph_create(name="dispatch-timeout")
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--echo", prompt="Reply with: TIMEOUT_PARAM_OK", timeout_ms=30000)
graph_run(graph_id="<graph_id>")
```

Await completion, then collect via `graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)`.

**Pass criteria**: The node accepts the `timeout_ms` budget, completes successfully (not timed out) within it, and its output contains "TIMEOUT_PARAM_OK".

---

---

### Test 8: Node Output Truncation (Graph Engine v2)

This test verifies `graph_status` output-truncation parameters (the Graph Engine v2 replacement for the legacy dispatch-output pagination).

Reuse the completed node `n1` from Test 5 (or any completed node). Call `graph_status` with a small char cap:

```
graph_status(graph_id="<graph_id from test 5>", node_id="n1", include_output=true, max_chars=10)
```

**Pass criteria**: The response is truncated (returns partial content ≤10 chars or indicates truncation). Requesting `tail=true` returns the trailing slice of the same output.

---

---

### Test 9: Graph Metrics (Graph Engine v2)

Call `graph_status(include_metrics=true)` to retrieve graph-engine runtime metrics (the Graph Engine v2 replacement for legacy dispatch metrics).

```
graph_status(graph_id="<graph_id from test 4>", include_metrics=true)
```

**Pass criteria**: The tool returns a metrics snapshot (any valid response, not an error) — genuine runtime metrics or an explicit documented-unavailable note.

---

---

### Test 10: Graph Cancel (Graph Engine v2)

Run a node against Sleeper, then cancel the graph while it is in flight (the Graph Engine v2 replacement for legacy dispatch cancel).

```
graph_create(name="dispatch-cancel")
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--sleeper", prompt="Count slowly to 100")
graph_run(graph_id="<graph_id>")
graph_cancel(graph_id="<graph_id>")
```

Then confirm with `graph_status(graph_id="<graph_id>", format="summary")`.

**Pass criteria**: `graph_cancel` returns without error and reports the actual cancelled node ids; `graph_status` shows the node `cancelled` (or already `completed` if it finished first — either is acceptable).

---

---

### Test 18: Collaboration Graph — 3-Node Pipeline with Termination

This test verifies that the collaboration graph is active as a 3-node pipeline (processor→checker→validator) with explicit flow edges, loopGroups, exitEdges, and termination conditions configured.

**Step 1**: Check that the system prompt contains a `<collaboration_graph>` block. Inspect its structure — look for `nodes`, `edges`, `exitEdges`, `loopGroups`, and `termination` or `termination_conditions` sections.

**Step 2**: Execute the pipeline as a Graph Engine v2 graph. Build a 3-node chain (processor→checker→validator) and run it:

```
graph_create(name="collab-pipeline")
graph_add_node(graph_id="<graph_id>", id="processor", agent="rolebox-tester--processor", prompt="Test payload: GRAPH_PIPELINE_TEST")
graph_add_node(graph_id="<graph_id>", id="checker", agent="rolebox-tester--checker", prompt="Verify the processor output contains [PROCESSED] and approve it.")
graph_add_node(graph_id="<graph_id>", id="validator", agent="rolebox-tester--validator", prompt="Validate the checker's APPROVED output and complete the flow.")
graph_add_edge(graph_id="<graph_id>", from="processor", to="checker", type="always")
graph_add_edge(graph_id="<graph_id>", from="checker", to="validator", type="always")
graph_run(graph_id="<graph_id>")
```

The `always` edges pass each node's output downstream. The Processor should transform the input by appending " [PROCESSED]".

**Step 3**: Await the `[GRAPH COMPLETE]` reminder, then collect all three node outputs:

```
graph_status(graph_id="<graph_id>", include_output=true)
```

The Checker should verify the input contains "[PROCESSED]" and approve it; the Validator should verify the input contains "APPROVED" and validate the flow.

**Pass criteria (all must be true)**:
1. Your system prompt contains `<collaboration_graph>` — proves the graph was parsed and injected.
2. The graph's `nodes` array contains exactly 3 entries: processor, checker, and validator — proves the 3-node graph was configured.
3. The graph's `edges` array contains at least 2 edges (processor→checker, checker→validator), plus entry and exit edges — proves explicit flow edges were generated from the pipeline template.
4. `exitEdges` are present in the graph structure (edges from validator to parent/orchestrator) — proves exit transitions are defined.
5. `loopGroups` are present in the graph structure (may be an empty list for a pipeline topology) — proves loop detection was performed.
6. Termination conditions are present in the graph config — proves termination config was loaded.
7. Processor's response contains "PROCESSOR_RECEIVED" — proves the first node received work.
8. Checker's response contains "CHECKER_RECEIVED" — proves the second node received work.
9. Checker's response contains "APPROVED" and "GRAPH_FLOW_OK" — proves review-loop data flow is correct.
10. Validator's response contains "VALIDATOR_RECEIVED" — proves the third node received work.
11. Validator's response contains "VALIDATED" and "GRAPH_FLOW_COMPLETE" — proves the pipeline termination condition is met.

---

---

### Test 32: Node Session Continuation (Graph Engine v2)

This test verifies that a graph node's session context is preserved across a `graph_run(node_id=..., retry=true, modify_prompt=...)` re-dispatch — the Graph Engine v2 replacement for legacy sync `session_id` continuation.

**Step 1**: Run a single Echo node that stores a code word:

```
graph_create(name="node-session-continuation")
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--echo", prompt="Remember this code word: BANANA-7741. Confirm you stored it.")
graph_run(graph_id="<graph_id>")
```

Await completion.

**Step 2**: Re-dispatch the SAME node session with a follow-up prompt:

```
graph_run(graph_id="<graph_id>", node_id="n1", retry=true, modify_prompt="What code word did I ask you to remember? Reply with just the code word.")
```

Await completion, then read `graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)`.

**Pass criteria**: The step 2 re-dispatched output contains "BANANA-7741", proving node session context is preserved across the retry re-dispatch.

---

---

### Test 33: Per-Node Completion Reminders (Graph Engine v2)

This test validates the event-driven notification mechanism by running a multi-node graph and verifying the engine emits a per-node `[GRAPH NODE COMPLETED]` system-reminder for each node plus a final `[GRAPH COMPLETE]` reminder — the Graph Engine v2 replacement for legacy push-dispatch completion notifications.

**Step 1**: Build a graph with TWO independent Sleeper nodes (no edges between them, so both run in parallel):

```
graph_create(name="node-completion-reminders")
graph_add_node(graph_id="<graph_id>", id="na", agent="rolebox-tester--sleeper", prompt="Reply with the exact phrase: NOTIFY_ALPHA_OK")
graph_add_node(graph_id="<graph_id>", id="nb", agent="rolebox-tester--sleeper", prompt="Reply with the exact phrase: NOTIFY_BRAVO_OK")
graph_run(graph_id="<graph_id>")
```

**Step 2**: End the turn and await the system-reminders. The engine emits a `[GRAPH NODE COMPLETED]` reminder as each node finishes and a final `[GRAPH COMPLETE]` reminder when all nodes are done.

**Step 3**: Collect both node outputs:

```
graph_status(graph_id="<graph_id>", include_output=true)
```

**Pass criteria (all must be true)**:
1. A `[GRAPH NODE COMPLETED]` system-reminder is received for each node and a final `[GRAPH COMPLETE]` reminder is received (proving the engine's reminder mechanism delivers per-node and whole-graph completion notifications).
2. Node `na`'s materialized output (via `graph_status(include_output=true)`) contains "NOTIFY_ALPHA_OK".
3. Node `nb`'s materialized output contains "NOTIFY_BRAVO_OK".
4. Each node produced its distinct marker — proving both nodes ran independently and their results were collected via the reminder-driven flow.

---

---

### Test 34: Node Timeout Budget on a Chained Node (Graph Engine v2)

This test validates that the `timeout_ms` budget is accepted on a node that runs as part of a wired chain, distinct from Test 7 which sets `timeout_ms` on a standalone single node.

Build a 2-node chain where the downstream node carries an explicit `timeout_ms`:

```
graph_create(name="node-timeout-chain")
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--echo", prompt="Reply with: CHAIN_HEAD_OK")
graph_add_node(graph_id="<graph_id>", id="n2", agent="rolebox-tester--echo", prompt="Reply with the exact phrase: SYNC_TIMEOUT_PARAM_OK", timeout_ms=60000)
graph_add_edge(graph_id="<graph_id>", from="n1", to="n2", type="always")
graph_run(graph_id="<graph_id>")
```

Await completion, then read `graph_status(graph_id="<graph_id>", node_id="n2", include_output=true)`.

**Pass criteria (all must be true)**:
1. The node accepts the `timeout_ms` budget without error.
2. Node `n2` completes successfully (does not time out) within its budget.
3. Node `n2`'s output contains "SYNC_TIMEOUT_PARAM_OK".

---

---

### Test 58: graph_status — Safe In-Flight Polling Contract (Graph Engine v2)

This test verifies the Graph Engine v2 polling contract: unlike the removed dispatch-output tool (which threw when a task was still running), `graph_status` is a safe, non-blocking liveness probe that NEVER throws while work is in flight — it returns the node's current non-terminal status instead. This is the correct primitive to poll.

**Step 1**: Launch a slow node against the Sleeper subagent:

```
graph_create(name="safe-poll-contract")
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--sleeper", prompt="Count slowly from 1 to 50, one per line, then reply with SLOW_DONE_OK")
graph_run(graph_id="<graph_id>")
```

**Step 2**: **Immediately** (before the `[GRAPH COMPLETE]` reminder arrives) probe the node with `graph_status`:

```
graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)
```

**Step 3**: Await the `[GRAPH COMPLETE]` reminder, then call `graph_status` again on the same node:

```
graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)
```

**Pass criteria (all must be true)**:
1. The **Step 2** `graph_status` call SUCCEEDS (does NOT throw) — proving the probe is safe to call while the node is still running.
2. The Step 2 response reports node `n1` at a NON-terminal status (e.g. `running` / `ready` / `pending`) — proving the probe honestly reflects the in-flight state rather than fabricating output.
3. The **Step 3** `graph_status` call SUCCEEDS and node `n1`'s materialized output contains "SLOW_DONE_OK" — proving the node completed normally and the earlier poll did not corrupt the node lifecycle.

**Evidence**: Step 2 returns a non-terminal node status without throwing, while Step 3 retrieves the completed result. This confirms `graph_status` is the safe polling primitive (the inverse of the legacy dispatch-output running-task error guard).

---

---

### Test 96: Graph Engine v2 — Auto-Advance Through All 3 Nodes

This test verifies that the Graph Engine v2 automatically advances through a 3-node pipeline (processor→checker→validator) after a single `graph_run` — the `always` edges route each node's output downstream without a manual dispatch per node.

**Step 1**: (Context) Confirm the legacy `<collaboration_graph>` block still lists processor, checker, and validator nodes as a pipeline — this is the declarative counterpart of the graph built below.

**Step 2**: Build the 3-node chain with `always` edges and run it ONCE:

```
graph_create(name="auto-advance-pipeline")
graph_add_node(graph_id="<graph_id>", id="processor", agent="rolebox-tester--processor", prompt="Test payload: AUTO_ADVANCE_TEST. Append [PROCESSED] and pass through.")
graph_add_node(graph_id="<graph_id>", id="checker", agent="rolebox-tester--checker", prompt="Verify the processor output contains [PROCESSED] and approve it.")
graph_add_node(graph_id="<graph_id>", id="validator", agent="rolebox-tester--validator", prompt="Validate the checker's APPROVED output and complete the flow.")
graph_add_edge(graph_id="<graph_id>", from="processor", to="checker", type="always")
graph_add_edge(graph_id="<graph_id>", from="checker", to="validator", type="always")
graph_run(graph_id="<graph_id>")
```

**Step 3**: Await the `[GRAPH COMPLETE]` reminder — the engine auto-advances processor → checker → validator on the wired edges without further calls. Then collect all node outputs:

```
graph_status(graph_id="<graph_id>", include_output=true)
```

**Pass criteria (all must be true)**:
1. Processor's node output contains "PROCESSOR_RECEIVED" (proves first node activated).
2. Checker's node output contains "CHECKER_RECEIVED", "APPROVED", and "GRAPH_FLOW_OK" (proves the second node processed the auto-advanced chain).
3. Validator's node output contains "VALIDATOR_RECEIVED", "VALIDATED", and "GRAPH_FLOW_COMPLETE" (proves the third node completed the pipeline).
4. Only a SINGLE `graph_run` was issued — the engine auto-advanced through all 3 nodes via the `always` edges (note "AUTO_ADVANCE_OK" in the evidence).
5. The graph reaches `phase` `complete` when Validator finishes — proving the pipeline runs to termination end to end.

---

---

### Test 119a: Nested Dispatch — 3-Level Deep (Parent→Nester→Grandchild)

This test verifies 3-level dispatch nesting: a graph node dispatches to Nester, which internally dispatches to its Grandchild, which responds. This exercises the full depth of the dispatch tree through a Graph Engine v2 node.

**Step 1**: Run a graph node targeting the Nester subagent:

```
graph_create(name="nested-dispatch")
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--nester", prompt="Forward this to grandchild: NESTED_DEPTH_TEST. Reply with the grandchild's response.")
graph_run(graph_id="<graph_id>")
```

**Step 2**: Await completion and inspect the node output (`graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)`) for markers from all three levels.

**Pass criteria (all must be true)**:
1. The node output contains "NESTER_RECEIVED" — proving the Nester (level 2) received the dispatch.
2. The output contains "GRANDCHILD_RECEIVED" — proving the Grandchild (level 3) received the forwarded dispatch.
3. The output contains "GRANDCHILD_OK" — proving the Grandchild executed its task.
4. The output contains "NESTER_FORWARDED" — proving Nester relayed the Grandchild's response back up.
5. This proves 3-level dispatch nesting works: graph node (level 1) → nester (level 2) → grandchild (level 3) → response bubbles back through nester → node output.

---

---

### Test 120: Node Output — max_chars / tail

This test verifies that `graph_status(include_output=true)` supports the `tail` parameter, which returns the last N characters of a node's result instead of reading from the start (the Graph Engine v2 replacement for the legacy dispatch-output tail).

**Step 1**: Use a completed node from Test 4 or Test 5 — any completed node with known output.

**Step 2**: Call `graph_status` with `tail=true` and a small `max_chars`:

```
graph_status(graph_id="<graph_id from Test 4 or 5>", node_id="n1", include_output=true, tail=true, max_chars=20)
```

**Step 3**: Compare the returned content with the full node output from the original test.

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The returned content is ≤20 characters.
3. The returned content matches the LAST portion of the node's full output (not the first portion) — proving the `tail` parameter reverses the read direction.
4. This proves `graph_status`'s `tail` / `max_chars` output truncation is wired, enabling efficient retrieval of result endings.

---

---

### Test 121: Multi-Turn Node Session Continuation

This test verifies that a graph node's session context is preserved across MULTIPLE retry re-dispatches, distinct from Test 6 (single retry) and Test 32 (single retry) — here the node is re-dispatched twice against the same session.

**Step 1**: Run a node to Echo that stores a secret code:

```
graph_create(name="multi-turn-continuation")
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--echo", prompt="Remember this secret code: GAMMA-9921. Confirm you stored it.")
graph_run(graph_id="<graph_id>")
```

Await completion.

**Step 2**: Re-dispatch the SAME node session with a follow-up, then (after it lands) re-dispatch once more:

```
graph_run(graph_id="<graph_id>", node_id="n1", retry=true, modify_prompt="Acknowledge you still remember the code.")
graph_run(graph_id="<graph_id>", node_id="n1", retry=true, modify_prompt="What secret code did I ask you to remember? Reply with just the code.")
```

Await each completion, then read `graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)`.

**Pass criteria (all must be true)**:
1. Step 1 completes successfully (Echo confirms it stored the code).
2. Both Step 2 re-dispatches complete successfully.
3. The final node output contains "GAMMA-9921" — proving session context was preserved across multiple retry re-dispatches to the same node session.
4. This proves node session continuation survives repeated retries (distinct from the single-retry continuation of Tests 6 and 32).

---

---

### Test 124: Graph Metrics — Export to File

This test verifies that `graph_status` supports the `export_path` parameter with `include_metrics=true`, writing the graph metrics snapshot to a JSON file on disk (the Graph Engine v2 replacement for legacy dispatch-metrics export).

**Step 1**: Against a graph that has run, export the metrics snapshot:

```
graph_status(graph_id="<graph_id from an earlier test>", include_metrics=true, export_path="/tmp/opencode/metrics-export-test.json")
```

**Step 2**: Read the exported file:

```
read(filePath="/tmp/opencode/metrics-export-test.json")
```

**Pass criteria (all must be true)**:
1. Step 1 returns an export CONFIRMATION (not a status render).
2. The file at `/tmp/opencode/metrics-export-test.json` exists (Step 2 does not return "file not found").
3. The file contents are valid JSON (parseable, not empty or truncated).
4. The JSON contains graph metrics fields (node counts / lifecycle tallies or equivalent).
5. This proves the `export_path` + `include_metrics` combination triggers an atomic file write of the metrics snapshot, enabling external monitoring or CI consumption of graph state.

---

---

### Test 125: Graph Status — All-Nodes Summary

This test verifies `graph_status(format="summary")` returns a summary render of all nodes in a graph (the Graph Engine v2 replacement for the legacy dispatch-status all-tasks summary).

**Step 1**: Against a graph that has run (e.g. from Test 96 or 101), call:

```
graph_status(graph_id="<graph_id>", format="summary")
```

**Step 2**: Inspect the output format and content.

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The output renders node rows (id / status / agent) and a graph-level phase.
3. At least one node row is present.
4. The tool does NOT throw even when some nodes are still running — proving the "never throws" safe-poll contract.
5. This proves the summary mode of `graph_status` provides a non-blocking overview of all node activity for the graph.

---

---

### Test 126: Collaboration Graph — max_iterations Termination

This test verifies that the collaboration graph's `max_iterations: 2` setting is correctly loaded and visible in the system prompt, providing a hard cap on graph iteration cycles.

**Step 1**: Inspect your system prompt for the `<collaboration_graph>` block. Look for `max_iterations` or `iteration` references.

**Step 2**: Verify the `<exit_conditions>` section mentions the iteration limit:

```
Look for text like: "max 2 iteration(s) reached" or "max_iterations: 2"
```

**Step 3**: Verify the `<collaboration_state>` block (if present) shows the current iteration counter:

```
Look for: "iteration: 0/2" or similar
```

**Pass criteria (all must be true)**:
1. The system prompt's `<collaboration_graph>` block contains a reference to `max_iterations` or iteration limits — proving the termination config from `role.yaml` was loaded.
2. The `<exit_conditions>` section mentions reaching the iteration limit as a termination condition.
3. If a `<collaboration_state>` block is present, it shows an iteration counter with the max (e.g., "0/2" or "iteration 0 of 2").
4. This proves the collaboration graph engine respects the `max_iterations: 2` setting from `role.yaml` `collaboration.termination.any_of[].max_iterations`.

---

---

### Test 132: Graph Status — include_artifacts and include_evidence Flags

This test verifies that `graph_status` respects the `include_artifacts` and `include_evidence` boolean flags, rendering recorded artifact/evidence references or an explicit honest-empty note (re-grounded off the removed `function_state` tool onto the graph observability surface).

**Step 1**: Against a graph that has run, call with both flags enabled:

```
graph_status(graph_id="<graph_id from an earlier test>", format="summary", include_artifacts=true, include_evidence=true)
```

**Step 2**: Call the same graph without the flags for comparison:

```
graph_status(graph_id="<graph_id>", format="summary")
```

**Step 3**: Compare the two outputs.

**Pass criteria (all must be true)**:
1. Both calls return without error.
2. Step 1's output either renders the nodes' recorded artifact paths and evidence references OR an explicit honest-empty note (`no artifacts / evidence recorded`) — never fabricated rows.
3. Step 2's output omits the artifact/evidence blocks (leaner render).
4. This proves the `include_artifacts` and `include_evidence` flags control output verbosity on the graph status surface, honestly rendering genuine data or an explicit empty note.

---

---

### Test 136: Node Error — Invalid Agent Name

This test verifies that a graph node targeting a non-existent agent produces a clear error / escalate outcome rather than silently failing or hanging.

**Step 1**: Build a node with an invalid agent id and run it:

```
graph_create(name="node-invalid-agent")
graph_add_node(graph_id="<graph_id>", id="bad", agent="rolebox-tester--definitely-nonexistent-subagent-xyz", prompt="This should fail")
graph_run(graph_id="<graph_id>")
```

**Step 2**: Await the reminder, then inspect the node via `graph_status(graph_id="<graph_id>", node_id="bad", include_output=true)`.

**Pass criteria (all must be true)**:
1. The node fails / escalates (does not hang indefinitely and is never a fabricated `completed`).
2. The error/escalate detail contains text indicating the agent was not found (e.g., "not found", "unknown", "invalid", "does not exist", or "no such agent").
3. The error detail references the invalid name "definitely-nonexistent-subagent-xyz" (helping debug which name failed).
4. This proves the dispatch layer validates agent ids against the resolved registry before executing a node, surfacing actionable errors through the node lifecycle.

---

---

### Test 163: Graph Engine v2 (imperative) — Graph Construction & Linear-Chain Execution

This test verifies the Graph Engine v2 imperative `graph_*` tool suite end-to-end by constructing a 3-node linear chain (n1→n2→n3, all agent `rolebox-tester--echo`) plus a 2-node bounded loop group, then validating the structure via `graph_run(dry_run=true)`. It exercises `graph_create`, `graph_add_node`, `graph_add_edge`, `graph_add_loop`, `graph_run`, and the `graph_status` polling protocol without consuming real dispatch budget during the validation phase.

**Step 1**: Create a new graph context:

```
graph_create(name="graph-engine-v2-chain")
```

Capture the returned `graph_id` from the response — it is required by every subsequent graph tool call.

**Step 2**: Add a linear chain of three nodes, all dispatching to the Echo subagent (full id `rolebox-tester--echo`):

```
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--echo", prompt="Reply with: GRAPH_N1_OK")
graph_add_node(graph_id="<graph_id>", id="n2", agent="rolebox-tester--echo", prompt="Reply with: GRAPH_N2_OK")
graph_add_node(graph_id="<graph_id>", id="n3", agent="rolebox-tester--echo", prompt="Reply with: GRAPH_N3_OK")
```

**Step 3**: Add `always`-type edges to form the linear chain, plus the closing back-edge that turns n2→n3 into the 2-node cycle the loop group declares:

```
graph_add_edge(graph_id="<graph_id>", from="n1", to="n2", type="always")
graph_add_edge(graph_id="<graph_id>", from="n2", to="n3", type="always")
graph_add_edge(graph_id="<graph_id>", from="n3", to="n2", type="always")
```

**Step 4**: Declare a bounded 2-node loop group on nodes n2 and n3 with a hard traversal cap:

```
graph_add_loop(graph_id="<graph_id>", id="loop-g1", nodes=["n2", "n3"], max_traversals=2)
```

**Step 5**: Validate the constructed graph without executing it (dry run). This must NOT dispatch any agent:

```
graph_run(graph_id="<graph_id>", dry_run=true)
```

**Step 6**: After a real (non-dry-run) `graph_run(graph_id="<graph_id>")` when executing a live graph, collect progress using the `graph_status` polling protocol:

```
graph_status(graph_id="<graph_id>", format="summary")
```

Repeatedly call `graph_status(graph_id="<graph_id>", format="summary")` until the graph `phase` becomes `complete` OR every node reports a terminal lifecycle status (`completed` / `timeout` / `escalate` / `cancelled` / `done`). `graph_status` is a safe, non-blocking liveness probe that never throws while work is in flight, so it is the correct primitive to poll.

**Pass criteria (all must be true)**:
1. `graph_create` returns a non-empty `graph_id`.
2. Each `graph_add_node` returns without error and acknowledges the node was added (response contains the node `id` or a success indication).
3. Each `graph_add_edge` with `type="always"` returns without error.
4. `graph_add_loop` with `nodes=["n2", "n3"]` and `max_traversals=2` returns without error.
5. `graph_run(graph_id="<graph_id>", dry_run=true)` returns a validation result with `validation.valid` equal to `true` — proving the graph (3-node chain + 2-node loop group) is structurally well-formed.
6. The same dry-run result has an `errors` array that is empty — proving no structural validation failures were detected.
7. `graph_status(graph_id="<graph_id>", format="summary")` returns without error and is safe to call repeatedly (the polling protocol), rendering node rows and a graph-level phase.
8. No actual agent dispatch occurred during the dry run (no `GRAPH_N*_OK` output is produced by the dry run itself) — proving `dry_run=true` validates without executing.
9. This proves the full Graph Engine v2 imperative construction surface (`graph_create` → `graph_add_node` → `graph_add_edge` → `graph_add_loop` → `graph_run` → `graph_status`) is wired and that validation correctly rejects nothing on a well-formed graph.

---

---

### Test 164: Graph Engine v2 (imperative) — Fan-Out / Fan-In Joins & Signal-Routed Edges

This test verifies the Graph Engine v2 fan-in convergence strategies and the `on_signal` edge-routing guard. It constructs fan-in graphs where multiple upstream nodes (agent `rolebox-tester--signal-answer`) converge on a single node declared with `graph_add_node(join={...})`, and asserts the `graph_status` phase transitions from the join *waiting* to *satisfied* as upstream nodes answer. It also exercises the documented guard that `graph_add_edge(type="on_signal")` WITHOUT `signal_filter` returns an error. All `rolebox-tester--signal-answer` upstream agents complete by emitting an `answer` signal (matching the documented JoinStrategy values `all` / `any` / `quorum` and the edge-type requirement that `on_signal` requires `signal_filter`).

**Step 1** — Create a fan-out / fan-in graph context:

```
graph_create(name="graph-engine-v2-joins")
```

Capture the returned `graph_id` from the response — it is required by every subsequent graph tool call. All fan-in graphs below reuse this single context.

**Step 2** — **join all**: Add two upstream nodes that both emit an `answer` signal, plus one convergence node whose `join` strategy is `all` (both upstream nodes must answer before the convergence node proceeds):

```
graph_add_node(graph_id="<graph_id>", id="ua1", agent="rolebox-tester--signal-answer", prompt="Reply with: JOIN_ALL_A_OK")
graph_add_node(graph_id="<graph_id>", id="ua2", agent="rolebox-tester--signal-answer", prompt="Reply with: JOIN_ALL_B_OK")
graph_add_node(graph_id="<graph_id>", id="all-join", agent="rolebox-tester--signal-answer", prompt="Reply with: JOIN_ALL_CONVERGED_OK", join={strategy:"all"})
```

**Step 3** — **join any**: Add two upstream nodes plus a convergence node whose `join` strategy is `any` (convergence proceeds after the FIRST upstream answer):

```
graph_add_node(graph_id="<graph_id>", id="ub1", agent="rolebox-tester--signal-answer", prompt="Reply with: JOIN_ANY_A_OK")
graph_add_node(graph_id="<graph_id>", id="ub2", agent="rolebox-tester--signal-answer", prompt="Reply with: JOIN_ANY_B_OK")
graph_add_node(graph_id="<graph_id>", id="any-join", agent="rolebox-tester--signal-answer", prompt="Reply with: JOIN_ANY_CONVERGED_OK", join={strategy:"any"})
```

**Step 4** — **join quorum**: Add three upstream nodes plus a convergence node whose `join` strategy is `quorum` with `quorum:2` (convergence proceeds when 2 of the 3 upstream nodes have answered):

```
graph_add_node(graph_id="<graph_id>", id="uq1", agent="rolebox-tester--signal-answer", prompt="Reply with: JOIN_QUORUM_A_OK")
graph_add_node(graph_id="<graph_id>", id="uq2", agent="rolebox-tester--signal-answer", prompt="Reply with: JOIN_QUORUM_B_OK")
graph_add_node(graph_id="<graph_id>", id="uq3", agent="rolebox-tester--signal-answer", prompt="Reply with: JOIN_QUORUM_C_OK")
graph_add_node(graph_id="<graph_id>", id="quorum-join", agent="rolebox-tester--signal-answer", prompt="Reply with: JOIN_QUORUM_CONVERGED_OK", join={strategy:"quorum", quorum:2})
```

**Step 5** — **on_signal edge (valid)**: Wire the fan-in convergence nodes into the graph with `on_signal` edges that carry a `signal_filter`, so each activation edge fires only on the upstream node's `answer` signal:

```
graph_add_edge(graph_id="<graph_id>", from="ua1", to="all-join", type="on_signal", signal_filter=["answer"])
graph_add_edge(graph_id="<graph_id>", from="ua2", to="all-join", type="on_signal", signal_filter=["answer"])
graph_add_edge(graph_id="<graph_id>", from="ub1", to="any-join", type="on_signal", signal_filter=["answer"])
graph_add_edge(graph_id="<graph_id>", from="ub2", to="any-join", type="on_signal", signal_filter=["answer"])
graph_add_edge(graph_id="<graph_id>", from="uq1", to="quorum-join", type="on_signal", signal_filter=["answer"])
graph_add_edge(graph_id="<graph_id>", from="uq2", to="quorum-join", type="on_signal", signal_filter=["answer"])
graph_add_edge(graph_id="<graph_id>", from="uq3", to="quorum-join", type="on_signal", signal_filter=["answer"])
```

**Step 6** — **on_signal guard (missing signal_filter)**: Exercise the documented guard — a second fan-in edge for `all-join` declared `on_signal` WITHOUT `signal_filter` MUST return an error:

```
graph_add_edge(graph_id="<graph_id>", from="ua1", to="all-join", type="on_signal")
```

**Step 7** — Validate the constructed graph structurally (dry run) without dispatching any agent:

```
graph_run(graph_id="<graph_id>", dry_run=true)
```

**Step 8** — After a real `graph_run(graph_id="<graph_id>")` when executing a live graph, collect progress using the `graph_status` polling protocol:

```
graph_status(graph_id="<graph_id>", format="summary")
```

Repeatedly call `graph_status(graph_id="<graph_id>", format="summary")` until the graph `phase` becomes `complete` OR every node reports a terminal lifecycle status (`completed` / `timeout` / `escalate` / `cancelled` / `done`). `graph_status` is a safe, non-blocking liveness probe that never throws while work is in flight, so it is the correct primitive to poll. When the graph is live, inspect the join nodes' reported join state across successive polls: each join node should report `waiting` before its upstream answers land and `satisfied` (then proceed) once the configured threshold is met.

**Pass criteria (all must be true)**:
1. `graph_create` returns a non-empty `graph_id`.
2. Every `graph_add_node(...)` that includes a `join` object returns without error and acknowledges the node — proving the structured `JoinConfig` (`strategy` + optional `quorum`) is accepted for strategies `all`, `any`, and `quorum`.
3. Every `graph_add_edge(type="on_signal", signal_filter=["answer"])` returns without error — proving an `on_signal` edge WITH `signal_filter` is accepted.
4. The Step 6 `graph_add_edge(type="on_signal")` WITHOUT `signal_filter` returns an ERROR (the engine throws because an `on_signal` edge requires `signal_filter`) — proving the documented guard is enforced.
5. `graph_run(graph_id="<graph_id>", dry_run=true)` returns a validation result with `validation.valid` equal to `true` and an empty `errors` array — proving the fan-out / fan-in graphs (with joins and `on_signal` edges) are structurally well-formed.
6. For **join all**: `graph_status` shows `all-join` first in a `waiting` join state, then transitions to `satisfied`/proceeds only AFTER BOTH `ua1` and `ua2` have answered.
7. For **join any**: `graph_status` shows `any-join` proceeding after the FIRST of `ub1`/`ub2` answers (the second answer is not required for convergence).
8. For **join quorum**: `graph_status` shows `quorum-join` proceeding once 2 of the 3 (`uq1`/`uq2`/`uq3`) upstream nodes have answered.
9. For the **on_signal** edges: the target join nodes advance only when their incoming `on_signal` edges receive a matching `answer` signal, confirming the `signal_filter` gates edge activation.
10. This proves the Graph Engine v2 fan-in convergence strategies (`all` / `any` / `quorum`) and `on_signal` signal-routed edges are wired, and that the missing-`signal_filter` guard correctly rejects malformed signal edges.

---

---

### Test 165: Graph Engine v2 (imperative) — Bounded Loops & Signal Propagation

This test verifies the Graph Engine v2 review-loop lifecycle and signal-propagation semantics. It builds a review loop — a worker node (agent `rolebox-tester--signal-revise`) feeding a convergence/reviewer node with a `type="on_signal"` back-edge gated on `signal_filter=["revise_needed"]`, all declared through `graph_add_loop(nodes=[...], max_traversals=3)`. It then drives the loop through all documented executor outcomes — `revising`, `converged`, `max_traversals_exhausted`, `stuck`, and `escalating` — asserting the node lifecycle (`escalate` / `cancelled` / `completed`), the `traversalCount`, and the recorded `round` history via `graph_status`. It also exercises the `graph_run(node_id=..., retry=true, modify_prompt=...)` node-retry path. Semantics verified against `src/graph/tools/index.ts` (`graph_add_loop` `nodes`/`max_traversals`; `graph_run` `node_id`/`retry`/`modify_prompt`), `src/graph/tools/graph-tools.ts` (`graph_status` `include_history`/`round`), and `src/graph/engine/loop-group-executor.ts` (outcomes `converged` / `revising` / `stuck` / `max_traversals_exhausted` / `escalating`; `CONSECUTIVE_STALE_THRESHOLD = 2`).

**Step 1** — Create a review-loop graph context:

```
graph_create(name="graph-engine-v2-loop-propagation")
```

Capture the returned `graph_id` from the response — it is required by every subsequent graph tool call. All loop scenarios below reuse this single context.

**Step 2** — Build the worker → reviewer review loop. Add a worker node (agent `rolebox-tester--signal-revise`, which emits a `revise_needed` signal with its payload) and a convergence/reviewer node (agent `rolebox-tester--signal-answer`, which emits an `answer` signal to converge the loop):

```
graph_add_node(graph_id="<graph_id>", id="review-worker", agent="rolebox-tester--signal-revise", prompt="Draft the review. First pass must reply with a revise_needed signal.")
graph_add_node(graph_id="<graph_id>", id="review-gate", agent="rolebox-tester--signal-answer", prompt="Review the draft. Converge by replying with an answer signal.", join={strategy:"all"})
```

**Step 3** — Wire the loop edges. A forward `always` edge worker → reviewer, plus a `type="on_signal"` back-edge reviewer → worker that fires only on the reviewer's `revise_needed` signal (without `signal_filter`, this edge would be rejected by the guard — see Test 164):

```
graph_add_edge(graph_id="<graph_id>", from="review-worker", to="review-gate", type="always")
graph_add_edge(graph_id="<graph_id>", from="review-gate", to="review-worker", type="on_signal", signal_filter=["revise_needed"])
```

**Step 4** — Declare a bounded review-loop group over the worker and reviewer with a hard cap of 3 traversals:

```
graph_add_loop(graph_id="<graph_id>", id="loop-review", nodes=["review-worker", "review-gate"], max_traversals=3)
```

**Step 5** — Validate the constructed loop graph without executing (dry run). This must NOT dispatch any agent:

```
graph_run(graph_id="<graph_id>", dry_run=true)
```

**Step 6** — After a real `graph_run(graph_id="<graph_id>")`, collect progress using the `graph_status` polling protocol. Request the round history so each recorded traversal round (its `round` number, `traversalCount`, and node `status`) is surfaced alongside the node lifecycle:

```
graph_status(graph_id="<graph_id>", format="summary", include_history=true)
```

Repeatedly call `graph_status(graph_id="<graph_id>", format="summary", include_history=true)` until the graph `phase` becomes `complete` OR every node reports a terminal lifecycle status (`completed` / `timeout` / `escalate` / `cancelled` / `done`). `graph_status` is a safe, non-blocking liveness probe that never throws while work is in flight, so it is the correct primitive to poll. Read the loop group's `traversalCount` (increments each time a `revise_needed` back-edge consumes a traversal) and the `rounds`/`include_history` array (each recorded round carries its `round` number and the `traversalCount` at that boundary).

**Step 7** — Drive the reviewing path (outcome `revising`). Re-run the live graph so the worker emits a `revise_needed`; because `max_traversals=3` leaves traversals remaining, the executor records a completed round and re-enters the worker via the back-edge. Assert via `graph_status(graph_id="<graph_id>", format="summary", include_history=true)` that the loop group reports a recorded `round` (the `include_history` output renders `round N [traversal M] status <status>`) and that `traversalCount` has incremented relative to its prior value.

**Step 8** — Drive the converged path (outcome `converged`). Re-run so the convergence/reviewer node (agent `rolebox-tester--signal-answer`) emits an `answer` signal on the reviewer. Assert via `graph_status` that the `answer` resets the loop's stuck tracker and completes the loop naturally — `review-gate` reaches a `completed` lifecycle (no further traversal is consumed on the happy path).

**Step 9** — Drive `max_traversals_exhausted`. Re-run so a `revise_needed` arrives after the loop has consumed its full `max_traversals=3`. Assert via `graph_status` that the affected node escalates — lifecycle `escalate`, `phase` NOT `complete` — with the exhaustion reason surfaced (the executor reports `max_traversals_exhausted` with `reason: "max_traversals exhausted"`).

**Step 10** — Drive the stuck path (outcome `stuck`). Re-run so the convergence node emits consecutive IDENTICAL `revise_needed` outputs (>= `CONSECUTIVE_STALE_THRESHOLD` = 2). Assert via `graph_status` that the node escalates with lifecycle `escalate` and `reason: "stuck"` BEFORE another traversal is consumed.

**Step 11** — Drive escalate propagation + cascade cancellation (outcome `escalating`). Add an upstream node (agent `rolebox-tester--signal-escalate`) and wire it to the worker with an `always` edge so its worst signal propagates forward. On its `escalate` signal, the engine performs worst-signal forward propagation and cascade cancellation of the still-pending downstream join. Assert via `graph_status` that the downstream node reports `escalate` and any still-pending upstream peers report `cancelled`.

**Step 12** — Exercise node retry. Pick a terminal node (e.g. the escalated or completed reviewer) and re-open / re-dispatch it:

```
graph_run(graph_id="<graph_id>", node_id="review-gate", retry=true, modify_prompt="Please retry the review and reply with an answer signal.")
```

Assert that the retry re-opens and re-dispatches the terminal node — `graph_status` shows `review-gate` returning to a re-dispatched state and settling back to `completed` after the retry lands.

**Pass criteria (all must be true)**:
1. `graph_create` returns a non-empty `graph_id`.
2. `graph_add_loop(graph_id="<graph_id>", id="loop-review", nodes=["review-worker", "review-gate"], max_traversals=3)` returns without error — proving the bounded-loop declaration accepts the `nodes` array and `max_traversals` cap.
3. The `on_signal` back-edge reviewer → worker WITH `signal_filter=["revise_needed"]` returns without error — proving a signal-routed loop back-edge is accepted.
4. `graph_run(graph_id="<graph_id>", dry_run=true)` returns `validation.valid` equal to `true` and an empty `errors` array — proving the worker → reviewer loop graph (forward `always` edge + `on_signal` back-edge) is structurally well-formed.
5. `graph_status(graph_id="<graph_id>", format="summary", include_history=true)` returns without error and renders a loop-group row with a `traversalCount` counter, plus per-round history rows when rounds have been recorded.
6. **Reviewing path (a)**: after a `revise_needed`, `graph_status(include_history=true)` shows a recorded `round` entry and `traversalCount` strictly greater than its value before the revise — proving the back-edge consumed a traversal and recorded a round.
7. **Converged path (b)**: an `answer` signal from `review-gate` (agent `rolebox-tester--signal-answer`) resets the stuck tracker and completes the loop — `graph_status` shows `review-gate` at `completed` with no further traversal consumed on the happy path.
8. **max_traversals_exhausted (c)**: a `revise_needed` arriving at the `max_traversals=3` cap escalates the node — `graph_status` shows lifecycle `escalate`, graph/node `phase` NOT `complete`, and the exhaustion reason surfaced.
9. **Stuck (d)**: `>= CONSECUTIVE_STALE_THRESHOLD` (= 2) consecutive IDENTICAL `revise_needed` outputs escalate the node with lifecycle `escalate` and `reason: "stuck"` BEFORE another traversal is consumed.
10. **Escalate propagation (e)**: an upstream `escalate` (agent `rolebox-tester--signal-escalate`) triggers worst-signal forward propagation and cascade cancellation — `graph_status` shows the downstream node at `escalate` and still-pending peers at `cancelled`.
11. **Node retry (f)**: `graph_run(node_id="review-gate", retry=true, modify_prompt="...")` re-opens and re-dispatches a terminal node — `graph_status` shows `review-gate` settling back to `completed` after the retry lands.
12. This proves the full Graph Engine v2 review-loop lifecycle (`revising` → `converged` → `max_traversals_exhausted` → `stuck` → `escalating`) — bounded loops with signal-routed back-edges, round-history recording, traversal caps, stuck detection, escalate/cascade propagation, and node retry — are all wired end to end.

---

---

### Test 166: Graph Engine v2 (imperative) — Approval Gate & Cancellation

This test verifies the Graph Engine v2 human-in-the-loop (`needs_approval`) approval gate and the three cancellation surfaces (`graph_cancel` whole-graph, scoped-with-cascade, and loop-target). It builds graphs whose gate node (agent `rolebox-tester--signal-approve`, declared with `needs_approval=true`) pauses the engine in the `blocked` lifecycle while the graph `phase` stays `executing` (not `complete`), then resumes it through the parent-facing `graph_approve(graph_id=..., node_id=..., action="approve"|"reject", reason=..., payload=...)` surface and asserts the per-action lifecycle outcome. It then exercises `graph_cancel`: whole-graph (every active node → `cancelled`, phase → `complete`), scoped `cascade=true` (only the target + its transitive downstream → `cancelled`, the upstream gate left `blocked`), and loop-target (the loop's full member set → `cancelled`). Semantics verified against `src/graph/tools/index.ts` (`graph_add_node` `needs_approval`; `graph_cancel` `graph_id`/`node_id`/`loop_id`/`cascade`; `graph_approve` `action` `approve`/`reject` + `reason`/`payload`), `src/graph/tools/graph-tools.ts` (`graph_approve` routes `approveNode`/`rejectNode` and returns the post-decision `node_status` + `phase`; `graph_cancel` whole-graph via `runtime.cancel()`, scoped via `runtime.cancelNodes(targetIds, {cascade})`), `src/graph/engine/approval-handler.ts` (`approveBlockedNode`: `blocked → completed`; `rejectBlockedNode`: loop member `blocked → ready` re-enter with the reason merged into the prompt, non-loop `blocked → escalate`), and `src/graph/engine/cancellation.ts` (`isCancellable` only `pending|ready|running`; `blocked`/`completed`/terminal are `skipped`; loop targets expand to their full member set; `cascade` walks the transitive downstream closure).

**Step 1** — Create the approval-gate graph context. All approval scenarios below reuse this single context:

```
graph_create(name="graph-engine-v2-approval-gate")
```

Capture the returned `graph_id` from the response — it is required by every subsequent graph tool call.

**Step 2** — Build a human-in-the-loop gate. Add a `needs_approval=true` gate node (agent `rolebox-tester--signal-approve`, which emits a `need_approval` signal with a rendered summary payload) plus one downstream node wired on an `on_signal` answer edge so the approved gate's forward data flow activates downstream:

```
graph_add_node(graph_id="<graph_id>", id="gate", agent="rolebox-tester--signal-approve", prompt="Request human approval before proceeding.", needs_approval=true)
graph_add_node(graph_id="<graph_id>", id="after", agent="rolebox-tester--signal-answer", prompt="Reply with: APPROVED_CONTINUED_OK")
graph_add_edge(graph_id="<graph_id>", from="gate", to="after", type="on_signal", signal_filter=["answer"])
```

**Step 3** — Validate the constructed approval graph without executing (dry run). This must NOT dispatch any agent:

```
graph_run(graph_id="<graph_id>", dry_run=true)
```

**Step 4** — Run the graph live and confirm the engine pauses at the gate. After a real `graph_run(graph_id="<graph_id>")`, collect state using the `graph_status` polling protocol:

```
graph_status(graph_id="<graph_id>", format="summary")
```

Repeatedly call `graph_status(graph_id="<graph_id>", format="summary")` until the gate node (`gate`) reports the `blocked` lifecycle status. `graph_status` is a safe, non-blocking liveness probe that never throws while work is in flight, so it is the correct primitive to poll. **Assert** that the gate is `blocked` AND the graph `phase` is still `executing` (a blocked approval gate counts as active work — the engine has NOT reached `complete`), and that the downstream `after` node has NOT advanced (its `on_signal(answer)` edge is gated on the gate's `answer` signal, which has not been emitted yet).

**Step 5** — **Approve the gate** and confirm it completes and advances the graph. Resolve the human gate with `action="approve"`, passing an optional approval `payload` that is routed downstream as the gate's `answer` output:

```
graph_approve(graph_id="<graph_id>", node_id="gate", action="approve", payload={"verdict":"approved"})
```

The returned result carries the post-decision `node_status` and `phase`. **Assert** that `node_status` is `completed` (the gate transitioned `blocked → completed` per `approveBlockedNode`) and that the `phase` has advanced (the gate's `answer` signal activates the downstream `on_signal(answer)` edge, so `after` proceeds toward `complete`). Confirm with `graph_status(graph_id="<graph_id>", format="summary")` that `gate` is `completed`, `after` advances/completes, and the graph `phase` reaches `complete`.

**Step 6** — **Reject on a NON-loop node (escalate lane)**. Build a second graph whose gate has NO loop group, block it, then reject it with `action="reject"` and a `reason`. Per `rejectBlockedNode`, a rejection with nowhere to re-enter escalates the node (`blocked → escalate`) so the graph does not proceed with un-reviewed changes:

```
graph_create(name="graph-engine-v2-reject-escalate")
graph_add_node(graph_id="<graph_id>", id="gate-e", agent="rolebox-tester--signal-approve", prompt="Request human approval.", needs_approval=true)
graph_run(graph_id="<graph_id>")
graph_status(graph_id="<graph_id>", format="summary")
graph_approve(graph_id="<graph_id>", node_id="gate-e", action="reject", reason="not acceptable")
```

After `graph_status` shows `gate-e` at `blocked`, the `graph_approve(..., action="reject", reason="not acceptable")` result's `node_status` MUST be `escalate` and its `phase` MUST NOT be `complete` — proving the reject-escalate lane (no loop group → `blocked → escalate`).

**Step 7** — **Reject on a LOOP member (re-enter lane)**. Build a third graph whose gate is a member of a declared loop group, block it, then reject it. Per `rejectBlockedNode`, a loop-member rejection re-enters the node `ready` with the rejection feedback merged into its re-execution prompt (so the node — and the loop that feeds it — re-runs):

```
graph_create(name="graph-engine-v2-reject-reenter")
graph_add_node(graph_id="<graph_id>", id="worker-r", agent="rolebox-tester--signal-revise", prompt="Produce a draft.")
graph_add_node(graph_id="<graph_id>", id="gate-r", agent="rolebox-tester--signal-approve", prompt="Review and request human approval.", needs_approval=true)
graph_add_edge(graph_id="<graph_id>", from="worker-r", to="gate-r", type="always")
graph_add_loop(graph_id="<graph_id>", id="loop-reject", nodes=["worker-r", "gate-r"], max_traversals=2)
graph_run(graph_id="<graph_id>")
graph_status(graph_id="<graph_id>", format="summary")
graph_approve(graph_id="<graph_id>", node_id="gate-r", action="reject", reason="redo this")
```

After `graph_status` shows `gate-r` at `blocked`, the `graph_approve(..., action="reject", reason="redo this")` result's `node_status` MUST be `ready` (the node re-entered `blocked → ready` and was added back to the frontier for re-dispatch) — proving the reject-re-enter lane (loop member → `blocked → ready` with feedback).

**Step 8** — **Whole-graph cancellation**. Reuse a fresh graph with an active (blocked) gate plus still-pending downstream, then cancel the ENTIRE graph. With neither `node_id` nor `loop_id`, `graph_cancel` runs `EngineRuntime.cancel()`: every active node (`running`/`ready`/`pending`) → `cancelled`, and the phase advances to `complete`:

```
graph_create(name="graph-engine-v2-cancel-whole")
graph_add_node(graph_id="<graph_id>", id="gate-w", agent="rolebox-tester--signal-approve", prompt="Request human approval.", needs_approval=true)
graph_add_node(graph_id="<graph_id>", id="leaf-w", agent="rolebox-tester--signal-answer", prompt="Reply with: CANCELLED_BEFORE_RUN_OK")
graph_add_edge(graph_id="<graph_id>", from="gate-w", to="leaf-w", type="always")
graph_run(graph_id="<graph_id>")
graph_cancel(graph_id="<graph_id>")
graph_status(graph_id="<graph_id>", format="summary")
```

After `graph_cancel(graph_id="<graph_id>")` returns a `cancelled` array (the ACTUAL cancelled ids from the engine, never a guess), poll `graph_status(graph_id="<graph_id>", format="summary")`. **Assert** that every active node reports `cancelled` and the graph `phase` is `complete` — proving whole-graph cancellation retires the entire graph.

**Step 9** — **Scoped cascade cancellation**. Build a linear chain whose head is a blocked gate and whose two downstream nodes are still pending, then cancel ONLY the middle node with `cascade=true`. Per `cancellation.ts` / `graph-tools.ts`, the scoped target + its transitive downstream (forward closure over edges) are retired to `cancelled`, while the upstream `blocked` gate is `skipped` (blocked nodes are not cancellable) and left untouched:

```
graph_create(name="graph-engine-v2-cancel-scoped")
graph_add_node(graph_id="<graph_id>", id="src-s", agent="rolebox-tester--signal-approve", prompt="Request human approval.", needs_approval=true)
graph_add_node(graph_id="<graph_id>", id="mid-s", agent="rolebox-tester--signal-answer", prompt="Reply with: MID_OK")
graph_add_node(graph_id="<graph_id>", id="leaf-s", agent="rolebox-tester--signal-answer", prompt="Reply with: LEAF_OK")
graph_add_edge(graph_id="<graph_id>", from="src-s", to="mid-s", type="always")
graph_add_edge(graph_id="<graph_id>", from="mid-s", to="leaf-s", type="always")
graph_run(graph_id="<graph_id>")
graph_cancel(graph_id="<graph_id>", node_id="mid-s", cascade=true)
graph_status(graph_id="<graph_id>", format="summary")
```

After `graph_status` shows `src-s` at `blocked` (mid and leaf still `pending`), `graph_cancel(graph_id="<graph_id>", node_id="mid-s", cascade=true)` returns a `cancelled` array. **Assert** via `graph_status` that `mid-s` AND `leaf-s` report `cancelled` (only the target + its transitive downstream), and that the upstream `src-s` remains `blocked` — proving scoped-with-cascade cancellation does NOT touch the whole graph and leaves non-cancellable (blocked) nodes alone.

**Step 10** — **Loop-target cancellation**. Build a loop group, then cancel it by `loop_id`. A loop target is an indivisible bounded cycle, so its full member set is retired (and `cascade` defaults to `true` for a loop target, retiring its transitive downstream too):

```
graph_create(name="graph-engine-v2-cancel-loop")
graph_add_node(graph_id="<graph_id>", id="l1", agent="rolebox-tester--signal-revise", prompt="Produce a draft.")
graph_add_node(graph_id="<graph_id>", id="l2", agent="rolebox-tester--signal-answer", prompt="Converge with an answer signal.", join={strategy:"all"})
graph_add_edge(graph_id="<graph_id>", from="l1", to="l2", type="always")
graph_add_edge(graph_id="<graph_id>", from="l2", to="l1", type="on_signal", signal_filter=["revise_needed"])
graph_add_loop(graph_id="<graph_id>", id="loop-cancel", nodes=["l1", "l2"], max_traversals=2)
graph_run(graph_id="<graph_id>")
graph_cancel(graph_id="<graph_id>", loop_id="loop-cancel")
graph_status(graph_id="<graph_id>", format="summary")
```

After `graph_cancel(graph_id="<graph_id>", loop_id="loop-cancel")` returns a `cancelled` array, **assert** via `graph_status` that BOTH loop members `l1` and `l2` report `cancelled` — proving the loop target resolved to its full member set and retired the bounded cycle.

**Pass criteria (all must be true)**:
1. `graph_create` returns a non-empty `graph_id` for every scenario.
2. `graph_add_node(..., needs_approval=true, agent="rolebox-tester--signal-approve", ...)` returns without error and acknowledges the node — proving the `needs_approval` boolean is accepted.
3. `graph_run(graph_id="<graph_id>", dry_run=true)` on the approval graph returns `validation.valid` equal to `true` and an empty `errors` array — proving a `needs_approval` gate graph is structurally well-formed.
4. After a live `graph_run`, `graph_status` shows the `needs_approval` gate at `blocked` AND the graph `phase` still `executing` (NOT `complete`) — proving the engine pauses at the approval gate without finishing.
5. `graph_approve(graph_id="<graph_id>", node_id="gate", action="approve", payload=...)` returns a result whose `node_status` is `completed` and whose `phase` advances — proving `approve` resolves the gate (`blocked → completed`) and runs the forward `answer` data flow (downstream `after` advances).
6. **Reject non-loop**: `graph_approve(..., node_id="gate-e", action="reject", reason="not acceptable")` on a gate with NO loop group returns a result whose `node_status` is `escalate` and whose `phase` is NOT `complete` — proving the reject-escalate lane.
7. **Reject loop member**: `graph_approve(..., node_id="gate-r", action="reject", reason="redo this")` on a loop-group-member gate returns a result whose `node_status` is `ready` — proving the reject-re-enter lane (`blocked → ready` with the reason merged into the re-execution prompt).
8. **Whole-graph cancel**: `graph_cancel(graph_id="<graph_id>")` (no target) returns a `cancelled` array and `graph_status` then shows every active node at `cancelled` with the graph `phase` at `complete`.
9. **Scoped cascade cancel**: `graph_cancel(graph_id="<graph_id>", node_id="mid-s", cascade=true)` returns a `cancelled` array and `graph_status` then shows `mid-s` AND `leaf-s` (the target + its transitive downstream) at `cancelled`, while the upstream `src-s` stays `blocked` — proving scoped cancellation does not tear down the whole graph and leaves non-cancellable nodes alone.
10. **Loop-target cancel**: `graph_cancel(graph_id="<graph_id>", loop_id="loop-cancel")` returns a `cancelled` array and `graph_status` then shows BOTH loop members `l1` and `l2` at `cancelled` — proving the loop target resolved to its full member set.
11. This proves the full Graph Engine v2 approval-gate and cancellation surface — `needs_approval` pausing (`blocked`, phase `executing`), `graph_approve` approve/reject (approve → `completed`; reject → re-enter `ready` on a loop member / `escalate` on a non-loop node), and `graph_cancel` (whole-graph, scoped `cascade=true`, and loop-target) — are all wired end to end.

---

---

### Test 167: Graph Engine v2 (imperative) — graph_status Observability Flags

This test verifies every backed `graph_status` observability flag renders either GENUINE data or an EXPLICIT honest-empty note — never a fabricated row. It builds one multi-node graph (a fan-in join + a bounded review loop over `rolebox-tester--signal-answer` / `rolebox-tester--signal-revise`), runs it to a terminal phase via the `graph_status` polling protocol, then exercises every §2.2 flag against the completed graph: `format="tree"` / `format="json"`, the `query` / `status` / `agent` filters, `group_by` (hour/day/agent over completed nodes), `include_history` + `round=<n>`, `stream` + `since`, the full `include_*` family (`include_budget` / `include_metrics` / `include_loops` / `include_concurrency` / `include_checkpoint` / `include_artifacts` / `include_evidence`), `scope="persisted"` / `scope="all"`, and `export_path`. Semantics verified against `src/graph/tools/index.ts` (`createGraphStatusTool` zod schema — `statusFormatEnum` `["summary","tree","json"]`, `scope` `["session","persisted","all"]`, `group_by` `["hour","day","agent"]`, `include_history`/`round`, `stream`/`since`, `export_path`), `src/graph/tools/status-queries.ts` (`filterByQuery`/`filterByStatus`/`filterByAgent` AND-combined; `filterByDateWindow`; `groupCompletedNodes` buckets ONLY completed nodes over `completedAt`, sorted by key, empty bucket list when none — honest, never invented), and `src/graph/tools/graph-tools.ts` (`UNSUPPORTED_GRAPH_STATUS_FLAGS = []` at lines 437-440 — the registry is EMPTY, so every original flag is backed; the empty-registry end state is pinned by `tests/graph/graph-status-flags.test.ts`).

**Step 1** — Create the observability graph context. All flag exercises below reuse this single context:

```
graph_create(name="graph-engine-v2-status-flags")
```

Capture the returned `graph_id` from the response — it is required by every subsequent `graph_status` call.

**Step 2** — Build a multi-node graph that produces completed nodes AND a recorded loop round (so the observability flags have genuine data to render). Add two upstream answer nodes, a fan-in join convergence node, and a bounded review loop (worker → reviewer wired with an `on_signal` back-edge gated on `revise_needed`):

```
graph_add_node(graph_id="<graph_id>", id="obs-a", agent="rolebox-tester--signal-answer", prompt="Reply with: STATUS_A_OK")
graph_add_node(graph_id="<graph_id>", id="obs-b", agent="rolebox-tester--signal-answer", prompt="Reply with: STATUS_B_OK")
graph_add_node(graph_id="<graph_id>", id="obs-join", agent="rolebox-tester--signal-answer", prompt="Reply with: STATUS_JOIN_OK", join={strategy:"all"})
graph_add_node(graph_id="<graph_id>", id="obs-worker", agent="rolebox-tester--signal-revise", prompt="Draft the review. First pass must reply with a revise_needed signal.")
graph_add_node(graph_id="<graph_id>", id="obs-gate", agent="rolebox-tester--signal-answer", prompt="Review the draft. Converge by replying with an answer signal.", join={strategy:"all"})
graph_add_edge(graph_id="<graph_id>", from="obs-a", to="obs-join", type="on_signal", signal_filter=["answer"])
graph_add_edge(graph_id="<graph_id>", from="obs-b", to="obs-join", type="on_signal", signal_filter=["answer"])
graph_add_edge(graph_id="<graph_id>", from="obs-worker", to="obs-gate", type="always")
graph_add_edge(graph_id="<graph_id>", from="obs-gate", to="obs-worker", type="on_signal", signal_filter=["revise_needed"])
graph_add_loop(graph_id="<graph_id>", id="obs-loop", nodes=["obs-worker", "obs-gate"], max_traversals=2)
```

**Step 3** — Validate the constructed graph structurally without executing (dry run). This must NOT dispatch any agent:

```
graph_run(graph_id="<graph_id>", dry_run=true)
```

**Step 4** — Run the graph live and drive it to a terminal phase using the `graph_status` polling protocol:

```
graph_status(graph_id="<graph_id>", format="summary")
```

Repeatedly call `graph_status(graph_id="<graph_id>", format="summary")` until the graph `phase` becomes `complete` OR every node reports a terminal lifecycle status (`completed` / `timeout` / `escalate` / `cancelled` / `done`). `graph_status` is a safe, non-blocking liveness probe that never throws while work is in flight, so it is the correct primitive to poll. **Assert** that at least the upstream and join nodes report `completed` (so `group_by` and the filters have genuine completed nodes to act on), and that the loop group recorded at least one round (so `include_history` / `round` have a genuine row).

**Step 5** — `format="tree"`. Request the node dependency tree. Assert it renders an INDENTED tree (nodes nested beneath their upstream parents via the wired edges), not a flat table:

```
graph_status(graph_id="<graph_id>", format="tree")
```

**Step 6** — `format="json"`. Request the machine-readable snapshot. Assert the response is VALID JSON (parseable) and carries the node rows (node `id` / `status` / `agent` present for the constructed nodes):

```
graph_status(graph_id="<graph_id>", format="json")
```

**Step 7** — Filters (`query` / `status` / `agent`). Exercise each filter independently and assert it narrows the render to an honest subset (AND-combined per `status-queries.ts` `filterNodes`):

```
graph_status(graph_id="<graph_id>", format="summary", query="obs-a")
graph_status(graph_id="<graph_id>", format="summary", status="completed")
graph_status(graph_id="<graph_id>", format="summary", agent="rolebox-tester--signal-answer")
```

For each call, **assert** that every returned row satisfies the filter predicate: `query="obs-a"` returns only rows whose nodeId/prompt/agent contain `obs-a`; `status="completed"` returns only `completed` rows; `agent="rolebox-tester--signal-answer"` returns only rows from that agent. A filter with no match MUST return an empty set, never an invented row.

**Step 8** — `group_by` (hour / day / agent). Aggregate the COMPLETED nodes over their `completedAt` into buckets (per `status-queries.ts` `groupCompletedNodes` — a distinct view mode that takes precedence over the row render and excludes uncompleted nodes honestly):

```
graph_status(graph_id="<graph_id>", format="summary", group_by="hour")
graph_status(graph_id="<graph_id>", format="summary", group_by="day")
graph_status(graph_id="<graph_id>", format="summary", group_by="agent")
```

For each mode, **assert** that only `completed` nodes (with a `completedAt` timestamp) appear in the returned bucket list, that each bucket carries a genuine `count` and `nodes` id list, and that buckets are sorted by key. On a graph with no completed node, the bucket list MUST be empty — never a fabricated slot.

**Step 9** — `include_history` + `round=<n>`. Surface the loop group's ordered round history, then drill to a single recorded round:

```
graph_status(graph_id="<graph_id>", format="summary", loop_id="obs-loop", include_history=true)
graph_status(graph_id="<graph_id>", format="summary", loop_id="obs-loop", include_history=true, round=1)
```

**Assert** that `include_history=true` renders the recorded round rows (each recorded round carries its `round` number and `traversalCount`) for the `obs-loop` group. A loop group with no recorded rounds MUST show an explicit `no loop rounds recorded` note — never invented rows. For a `round=<n>` that was NOT recorded, the response MUST show an explicit `round N: not recorded` note.

**Step 10** — `stream` + `since`. Surface the timestamped per-node signal-event history, then window it by a lower bound:

```
graph_status(graph_id="<graph_id>", format="summary", stream=true)
graph_status(graph_id="<graph_id>", format="summary", stream=true, since="<ISO-8601 timestamp at or before the graph run>")
```

**Assert** that `stream=true` renders each node's signal-event history (`signal` / `atMs` entries) from the signal ledger — genuine recorded events, not fabricated. An empty history MUST show an explicit `no events recorded` note. With `since`, events before the bound are filtered; if none remain, the response MUST show an explicit `no events since <ts>` note.

**Step 11** — The `include_*` family. Exercise each flag and assert it renders GENUINE data OR an explicit honest-empty note — NEVER a fabricated row:

```
graph_status(graph_id="<graph_id>", format="summary", include_budget=true)
graph_status(graph_id="<graph_id>", format="summary", include_metrics=true)
graph_status(graph_id="<graph_id>", format="summary", include_loops=true)
graph_status(graph_id="<graph_id>", format="summary", include_concurrency=true)
graph_status(graph_id="<graph_id>", format="summary", include_checkpoint=true)
graph_status(graph_id="<graph_id>", format="summary", include_artifacts=true)
graph_status(graph_id="<graph_id>", format="summary", include_evidence=true)
```

For each: **assert** the flag is honored and either (a) renders genuine backing data — `include_loops` the `obs-loop` group's `traversalCount`/rounds; `include_budget` the budget consumption breakdown — or (b) renders an EXPLICIT honest-empty / documented-unavailable note — `include_metrics` a metrics snapshot or a documented-unavailable note, `include_concurrency` a live per-key slot breakdown OR the explicit `no dispatch manager bound` documented-unavailable note (never fabricated slot data), `include_checkpoint` an explicit `no checkpoint recorded` note when none exists, `include_artifacts` / `include_evidence` the recorded artifact/evidence paths OR an explicit `no artifacts / evidence recorded` note. No flag may render a made-up value.

**Step 12** — `scope="persisted"` / `scope="all"`. Query the cross-session on-disk engine-state view:

```
graph_status(scope="persisted")
graph_status(scope="all")
```

For `scope="persisted"` and `scope="all"`, **assert** an EXPLICIT honest-empty note when the engine-state store holds no hydrated graphs (e.g. `no persisted graphs recorded`), OR a genuine listing when persisted graphs exist — never fabricated rows. The `query` / `status` / `agent` / `group_by` filters and `include_budget` aggregate across sessions in these scopes.

**Step 13** — `export_path`. Write an atomic export and assert the confirmation (mode-dependent: a node_id writes that node's materialized result text; `include_metrics` writes a metrics JSON snapshot; neither writes the owning graph's declaration to YAML):

```
graph_status(graph_id="<graph_id>", node_id="obs-a", export_path="<a writable path ending in .txt>")
graph_status(graph_id="<graph_id>", format="summary", include_metrics=true, export_path="<a writable path ending in .json>")
```

**Assert** each call returns an explicit export CONFIRMATION (not a status render), the target file is created on disk, and for the JSON metrics export the file content parses as valid JSON.

**Step 14** — Reference the empty `UNSUPPORTED_GRAPH_STATUS_FLAGS` registry. Cross-check the end-state pinned by `tests/graph/graph-status-flags.test.ts`:

```
graph_status(graph_id="<graph_id>", format="summary")
```

No dedicated `graph_status` call backs this registry (it is a code-level constant), so **assert** by construction that every §2.2 flag exercised in Steps 5-13 (`format` `summary`/`tree`/`json`; `scope` `session`/`persisted`/`all`; `query`; `status`; `agent`; `group_by` `hour`/`day`/`agent`; `include_budget`; `include_metrics`; `include_loops`; `include_concurrency`; `include_checkpoint`; `include_artifacts`; `include_evidence`; `include_history`; `round`; `stream`; `since`; `export_path`) is now backed with genuine data or an explicit honest-empty note, and that `UNSUPPORTED_GRAPH_STATUS_FLAGS === []` — the registry is EMPTY, so no flag is documented-unsupported. (Confirmed against `src/graph/tools/graph-tools.ts:437-440` where the registry is declared as an empty `ReadonlyArray`.)

**Pass criteria (all must be true)**:
1. `graph_create` returns a non-empty `graph_id`, and every `graph_add_node` / `graph_add_edge` / `graph_add_loop` returns without error — the multi-node graph (fan-in join + bounded review loop) is constructed.
2. `graph_run(graph_id="<graph_id>", dry_run=true)` returns `validation.valid` equal to `true` and an empty `errors` array — the graph is structurally well-formed.
3. After a live `graph_run`, the `graph_status(format="summary")` polling protocol drives the graph to a terminal phase with at least the upstream and join nodes `completed` and at least one recorded loop round.
4. `format="tree"` renders an INDENTED dependency tree (nodes nested under upstream parents), not a flat table.
5. `format="json"` returns a response that is VALID JSON carrying the constructed node rows (`id` / `status` / `agent`).
6. The `query` / `status` / `agent` filters each return an honest subset matching their predicate; a no-match filter returns an empty set, never an invented row.
7. `group_by` (hour/day/agent) buckets ONLY `completed` nodes over `completedAt`, sorted by key, with genuine `count` / `nodes`; an empty bucket list (not fabricated) when no completed node exists.
8. `include_history` renders the loop group's recorded round rows and `round=<n>` returns a recorded round or an explicit `round N: not recorded` note.
9. `stream` renders genuine signal-event history; `since` filters to events at/after the bound and yields an explicit `no events since <ts>` note when none remain; an empty history yields `no events recorded`.
10. Every `include_*` flag (`include_budget` / `include_metrics` / `include_loops` / `include_concurrency` / `include_checkpoint` / `include_artifacts` / `include_evidence`) renders genuine backing data OR an explicit honest-empty / documented-unavailable note — NEVER a fabricated row.
11. `scope="persisted"` / `scope="all"` yield an explicit honest-empty note when the engine-state store is empty, or a genuine listing when persisted graphs exist.
12. `export_path` returns an export confirmation, creates the file on disk, and a `.json` metrics export parses as valid JSON.
13. `UNSUPPORTED_GRAPH_STATUS_FLAGS === []` (empty registry) — every original §2.2 `graph_status` flag is backed, confirmed against `src/graph/tools/graph-tools.ts:437-440`.
14. This proves the full `graph_status` observability surface — formats, filters, grouping, loop-round history, signal-event stream, the `include_*` family, cross-session scopes, and atomic export — all backed with honest rendering and zero fabricated values.

---

---

### Test 168: Graph Engine v2 (imperative) — `on_condition` Edges

This test verifies the Graph Engine v2 `type="on_condition"` edge lane, which activates a forward edge only when a named condition evaluates true against the source node's runtime state. The default resolver supports `signal_observed(<type>)` and `artifact_exists(<name>)` (per `src/graph/engine/condition-resolver.ts`); every other name evaluates false and never activates the edge. It also exercises the documented guard that `graph_add_edge(type="on_condition")` WITHOUT a `condition` returns an error.

**Step 1** — Create the condition-edge graph context:

```
graph_create(name="graph-engine-v2-on-condition")
```

Capture the returned `graph_id`.

**Step 2** — Build a source node that emits an `answer` signal plus a downstream node gated on a `signal_observed(answer)` condition edge:

```
graph_add_node(graph_id="<graph_id>", id="cond-src", agent="rolebox-tester--signal-answer", prompt="Reply with: COND_SRC_OK")
graph_add_node(graph_id="<graph_id>", id="cond-after", agent="rolebox-tester--signal-answer", prompt="Reply with: COND_AFTER_OK")
graph_add_edge(graph_id="<graph_id>", from="cond-src", to="cond-after", type="on_condition", condition="signal_observed(answer)")
```

**Step 3** — **on_condition guard (missing condition)**: A second condition edge declared WITHOUT `condition` MUST return an error:

```
graph_add_edge(graph_id="<graph_id>", from="cond-src", to="cond-after", type="on_condition")
```

**Step 4** — Validate the constructed graph structurally (dry run) without dispatching any agent:

```
graph_run(graph_id="<graph_id>", dry_run=true)
```

**Step 5** — After a real `graph_run(graph_id="<graph_id>")`, collect progress with the `graph_status` polling protocol:

```
graph_status(graph_id="<graph_id>", format="summary")
```

Repeatedly poll `graph_status(graph_id="<graph_id>", format="summary")` until the graph `phase` becomes `complete` OR every node reports a terminal lifecycle status (`completed` / `timeout` / `escalate` / `cancelled` / `done`). `graph_status` is a safe, non-blocking liveness probe that never throws while work is in flight.

**Pass criteria (all must be true)**:
1. `graph_create` returns a non-empty `graph_id`.
2. `graph_add_edge(type="on_condition", condition="signal_observed(answer)")` returns without error — proving an `on_condition` edge WITH a `condition` is accepted.
3. The Step 3 `graph_add_edge(type="on_condition")` WITHOUT `condition` returns an ERROR — proving the documented guard (`'on_condition' requires condition.`) is enforced.
4. `graph_run(dry_run=true)` returns `validation.valid` equal to `true` with an empty `errors` array — proving the condition-edge graph is structurally well-formed.
5. On a live run, `cond-after` advances only AFTER `cond-src` records its `answer` signal (the `signal_observed(answer)` condition became true) — `graph_status` shows `cond-after` gated until the condition is satisfied.
6. This proves the `on_condition` edge lane and its default condition vocabulary (`signal_observed` / `artifact_exists`) are wired, and the missing-`condition` guard rejects malformed condition edges.

---

---

### Test 169: Graph Engine v2 (imperative) — Loop `termination` Block & `mode`

This test verifies the Graph Engine v2 `graph_add_loop` soft-`termination` block and the loop-round session-isolation `mode`. The termination schema accepts `any_of` / `all_of` arrays of variants (`max_iterations`, `timeout_ms`, `converged`, `result_matches`, `stuck`, `budget_exhausted`, `signal`); `mode: "inherit"` records that loop rounds re-dispatch within the SAME engine state, while `mode: "fresh"` is documented-unsupported and returns an explicit error naming the alternative path (a separate graph per round). Semantics verified against `src/graph/tools/index.ts` (`terminationSchema`; `graph_add_loop` `mode` enum `["inherit","fresh"]`).

**Step 1** — Create the loop-termination graph context:

```
graph_create(name="graph-engine-v2-loop-termination")
```

Capture the returned `graph_id`.

**Step 2** — Build a bounded review loop (worker → reviewer with an `on_signal` back-edge on `revise_needed`):

```
graph_add_node(graph_id="<graph_id>", id="term-worker", agent="rolebox-tester--signal-revise", prompt="Draft. First pass replies with a revise_needed signal.")
graph_add_node(graph_id="<graph_id>", id="term-gate", agent="rolebox-tester--signal-answer", prompt="Review. Converge with an answer signal.", join={strategy:"all"})
graph_add_edge(graph_id="<graph_id>", from="term-worker", to="term-gate", type="always")
graph_add_edge(graph_id="<graph_id>", from="term-gate", to="term-worker", type="on_signal", signal_filter=["revise_needed"])
```

**Step 3** — Declare the loop group with a hard `max_traversals` cap, a soft `termination` block, and `mode: "inherit"`:

```
graph_add_loop(graph_id="<graph_id>", id="term-loop", nodes=["term-worker", "term-gate"], max_traversals=5, mode="inherit", termination={any_of:[{max_iterations:3}, {converged:"term-gate"}, {stuck:{repeats:2}}, {signal:"answer"}, {result_matches:{agent:"term-gate", contains:"CONVERGED"}}]})
```

**Step 4** — **mode guard (fresh unsupported)**: Declaring a loop with `mode: "fresh"` MUST return an explicit error naming the alternative (a separate graph per round):

```
graph_add_loop(graph_id="<graph_id>", id="term-loop-fresh", nodes=["term-worker", "term-gate"], max_traversals=2, mode="fresh")
```

**Step 5** — Validate structurally (dry run) without dispatching any agent:

```
graph_run(graph_id="<graph_id>", dry_run=true)
```

**Step 6** — After a real `graph_run(graph_id="<graph_id>")`, poll with round history:

```
graph_status(graph_id="<graph_id>", format="summary", include_history=true)
```

Repeatedly poll until the graph `phase` becomes `complete` OR every node reports a terminal lifecycle status. `graph_status` is a safe, non-blocking liveness probe that never throws while work is in flight.

**Pass criteria (all must be true)**:
1. `graph_create` returns a non-empty `graph_id`.
2. `graph_add_loop(..., termination={any_of:[...]}, mode="inherit")` returns without error — proving the `termination` schema (`any_of` with `max_iterations` / `converged` / `stuck` / `signal` / `result_matches` variants) and `mode: "inherit"` are accepted.
3. The Step 4 `graph_add_loop(..., mode="fresh")` returns an EXPLICIT error naming the unsupported flavor and the alternative path (a separate graph per round) — never a silent accept.
4. `graph_run(dry_run=true)` returns `validation.valid` equal to `true` with an empty `errors` array — proving the loop-with-termination graph is structurally well-formed.
5. On a live run, the loop exits at the FIRST satisfied condition — whichever of the soft `termination` variants (e.g. `converged`, `signal:"answer"`, `max_iterations:3`, `stuck`) or the hard `max_traversals=5` cap fires first — `graph_status(include_history=true)` shows the recorded rounds and the loop settling to a terminal state at or before the cap.
6. This proves the loop soft-`termination` block and the `mode: "inherit"` session-isolation flavor are wired, and that `mode: "fresh"` is honestly rejected as documented-unsupported.

---

---

### Test 170: Graph Engine v2 (imperative) — Node & Graph `budget` Limits

This test verifies the Graph Engine v2 resource-`budget` limits at both the node level (`graph_add_node(budget={...})` — `timeout_ms`, `max_sessions`, `max_cost_usd`, `max_retries`) and the graph level (`graph_create(budget={...})` — `max_total_sessions`, `max_total_cost_usd`, `max_total_input_tokens`, `max_total_output_tokens`). Budget exhaustion must be surfaced honestly (a budget-blocked / escalated node, never a fabricated `completed`) and reflected in `graph_status(include_budget=true)` and `task_budget`.

**Step 1** — Create a graph with a graph-level budget cap:

```
graph_create(name="graph-engine-v2-budget", budget={max_total_sessions:4, max_total_cost_usd:1.0})
```

Capture the returned `graph_id`.

**Step 2** — Add a node with a per-node budget (timeout + session cap), plus a small chain:

```
graph_add_node(graph_id="<graph_id>", id="b1", agent="rolebox-tester--echo", prompt="Reply with: BUDGET_NODE_OK", budget={timeout_ms:60000, max_sessions:1, max_retries:0})
graph_add_node(graph_id="<graph_id>", id="b2", agent="rolebox-tester--echo", prompt="Reply with: BUDGET_CHAIN_OK")
graph_add_edge(graph_id="<graph_id>", from="b1", to="b2", type="always")
```

**Step 3** — Validate structurally (dry run) without dispatching any agent:

```
graph_run(graph_id="<graph_id>", dry_run=true)
```

**Step 4** — After a real `graph_run(graph_id="<graph_id>")`, inspect the budget consumption:

```
graph_status(graph_id="<graph_id>", format="summary", include_budget=true)
task_budget()
```

Poll `graph_status(graph_id="<graph_id>", format="summary")` until the graph reaches a terminal phase. `graph_status` is a safe, non-blocking liveness probe that never throws while work is in flight.

**Pass criteria (all must be true)**:
1. `graph_create(budget={max_total_sessions:4, max_total_cost_usd:1.0})` accepts the graph-level budget object.
2. `graph_add_node(..., budget={timeout_ms:60000, max_sessions:1, max_retries:0})` accepts the per-node budget object.
3. `graph_run(dry_run=true)` returns `validation.valid` equal to `true` with an empty `errors` array — proving a budgeted graph is structurally well-formed.
4. On a live run within budget, `b1` and `b2` complete with their OK markers (BUDGET_NODE_OK / BUDGET_CHAIN_OK), and `graph_status(include_budget=true)` renders a genuine consumption breakdown (sessions / cost) — or an explicit documented-unavailable note — never a fabricated figure.
5. `task_budget()` reflects the session consumption against the cap.
6. This proves node-level and graph-level `budget` limits are accepted, enforced, and observable via the budget surface.

---

---

### Test 171: Graph Engine v2 (imperative) — Node Liveness / Stall

This test verifies the Graph Engine v2 node-liveness surface: `graph_status(include_liveness=true)` renders each node's recorded liveness (`lastActivityAt` / `heartbeatSource` / `stallStatus` / `stallWarnedAt` / `stallReason`). Running nodes always render liveness; for terminal nodes the block appears only when liveness was recorded (honest-absent otherwise, never fabricated).

**Step 1** — Create the liveness graph context:

```
graph_create(name="graph-engine-v2-liveness")
```

Capture the returned `graph_id`.

**Step 2** — Add a slow node (so it stays running long enough to observe liveness) and run the graph:

```
graph_add_node(graph_id="<graph_id>", id="live1", agent="rolebox-tester--sleeper", prompt="Count slowly from 1 to 40, one per line, then reply with LIVENESS_OK")
graph_run(graph_id="<graph_id>")
```

**Step 3** — While `live1` is in flight, probe its liveness:

```
graph_status(graph_id="<graph_id>", node_id="live1", include_liveness=true)
```

**Step 4** — Await the `[GRAPH COMPLETE]` reminder, then probe once more and collect output:

```
graph_status(graph_id="<graph_id>", node_id="live1", include_liveness=true, include_output=true)
```

**Pass criteria (all must be true)**:
1. `graph_create` returns a non-empty `graph_id` and the node/run are accepted.
2. Step 3 returns WITHOUT throwing while `live1` is still running — proving the safe-poll contract.
3. The Step 3 render includes a liveness block for the running node with at least a `lastActivityAt` (and, when applicable, `heartbeatSource` / `stallStatus`) — running nodes always render liveness.
4. If the node stalls, the liveness block surfaces `stallStatus` / `stallReason` honestly; if it does not stall, no stall fields are fabricated.
5. Step 4 shows `live1` `completed` with output containing "LIVENESS_OK".
6. This proves the node-liveness / stall observability surface (`include_liveness=true`) renders genuine liveness data or an honest-absent block — never invented activity.

---

---

### Test 172: Interactive Terminal — Persistent Session Smoke Test

This test verifies the `interactive_terminal` tool (new in v1.4.0, previously uncovered): a persistent, interactive terminal session driven through `open` → `write` → `read` → `close`, using `until` / `wait_ms` to synchronize on evolving output rather than fixed sleeps.

**Step 1** — Open a persistent shell session:

```
interactive_terminal(action="open", command="bash")
```

Capture the returned session `id`.

**Step 2** — Write a command that emits a known marker, submitting with Enter:

```
interactive_terminal(action="write", id="<id>", data="echo INTERACTIVE_TERM_OK")
```

**Step 3** — Read until the marker appears (bounded by a regex, not a fixed sleep):

```
interactive_terminal(action="read", id="<id>", until="INTERACTIVE_TERM_OK", timeout_ms=10000)
```

**Step 4** — Close the session:

```
interactive_terminal(action="close", id="<id>")
```

**Pass criteria (all must be true)**:
1. Step 1 `open` returns without error and yields a non-empty session `id` (a real PTY or a pipe-backed fallback — either is acceptable).
2. Step 2 `write` is accepted (the command plus Enter is sent to the live session).
3. Step 3 `read` returns the evolving session output containing the marker "INTERACTIVE_TERM_OK", and the result honestly reports a matched (not timed-out) status for the `until` regex.
4. Step 4 `close` terminates the session without error, and a subsequent `list` no longer shows it as active.
5. This proves the `interactive_terminal` persistent-session lifecycle (open → write → read-until → close) is wired end to end — the previously-uncovered v1.4.0 tool now has a smoke test.

---

## Runner: Graph Engine v2 & Dispatch — Runner Pass/Fail Report

After executing every `### Test` above, emit ONE markdown table with a row per test:

| Test | Name | Result | Evidence |
|------|------|--------|----------|
| <n>  | ...  | PASS/FAIL | one-line observation |

Then emit a final JSON line for the dispatcher to aggregate:

```json
{"runner": "<this runner id>", "total": <n>, "passed": <n>, "failed": <n>, "failures": [<test numbers>]}
```

Report honestly: a test that cannot be exercised in this environment is reported FAIL (or SKIP with reason), never fabricated PASS.
