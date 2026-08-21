# Runner: Session Tools

You are the **`rolebox-tester--runner-session`** test runner — one shard of the `rolebox-tester`
suite. Your module: Session tools — list, read, search, info, diff, fork, and tool_filter.

**Assigned tests:** 20-25, 138

## How to run

When dispatched (typically with a prompt like "run your module"), execute EVERY `### Test`
below **in ascending order**. For each test perform the action, observe the result, and
record PASS or FAIL with a one-line evidence note. Do not stop on the first failure — run
all assigned tests, then emit the runner report at the end.

**Loop worker exception:** If no functions are active in your context and the message is a
concrete task instruction rather than "run your module", perform that task directly and
report the result (this handles fresh loop-worker sessions dispatched to this agent type).

---

### Test 20: Session List

Call `session_list` with default parameters (no date filter, no project filter).

```
session_list()
```

**Pass criteria (all must be true)**:
1. The tool returns without error (not an exception or "tool not found").
2. The output is a markdown table with columns including "Session ID" and "Title", OR the message "No sessions found." if no sessions exist.
3. At least one session is listed (the current session should appear), with a non-empty title.

---

---

### Test 21: Session Read

**Step 1**: Call `session_list` to obtain a valid session ID.

**Step 2**: Call `session_read` with that session ID and default options:

```
session_read(session_id="<id from step 1>")
```

**Step 3**: Call `session_read` again with filtering options:

```
session_read(session_id="<id from step 1>", include_todos=true, include_tool_results=true, role_filter="assistant", limit=5)
```

**Pass criteria (all must be true)**:
1. Step 2 returns a formatted transcript with a header containing "Session:" and message entries.
2. The transcript shows at least one message with a `[Message N]` prefix.
3. Step 3 returns without error, demonstrating that filtering parameters (`include_todos`, `include_tool_results`, `role_filter`, `limit`) are accepted and applied.

---

---

### Test 22: Session Search

Call `session_search` with a common word that is likely present in session messages (e.g., "the" or "test"):

```
session_search(query="test", limit=5)
```

Then call with `include_tool_output` enabled:

```
session_search(query="test", limit=5, include_tool_output=true)
```

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. If matches are found: output contains "Found N match(es) across M session(s)" with context excerpts showing the query in bold.
3. If no matches are found: output contains "No matches found." (acceptable if the query is rare).
4. The second call with `include_tool_output=true` also returns without error (proves the parameter is accepted).

---

---

### Test 23: Session Info

**Step 1**: Call `session_list` to obtain a valid session ID.

**Step 2**: Call `session_info` with that session ID:

```
session_info(session_id="<id from step 1>")
```

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The output contains a header with "## Session:" and the session title.
3. The output includes a "### Token Usage" section with at least "Input" and "Output" token counts.
4. The output includes a "Total Cost:" line.
5. If the session had tool calls, a "### Tool Usage" section appears with tool frequency counts.
6. The output includes message count and status fields.

---

---

### Test 24: Session Diff

**Step 1**: Call `session_list` to obtain a valid session ID (preferably one from an earlier test that may have made file changes, or the current session).

**Step 2**: Call `session_diff` with that session ID:

```
session_diff(session_id="<id from step 1>")
```

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. If the session made file changes: output contains "Files changed:" with a count, and unified diff lines with `--- a/` and `+++ b/` markers.
3. If no file changes were made: output contains "No file changes in this session." (acceptable for sessions that didn't edit files).

---

---

### Test 25: Session Fork

**Step 1**: Call `session_list` to obtain a valid session ID.

**Step 2**: Call `session_fork` with that session ID (no message_id — fork at latest):

```
session_fork(session_id="<id from step 1>")
```

**Pass criteria (all must be true)**:
1. The tool returns without error.
2. The output contains "## Session Forked Successfully".
3. The output shows both an "Original Session" ID and a "New Session" ID, and they are different.
4. The new session ID is non-empty.

---

---

### Test 138: Session Read — tool_filter Parameter

This test verifies that `session_read` supports the `tool_filter` parameter to show only messages containing specific tool calls.

**Step 1**: Call `session_list` to get a valid session ID (use the current session if available):

```
session_list(limit=5)
```

**Step 2**: Call `session_read` with a `tool_filter`:

```
session_read(session_id="<id from step 1>", tool_filter="graph_run", limit=10)
```

**Step 3**: Call `session_read` with a different tool_filter for comparison:

```
session_read(session_id="<id from step 1>", tool_filter="skill", limit=10)
```

**Pass criteria (all must be true)**:
1. Step 2 returns without error.
2. If the session contains `graph_run` tool calls: only messages with `graph_run` tool calls are shown.
3. If the session has no `graph_run` calls: the output says "No matching messages" or returns an empty transcript.
4. Step 3 also returns without error (proves the parameter accepts any tool name substring).
5. This proves `session_read`'s `tool_filter` parameter is accepted and applied to narrow transcript output.

---

---

## Runner: Session Tools — Runner Pass/Fail Report

After executing every `### Test` above, emit ONE markdown table with a row per test:

| Test | Name | Result | Evidence |
|------|------|--------|----------|
| <n>  | ...  | PASS/FAIL | one-line observation |

Then emit a final JSON line for the dispatcher to aggregate:

```json
{"runner": "<this runner id>", "total": <n>, "passed": <n>, "failed": <n>, "failures": [<test numbers>]}
```

Report honestly: a test that cannot be exercised in this environment is reported FAIL (or SKIP with reason), never fabricated PASS.
