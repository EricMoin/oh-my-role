# Runner: Session Tools

You are the **`rolebox-tester--runner-session`** test runner — one shard of the `rolebox-tester`
suite. Your module: Session tools — list, read, search, info, diff, fork, and tool_filter.

**Assigned tests:** 20-25, 138, 179

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
4. **Full/untruncated ids (v1.8.0, `6466d68`):** the "Session ID" column emits the complete session id — no `...` ellipsis and no 12-character cut — so the cell value equals the source id and can be fed back verbatim into `session_info` / `session_read` / `session_fork`. The renderer assigns `const id = s.id;` with no `shortId()` call (`src/session/formatters.ts:82`, `formatSessionListTable`).

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
4. **Full/untruncated ids (v1.8.0, `6466d68`):** the transcript header's `ID:` line emits the complete session id with no `...` truncation — the header is built as `ID: ${session.id}` (`src/session/session-inspect-tools.ts:47`, `createSessionReadTool`).

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
5. **Full/untruncated ids (v1.8.0, `6466d68`):** when matches are found, each result's `Session:` id and `Message:` id are emitted complete (no `...` ellipsis, no 12-character cut), so both can be fed back into the session tools — the search table interpolates `${m.sessionID}` and `Message: ${m.messageID}` with no `shortId()` call (`src/session/formatters.ts:276-277`, `formatSearchResults`).

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

**Refusal-honesty criteria (apply only when the fork is refused — i.e. no "## Session Forked Successfully" header and the output says the session exists but the fork was refused; v1.8.0, `31628ba`):**
5. **No phantom id blame:** a call that supplied **no** `message_id` must not name or implicate any message id. The no-`message_id` refusal is the bare sentence ending "the session exists, but the fork was refused." (`src/session/session-inspect-tools.ts:166-168`).
6. **No false "session may not exist":** the refusal must not claim the session is missing, unknown, or may not exist — `client.get()` proved the session exists before the fork, so only a **supplied** `message_id` may be flagged (as the possibly-invalid fork point) (`src/session/session-inspect-tools.ts:163-168`).
7. **Cause surfaced, not swallowed:** the refusal is explicit (fork refused; a supplied message id "may be invalid") rather than a bare or misleading failure, and the underlying adapter error is logged at `warn` with its message so the real cause is observable — not a silent debug-only swallow (`src/platform/adapters/dsh/session.ts:415-421`).

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

### Test 179: Session Id Round-Trip (list → info → read → fork)

Verifies the v1.8.0 full-id fix (`6466d68`): an id taken straight from the
`session_list` table is complete enough to feed back unmodified into every
downstream session tool without a "Session not found" failure.

**Step 1**: Call `session_list` and capture a "Session ID" cell value **verbatim** — do not trim, reformat, or re-type it:

```
session_list(limit=5)
```

**Step 2**: Feed that exact id (unmodified) into `session_info`:

```
session_info(session_id="<id straight from step 1>")
```

**Step 3**: Feed the same unmodified id into `session_read`:

```
session_read(session_id="<id straight from step 1>", limit=1)
```

**Step 4**: Feed the same unmodified id into `session_fork`:

```
session_fork(session_id="<id straight from step 1>")
```

**Pass criteria (all must be true)**:
1. The Step 1 id is the full untruncated value — it contains no `...` ellipsis (length > 12 unless the platform genuinely emits short ids).
2. Step 2 resolves: the output begins `## Session: <title>` and its `**ID:**` line echoes the same id — not `Session not found`, not an error.
3. Step 3 resolves: the transcript header's `ID:` line echoes the same id — not `Session not found`.
4. Step 4 resolves: the output contains "## Session Forked Successfully" with a non-empty new id different from the original — not `Failed to fork` and not `Session not found`.
5. All three downstream calls accepted the id **unmodified** (no character added, removed, or substituted between capture and use), proving the emit/consume round-trip — the list table emits `const id = s.id;` with no `shortId()` (`src/session/formatters.ts:82`), and `session_info`/`session_read`/`session_fork` consume that raw string (`src/session/session-inspect-tools.ts:47,89,166-168`).

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
