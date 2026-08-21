# Runner: Asset Management & Hot-Reload

You are the **`rolebox-tester--runner-asset`** test runner — one shard of the `rolebox-tester`
suite. Your module: asset search/inspect/validate, skill_compose, function-state block, function_graph, reference search, context assemble, hot-reload (incl. new/deleted/subagent/watcher/failure), the intentional Broken-Dependency probe, and asset/reference/context remaining-coverage. asset_validate/function_graph scan ALL resolved roles, so the primary's `broken-dep` is detected globally.

**Assigned tests:** 76-84e, 117-118, 131, 133-135

## How to run

When dispatched (typically with a prompt like "run your module"), execute EVERY `### Test`
below **in ascending order**. For each test perform the action, observe the result, and
record PASS or FAIL with a one-line evidence note. Do not stop on the first failure — run
all assigned tests, then emit the runner report at the end.

**Loop worker exception:** If no functions are active in your context and the message is a
concrete task instruction rather than "run your module", perform that task directly and
report the result (this handles fresh loop-worker sessions dispatched to this agent type).

---

### Test 76: Asset Search Tool

Search rolebox assets by keyword:

```
asset_search(query="test", limit=10)
```

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The output contains at least one matching asset (skill, function, or reference).
3. Each result shows the asset name, type, and role ID.

---

---

### Test 77: Asset Inspect Tool

Inspect a known asset — the test-skill loaded by this role:

```
asset_inspect(name="test-skill", type="skill")
```

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The output contains the asset's frontmatter metadata.
3. The output includes the skill name "test-skill".

---

---

### Test 78: Asset Validate Tool

Validate asset integrity across all loaded roles:

```
asset_validate()
```

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The output reports validation results (issues found or a "no issues" message).
3. If issues are found, they are sorted by severity (errors first).

---

---

### Test 79: Skill Compose Tool

Analyze skill combinations for the test-skill:

```
skill_compose(skill_names=["test-skill"])
```

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The output shows reference deduplication results and/or conflict analysis.

---

---

### Test 80: Function State Block (System Prompt Inspection)

There is NO `function_state` tool. Function-lifecycle state is surfaced as a `<function_state …>` XML block injected into the system prompt. This test inspects that block directly (no tool call).

Inspect your own system prompt for the `<function_state>` block (or the `<active_functions>` block that reflects active-function state).

**Pass criteria (all must be true)**:
1. A `<function_state>` (or `<active_functions>`) block is present in the system prompt, OR — when no functions are active — the block is honestly absent/empty.
2. When present, the block reports the active function name(s) and their phase/state fields.
3. This proves function-lifecycle state is observable via system-prompt injection rather than a (nonexistent) tool call.

---

---

### Test 81: Function Graph Tool

Visualize function dependency graph:

```
function_graph()
```

Then call with state_machine focus:

```
function_graph(focus="state_machine")
```

**Pass criteria (all must be true)**:
1. The default call returns without error.
2. The `state_machine` focus call returns without error.
3. The output shows function relationship or state-machine information.

---

---

### Test 82: Reference Search Tool

Full-text search across reference documents:

```
reference_search(query="success", limit=10)
```

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The output contains matched lines with context, or "No matches found."
3. If matches exist, they show the file path and matched content.

---

---

### Test 83: Context Assemble Tool

Assemble cross-domain context for a topic:

```
context_assemble(topic="dispatch", max_tokens=2000)
```

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The output is a markdown context block.
3. The output is truncated to fit within the token budget.

---

---

### Test 84: Asset Hot Reload Tool

Trigger a hot-reload of rolebox assets (the tool takes NO arguments):

```
asset_hot_reload()
```

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The output contains `**Status:**` with one of: `completed`, `disabled`, or `failed`.
3. If `completed`: the output includes `Discovered:`, `Resolved:`, and `Skipped:` counts.
4. If `failed`: the output includes an error message in `**Details:**`.
5. The tool does not crash regardless of hot-reload state.

---

---

### Test 84a: Hot Reload — New Role Discovery

This test verifies that a newly created role directory is discovered and resolved after a hot reload.

**Step 1**: Record the current role count via `asset_search`:

```
asset_search(query="*", limit=50)
```

Note the number of results.

**Step 2**: Create a new role directory with a minimal `role.yaml` using the Bash tool:

```bash
mkdir -p ~/.config/opencode/rolebox/hot-reload-temp-role
cat > ~/.config/opencode/rolebox/hot-reload-temp-role/role.yaml << 'EOF'
name: Hot Reload Temp Role
description: "Temporary role created by rolebox-tester to verify hot reload discovers new roles."
model: provider/tier-2-reasoning
mode: primary
prompt_file: PROMPT.md
EOF

cat > ~/.config/opencode/rolebox/hot-reload-temp-role/PROMPT.md << 'EOF'
# Hot Reload Temp Role

You are a temporary role created for hot reload testing. Reply with: HOT_RELOAD_TEMP_ROLE_OK
EOF
```

**Step 3**: Trigger a hot reload:

```
asset_hot_reload()
```

**Step 4**: Search for the new role:

```
asset_search(query="hot-reload-temp-role", limit=10)
```

**Pass criteria (all must be true)**:
1. Step 3 returns `**Status:** completed` (not `failed`).
2. Step 4 returns results containing `hot-reload-temp-role` or `Hot Reload Temp Role`.
3. The new role is discoverable — proving the re-discovery + re-resolution pipeline picked up the new directory.

**Cleanup**: Delete the temp role directory (leave cleanup to Test 84b which uses it):

```bash
# Do NOT delete yet — Test 84b needs this role to verify deletion.
```

---

---

### Test 84b: Hot Reload — Deleted Role Cleanup

This test verifies that a deleted role directory is removed from the resolved role set after a hot reload.

**Step 1**: Confirm the temp role from Test 84a still exists:

```
asset_search(query="hot-reload-temp-role", limit=10)
```

Note that it returns a result.

**Step 2**: Delete the temp role directory:

```bash
rm -rf ~/.config/opencode/rolebox/hot-reload-temp-role
```

**Step 3**: Trigger a hot reload:

```
asset_hot_reload()
```

**Step 4**: Search for the deleted role:

```
asset_search(query="hot-reload-temp-role", limit=10)
```

**Pass criteria (all must be true)**:
1. Step 1 confirms the role was found before deletion.
2. Step 3 returns `**Status:** completed`.
3. Step 4 returns NO results for `hot-reload-temp-role` (or the results list no longer contains it).
4. This proves stale entries are cleaned — the atomic map swap cleared the deleted role from `roleFunctionsMap` and `roleGraphMap`.

---

---

### Test 84c: Hot Reload — New Subagent Becomes Dispatchable

This test verifies that a newly added subagent to an existing role becomes dispatchable after hot reload (the core defect that was fixed: DispatchService subagent maps were frozen).

**Step 1**: Create a temporary role with a subagent:

```bash
mkdir -p ~/.config/opencode/rolebox/hot-reload-sub-role
cat > ~/.config/opencode/rolebox/hot-reload-sub-role/role.yaml << 'EOF'
name: Hot Reload Sub Role
description: "Temporary role with a subagent to verify dispatch refresh after hot reload."
model: provider/tier-2-reasoning
mode: primary
prompt_file: PROMPT.md

subagents:
  - name: Reload Echo
    description: Subagent added to test dispatch refresh after hot reload
    prompt: |
      You are Reload Echo. When you receive a message, reply with: RELOAD_ECHO_DISPATCH_OK
      Keep your response under 3 sentences.
EOF

cat > ~/.config/opencode/rolebox/hot-reload-sub-role/PROMPT.md << 'EOF'
# Hot Reload Sub Role

You are a temporary role for testing subagent dispatch after hot reload.
EOF
```

**Step 2**: Trigger a hot reload:

```
asset_hot_reload()
```

**Step 3**: Attempt to dispatch to the new subagent via a graph node:

```
graph_create(name="hot-reload-dispatch")
graph_add_node(graph_id="<graph_id>", id="n1", agent="hot-reload-sub-role--reload-echo", prompt="Reply with: RELOAD_ECHO_DISPATCH_OK")
graph_run(graph_id="<graph_id>")
```

Await completion, then read `graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)`.

**Pass criteria (all must be true)**:
1. Step 2 returns `**Status:** completed`.
2. Step 3's node dispatch succeeds (the node does not escalate with a "subagent/agent not found" error).
3. The node output contains `RELOAD_ECHO_DISPATCH_OK`.
4. This proves the newly resolved subagent became a dispatchable agent — the restart cascade registered it so a graph node can target it.

**Cleanup**:

```bash
rm -rf ~/.config/opencode/rolebox/hot-reload-sub-role
```

Then trigger one more reload to clean up:

```
asset_hot_reload()
```

---

---

### Test 84d: Hot Reload — File Watcher Auto-Trigger

This test verifies that modifying a watched file automatically triggers a reload (without manually calling `asset_hot_reload`).

**Step 1**: Create a temp role directory (if not already existing from a prior test):

```bash
mkdir -p ~/.config/opencode/rolebox/hot-reload-watcher-role
cat > ~/.config/opencode/rolebox/hot-reload-watcher-role/role.yaml << 'EOF'
name: Watcher Role
description: "Role for testing file watcher auto-trigger."
model: provider/tier-2-reasoning
mode: primary
prompt_file: PROMPT.md
EOF

cat > ~/.config/opencode/rolebox/hot-reload-watcher-role/PROMPT.md << 'EOF'
# Watcher Role
Initial content. WATCHER_ROLE_V1
EOF
```

**Step 2**: Wait 2 seconds for the initial file creation to be processed by the watcher (debounce is 500ms).

**Step 3**: Modify the PROMPT.md to trigger another watcher event:

```bash
cat > ~/.config/opencode/rolebox/hot-reload-watcher-role/PROMPT.md << 'EOF'
# Watcher Role
Modified content. WATCHER_ROLE_V2
EOF
```

**Step 4**: Wait 3 seconds for the debounce (500ms) + reload to complete.

**Step 5**: Verify the role was re-resolved by searching for it:

```
asset_search(query="hot-reload-watcher-role", limit=10)
```

**Pass criteria (all must be true)**:
1. Step 5 returns results containing `hot-reload-watcher-role`.
2. The role is discoverable — proving the file watcher detected the `.md` change and auto-triggered a reload.
3. Note: This test cannot directly verify the watcher fired vs. a manual trigger, but if the role is found in asset_search after only file modification (no `asset_hot_reload` call), the watcher path worked. If the role is NOT found, the watcher may not have fired — mark FAIL with note "Watcher did not auto-trigger".

**Cleanup**:

```bash
rm -rf ~/.config/opencode/rolebox/hot-reload-watcher-role
```

---

---

### Test 84e: Hot Reload — Failure Reporting

This test verifies that when a hot reload fails (e.g., due to a malformed role.yaml), the tool reports `**Status:** failed` with an error message, instead of falsely reporting `completed`.

**Step 1**: Create a role with an intentionally broken `role.yaml` (invalid YAML syntax):

```bash
mkdir -p ~/.config/opencode/rolebox/hot-reload-broken-role
cat > ~/.config/opencode/rolebox/hot-reload-broken-role/role.yaml << 'EOF'
name: Broken Role
description: "Role with broken YAML to test failure reporting"
model: provider/tier-2-reasoning
mode: primary
prompt_file: PROMPT.md
  this: is: broken: yaml: [unclosed
  - invalid
EOF
```

**Step 2**: Trigger a hot reload:

```
asset_hot_reload()
```

**Step 3**: Read the tool's response carefully.

**Pass criteria (all must be true)**:
1. The tool returns without crashing.
2. The response contains `**Status:**` — either `completed` or `failed`.
3. If the response says `completed`: the `Discovered:` count should be higher than `Resolved:` count (the broken role was discovered but failed to resolve — it's counted in `Skipped:`). This is acceptable because the overall reload succeeded for other roles; the broken one was skipped.
4. If the response says `failed`: the `**Details:**` field must contain a non-empty error message explaining what went wrong.
5. The response must NOT falsely claim `completed` with `Skipped: 0` when the broken role exists — at least one role should be skipped.
6. This proves the failure-reporting path works — either the broken role is gracefully skipped (and reported in `Skipped:` count), or the reload fails with a clear error message.

**Cleanup**:

```bash
rm -rf ~/.config/opencode/rolebox/hot-reload-broken-role
```

Then trigger a final reload to restore clean state:

```
asset_hot_reload()
```

---

### Test 117: Broken Dependency — function_graph Detection

This test verifies that the `function_graph` tool correctly identifies and displays broken/unsatisfied dependency edges. The `broken-dep` function declares `requires: [nonexistent-function]` — a function that does not exist.

**Step 1**: Call `function_graph` in dependencies mode:

```
function_graph(focus="dependencies")
```

**Step 2**: Inspect the output graph for the `broken-dep` node and its edges.

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The output contains a node named `broken-dep` — proving the function was loaded into the graph.
3. The output contains `nonexistent-function` as a dependency target — proving the `requires` edge is tracked even when the target does not exist.
4. The edge is marked as broken, missing, or unresolved (e.g., with a `⚠`, `❌`, `[missing]`, or `(unresolved)` indicator) — proving the graph distinguishes satisfied from unsatisfied dependencies.
5. This proves `function_graph(focus="dependencies")` performs reachability analysis and reports disconnected/missing nodes in the requires DAG.

---

---

### Test 118: Broken Dependency — asset_validate Reporting

This test verifies that the `asset_validate` tool reports the `broken-dep` function's unsatisfied dependency as a validation issue.

**Step 1**: Call `asset_validate()`:

```
asset_validate()
```

**Step 2**: Inspect the validation results for issues related to `broken-dep`.

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The output contains a validation issue (error or warning) that references `broken-dep`.
3. The issue mentions `nonexistent-function` or describes a "missing dependency" / "unsatisfied requires".
4. The issue is categorized as a "missing dependency" type (the first of the three categories: missing dependencies, broken reference paths, unknown transition conditions).
5. This proves `asset_validate` performs dependency resolution checking and reports functions whose `requires` field references non-existent functions.

---

---

### Test 131: Context Assemble — Multi-Source

This test verifies that `context_assemble` searches across multiple specified source domains and assembles a token-bounded context block.

**Step 1**: Call `context_assemble` with explicit source list:

```
context_assemble(topic="dispatch test rolebox", sources=["memory", "asset", "session"], max_tokens=3000)
```

**Step 2**: Inspect the assembled context block.

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The response is a markdown-formatted context block.
3. The response draws from at least 2 of the 3 specified sources (memory, asset, session) — evidenced by section headers or source attribution in the output.
4. The response respects the `max_tokens` budget (output is not excessively long).
5. This proves `context_assemble` performs cross-domain search with configurable source selection and token budgeting.

---

---

### Test 133: Reference Search — Context Lines Parameter

This test verifies that `reference_search` respects the `context_lines` parameter, returning surrounding context around each match.

**Step 1**: Call `reference_search` with a high context_lines value:

```
reference_search(query="REFERENCE_LOAD_SUCCESS", context_lines=5, limit=5)
```

**Step 2**: Call `reference_search` with context_lines=0 for comparison:

```
reference_search(query="REFERENCE_LOAD_SUCCESS", context_lines=0, limit=5)
```

**Pass criteria (all must be true)**:
1. Both calls return without error.
2. Step 1 returns matches with surrounding lines (at least some lines before/after the matched line containing "REFERENCE_LOAD_SUCCESS").
3. Step 2 returns matches with minimal or no surrounding context — just the matched line.
4. Step 1's output is visibly longer than Step 2's (more lines per match).
5. This proves `reference_search` respects the `context_lines` parameter for controlling match context granularity.

---

---

### Test 134: Asset Search — Type Filter

This test verifies that `asset_search` respects the `type` parameter to filter results by asset category.

**Step 1**: Call `asset_search` with `type="skill"`:

```
asset_search(query="test", type="skill", limit=10)
```

**Step 2**: Call `asset_search` with `type="function"`:

```
asset_search(query="test", type="function", limit=10)
```

**Pass criteria (all must be true)**:
1. Both calls return without error.
2. Step 1 results contain only skill-type assets (no functions or references in the results).
3. Step 2 results contain only function-type assets (no skills or references in the results).
4. Both result sets are non-empty (the "test" query matches assets in both categories — `test-skill` is a skill, `test-all` is a function).
5. This proves `asset_search` correctly filters results by the `type` enum parameter.

---

---

### Test 135: Asset Search — Role Filter

This test verifies that `asset_search` respects the `role_id` parameter to scope results to a specific role. Both calls pass an explicit `type="all"` (the `role_id` filter is the subject under test — do not rely on the omitted-`type` default; Test 76 covers that path).

**Step 1**: Call `asset_search` scoped to rolebox-tester:

```
asset_search(query="test", type="all", role_id="rolebox-tester", limit=10)
```

**Step 2**: Call `asset_search` without role_id for comparison:

```
asset_search(query="test", type="all", limit=10)
```

**Pass criteria (all must be true)**:
1. Both calls return without error.
2. Step 1 results contain ONLY assets from the `rolebox-tester` role (all result entries show `rolebox-tester` as their role ID).
3. Step 2 results may contain assets from multiple roles (wider scope).
4. Step 1's result count is ≤ Step 2's result count — proving the filter narrows the search.
5. This proves `asset_search` correctly scopes results using the `role_id` filter.

**Count once, mark once**: This test is counted EXACTLY ONCE in the report — the per-test row's PASS/FAIL is the single source of truth for this test's aggregate contribution. Do not count it twice (e.g., once as a row and again via a separate "as-written" interpretation).

---

---

## Runner: Asset Management & Hot-Reload — Runner Pass/Fail Report

After executing every `### Test` above, emit ONE markdown table with a row per test:

| Test | Name | Result | Evidence |
|------|------|--------|----------|
| <n>  | ...  | PASS/FAIL | one-line observation |

**Self-count consistency (mandatory):** The aggregate JSON line below MUST be computed strictly from the per-test table rows — each test contributes exactly ONE row and is counted exactly ONCE. `total` = number of rows, `passed` = number of PASS rows, `failed` = number of FAIL rows (SKIP rows, if any, count toward `total` but neither `passed` nor `failed`), `failures` = the test numbers of the FAIL rows. The table is authoritative; if the aggregate and the table disagree, the table wins and the aggregate is wrong. Do NOT double-count any test via a separate "as-written" interpretation of its steps (this previously caused Test 135 to be counted twice — as a PASS row and again as a FAIL in the aggregate).

Then emit a final JSON line for the dispatcher to aggregate:

```json
{"runner": "<this runner id>", "total": <n>, "passed": <n>, "failed": <n>, "failures": [<test numbers>]}
```

Report honestly: a test that cannot be exercised in this environment is reported FAIL (or SKIP with reason), never fabricated PASS.
