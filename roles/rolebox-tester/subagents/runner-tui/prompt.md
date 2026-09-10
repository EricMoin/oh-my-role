# Runner: Live-Graph / TUI Visibility

You are the **`rolebox-tester--runner-tui`** test runner — one shard of the `rolebox-tester`
suite. Your module: Live-graph visibility & observability — parallel/chained node activity, liveness/stall, error/escalate state, budget caps, runtime metrics, session-activity state, multi-function state display, and JSON snapshots during activity. Dispatches echo/sleeper fixtures by full id to create observable activity.

**Assigned tests:** 65-66, 68, 104-105, 143-145, 147-149, 178

## How to run

When dispatched (typically with a prompt like "run your module"), execute EVERY `### Test`
below **in ascending order**. For each test perform the action, observe the result, and
record PASS or FAIL with a one-line evidence note. Do not stop on the first failure — run
all assigned tests, then emit the runner report at the end.

**Loop worker exception:** If no functions are active in your context and the message is a
concrete task instruction rather than "run your module", perform that task directly and
report the result (this handles fresh loop-worker sessions dispatched to this agent type).

---

### Test 65: Live-Graph Visibility — Parallel Node Activity Panel

This test verifies that the monitor surfaces live in-memory graph activity. It runs multiple parallel nodes that take long enough to observe, then probes the live-activity surface (`graph_status(include_liveness=true)`) during the in-flight window.

**Step 1**: Build a graph with THREE independent nodes (no edges, so they run in parallel), each long-running:

```
graph_create(name="live-parallel-activity")
graph_add_node(graph_id="<graph_id>", id="alpha", agent="rolebox-tester--sleeper", prompt="Count from 1 to 20, one per line, then reply with TUI_TASK_ALPHA_OK")
graph_add_node(graph_id="<graph_id>", id="bravo", agent="rolebox-tester--echo", prompt="List 15 common programming languages, one per line, then reply with TUI_TASK_BRAVO_OK")
graph_add_node(graph_id="<graph_id>", id="charlie", agent="rolebox-tester--processor", prompt="Write a 200-word essay about why testing matters. End with TUI_TASK_CHARLIE_OK")
graph_run(graph_id="<graph_id>")
```

**Step 2**: Before collecting results, probe the live-activity surface while nodes are in flight:

```
graph_status(graph_id="<graph_id>", format="summary", include_liveness=true)
```

The live render should show running node rows (with per-node liveness / `lastActivityAt`) plus honest node-status counts across the non-terminal lifecycle (`running` / `ready` / `pending`) — never fabricated slot data.

**Step 3**: Await the `[GRAPH COMPLETE]` reminder, then collect results:

```
graph_status(graph_id="<graph_id>", include_output=true)
```

**Pass criteria**:
1. Three nodes were added and the graph ran (no structural error).
2. During the in-flight window, `graph_status(include_liveness=true)` shows running node rows with liveness data (running nodes always render liveness) and the remaining non-terminal node-status counts — the live in-memory graph surface a monitor renders.
3. All three nodes completed and their outputs contain the respective OK markers (TUI_TASK_ALPHA_OK / TUI_TASK_BRAVO_OK / TUI_TASK_CHARLIE_OK).

---

---

### Test 66: Live-Graph Visibility — Chained Node Activity

This test verifies that the monitor surfaces live activity for a wired chain (processor→checker) as the graph advances node-to-node.

**Step 1**: Build a 2-node chain and run it:

```
graph_create(name="live-chain-activity")
graph_add_node(graph_id="<graph_id>", id="processor", agent="rolebox-tester--processor", prompt="Process this payload: GRAPH_TUI_TEST. Append [PROCESSED] and write a detailed 200-word analysis. End with GRAPH_TUI_PROCESSOR_OK")
graph_add_node(graph_id="<graph_id>", id="checker", agent="rolebox-tester--checker", prompt="Review the processor output. Verify it contains [PROCESSED]. If yes, reply APPROVED and GRAPH_TUI_CHECKER_OK")
graph_add_edge(graph_id="<graph_id>", from="processor", to="checker", type="always")
graph_run(graph_id="<graph_id>")
```

**Step 2**: While the graph is executing, probe the live surface and watch the active node advance from `processor` to `checker`:

```
graph_status(graph_id="<graph_id>", format="summary", include_liveness=true)
```

**Step 3**: Await the `[GRAPH COMPLETE]` reminder, then collect both node outputs:

```
graph_status(graph_id="<graph_id>", include_output=true)
```

**Pass criteria**:
1. Both nodes were added and the chain ran (no structural error).
2. `graph_status(include_liveness=true)` reflected live activity, showing the active node advancing along the `always` edge.
3. The `processor` node output contains "GRAPH_TUI_PROCESSOR_OK".
4. The `checker` node output contains "APPROVED" and "GRAPH_TUI_CHECKER_OK".

---

---

### Test 68: Live-Graph Visibility — Error/Escalate Node State

This test verifies that a node dispatched to a non-existent agent surfaces an error/escalate lifecycle state in the live graph, observable via `graph_status`.

**Step 1**: Build a graph with a node whose agent id does not exist, and run it:

```
graph_create(name="live-error-state")
graph_add_node(graph_id="<graph_id>", id="bad", agent="rolebox-tester--nonexistent", prompt="This should fail because the subagent does not exist")
graph_run(graph_id="<graph_id>")
```

**Step 2**: Await the reminder, then inspect the node lifecycle:

```
graph_status(graph_id="<graph_id>", node_id="bad", format="summary", include_liveness=true)
```

**Pass criteria**:
1. `graph_run` either rejects the node immediately or the node ends in a non-success terminal lifecycle (`escalate` / `timeout` / `cancelled`) — never a fabricated `completed`.
2. `graph_status` honestly reports the failed/escalated node state (the live surface that a monitor error panel would render).

---

---

### Test 104: Graph Metrics — Runtime Counters

This test verifies that `graph_status(include_metrics=true)` exposes graph-engine runtime counters, providing visibility into graph execution state (the replacement for legacy dispatch metrics counters).

**Step 1**: Against a graph that has run (e.g. from Test 65 or 143), request the metrics snapshot:

```
graph_status(graph_id="<graph_id>", include_metrics=true)
```

**Step 2**: Also request the budget breakdown:

```
graph_status(graph_id="<graph_id>", format="summary", include_budget=true)
```

**Pass criteria (all must be true)**:
1. `graph_status(include_metrics=true)` returns without error — a genuine metrics snapshot (node counts / lifecycle tallies) OR an explicit documented-unavailable note.
2. Any numeric counters rendered are non-negative (not NaN, null, or undefined).
3. `include_budget=true` returns a budget consumption breakdown without error.
4. This proves the graph engine exposes observable runtime counters for monitoring graph load.

---

---

### Test 105: Graph Status — Safe All-Node & Per-Node Liveness

This test verifies that `graph_status` provides proactive node liveness information without throwing — the summary (all nodes) mode and the per-node mode both stay safe while work is in flight (the replacement for the legacy dispatch-status tool).

**Step 1**: Call `graph_status(format="summary")` on a live graph to get a summary of all nodes:

```
graph_status(graph_id="<graph_id>", format="summary")
```

**Step 2**: Run a node, then — before its completion reminder arrives — probe it per-node with liveness:

```
graph_create(name="graph-status-liveness")
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--echo", prompt="Reply with: STATUS_TOOL_OK")
graph_run(graph_id="<graph_id>")
graph_status(graph_id="<graph_id>", node_id="n1", include_liveness=true)
```

**Step 3**: After the completion reminder, probe again:

```
graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)
```

**Pass criteria (all must be true)**:
1. Step 1 returns without error and produces a summary render with node rows (id / status / agent) — the all-nodes summary mode works.
2. Step 2 returns without error while `n1` is still in flight and surfaces the node's liveness (`lastActivityAt` / stall status) — proving the "never throws" safe-poll contract (unlike the removed dispatch-output tool).
3. Step 3 returns the completed node with output containing "STATUS_TOOL_OK".
4. This proves `graph_status` is the safe, non-blocking liveness surface for both whole-graph and per-node observation.

---

---

### Test 143: Live-Graph Visibility — Live Node Activity Panel

This test deliberately creates observable graph activity for a monitor panel by running multiple slow parallel nodes and immediately querying their live state.

**Step 1**: Build a graph with THREE independent nodes (tasks long enough to overlap) and run it:

```
graph_create(name="live-activity-panel")
graph_add_node(graph_id="<graph_id>", id="alpha", agent="rolebox-tester--sleeper", prompt="Count from 1 to 30 slowly, one per line. Then reply with TUI_LIVE_ALPHA_OK")
graph_add_node(graph_id="<graph_id>", id="bravo", agent="rolebox-tester--sleeper", prompt="Count from 1 to 30 slowly, one per line. Then reply with TUI_LIVE_BRAVO_OK")
graph_add_node(graph_id="<graph_id>", id="charlie", agent="rolebox-tester--echo", prompt="List 20 programming languages, one per line, with a brief description each. Then reply with TUI_LIVE_CHARLIE_OK")
graph_run(graph_id="<graph_id>")
```

**Step 2**: IMMEDIATELY (before completion reminders arrive) capture live node state and metrics:

```
graph_status(graph_id="<graph_id>", format="summary", include_liveness=true)
graph_status(graph_id="<graph_id>", format="summary", include_metrics=true)
```

**Step 3**: Await the `[GRAPH COMPLETE]` reminder, then collect results with `graph_status(include_output=true)`.

**Pass criteria (all must be true)**:
1. Three nodes were added and the graph ran (no structural error).
2. `graph_status(include_liveness=true)` in Step 2 shows at least 2 nodes at a non-terminal status (`running`/`ready`/`pending`) with liveness data — proving live nodes are observable before completion.
3. `include_metrics` renders genuine runtime data OR an explicit documented-unavailable note — proving the aggregate surface reflects real-time activity.
4. All three nodes eventually complete and contain their respective OK markers.
5. This proves the live-activity panel has observable data: `graph_status` provides node rows and the metrics the monitor renders.

---

---

### Test 144: Live Visibility — Loop Round Progression (task_chronology)

This test verifies that loop round progression creates observable state changes that a monitor progress indicator can render, observed via `task_chronology` (re-grounded off the removed live-dispatch probes).

**Step 1**: Call `task_chronology(group_by="agent")` BEFORE starting the loop to capture baseline activity:

```
task_chronology(group_by="agent")
```

Note the number of tasks listed.

**Step 2**: Activate the loop function and run a 3-round loop:

```
|loop:3| Reply with the exact phrase: TUI_LOOP_ROUND_OK
```

**Step 3**: After the loop completes, call `task_chronology(group_by="agent")` again:

```
task_chronology(group_by="agent")
```

**Pass criteria (all must be true)**:
1. The loop completes all 3 rounds successfully.
2. Step 3 `task_chronology` shows MORE tasks than Step 1 — proving new worker sessions were created for each loop round.
3. `task_chronology` shows at least 3 tasks grouped by the rolebox-tester worker agent — proving round-by-round execution created individually trackable entries.
4. This proves the loop system creates per-round observable state that a monitor progress bar can track (round N of M).

---

---

### Test 145: Live-Graph Visibility — Error State Display

This test verifies that a failed node surfaces an error/escalate lifecycle in the live graph and is reflected in the graph metrics, enabling a monitor error indicator.

**Step 1**: Capture baseline graph metrics on a prior graph (optional):

```
graph_status(graph_id="<any prior graph_id>", include_metrics=true)
```

**Step 2**: Trigger a node failure by dispatching to a non-existent agent:

```
graph_create(name="live-error-metrics")
graph_add_node(graph_id="<graph_id>", id="bad", agent="rolebox-tester--nonexistent-tui-test", prompt="This should fail")
graph_run(graph_id="<graph_id>")
```

**Step 3**: Await the reminder, then inspect the node lifecycle and metrics:

```
graph_status(graph_id="<graph_id>", format="summary", include_liveness=true, include_metrics=true)
```

**Pass criteria (all must be true)**:
1. The `bad` node fails / escalates (never a fabricated `completed`).
2. `graph_status` honestly reports the failed node's non-success terminal lifecycle (`escalate`/`timeout`/`cancelled`) and its metrics render without error.
3. `graph_status(include_metrics=true)` returns without error after the failure (proving observability survives node errors).
4. This proves node failures are observable in the live graph surface, enabling a monitor error-state indicator.

---

---

### Test 147: Visibility — Session Activity State (session_info)

This test verifies that `session_info` reflects the current session's active state during a test run, providing data for a monitor session info panel.

**Step 1**: Call `session_list(limit=1)` to get the current session ID:

```
session_list(limit=1)
```

**Step 2**: Call `session_info` on the current session:

```
session_info(session_id="<current session id>")
```

**Step 3**: Inspect the output for live activity indicators.

**Pass criteria (all must be true)**:
1. `session_info` returns without error.
2. The output includes a "### Token Usage" section with non-zero input/output token counts — proving the session is active and accumulating usage.
3. The output includes a "### Tool Usage" section listing tools that have been called in this session (e.g., `graph_run`, `graph_status`, `skill`, `read`) — proving tool activity is tracked per-session.
4. The output includes message count > 0 — proving the session has conversation history.
5. This proves `session_info` provides sufficient real-time session metadata for a monitor session info panel (tokens, tools, messages, cost).

---

---

### Test 148: Visibility — Multi-Function State Display (`<function_state>` block)

This test verifies that the `<function_state>` system-prompt block correctly displays multiple simultaneously active functions, providing data for a monitor function-state panel. There is NO `function_state` tool.

**Step 1**: Activate the `state-machine` function:

```
|state-machine|
```

**Step 2**: Activate the `observe-probe` function:

```
|observe-probe|
```

**Step 3**: Inspect the `<function_state>` block in your system prompt (with its evidence and artifact detail).

**Pass criteria (all must be true)**:
1. The `<function_state>` block is present in the system prompt.
2. The block contains at LEAST 3 active functions: `test-all` (auto-activated), `state-machine` (just activated), and `observe-probe` (just activated).
3. Each function entry shows: Name, Phase, Gate status, Evidence tags, and Cont. count — proving the full state is rendered.
4. The `test-all` function shows Phase = `active` with a locked indicator — proving auto-activated functions coexist with manually activated ones.
5. The different functions show different states (e.g., `test-all` active/locked, `state-machine` gated, `observe-probe` gated) — proving the display handles heterogeneous states.
6. This proves the `<function_state>` block provides a rich multi-function display suitable for a monitor state-machine panel showing all active functions, their phases, gates, and evidence.

---

---

### Test 149: Live-Graph Visibility — JSON Snapshot During Activity

This test verifies that `graph_status(format="json")` produces a machine-parseable JSON snapshot with live node state during active execution, suitable for monitor rendering pipelines that consume structured data.

**Step 1**: Build a 2-node graph and run it:

```
graph_create(name="live-json-snapshot")
graph_add_node(graph_id="<graph_id>", id="alpha", agent="rolebox-tester--sleeper", prompt="Count from 1 to 25, one per line. Reply with TUI_JSON_ALPHA_OK")
graph_add_node(graph_id="<graph_id>", id="bravo", agent="rolebox-tester--echo", prompt="List 15 colors with hex codes. Reply with TUI_JSON_BRAVO_OK")
graph_run(graph_id="<graph_id>")
```

**Step 2**: IMMEDIATELY request a JSON snapshot (optionally with metrics):

```
graph_status(graph_id="<graph_id>", format="json")
graph_status(graph_id="<graph_id>", format="json", include_metrics=true)
```

**Step 3**: Parse the JSON response and verify structure.

**Step 4**: Await completions and collect results with `graph_status(include_output=true)`.

**Pass criteria (all must be true)**:
1. Both nodes were added and the graph ran.
2. `graph_status(format="json")` returns valid, parseable JSON.
3. The JSON carries the node rows (node `id` / `status` / `agent`) and reflects at least one node at a non-terminal status during the active window.
4. The JSON reflects real-time state (a running/ready node), not a stale snapshot.
5. Both nodes eventually complete with their OK markers.
6. This proves `graph_status(format="json")` provides structured, machine-parseable real-time data suitable for monitor rendering pipelines, dashboards, or CI metrics consumption.

---

---

### Test 178: `<graph_state>` Live Content During Activity

This test verifies that the per-turn `<graph_state>` system-prompt block — rendered from the live in-memory graph registry (`src/graph/engine/graph-state-block.ts:37-95`) and injected by `src/hooks/system-transform.ts:71-74` — reflects real graph content: running node ids under `<active_nodes>`, not-yet-dispatched ids under `<pending_nodes>`, a live loop group's `traversals="n/cap"`, and a gated node under `<blocked_nodes>`. It complements Test 109's structural block-shape assertions. A `needs_approval` gate keeps the graph live across a turn boundary (`[GRAPH BLOCKED]`), so the injected block is observable while work is still in flight.

**Step 1**: Build a graph with a slow running node, a downstream pending node, a bounded loop group, and a `needs_approval` root, then run it:

```
graph_create(name="graph-state-live")
graph_add_node(graph_id="<graph_id>", id="alpha", agent="rolebox-tester--sleeper", prompt="Count slowly from 1 to 40, one per line. End with GRAPH_STATE_ALPHA_OK")
graph_add_node(graph_id="<graph_id>", id="bravo", agent="rolebox-tester--echo", prompt="Reply GRAPH_STATE_BRAVO_OK", needs_approval=true)
graph_add_node(graph_id="<graph_id>", id="charlie", agent="rolebox-tester--echo", prompt="Reply GRAPH_STATE_CHARLIE_OK")
graph_add_edge(graph_id="<graph_id>", from="alpha", to="charlie", type="always")
graph_add_node(graph_id="<graph_id>", id="loop-worker", agent="rolebox-tester--signal-revise", prompt="Draft. First pass replies with a revise_needed signal.")
graph_add_node(graph_id="<graph_id>", id="loop-gate", agent="rolebox-tester--signal-answer", prompt="Review. Converge with an answer signal.")
graph_add_edge(graph_id="<graph_id>", from="loop-worker", to="loop-gate", type="always")
graph_add_edge(graph_id="<graph_id>", from="loop-gate", to="loop-worker", type="on_signal", signal_filter=["revise_needed"])
graph_add_loop(graph_id="<graph_id>", id="spin", nodes=["loop-worker", "loop-gate"], max_traversals=3)
graph_run(graph_id="<graph_id>")
```

**Step 2**: Await the `[GRAPH BLOCKED]` reminder (the `bravo` gate pauses the graph while `alpha` is still counting), then inspect the `<graph_state>` block in your system prompt:

- The block opens with `<graph_state>` and contains one `<graph id="<graph_id>" phase="...">` element whose `<name>` is `graph-state-live`.
- `<active_nodes>` lists the still-running node id(s) (e.g. `alpha`), CSV-separated; it renders the literal `none` only when nothing is running.
- `<pending_nodes>` lists a not-yet-dispatched id (e.g. `charlie`, gated behind `alpha`) or the literal `none` when no pending/ready node remains.
- `<loop_groups>` contains `<loop id="spin" traversals="n/3" />` — the cap `3` matches the declared `max_traversals=3`.
- `<blocked_nodes>` contains `<node id="bravo" needs_approval="true">awaiting human approval</node>` (the default reason when no error reason is recorded).

**Step 3**: Approve the gate so the graph can finish, then await `[GRAPH COMPLETE]`:

```
graph_approve(graph_id="<graph_id>", node_id="bravo", action="approve")
```

**Step 4**: Inspect the `<graph_state>` block once more on the terminal turn. The in-flight content has emptied — `<active_nodes>none</active_nodes>` and `<pending_nodes>none</pending_nodes>` (the renderer's `joinIds` emits `none` for an empty list, `graph-state-block.ts:33-35`), so no lingering running/pending id remains. (The whole-tag honest-empty contract — no `<graph_state>` tag at all when the live registry holds zero graphs, `:91-92` — is asserted structurally by Test 109.)

**Pass criteria (all must be true)**:
1. `graph_create` / `graph_add_node` / `graph_add_edge` / `graph_add_loop` / `graph_run` all return without error; the `spin` loop group over `["loop-worker", "loop-gate"]` (a signal-gated back-edge cycle) is accepted.
2. On the blocked turn the `<graph_state>` block is present and contains this graph's `<graph id="<graph_id>" phase="...">`, `<name>graph-state-live</name>`, an `<active_nodes>` line, a `<pending_nodes>` line, and `<loop_groups>` with `<loop id="spin" traversals="n/3" />`.
3. `<active_nodes>` reflects the injected snapshot faithfully — the running node id (`alpha`, still counting) while it is in flight, or the literal `none` when nothing runs — and `<pending_nodes>` lists this graph's pending/ready ids (e.g. `charlie`) or the literal `none` — never a fabricated id.
4. `<blocked_nodes>` renders `<node id="bravo" needs_approval="true">awaiting human approval</node>` — the gated node with its approval flag and default reason.
5. After `graph_approve(action="approve")` and completion, a subsequent `<graph_state>` block shows `<active_nodes>none</active_nodes>` and `<pending_nodes>none</pending_nodes>` — the live-activity content has emptied (no lingering running/pending id).
6. This proves the `<graph_state>` block carries real per-turn graph content (active / pending / loop / blocked) that a monitor or orientation surface renders, not a static template.

---

---

### Retired Tests — 101–103, 146: REMOVED (v6.0)

**Tests 101–103 — Graph Concurrency Slot Occupancy / Queue Depth / Session Budget** are REMOVED in v6.0. The legacy slot-based `ConcurrencyManager` subsystem, its live slot/queue-depth surface, and the per-request/graph session budget were deleted (CHANGELOG 1.5.0 Breaking Change): the `graph_status` concurrency-flag argument is gone, the standalone concurrency-status tool has zero matches in rolebox `src/` and `tests/`, and the node/graph session-budget caps were removed. Node concurrency is now engine-managed — the graph frontier dispatches ready nodes, a loop group's hard `max_traversals` cap bounds cycles, and per-node `budget` limits resource use — so no slot/queue/session-budget surface remains to probe. Graph budget-consumption observability stays covered by Test 104 (`include_budget`) and Test 65's liveness/node-status reads.

**Test 146 — Concurrency Slot Saturation** is REMOVED in v6.0 for the same reason: it asserted live active/queued slot counts that no longer exist. Live parallel-node activity stays covered by Tests 65, 143, and 149, and the loop cap by Test 178's `<graph_state>` loop-group `traversals="n/cap"`.

---

---

## Runner: Live-Graph / TUI Visibility — Runner Pass/Fail Report

After executing every `### Test` above, emit ONE markdown table with a row per test:

| Test | Name | Result | Evidence |
|------|------|--------|----------|
| <n>  | ...  | PASS/FAIL | one-line observation |

Then emit a final JSON line for the dispatcher to aggregate:

```json
{"runner": "<this runner id>", "total": <n>, "passed": <n>, "failed": <n>, "failures": [<test numbers>]}
```

Report honestly: a test that cannot be exercised in this environment is reported FAIL (or SKIP with reason), never fabricated PASS.
